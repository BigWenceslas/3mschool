import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import Journal from '@/lib/models/Journal'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// GET - Récupérer les entrées de journal
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const mood = searchParams.get('mood')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const tags = searchParams.get('tags')

    let query: any = { userId: user._id }

    // Filtres de recherche
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ]
    }

    if (mood) {
      query.mood = mood
    }

    if (fromDate || toDate) {
      query.date = {}
      if (fromDate) query.date.$gte = new Date(fromDate)
      if (toDate) query.date.$lte = new Date(toDate)
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim())
      query.tags = { $in: tagArray }
    }

    const skip = (page - 1) * limit

    const entries = await Journal.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName')

    const total = await Journal.countDocuments(query)

    return NextResponse.json({
      entries,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des entrées:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle entrée de journal
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

    // Validation
    if (!title || !content) {
      return NextResponse.json({ 
        error: 'Le titre et le contenu sont requis' 
      }, { status: 400 })
    }

    const journalEntry = new Journal({
      userId: user._id,
      title: title.trim(),
      content: content.trim(),
      mood: mood || 'neutral',
      tags: tags || [],
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      date: date ? new Date(date) : new Date(),
      spiritualPractices: spiritualPractices || {
        meditation: 0,
        prayer: 0,
        reading: 0,
        reflection: 0
      },
      gratitude: gratitude || [],
      challenges: challenges?.trim() || '',
      insights: insights?.trim() || ''
    })

    await journalEntry.save()
    await journalEntry.populate('userId', 'firstName lastName')

    return NextResponse.json({ 
      message: 'Entrée de journal créée avec succès',
      entry: journalEntry 
    })

  } catch (error: any) {
    console.error('Erreur lors de la création de l\'entrée:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}