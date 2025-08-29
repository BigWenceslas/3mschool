import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { connectMongoDB } from '@/lib/mongodb'
import Enrollment from '@/lib/models/Enrollment'
import AnnualRegistration from '@/lib/models/AnnualRegistration'
import User from '@/lib/models/User'
import Course from '@/lib/models/Course'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    // Vérifier que l'utilisateur est admin
    if (auth.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      )
    }

    await connectMongoDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '15')
    const skip = (page - 1) * limit

    // Filtres
    const type = searchParams.get('type')
    const paymentMethod = searchParams.get('paymentMethod')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const exportData = searchParams.get('export') === 'true'

    const payments = []

    // Construction des filtres de date
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.$gte = new Date(startDate)
    }
    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      dateFilter.$lte = endDateTime
    }

    // Récupérer les paiements de cours (enrollments)
    if (!type || type === 'course') {
      const enrollmentFilter: any = {}
      
      if (status) {
        enrollmentFilter.paymentStatus = status
      }
      
      if (paymentMethod) {
        enrollmentFilter.paymentMethod = paymentMethod
      }

      if (Object.keys(dateFilter).length > 0) {
        enrollmentFilter.$or = [
          { paymentDate: dateFilter },
          { createdAt: dateFilter }
        ]
      }

      const enrollments = await Enrollment.find(enrollmentFilter)
        .populate('courseId')
        .populate('userId')
        .sort({ createdAt: -1 })
        .lean()

      for (const enrollment of enrollments) {
        const course = enrollment.courseId as any
        const user = enrollment.userId as any

        if (!user) continue

        // Filtre de recherche
        if (search) {
          const searchLower = search.toLowerCase()
          const userName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().trim() || ''
          const userEmail = user.email?.toLowerCase() || ''
          const courseTitle = course?.title?.toLowerCase() || ''
          const courseName = course?.name?.toLowerCase() || ''
          
          if (!userName.includes(searchLower) && 
              !userEmail.includes(searchLower) && 
              !courseTitle.includes(searchLower) && 
              !courseName.includes(searchLower)) {
            continue
          }
        }

        payments.push({
          _id: enrollment._id,
          type: 'course',
          amount: course?.price || 0,
          paymentMethod: enrollment.paymentMethod || 'cash',
          status: enrollment.paymentStatus || 'pending',
          date: enrollment.paymentDate || enrollment.createdAt,
          courseTitle: course?.title,
          courseName: course?.name,
          description: `Cours: ${course?.title || course?.name || 'Cours supprimé'}`,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
          userEmail: user.email || '',
          createdAt: enrollment.createdAt
        })
      }
    }

    // Récupérer les paiements d'inscriptions annuelles
    if (!type || type === 'annual_registration') {
      const registrationFilter: any = {}
      
      if (status) {
        registrationFilter.paymentStatus = status
      }
      
      if (paymentMethod) {
        registrationFilter.paymentMethod = paymentMethod
      }

      if (Object.keys(dateFilter).length > 0) {
        registrationFilter.$or = [
          { paymentDate: dateFilter },
          { createdAt: dateFilter }
        ]
      }

      const registrations = await AnnualRegistration.find(registrationFilter)
        .populate('userId')
        .sort({ createdAt: -1 })
        .lean()

      for (const registration of registrations) {
        const user = registration.userId as any

        if (!user) continue

        // Filtre de recherche
        if (search) {
          const searchLower = search.toLowerCase()
          const userName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().trim() || ''
          const userEmail = user.email?.toLowerCase() || ''
          const year = registration.year?.toString() || ''
          
          if (!userName.includes(searchLower) && 
              !userEmail.includes(searchLower) && 
              !year.includes(searchLower)) {
            continue
          }
        }

        payments.push({
          _id: registration._id,
          type: 'annual_registration',
          amount: registration.amount || 0,
          paymentMethod: registration.paymentMethod || 'cash',
          status: registration.paymentStatus || 'pending',
          date: registration.paymentDate || registration.createdAt,
          year: registration.year,
          description: `Inscription annuelle ${registration.year}`,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
          userEmail: user.email || '',
          createdAt: registration.createdAt
        })
      }
    }

    // Trier tous les paiements par date (plus récent en premier)
    payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculer les statistiques
    const stats = {
      totalRevenue: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      courseRevenue: payments.filter(p => p.type === 'course' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      registrationRevenue: payments.filter(p => p.type === 'annual_registration' && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
      totalTransactions: payments.length,
      averageTransaction: payments.length > 0 ? Math.round(payments.reduce((sum, p) => sum + p.amount, 0) / payments.length) : 0
    }

    // Export CSV
    if (exportData) {
      const csvHeader = 'Date,Utilisateur,Email,Type,Description,Montant,Mode de paiement,Statut\n'
      const csvData = payments.map(payment => {
        const date = new Date(payment.date || payment.createdAt).toLocaleDateString('fr-FR')
        const type = payment.type === 'course' ? 'Cours' : 'Inscription'
        const amount = payment.amount.toString()
        const paymentMethod = payment.paymentMethod
        const status = payment.status === 'paid' ? 'Payé' : 'En attente'
        
        return `"${date}","${payment.userName}","${payment.userEmail}","${type}","${payment.description}","${amount}","${paymentMethod}","${status}"`
      }).join('\n')

      const csvContent = csvHeader + csvData

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="historique_paiements_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Pagination
    const totalPayments = payments.length
    const paginatedPayments = payments.slice(skip, skip + limit)

    return NextResponse.json({
      payments: paginatedPayments,
      totalPages: Math.ceil(totalPayments / limit),
      currentPage: page,
      totalPayments,
      stats
    })

  } catch (error) {
    console.error('Error fetching admin payment data:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données financières' },
      { status: 500 }
    )
  }
}