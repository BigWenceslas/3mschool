import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import AnnualRegistration from '@/lib/models/AnnualRegistration'
import User from '@/lib/models/User'
import { requireAuth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'

// GET - Récupérer une inscription spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    await connectMongoDB()
    
    const user = await User.findById(auth.user.userId)

    const registration = await AnnualRegistration.findById(params.id)
      .populate('userId', 'firstName lastName email')

    if (!registration) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }

    // Vérifier les permissions
    if (auth.user.role !== 'admin' && registration.userId._id.toString() !== user?._id.toString()) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    return NextResponse.json({ registration })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'inscription:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour une inscription
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    const csrf = requireCSRF(request)
    if ('error' in csrf) {
      return csrf.error
    }

    await connectMongoDB()
    
    const user = await User.findById(auth.user.userId)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Seuls les admins peuvent modifier les inscriptions
    if (auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await request.json()
    const { status, paymentMethod, paymentReference, notes, amount, exemptionReason } = body

    const registration = await AnnualRegistration.findById(params.id)
    if (!registration) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }

    // Mettre à jour les champs modifiés
    if (status !== undefined) registration.status = status
    if (paymentMethod !== undefined && paymentMethod.trim() !== '') registration.paymentMethod = paymentMethod
    if (paymentReference !== undefined) registration.paymentReference = paymentReference
    if (notes !== undefined) registration.notes = notes
    if (amount !== undefined) registration.amount = amount
    if (exemptionReason !== undefined) registration.exemptionReason = exemptionReason

    // Si le statut passe à "paid" et qu'il n'y a pas encore de date de paiement
    if (status === 'paid' && !registration.paymentDate) {
      registration.paymentDate = new Date()
    }

    await registration.save()
    await registration.populate('userId', 'firstName lastName email')

    return NextResponse.json({ 
      message: 'Inscription mise à jour avec succès',
      registration 
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'inscription:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une inscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    const csrf = requireCSRF(request)
    if ('error' in csrf) {
      return csrf.error
    }

    await connectMongoDB()
    
    const user = await User.findById(auth.user.userId)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Seuls les admins peuvent supprimer les inscriptions
    if (auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const registration = await AnnualRegistration.findByIdAndDelete(params.id)
    if (!registration) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Inscription supprimée avec succès' })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'inscription:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}