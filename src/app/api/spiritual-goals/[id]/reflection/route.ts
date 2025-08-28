import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import SpiritualGoal from '@/lib/models/SpiritualGoal'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// POST - Ajouter une réflexion à un objectif
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
    const { content, mood } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ 
        error: 'Le contenu de la réflexion est requis' 
      }, { status: 400 })
    }

    // Ajouter la réflexion
    await goal.addReflection(content.trim(), mood)

    return NextResponse.json({ 
      message: 'Réflexion ajoutée avec succès',
      reflection: goal.reflections[goal.reflections.length - 1]
    })

  } catch (error) {
    console.error('Erreur lors de l\'ajout de la réflexion:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}