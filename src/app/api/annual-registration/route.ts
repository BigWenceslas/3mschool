import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import AnnualRegistration from '@/lib/models/AnnualRegistration'
import User from '@/lib/models/User'
import Config from '@/lib/models/Config'
import { requireAuth } from '@/lib/auth'

// GET - Récupérer les inscriptions annuelles
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    await connectMongoDB()
    
    const user = await User.findById(auth.user.userId)

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    let query: any = {}
    
    if (year) query.year = parseInt(year)
    if (status) query.status = status
    
    // Si l'utilisateur n'est pas admin, il ne peut voir que ses propres inscriptions
    if (auth.user.role !== 'admin') {
      query.userId = user?._id
    } else if (userId) {
      query.userId = userId
    }

    const registrations = await AnnualRegistration.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ year: -1, createdAt: -1 })

    return NextResponse.json({ registrations })

  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer ou mettre à jour une inscription annuelle
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    await connectMongoDB()
    
    const user = await User.findById(auth.user.userId)

    const body = await request.json()
    const { userId, year, status, paymentMethod, paymentReference, notes } = body

    // Vérifier les permissions
    if (auth.user.role !== 'admin' && userId !== user?._id.toString()) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Obtenir le tarif configuré
    const configValue = await Config.findOne({ key: 'tarif_inscription_annuelle' })
    const amount = configValue?.value || 10000

    // Créer ou mettre à jour l'inscription
    let registration = await AnnualRegistration.findOne({ 
      userId: userId || user?._id, 
      year: year || new Date().getFullYear() 
    })

    if (registration) {
      // Mettre à jour l'inscription existante
      if (status) registration.status = status
      if (paymentMethod && paymentMethod.trim() !== '') registration.paymentMethod = paymentMethod
      if (paymentReference) registration.paymentReference = paymentReference
      if (notes) registration.notes = notes
      if (status === 'paid' && !registration.paymentDate) {
        registration.paymentDate = new Date()
      }
      
      await registration.save()
    } else {
      // Créer une nouvelle inscription
      registration = new AnnualRegistration({
        userId: userId || user?._id,
        year: year || new Date().getFullYear(),
        amount,
        status: status || 'pending',
        ...(paymentMethod && paymentMethod.trim() !== '' && { paymentMethod }),
        paymentReference,
        notes,
        ...(status === 'paid' && { paymentDate: new Date() })
      })
      
      await registration.save()
    }

    await registration.populate('userId', 'firstName lastName email')

    return NextResponse.json({ 
      message: 'Inscription mise à jour avec succès',
      registration 
    })

  } catch (error: any) {
    console.error('Erreur lors de la création/mise à jour de l\'inscription:', error)
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: 'Une inscription existe déjà pour cet utilisateur et cette année' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}