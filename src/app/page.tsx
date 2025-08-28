'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-400/60 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-blue-400/30 rounded-full animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-amber-300/50 rounded-full animate-pulse" style={{ animationDelay: '6s' }}></div>
        <div className="absolute top-1/6 right-1/6 w-1 h-1 bg-purple-300/60 rounded-full animate-pulse" style={{ animationDelay: '8s' }}></div>
        
        {/* Sacred Geometry */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10"
          style={{ transform: `translate(-50%, -50%) rotate(${scrollY * 0.1}deg)` }}
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <polygon 
              points="200,50 350,300 50,300" 
              fill="none" 
              stroke="url(#triangleGradient)" 
              strokeWidth="2"
              className="animate-pulse"
            />
            <circle 
              cx="200" 
              cy="200" 
              r="100" 
              fill="none" 
              stroke="url(#circleGradient)" 
              strokeWidth="1.5"
              className="animate-pulse"
              style={{ animationDelay: '2s' }}
            />
            <circle 
              cx="200" 
              cy="200" 
              r="150" 
              fill="none" 
              stroke="url(#circleGradient2)" 
              strokeWidth="1"
              className="animate-pulse"
              style={{ animationDelay: '4s' }}
            />
            <defs>
              <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8"/>
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4"/>
              </linearGradient>
              <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4"/>
              </linearGradient>
              <linearGradient id="circleGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`relative z-50 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-slate-900 font-bold text-sm">3M</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-purple-600 rounded-full blur opacity-30 animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
                3 Mages
              </span>
            </div>
            <div className="flex space-x-6">
              <Link 
                href="/login" 
                className="text-slate-300 hover:text-white transition-colors duration-300 font-medium"
              >
                Connexion
              </Link>
              <Link 
                href="/dashboard" 
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 px-6 py-2 rounded-full transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg hover:shadow-xl"
              >
                Espace Membre
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] px-6">
        <div className="text-center max-w-6xl mx-auto">
          <div className={`transition-all duration-1500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 leading-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-purple-400 to-blue-400 drop-shadow-2xl">
                3 Mages
              </span>
            </h1>
            
            <p className={`text-2xl md:text-3xl text-slate-200 mb-6 font-light transition-all duration-1500 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              L'Éveil de la Conscience Spirituelle
            </p>
            
            <p className={`text-lg md:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed transition-all duration-1500 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
              Rejoignez une communauté spirituelle dédiée à l'exploration des mystères intérieurs. 
              Développez votre pratique, partagez vos expériences et progressez ensemble vers l'illumination.
            </p>
          </div>

          <div className={`flex flex-col sm:flex-row gap-6 justify-center mb-20 transition-all duration-1500 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
            <Link 
              href="/login"
              className="group relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25"
            >
              <span className="relative z-10">Commencer le Voyage</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            </Link>
            <Link 
              href="/blog"
              className="group relative bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 px-10 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-amber-500/25"
            >
              <span className="relative z-10">Espace Sacré</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Features Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 transition-all duration-1500 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
            <div className="group bg-gradient-to-br from-slate-800/50 to-purple-900/50 backdrop-blur-sm p-8 rounded-3xl border border-purple-800/30 hover:border-purple-600/50 transition-all duration-500 transform hover:-translate-y-4 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300">
                <span className="text-3xl">🧘‍♀️</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Méditation Profonde</h3>
              <p className="text-slate-300 leading-relaxed">
                Explorez les dimensions intérieures de votre être à travers des techniques de méditation ancestrales et modernes
              </p>
            </div>
            
            <div className="group bg-gradient-to-br from-slate-800/50 to-amber-900/50 backdrop-blur-sm p-8 rounded-3xl border border-amber-800/30 hover:border-amber-600/50 transition-all duration-500 transform hover:-translate-y-4 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-amber-500/50 transition-all duration-300">
                <span className="text-3xl">📿</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Sagesse Ancestrale</h3>
              <p className="text-slate-300 leading-relaxed">
                Accédez aux enseignements millénaires et découvrez les secrets de la transformation spirituelle
              </p>
            </div>
            
            <div className="group bg-gradient-to-br from-slate-800/50 to-blue-900/50 backdrop-blur-sm p-8 rounded-3xl border border-blue-800/30 hover:border-blue-600/50 transition-all duration-500 transform hover:-translate-y-4 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300">
                <span className="text-3xl">🌟</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Éveil Collectif</h3>
              <p className="text-slate-300 leading-relaxed">
                Connectez-vous avec une communauté de chercheurs spirituels partageant le même chemin d'évolution
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Additional sections can be added here for more content */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-4xl md:text-5xl font-bold text-white mb-8 transition-all duration-1500 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-400">
              Le Chemin des Trois Mages
            </span>
          </h2>
          <p className={`text-xl text-slate-300 leading-relaxed transition-all duration-1500 delay-1400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
            Inspiré par la tradition des Mages d'Orient, notre plateforme vous guide dans l'exploration 
            des trois piliers de la sagesse : la connaissance de soi, la communion avec l'univers, 
            et le service à l'humanité.
          </p>
        </div>
      </section>
    </div>
  )
}