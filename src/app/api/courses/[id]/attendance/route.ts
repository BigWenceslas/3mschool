import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import Course from '@/lib/models/Course'
import Enrollment from '@/lib/models/Enrollment'
import { getUserFromRequest } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenData = getUserFromRequest(request)
    
    if (!tokenData || tokenData.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès non autorisé - Admin requis' },
        { status: 403 }
      )
    }

    await connectMongoDB()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'ID de cours invalide' },
        { status: 400 }
      )
    }

    // Récupérer toutes les inscriptions pour ce cours
    const enrollments = await Enrollment.find({ courseId: params.id })
      .populate('userId', 'firstName lastName email')
      .populate('courseId', 'title date price')
      .sort({ enrolledAt: 1 })

    return NextResponse.json({
      success: true,
      enrollments: enrollments.map(e => e.toObject())
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des présences:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenData = getUserFromRequest(request)
    
    if (!tokenData || tokenData.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès non autorisé - Admin requis' },
        { status: 403 }
      )
    }

    await connectMongoDB()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'ID de cours invalide' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { attendanceList } = body

    if (!Array.isArray(attendanceList)) {
      return NextResponse.json(
        { success: false, message: 'Liste de présence invalide' },
        { status: 400 }
      )
    }

    const course = await Course.findById(params.id)
    
    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Cours non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour les présences
    const updatePromises = attendanceList.map(async (attendance: any) => {
      const { userId, attended, notes, paymentStatus, paymentMethod, paymentReference } = attendance

      const enrollment = await Enrollment.findOne({
        courseId: params.id,
        userId
      })

      if (enrollment) {
        enrollment.attended = attended
        if (notes) enrollment.notes = notes
        
        // Mettre à jour le statut de paiement si fourni
        if (paymentStatus && ['pending', 'paid', 'exempted'].includes(paymentStatus)) {
          enrollment.paymentStatus = paymentStatus
          if (paymentStatus === 'paid') {
            enrollment.paymentDate = new Date()
            if (paymentMethod) enrollment.paymentMethod = paymentMethod
            if (paymentReference) enrollment.paymentReference = paymentReference
          }
        }
        
        await enrollment.save()
        return enrollment
      }
      return null
    })

    const updatedEnrollments = await Promise.all(updatePromises)
    const validUpdates = updatedEnrollments.filter(e => e !== null)

    // Mettre à jour le statut du cours si nécessaire
    if (course.status === 'planned' && validUpdates.some(e => e?.attended)) {
      course.status = 'completed'
      await course.save()
    }

    return NextResponse.json({
      success: true,
      message: `Présences mises à jour pour ${validUpdates.length} participant(s)`,
      updatedCount: validUpdates.length
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour des présences:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenData = getUserFromRequest(request)
    
    if (!tokenData || tokenData.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès non autorisé - Admin requis' },
        { status: 403 }
      )
    }

    await connectMongoDB()
    
    const body = await request.json()
    const { userId, attended, notes, paymentStatus, paymentMethod, paymentReference } = body

    if (!mongoose.Types.ObjectId.isValid(params.id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: 'ID invalide' },
        { status: 400 }
      )
    }

    const enrollment = await Enrollment.findOne({
      courseId: params.id,
      userId
    }).populate('userId', 'firstName lastName email')

    if (!enrollment) {
      return NextResponse.json(
        { success: false, message: 'Inscription non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour les informations
    if (typeof attended === 'boolean') {
      enrollment.attended = attended
    }
    
    if (notes !== undefined) {
      enrollment.notes = notes
    }

    if (paymentStatus && ['pending', 'paid', 'exempted'].includes(paymentStatus)) {
      enrollment.paymentStatus = paymentStatus
      if (paymentStatus === 'paid') {
        enrollment.paymentDate = new Date()
        if (paymentMethod) enrollment.paymentMethod = paymentMethod
        if (paymentReference) enrollment.paymentReference = paymentReference
      }
    }

    await enrollment.save()
    await enrollment.populate('courseId', 'title date price')

    return NextResponse.json({
      success: true,
      message: 'Inscription mise à jour avec succès',
      enrollment: enrollment.toObject()
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'inscription:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}