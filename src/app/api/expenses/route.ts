import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import Expense from '@/lib/models/Expense'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// GET - Récupérer les dépenses
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

    // Seuls les admins peuvent voir les dépenses
    if (user.role.name !== 'admin') {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    let query: any = {}

    if (status) query.status = status
    if (category) query.category = category
    if (fromDate || toDate) {
      query.date = {}
      if (fromDate) query.date.$gte = new Date(fromDate)
      if (toDate) query.date.$lte = new Date(toDate)
    }

    const skip = (page - 1) * limit

    const expenses = await Expense.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Expense.countDocuments(query)

    return NextResponse.json({
      expenses,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des dépenses:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une nouvelle dépense
export async function POST(request: NextRequest) {
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

    // Seuls les admins peuvent créer des dépenses
    if (user.role.name !== 'admin') {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      amount,
      category,
      type,
      paymentMethod,
      paymentReference,
      vendor,
      receiptUrl,
      date,
      dueDate,
      status,
      tags,
      notes,
      recurringSchedule
    } = body

    // Validation
    if (!title || !amount || amount <= 0) {
      return NextResponse.json({ 
        error: 'Le titre et un montant positif sont requis' 
      }, { status: 400 })
    }

    const expense = new Expense({
      title: title.trim(),
      description: description?.trim() || '',
      amount,
      category,
      type: type || 'one_time',
      paymentMethod,
      paymentReference: paymentReference?.trim(),
      vendor: vendor?.trim(),
      receiptUrl: receiptUrl?.trim(),
      date: date ? new Date(date) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: status || 'pending',
      tags: tags || [],
      notes: notes?.trim(),
      recurringSchedule,
      createdBy: user._id
    })

    await expense.save()
    await expense.populate('createdBy', 'firstName lastName')

    return NextResponse.json({ 
      message: 'Dépense créée avec succès',
      expense 
    })

  } catch (error: any) {
    console.error('Erreur lors de la création de la dépense:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}