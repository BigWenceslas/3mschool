import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import Journal from '@/lib/models/Journal'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// GET - Récupérer une entrée spécifique
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
    
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const entry = await Journal.findById(params.id).populate('userId', 'firstName lastName')
    
    if (!entry) {
      return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 })
    }

    // Vérifier que l'utilisateur peut voir cette entrée
    if (entry.userId._id.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    return NextResponse.json({ entry })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'entrée:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour une entrée
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

    const entry = await Journal.findById(params.id)
    if (!entry) {
      return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 })
    }

    // Vérifier que l'utilisateur peut modifier cette entrée
    if (entry.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      content,
      mood,
      tags,
      isPrivate,
      date,
      spiritualPractices,
      gratitude,
      challenges,
      insights
    } = body

    // Mettre à jour les champs modifiés
    if (title !== undefined) entry.title = title.trim()
    if (content !== undefined) entry.content = content.trim()
    if (mood !== undefined) entry.mood = mood
    if (tags !== undefined) entry.tags = tags
    if (isPrivate !== undefined) entry.isPrivate = isPrivate
    if (date !== undefined) entry.date = new Date(date)
    if (spiritualPractices !== undefined) entry.spiritualPractices = spiritualPractices
    if (gratitude !== undefined) entry.gratitude = gratitude
    if (challenges !== undefined) entry.challenges = challenges.trim()
    if (insights !== undefined) entry.insights = insights.trim()

    await entry.save()
    await entry.populate('userId', 'firstName lastName')

    return NextResponse.json({ 
      message: 'Entrée mise à jour avec succès',
      entry 
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

// DELETE - Supprimer une entrée
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
    
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const entry = await Journal.findById(params.id)
    if (!entry) {
      return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 })
    }

    // Vérifier que l'utilisateur peut supprimer cette entrée
    if (entry.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    await Journal.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'Entrée supprimée avec succès' })

  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}