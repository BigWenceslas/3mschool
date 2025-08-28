import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import AnnualRegistration from '@/lib/models/AnnualRegistration'
import Enrollment from '@/lib/models/Enrollment'
import Expense from '@/lib/models/Expense'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// GET - Export du rapport financier
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
    const format = searchParams.get('format') || 'json' // json, csv
    const type = searchParams.get('type') || 'summary' // summary, detailed, member
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const userId = searchParams.get('userId')

    let dateFilter: any = {}
    if (fromDate || toDate) {
      dateFilter = {}
      if (fromDate) dateFilter.$gte = new Date(fromDate)
      if (toDate) dateFilter.$lte = new Date(toDate)
    }

    // Pour les exports membres, vérifier les permissions
    if (type === 'member') {
      const targetUserId = userId || user._id.toString()
      if (user.role.name !== 'admin' && targetUserId !== user._id.toString()) {
        return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
      }
      
      const memberData = await getMemberFinancialReport(targetUserId, year, dateFilter)
      return formatResponse(memberData, format, `rapport-membre-${year}`)
    }

    // Seuls les admins peuvent exporter les rapports globaux
    if (user.role.name !== 'admin') {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    let reportData: any = {}

    if (type === 'summary') {
      reportData = await getSummaryReport(year, dateFilter)
    } else if (type === 'detailed') {
      reportData = await getDetailedReport(year, dateFilter)
    }

    const filename = `rapport-financier-${type}-${year}`
    return formatResponse(reportData, format, filename)

  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function getSummaryReport(year: number, dateFilter: any) {
  // Revenus des inscriptions
  const registrationRevenue = await AnnualRegistration.aggregate([
    {
      $match: {
        year,
        status: 'paid',
        ...(Object.keys(dateFilter).length && { paymentDate: dateFilter })
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
        ...(Object.keys(dateFilter).length && { paymentDate: dateFilter })
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
  const expenses = await Expense.aggregate([
    {
      $match: {
        status: 'paid',
        ...(Object.keys(dateFilter).length && { paidDate: dateFilter })
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ])

  const totalRevenue = (registrationRevenue[0]?.totalAmount || 0) + (coursesRevenue[0]?.totalAmount || 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0)

  return {
    periode: year,
    resume: {
      revenus_totaux: totalRevenue,
      depenses_totales: totalExpenses,
      benefice_net: totalRevenue - totalExpenses,
      marge_beneficiaire: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(2) + '%' : '0%'
    },
    revenus: {
      inscriptions_annuelles: {
        montant: registrationRevenue[0]?.totalAmount || 0,
        nombre: registrationRevenue[0]?.count || 0
      },
      cours: {
        montant: coursesRevenue[0]?.totalAmount || 0,
        nombre: coursesRevenue[0]?.count || 0
      }
    },
    depenses_par_categorie: expenses.map(exp => ({
      categorie: exp._id,
      montant: exp.totalAmount,
      nombre: exp.count
    }))
  }
}

async function getDetailedReport(year: number, dateFilter: any) {
  const summaryData = await getSummaryReport(year, dateFilter)

  // Détail des inscriptions
  const registrations = await AnnualRegistration.find({
    year,
    status: 'paid',
    ...(Object.keys(dateFilter).length && { paymentDate: dateFilter })
  })
  .populate('userId', 'firstName lastName email')
  .sort({ paymentDate: -1 })

  // Détail des paiements de cours
  const coursePayments = await Enrollment.find({
    paymentStatus: 'paid',
    ...(Object.keys(dateFilter).length && { paymentDate: dateFilter })
  })
  .populate('userId', 'firstName lastName email')
  .populate('courseId', 'title date price')
  .sort({ paymentDate: -1 })

  // Détail des dépenses
  const expenseDetails = await Expense.find({
    status: 'paid',
    ...(Object.keys(dateFilter).length && { paidDate: dateFilter })
  })
  .populate('createdBy', 'firstName lastName')
  .sort({ paidDate: -1 })

  return {
    ...summaryData,
    details: {
      inscriptions: registrations.map(reg => ({
        date_paiement: reg.paymentDate?.toISOString().split('T')[0],
        membre: `${reg.userId.firstName} ${reg.userId.lastName}`,
        email: reg.userId.email,
        montant: reg.amount,
        methode: reg.paymentMethod,
        reference: reg.paymentReference
      })),
      paiements_cours: coursePayments.map(payment => ({
        date_paiement: payment.paymentDate?.toISOString().split('T')[0],
        membre: `${payment.userId.firstName} ${payment.userId.lastName}`,
        cours: payment.courseId.title,
        date_cours: payment.courseId.date.toISOString().split('T')[0],
        montant: payment.courseId.price,
        methode: payment.paymentMethod,
        reference: payment.paymentReference
      })),
      depenses: expenseDetails.map(exp => ({
        date_paiement: exp.paidDate?.toISOString().split('T')[0],
        titre: exp.title,
        categorie: exp.category,
        montant: exp.amount,
        fournisseur: exp.vendor,
        methode: exp.paymentMethod,
        reference: exp.paymentReference,
        cree_par: `${exp.createdBy.firstName} ${exp.createdBy.lastName}`
      }))
    }
  }
}

async function getMemberFinancialReport(userId: string, year: number, dateFilter: any) {
  // Inscription annuelle
  const registration = await AnnualRegistration.findOne({
    userId,
    year
  })

  // Historique des cours
  const coursePayments = await Enrollment.find({
    userId,
    ...(Object.keys(dateFilter).length && { createdAt: dateFilter })
  })
  .populate('courseId', 'title date price')
  .sort({ createdAt: -1 })

  // Statistiques
  const stats = {
    inscription_annuelle: {
      statut: registration?.status || 'non_enregistree',
      montant: registration?.amount || 0,
      date_paiement: registration?.paymentDate?.toISOString().split('T')[0] || null
    },
    cours: {
      total_inscrit: coursePayments.length,
      total_paye: coursePayments.filter(p => p.paymentStatus === 'paid').reduce((sum, p) => sum + p.courseId.price, 0),
      total_du: coursePayments.filter(p => p.paymentStatus === 'pending').reduce((sum, p) => sum + p.courseId.price, 0)
    }
  }

  return {
    periode: year,
    membre_id: userId,
    statistiques: stats,
    historique_cours: coursePayments.map(payment => ({
      cours: payment.courseId.title,
      date_cours: payment.courseId.date.toISOString().split('T')[0],
      montant: payment.courseId.price,
      statut_paiement: payment.paymentStatus,
      date_inscription: payment.enrolledAt.toISOString().split('T')[0],
      date_paiement: payment.paymentDate?.toISOString().split('T')[0] || null,
      present: payment.attended
    }))
  }
}

function formatResponse(data: any, format: string, filename: string) {
  if (format === 'csv') {
    const csv = convertToCSV(data)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    })
  }

  // Format JSON par défaut
  return NextResponse.json(data, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}.json"`
    }
  })
}

function convertToCSV(data: any): string {
  // Conversion simple - pour une version plus robuste, utiliser papaparse côté client
  if (data.details) {
    // Rapport détaillé - créer plusieurs sections
    let csv = 'RESUME FINANCIER\n'
    csv += `Revenus totaux,${data.resume.revenus_totaux}\n`
    csv += `Depenses totales,${data.resume.depenses_totales}\n`
    csv += `Benefice net,${data.resume.benefice_net}\n\n`
    
    csv += 'INSCRIPTIONS ANNUELLES\n'
    csv += 'Date,Membre,Email,Montant,Methode,Reference\n'
    data.details.inscriptions.forEach((item: any) => {
      csv += `${item.date_paiement},${item.membre},${item.email},${item.montant},${item.methode},${item.reference || ''}\n`
    })
    
    csv += '\nPAIEMENTS COURS\n'
    csv += 'Date,Membre,Cours,Date cours,Montant,Methode,Reference\n'
    data.details.paiements_cours.forEach((item: any) => {
      csv += `${item.date_paiement},${item.membre},${item.cours},${item.date_cours},${item.montant},${item.methode},${item.reference || ''}\n`
    })
    
    csv += '\nDEPENSES\n'
    csv += 'Date,Titre,Categorie,Montant,Fournisseur,Methode,Reference,Cree par\n'
    data.details.depenses.forEach((item: any) => {
      csv += `${item.date_paiement},${item.titre},${item.categorie},${item.montant},${item.fournisseur || ''},${item.methode},${item.reference || ''},${item.cree_par}\n`
    })
    
    return csv
  }
  
  // Format simple pour d'autres types de données
  return JSON.stringify(data, null, 2)
}