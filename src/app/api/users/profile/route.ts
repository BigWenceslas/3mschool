import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'
import { connectMongoDB } from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function PUT(request: NextRequest) {
  try {
    const csrf = requireCSRF(request)
    if ('error' in csrf) {
      return csrf.error
    }

    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    await connectMongoDB()

    const body = await request.json()
    const { firstName, lastName, email } = body

    // Validation basique
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: auth.user.userId }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé par un autre utilisateur' },
        { status: 400 }
      )
    }

    // Mettre à jour le profil
    const updatedUser = await User.findByIdAndUpdate(
      auth.user.userId,
      {
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.toLowerCase().trim(),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Retourner les données mises à jour (sans le mot de passe)
    const { password, ...userWithoutPassword } = updatedUser.toObject()

    return NextResponse.json({
      message: 'Profil mis à jour avec succès',
      user: {
        ...userWithoutPassword,
        firstName,
        lastName
      }
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}