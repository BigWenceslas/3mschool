import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import mongoose from 'mongoose'
import Expense from '@/lib/models/Expense'
import AnnualRegistration from '@/lib/models/AnnualRegistration'
import Enrollment from '@/lib/models/Enrollment'
import User from '@/lib/models/User'
import Course from '@/lib/models/Course'
import jwt from 'jsonwebtoken'

// GET - Tableau de bord financier
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    const user = await User.findById(decoded.userId).populate('role')
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

    let dateFilter: any = {}
    if (month !== undefined) {
      // Filtrer par mois spécifique
      dateFilter = {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1)
      }
    } else {
      // Filtrer par année
      dateFilter = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    }

    // Pour les membres, on retourne seulement leurs données personnelles
    if (user.role.name !== 'admin') {
      return await getMemberFinancialData(user._id, year)
    }

    // Revenus des inscriptions annuelles
    const annualRegistrationsRevenue = await AnnualRegistration.aggregate([
      {
        $match: {
          year,
          status: 'paid',
          ...(month && { paymentDate: dateFilter })
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])

    // Revenus des cours
    const coursesRevenue = await Enrollment.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $match: {
          paymentStatus: 'paid',
          ...(month && { paymentDate: dateFilter }),
          ...(!month && { 
            createdAt: dateFilter 
          })
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $arrayElemAt: ['$course.price', 0] } },
          count: { $sum: 1 }
        }
      }
    ])

    // Dépenses
    const expensesData = await Expense.aggregate([
      {
        $match: {
          status: 'paid',
          paidDate: dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          byCategory: {
            $push: {
              category: '$category',
              amount: '$amount'
            }
          }
        }
      }
    ])

    // Statistiques mensuelles pour l'année
    const monthlyStats = await Promise.all([
      // Revenus mensuels des inscriptions
      AnnualRegistration.aggregate([
        {
          $match: {
            year,
            status: 'paid',
            paymentDate: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$paymentDate' },
            registrationRevenue: { $sum: '$amount' }
          }
        }
      ]),
      
      // Revenus mensuels des cours
      Enrollment.aggregate([
        {
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course'
          }
        },
        {
          $match: {
            paymentStatus: 'paid',
            paymentDate: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$paymentDate' },
            courseRevenue: { $sum: { $arrayElemAt: ['$course.price', 0] } }
          }
        }
      ]),
      
      // Dépenses mensuelles
      Expense.aggregate([
        {
          $match: {
            status: 'paid',
            paidDate: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$paidDate' },
            expenses: { $sum: '$amount' }
          }
        }
      ])
    ])

    // Combiner les statistiques mensuelles
    const monthlyData: any = {}
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = {
        month: i,
        registrationRevenue: 0,
        courseRevenue: 0,
        expenses: 0,
        netProfit: 0
      }
    }

    // Remplir avec les données réelles
    monthlyStats[0].forEach((item: any) => {
      monthlyData[item._id].registrationRevenue = item.registrationRevenue
    })
    
    monthlyStats[1].forEach((item: any) => {
      monthlyData[item._id].courseRevenue = item.courseRevenue
    })
    
    monthlyStats[2].forEach((item: any) => {
      monthlyData[item._id].expenses = item.expenses
    })

    // Calculer le profit net
    Object.values(monthlyData).forEach((data: any) => {
      data.totalRevenue = data.registrationRevenue + data.courseRevenue
      data.netProfit = data.totalRevenue - data.expenses
    })

    // Dépenses par catégorie
    const expensesByCategory = await Expense.aggregate([
      {
        $match: {
          status: 'paid',
          paidDate: dateFilter
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])

    // Paiements en attente
    const pendingPayments = await Promise.all([
      // Inscriptions en attente
      AnnualRegistration.countDocuments({ 
        year, 
        status: 'pending' 
      }),
      
      // Cours non payés
      Enrollment.countDocuments({ 
        paymentStatus: 'pending' 
      }),
      
      // Dépenses non payées
      Expense.aggregate([
        {
          $match: {
            status: { $in: ['pending', 'overdue'] }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ])
    ])

    const totalRevenue = (annualRegistrationsRevenue[0]?.totalAmount || 0) + 
                        (coursesRevenue[0]?.totalAmount || 0)
    const totalExpenses = expensesData[0]?.totalAmount || 0
    const netProfit = totalRevenue - totalExpenses

    return NextResponse.json({
      period: month ? `${year}-${month.toString().padStart(2, '0')}` : year.toString(),
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0
      },
      revenue: {
        registrations: {
          amount: annualRegistrationsRevenue[0]?.totalAmount || 0,
          count: annualRegistrationsRevenue[0]?.count || 0
        },
        courses: {
          amount: coursesRevenue[0]?.totalAmount || 0,
          count: coursesRevenue[0]?.count || 0
        }
      },
      expenses: {
        total: totalExpenses,
        count: expensesData[0]?.count || 0,
        byCategory: expensesByCategory
      },
      monthlyData: Object.values(monthlyData),
      pendingPayments: {
        registrations: pendingPayments[0],
        courses: pendingPayments[1],
        expenses: {
          count: pendingPayments[2][0]?.count || 0,
          amount: pendingPayments[2][0]?.amount || 0
        }
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function getMemberFinancialData(userId: string, year: number) {
  // Inscription annuelle du membre
  const annualRegistration = await AnnualRegistration.findOne({
    userId,
    year
  })

  // Historique des paiements de cours
  const coursePayments = await Enrollment.find({ userId })
    .populate('courseId', 'title price date')
    .sort({ createdAt: -1 })

  // Statistiques du membre
  const memberStats = await Enrollment.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'courses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'course'
      }
    },
    {
      $group: {
        _id: null,
        totalCoursesEnrolled: { $sum: 1 },
        totalPaid: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'paid'] },
              { $arrayElemAt: ['$course.price', 0] },
              0
            ]
          }
        },
        totalOwed: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'pending'] },
              { $arrayElemAt: ['$course.price', 0] },
              0
            ]
          }
        }
      }
    }
  ])

  const stats = memberStats[0] || {
    totalCoursesEnrolled: 0,
    totalPaid: 0,
    totalOwed: 0
  }

  return NextResponse.json({
    member: true,
    annualRegistration,
    coursePayments,
    summary: {
      totalPaid: stats.totalPaid + (annualRegistration?.status === 'paid' ? annualRegistration.amount : 0),
      totalOwed: stats.totalOwed + (annualRegistration?.status === 'pending' ? annualRegistration?.amount || 0 : 0),
      coursesEnrolled: stats.totalCoursesEnrolled
    }
  })
}