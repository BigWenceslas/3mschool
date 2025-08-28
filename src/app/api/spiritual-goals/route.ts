import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import SpiritualGoal from '@/lib/models/SpiritualGoal'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// GET - Récupérer les objectifs spirituels
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
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const userId = searchParams.get('userId')

    let query: any = {}

    // Si l'utilisateur n'est pas admin, il ne voit que ses objectifs
    if (user.role.name !== 'admin') {
      query.userId = user._id
    } else if (userId) {
      query.userId = userId
    }

    // Filtres
    if (status) query.status = status
    if (category) query.category = category
    if (priority) query.priority = priority

    const goals = await SpiritualGoal.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ priority: -1, startDate: -1 })

    return NextResponse.json({ goals })

  } catch (error) {
    console.error('Erreur lors de la récupération des objectifs:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouvel objectif spirituel
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
      title,
      description,
      category,
      targetType,
      targetValue,
      unit,
      startDate,
      endDate,
      priority,
      reminders
    } = body

    // Validation
    if (!title || !targetValue || targetValue <= 0) {
      return NextResponse.json({ 
        error: 'Le titre et une valeur cible positive sont requis' 
      }, { status: 400 })
    }

    // Créer les milestones par défaut (25%, 50%, 75%, 100%)
    const defaultMilestones = [
      { percentage: 25, reached: false },
      { percentage: 50, reached: false },
      { percentage: 75, reached: false },
      { percentage: 100, reached: false }
    ]

    const goal = new SpiritualGoal({
      userId: user._id,
      title: title.trim(),
      description: description?.trim() || '',
      category: category || 'personal_growth',
      targetType: targetType || 'daily',
      targetValue,
      unit: unit || 'minutes',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      priority: priority || 'medium',
      reminders: reminders || { enabled: false, frequency: 'daily' },
      milestones: defaultMilestones
    })

    await goal.save()
    await goal.populate('userId', 'firstName lastName')

    return NextResponse.json({ 
      message: 'Objectif créé avec succès',
      goal 
    })

  } catch (error: any) {
    console.error('Erreur lors de la création de l\'objectif:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}