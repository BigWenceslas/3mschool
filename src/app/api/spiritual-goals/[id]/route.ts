import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import SpiritualGoal from '@/lib/models/SpiritualGoal'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// GET - Récupérer un objectif spécifique
export async function GET(
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
    
    const user = await User.findById(decoded.userId).populate('role')
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const goal = await SpiritualGoal.findById(params.id).populate('userId', 'firstName lastName')
    
    if (!goal) {
      return NextResponse.json({ error: 'Objectif non trouvé' }, { status: 404 })
    }

    // Vérifier les permissions
    if (user.role.name !== 'admin' && goal.userId._id.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    return NextResponse.json({ goal })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'objectif:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un objectif
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
    
    const user = await User.findById(decoded.userId).populate('role')
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const goal = await SpiritualGoal.findById(params.id)
    if (!goal) {
      return NextResponse.json({ error: 'Objectif non trouvé' }, { status: 404 })
    }

    // Vérifier les permissions
    if (user.role.name !== 'admin' && goal.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      targetType,
      targetValue,
      unit,
      endDate,
      status,
      priority,
      reminders
    } = body

    // Mettre à jour les champs modifiés
    if (title !== undefined) goal.title = title.trim()
    if (description !== undefined) goal.description = description.trim()
    if (category !== undefined) goal.category = category
    if (targetType !== undefined) goal.targetType = targetType
    if (targetValue !== undefined) goal.targetValue = targetValue
    if (unit !== undefined) goal.unit = unit
    if (endDate !== undefined) goal.endDate = endDate ? new Date(endDate) : undefined
    if (status !== undefined) goal.status = status
    if (priority !== undefined) goal.priority = priority
    if (reminders !== undefined) goal.reminders = reminders

    await goal.save()
    await goal.populate('userId', 'firstName lastName')

    return NextResponse.json({ 
      message: 'Objectif mis à jour avec succès',
      goal 
    })

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un objectif
export async function DELETE(
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
    
    const user = await User.findById(decoded.userId).populate('role')
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const goal = await SpiritualGoal.findById(params.id)
    if (!goal) {
      return NextResponse.json({ error: 'Objectif non trouvé' }, { status: 404 })
    }

    // Vérifier les permissions
    if (user.role.name !== 'admin' && goal.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    await SpiritualGoal.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'Objectif supprimé avec succès' })

  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}