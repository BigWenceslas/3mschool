import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import AnnualRegistration from '@/lib/models/AnnualRegistration'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// GET - Statistiques des inscriptions annuelles
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

    // Seuls les admins peuvent voir les statistiques globales
    if (user.role.name !== 'admin') {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const targetYear = year ? parseInt(year) : new Date().getFullYear()

    // Statistiques de l'année demandée
    const yearStats = await AnnualRegistration.aggregate([
      { $match: { year: targetYear } },
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: 1 },
          totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          totalPending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'paid'] }, 
                '$amount', 
                0
              ] 
            } 
          },
          averageAmount: { $avg: '$amount' }
        }
      }
    ])
    
    // Statistiques par mois pour l'année
    const monthlyStats = await AnnualRegistration.aggregate([
      { 
        $match: { 
          year: targetYear,
          status: 'paid'
        } 
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ])

    // Évolution par années (5 dernières années)
    const currentYear = new Date().getFullYear()
    const yearlyEvolution = await AnnualRegistration.aggregate([
      { 
        $match: { 
          year: { $gte: currentYear - 4, $lte: currentYear }
        } 
      },
      {
        $group: {
          _id: '$year',
          totalRegistrations: { $sum: 1 },
          paidRegistrations: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          revenue: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] 
            } 
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ])

    // Utilisateurs sans inscription pour l'année courante
    const usersWithoutRegistration = await User.aggregate([
      {
        $lookup: {
          from: 'annualregistrations',
          localField: '_id',
          foreignField: 'userId',
          as: 'registrations'
        }
      },
      {
        $match: {
          'registrations': {
            $not: {
              $elemMatch: { year: targetYear }
            }
          }
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1
        }
      }
    ])

    return NextResponse.json({
      yearStats: yearStats[0] || {
        totalRegistrations: 0,
        totalPaid: 0,
        totalPending: 0,
        totalRevenue: 0,
        averageAmount: 0
      },
      monthlyStats,
      yearlyEvolution,
      usersWithoutRegistration,
      year: targetYear
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}