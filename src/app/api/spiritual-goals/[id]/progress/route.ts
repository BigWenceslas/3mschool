import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import SpiritualGoal from '@/lib/models/SpiritualGoal'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// POST - Mettre à jour le progrès d'un objectif
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const goal = await SpiritualGoal.findById(params.id)
    if (!goal) {
      return NextResponse.json({ error: 'Objectif non trouvé' }, { status: 404 })
    }

    // Vérifier les permissions
    if (goal.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { increment, note } = body

    if (typeof increment !== 'number') {
      return NextResponse.json({ 
        error: 'L\'incrément doit être un nombre' 
      }, { status: 400 })
    }

    // Mettre à jour le progrès
    await goal.updateProgress(increment, note)

    return NextResponse.json({ 
      message: 'Progrès mis à jour avec succès',
      goal: {
        _id: goal._id,
        currentProgress: goal.currentProgress,
        targetValue: goal.targetValue,
        progressPercentage: goal.getProgressPercentage(),
        status: goal.status,
        milestones: goal.milestones
      }
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour du progrès:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Définir le progrès absolu
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const goal = await SpiritualGoal.findById(params.id)
    if (!goal) {
      return NextResponse.json({ error: 'Objectif non trouvé' }, { status: 404 })
    }

    // Vérifier les permissions
    if (goal.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { progress, note } = body

    if (typeof progress !== 'number' || progress < 0) {
      return NextResponse.json({ 
        error: 'Le progrès doit être un nombre positif' 
      }, { status: 400 })
    }

    // Calculer l'incrément
    const increment = progress - goal.currentProgress

    // Mettre à jour le progrès
    await goal.updateProgress(increment, note)

    return NextResponse.json({ 
      message: 'Progrès défini avec succès',
      goal: {
        _id: goal._id,
        currentProgress: goal.currentProgress,
        targetValue: goal.targetValue,
        progressPercentage: goal.getProgressPercentage(),
        status: goal.status,
        milestones: goal.milestones
      }
    })

  } catch (error) {
    console.error('Erreur lors de la définition du progrès:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}