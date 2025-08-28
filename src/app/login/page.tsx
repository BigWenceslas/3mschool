'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CircularLoader from '@/components/CircularLoader'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError(data.error || 'Erreur de connexion')
      }
    } catch (error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl transform -translate-x-1/2"></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <span className="text-3xl">🌀</span>
              <span className="text-2xl font-bold text-blue-900">3 Mages</span>
            </Link>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Connexion</h1>
            <p className="text-blue-600">Accédez à votre espace spirituel</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-blue-100 shadow-xl">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-blue-900 mb-2">
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-blue-100 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-blue-900 mb-2">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-blue-100 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-blue-700">
                    Se souvenir de moi
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm text-violet-600 hover:text-violet-800 transition-colors">
                  Mot de passe oublié?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-2xl transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <CircularLoader size="sm" className="mr-2 text-white" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 mb-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-blue-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-blue-500">ou</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}