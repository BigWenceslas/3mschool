import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import Enrollment from '@/lib/models/Enrollment'
import { requireAuth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'

// GET - Récupérer les inscriptions
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }
    const tokenData = auth.user

    await connectMongoDB()

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query: any = {}

    if (courseId) {
      query.courseId = courseId
    }

    if (userId) {
      // Vérifier les permissions : admin ou l'utilisateur lui-même
      if (tokenData.role !== 'admin' && userId !== tokenData.userId) {
        return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
      }
      query.userId = userId
    } else if (tokenData.role !== 'admin') {
      // Si pas admin et pas de userId spécifié, montrer seulement ses inscriptions
      query.userId = tokenData.userId
    }

    const skip = (page - 1) * limit

    const enrollments = await Enrollment.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('courseId', 'title date price location duration')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Enrollment.countDocuments(query)

    return NextResponse.json({
      enrollments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une inscription
export async function POST(request: NextRequest) {
  try {
    // Vérification CSRF
    const csrf = requireCSRF(request)
    if ('error' in csrf) {
      return csrf.error
    }

    // Vérification d'authentification
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }
    const tokenData = auth.user

    await connectMongoDB()

    const body = await request.json()
    const { courseId, userId } = body

    // Si userId est fourni, seul un admin peut inscrire quelqu'un d'autre
    const targetUserId = userId || tokenData.userId
    if (userId && tokenData.role !== 'admin') {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Vérifier que l'inscription n'existe pas déjà
    const existingEnrollment = await Enrollment.findOne({
      courseId,
      userId: targetUserId
    })

    if (existingEnrollment) {
      return NextResponse.json({ 
        error: 'L\'utilisateur est déjà inscrit à ce cours' 
      }, { status: 400 })
    }

    const enrollment = new Enrollment({
      courseId,
      userId: targetUserId,
      enrolledAt: new Date()
    })

    await enrollment.save()
    await enrollment.populate('userId', 'firstName lastName email')
    await enrollment.populate('courseId', 'title date price')

    return NextResponse.json({ 
      message: 'Inscription créée avec succès',
      enrollment 
    })

  } catch (error: any) {
    console.error('Erreur lors de la création de l\'inscription:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}