import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const tokenData = getUserFromRequest(request)
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Token non valide' },
        { status: 401 }
      )
    }

    await connectMongoDB()
    
    const user = await User.findById(tokenData.userId)
    
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Split name into firstName and lastName for compatibility
    const nameParts = user.name.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        firstName,
        lastName,
        role: user.role,
        avatar: user.avatar
      }
    })

  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}