import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Course from '@/lib/models/Course'
import Enrollment from '@/lib/models/Enrollment'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromRequest(request)
    
    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming')
    const instructorId = searchParams.get('instructor')
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10
    
    // Construire la requête
    let query: any = {}
    
    if (status) {
      query.status = status
    }
    
    if (upcoming === 'true') {
      query.date = { $gte: new Date() }
    }
    
    if (instructorId) {
      query.instructor = instructorId
    }
    
    // Pour les non-admins, ne montrer que les cours publics
    if (tokenData.role !== 'admin') {
      query.status = { $in: ['planned', 'completed'] }
    }

    const skip = (page - 1) * limit

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('instructor', 'name email')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit),
      Course.countDocuments(query)
    ])

    // Pour chaque cours, ajouter le nombre d'inscrits
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({ 
          courseId: course._id 
        })
        
        const userEnrollment = tokenData.role !== 'admin' 
          ? await Enrollment.findOne({ 
              courseId: course._id, 
              userId: tokenData.userId 
            })
          : null

        return {
          ...course.toObject(),
          enrollmentCount,
          isEnrolled: !!userEnrollment,
          userEnrollment: userEnrollment ? {
            attended: userEnrollment.attended,
            paymentStatus: userEnrollment.paymentStatus
          } : null
        }
      })
    )

    return NextResponse.json({
      success: true,
      courses: coursesWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des cours:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenData = getUserFromRequest(request)
    
    if (!tokenData || tokenData.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Accès non autorisé - Admin requis' },
        { status: 403 }
      )
    }

    await connectDB()
    
    const body = await request.json()
    const { 
      title, 
      description, 
      date, 
      duration, 
      location, 
      maxParticipants, 
      price = 1000 
    } = body

    // Validation des données requises
    if (!title || !description || !date || !duration || !location || !maxParticipants) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Vérifier que la date est dans le futur
    const courseDate = new Date(date)
    if (courseDate <= new Date()) {
      return NextResponse.json(
        { success: false, message: 'La date du cours doit être dans le futur' },
        { status: 400 }
      )
    }

    const course = new Course({
      title,
      description,
      date: courseDate,
      duration,
      location,
      maxParticipants,
      instructor: tokenData.userId,
      price
    })

    await course.save()
    await course.populate('instructor', 'name email')

    return NextResponse.json({
      success: true,
      message: 'Cours créé avec succès',
      course: course.toObject()
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de la création du cours:', error)
    
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