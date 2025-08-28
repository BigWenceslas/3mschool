import { randomBytes, createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function setCSRFCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, hashToken(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 // 24 hours
  })
  return response
}

export function getCSRFToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null
}

export function getCSRFTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME) || null
}

export function validateCSRFToken(request: NextRequest): boolean {
  // GET, HEAD, OPTIONS, TRACE sont exemptés de la validation CSRF
  const method = request.method
  if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
    return true
  }

  const storedToken = getCSRFToken(request)
  const providedToken = getCSRFTokenFromHeader(request)

  if (!storedToken || !providedToken) {
    return false
  }

  const hashedProvidedToken = hashToken(providedToken)
  return storedToken === hashedProvidedToken
}

export function requireCSRF(request: NextRequest): { success: true } | { error: Response } {
  // Désactiver temporairement CSRF en développement
  if (process.env.NODE_ENV === 'development') {
    return { success: true }
  }
  
  if (!validateCSRFToken(request)) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Token CSRF manquant ou invalide' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  return { success: true }
}