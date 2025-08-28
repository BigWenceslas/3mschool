import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import LevelValidation from '@/lib/models/LevelValidation'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// GET - Récupérer les demandes de validation
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
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    let query: any = {}

    // Si l'utilisateur n'est pas admin, il ne voit que ses demandes
    if (user.role.name !== 'admin') {
      query.userId = user._id
    } else {
      // Les admins peuvent filtrer par utilisateur
      if (userId) query.userId = userId
    }

    if (status) query.status = status

    const validations = await LevelValidation.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ requestDate: -1 })

    return NextResponse.json({ validations })

  } catch (error) {
    console.error('Erreur lors de la récupération des validations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle demande de validation
export async function POST(request: NextRequest) {
  try {
    await connectMongoDB()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const body = await request.json()
    const {
      currentLevel,
      requestedLevel,
      submissionData
    } = body

    // Validation
    if (!requestedLevel || requestedLevel <= currentLevel) {
      return NextResponse.json({ 
        error: 'Le niveau demandé doit être supérieur au niveau actuel' 
      }, { status: 400 })
    }

    if (!submissionData?.selfAssessment) {
      return NextResponse.json({ 
        error: 'L\'auto-évaluation est requise' 
      }, { status: 400 })
    }

    // Vérifier qu'il n'y a pas déjà une demande en attente
    const existingRequest = await LevelValidation.findOne({
      userId: user._id,
      status: 'pending'
    })

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'Une demande de validation est déjà en cours' 
      }, { status: 400 })
    }

    // Obtenir les exigences par défaut pour ce niveau
    const defaultRequirements = (LevelValidation as any).getDefaultRequirements(requestedLevel)

    const validation = new LevelValidation({
      userId: user._id,
      currentLevel: currentLevel || 0,
      requestedLevel,
      submissionData: {
        achievements: submissionData.achievements || [],
        selfAssessment: submissionData.selfAssessment.trim(),
        practiceHours: submissionData.practiceHours || 0,
        coursesCompleted: submissionData.coursesCompleted || [],
        testimonials: submissionData.testimonials || [],
        artifacts: submissionData.artifacts || []
      },
      requirements: defaultRequirements,
      progressTracking: {
        practiceHoursCompleted: 0,
        coursesCompleted: 0,
        journalEntriesCount: 0,
        goalsCompletedCount: 0,
        lastUpdated: new Date()
      }
    })

    // Mettre à jour automatiquement le suivi des progrès
    await validation.updateProgress()

    await validation.save()
    await validation.populate('userId', 'firstName lastName email')

    return NextResponse.json({ 
      message: 'Demande de validation créée avec succès',
      validation 
    })

  } catch (error: any) {
    console.error('Erreur lors de la création de la demande:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}