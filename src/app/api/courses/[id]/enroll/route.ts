import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Course from '@/lib/models/Course'
import Enrollment from '@/lib/models/Enrollment'
import { getUserFromRequest } from '@/lib/auth'
import mongoose from 'mongoose'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenData = getUserFromRequest(request)
    
    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    await connectDB()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'ID de cours invalide' },
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

    // Vérifier si les inscriptions sont ouvertes
    if (!course.isEnrollmentOpen()) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Les inscriptions pour ce cours sont fermées' 
        },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingEnrollment = await Enrollment.findOne({
      courseId: params.id,
      userId: tokenData.userId
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Vous êtes déjà inscrit à ce cours' 
        },
        { status: 400 }
      )
    }

    // Vérifier si le cours n'est pas complet
    const currentEnrollments = await Enrollment.countDocuments({ courseId: params.id })
    
    if (currentEnrollments >= course.maxParticipants) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Ce cours est complet' 
        },
        { status: 400 }
      )
    }

    // Créer l'inscription
    const enrollment = new Enrollment({
      courseId: params.id,
      userId: tokenData.userId,
      paymentStatus: 'pending'
    })

    await enrollment.save()
    await enrollment.populate([
      { path: 'courseId', select: 'title date price' },
      { path: 'userId', select: 'name email' }
    ])

    return NextResponse.json({
      success: true,
      message: 'Inscription réussie',
      enrollment: enrollment.toObject()
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de l\'inscription:', error)
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Vous êtes déjà inscrit à ce cours' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenData = getUserFromRequest(request)
    
    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    await connectDB()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'ID de cours invalide' },
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

    // Vérifier si on peut encore se désinscrire
    const timeDifference = course.date.getTime() - new Date().getTime()
    const hoursUntilCourse = timeDifference / (1000 * 3600)
    
    if (hoursUntilCourse < 24) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Impossible de se désinscrire moins de 24h avant le cours' 
        },
        { status: 400 }
      )
    }

    const enrollment = await Enrollment.findOne({
      courseId: params.id,
      userId: tokenData.userId
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, message: 'Vous n\'êtes pas inscrit à ce cours' },
        { status: 404 }
      )
    }

    // Ne pas permettre la désinscription si le paiement a été effectué
    if (enrollment.paymentStatus === 'paid') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Impossible de se désinscrire après avoir payé. Contactez un administrateur.' 
        },
        { status: 400 }
      )
    }

    await Enrollment.findByIdAndDelete(enrollment._id)

    return NextResponse.json({
      success: true,
      message: 'Désinscription réussie'
    })

  } catch (error) {
    console.error('Erreur lors de la désinscription:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}