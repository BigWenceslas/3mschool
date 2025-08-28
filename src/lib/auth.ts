import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  const tokenCookie = request.cookies.get('auth-token')
  return tokenCookie?.value || null
}

export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}

export function requireAuth(request: NextRequest): { user: TokenPayload } | { error: Response } {
  const user = getUserFromRequest(request)
  
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Non autorisé - session invalide' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return { user }
}