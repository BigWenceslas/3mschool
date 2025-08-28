import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, setCSRFCookie } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  const token = generateCSRFToken()
  const response = NextResponse.json({ csrfToken: token })
  
  return setCSRFCookie(response, token)
}