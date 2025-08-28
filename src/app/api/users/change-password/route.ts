import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'
import { connectMongoDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'

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
    const { currentPassword, newPassword } = body

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur
    const user = await User.findById(auth.user.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 }
      )
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit être différent de l\'ancien' },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Mettre à jour le mot de passe
    await User.findByIdAndUpdate(
      auth.user.userId,
      {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    )

    return NextResponse.json({
      message: 'Mot de passe modifié avec succès'
    })

  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du mot de passe' },
      { status: 500 }
    )
  }
}