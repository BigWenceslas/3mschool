'use client'

import { useState, useEffect } from 'react'

interface UseCSRFReturn {
  csrfToken: string | null
  loading: boolean
  error: string | null
  refreshToken: () => Promise<void>
}

export function useCSRF(): UseCSRFReturn {
  const [csrfToken, setCSRFToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCSRFToken = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/csrf', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Échec de récupération du token CSRF')
      }

      const data = await response.json()
      setCSRFToken(data.csrfToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setCSRFToken(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCSRFToken()
  }, [])

  return {
    csrfToken,
    loading,
    error,
    refreshToken: fetchCSRFToken
  }
}

// Utility function to make CSRF-protected requests
export async function fetchWithCSRF(url: string, options: RequestInit = {}, csrfToken?: string) {
  // Si pas de token CSRF fourni, essayer de le récupérer
  if (!csrfToken && !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(options.method?.toUpperCase() || 'GET')) {
    const csrfResponse = await fetch('/api/csrf', { credentials: 'include' })
    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json()
      csrfToken = csrfData.csrfToken
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
  }

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers
  })
}