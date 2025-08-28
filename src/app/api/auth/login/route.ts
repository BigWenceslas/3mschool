import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email }).select('+password')
    
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      )
    }

    const isPasswordValid = await user.comparePassword(password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    })

    const response = NextResponse.json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}