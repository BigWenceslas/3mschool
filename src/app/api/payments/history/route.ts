import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { connectMongoDB } from '@/lib/mongodb'
import Enrollment from '@/lib/models/Enrollment'
import AnnualRegistration from '@/lib/models/AnnualRegistration'
import Course from '@/lib/models/Course'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    await connectMongoDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const userId = searchParams.get('userId')
    const skip = (page - 1) * limit

    // Pour les utilisateurs non-admin, ils ne peuvent voir que leurs propres paiements
    const targetUserId = auth.user.role === 'admin' && userId ? userId : auth.user.userId

    const payments = []

    // Récupérer les paiements de cours (enrollments)
    const enrollments = await Enrollment.find({
      userId: targetUserId,
      paymentStatus: 'paid'
    })
    .populate('courseId')
    .sort({ createdAt: -1 })
    .lean()

    for (const enrollment of enrollments) {
      const course = enrollment.courseId as any
      payments.push({
        _id: enrollment._id,
        type: 'course',
        amount: course?.price || 0,
        paymentMethod: enrollment.paymentMethod || 'cash',
        status: 'paid',
        date: enrollment.paymentDate || enrollment.createdAt,
        courseTitle: course?.title,
        courseName: course?.name,
        description: `Cours: ${course?.title || course?.name || 'Cours supprimé'}`,
        createdAt: enrollment.createdAt
      })
    }

    // Récupérer les paiements d'inscriptions annuelles
    const registrations = await AnnualRegistration.find({
      userId: targetUserId,
      paymentStatus: 'paid'
    })
    .sort({ createdAt: -1 })
    .lean()

    for (const registration of registrations) {
      payments.push({
        _id: registration._id,
        type: 'annual_registration',
        amount: registration.amount || 0,
        paymentMethod: registration.paymentMethod || 'cash',
        status: 'paid',
        date: registration.paymentDate || registration.createdAt,
        year: registration.year,
        description: `Inscription annuelle ${registration.year}`,
        createdAt: registration.createdAt
      })
    }

    // Trier tous les paiements par date (plus récent en premier)
    payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Pagination
    const totalPayments = payments.length
    const paginatedPayments = payments.slice(skip, skip + limit)

    // Calculer le montant total payé
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)

    return NextResponse.json({
      payments: paginatedPayments,
      totalPages: Math.ceil(totalPayments / limit),
      currentPage: page,
      totalPayments,
      totalAmount
    })

  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique des paiements' },
      { status: 500 }
    )
  }
}