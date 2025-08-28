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
    
    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    await connectMongoDB()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'ID de cours invalide' },
        { status: 400 }
      )
    }

    const course = await Course.findById(params.id).populate('instructor', 'name email')
    
    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Cours non trouvé' },
        { status: 404 }
      )
    }

    // Statistiques des inscriptions
    const enrollmentStats = await Enrollment.aggregate([
      { $match: { courseId: new mongoose.Types.ObjectId(params.id) } },
      {
        $group: {
          _id: null,
          totalEnrolled: { $sum: 1 },
          totalAttended: { $sum: { $cond: ['$attended', 1, 0] } },
          totalPaid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } }
        }
      }
    ])

    const stats = enrollmentStats[0] || {
      totalEnrolled: 0,
      totalAttended: 0,
      totalPaid: 0
    }

    // Vérifier si l'utilisateur est inscrit
    const userEnrollment = await Enrollment.findOne({
      courseId: params.id,
      userId: tokenData.userId
    })

    const courseData = {
      ...course.toObject(),
      stats,
      isEnrolled: !!userEnrollment,
      userEnrollment: userEnrollment ? {
        attended: userEnrollment.attended,
        paymentStatus: userEnrollment.paymentStatus,
        enrolledAt: userEnrollment.enrolledAt
      } : null
    }

    return NextResponse.json({ success: true, course: courseData })

  } catch (error) {
    console.error('Erreur lors de la récupération du cours:', error)
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
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'ID de cours invalide' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updateData = { ...body }

    // Nettoyer les champs qui ne doivent pas être modifiés
    delete updateData._id
    delete updateData.createdAt
    delete updateData.updatedAt
    delete updateData.instructor // L'instructeur ne peut être changé que par un super admin

    const course = await Course.findById(params.id)
    
    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Cours non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si le cours peut être modifié
    if (!course.isEditable() && updateData.summary === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Ce cours ne peut plus être modifié (cours passé ou en cours)' 
        },
        { status: 400 }
      )
    }

    // Si on met à jour seulement le résumé, permettre même pour les cours terminés
    if (Object.keys(updateData).length === 1 && updateData.summary !== undefined) {
      course.summary = updateData.summary
      await course.save()
    } else {
      // Mise à jour complète
      Object.assign(course, updateData)
      await course.save()
    }

    await course.populate('instructor', 'name email')

    return NextResponse.json({
      success: true,
      message: 'Cours mis à jour avec succès',
      course: course.toObject()
    })

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du cours:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Données invalides', 
          errors: Object.values(error.errors).map((e: any) => e.message)
        },
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

    const course = await Course.findById(params.id)
    
    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Cours non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a des inscriptions
    const enrollmentCount = await Enrollment.countDocuments({ courseId: params.id })
    
    if (enrollmentCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Impossible de supprimer ce cours car il y a ${enrollmentCount} inscription(s)` 
        },
        { status: 400 }
      )
    }

    await Course.findByIdAndDelete(params.id)

    return NextResponse.json({
      success: true,
      message: 'Cours supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de la suppression du cours:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}