'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Heart, MessageCircle, Tag, Search, ArrowRight } from 'lucide-react'

interface BlogPost {
  _id: string
  title: string
  excerpt: string
  author: {
    firstName: string
    lastName: string
  } | null
  slug: string
  tags: string[]
  publishedAt: string
  readTime: number
  views: number
  likes: number
  comments: string[]
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    loadPosts()
  }, [selectedTag])

  const loadPosts = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (selectedTag) {
        queryParams.append('tag', selectedTag)
      }
      if (searchTerm) {
        queryParams.append('search', searchTerm)
      }
      
      const response = await fetch(`/api/blog?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        
        // Extraire tous les tags uniques
        const uniqueTags = Array.from(
          new Set(data.posts.flatMap((post: BlogPost) => post.tags))
        ).sort()
        setAllTags(uniqueTags)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadPosts()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Background décoratif identique à l'accueil */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900"></div>
        
        {/* Éléments flottants */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-400/60 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-blue-400/30 rounded-full animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-amber-300/50 rounded-full animate-pulse" style={{ animationDelay: '6s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-slate-900 font-bold text-sm">3M</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-purple-600 rounded-full blur opacity-30 animate-pulse"></div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
                  3 Mages
                </span>
              </Link>
            </div>
            <div className="flex space-x-6">
              <Link 
                href="/" 
                className="text-slate-300 hover:text-white transition-colors duration-300 font-medium"
              >
                Accueil
              </Link>
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

      {/* Header du blog */}
      <div className="relative z-10 text-center py-16 px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-purple-400 to-blue-400 drop-shadow-2xl">
            Espace Sacré
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-200 mb-8 max-w-3xl mx-auto font-light">
          Explorez nos réflexions sur la spiritualité, la sagesse ancestrale et l'éveil de la conscience
        </p>
      </div>

      {/* Contenu du blog */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        {/* Barre de recherche et filtres */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-12 border border-purple-800/30">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            {/* Recherche */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher des articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Filtres par tags */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedTag === '' 
                      ? 'bg-amber-500 text-slate-900 font-medium' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                >
                  Tous
                </button>
                {allTags.slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      selectedTag === tag 
                        ? 'bg-purple-500 text-white font-medium' 
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Articles */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article
                key={post._id}
                className="group bg-gradient-to-br from-slate-800/80 to-purple-900/50 backdrop-blur-sm rounded-2xl border border-purple-800/30 hover:border-purple-600/50 transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 overflow-hidden"
              >
                <div className="p-6">
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full"
                        >
                          <Tag size={10} className="mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Titre */}
                  <h2 className="text-xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  {/* Extrait */}
                  <p className="text-slate-300 mb-4 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Métadonnées */}
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <User size={14} className="mr-1" />
                        <span>{post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Auteur anonyme'}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        <span>{post.readTime} min</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                  </div>

                  {/* Statistiques */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <div className="flex items-center">
                        <Heart size={14} className="mr-1" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle size={14} className="mr-1" />
                        <span>{post.comments.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lien vers l'article */}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-amber-400 hover:text-amber-300 transition-colors font-medium"
                  >
                    Lire l'article
                    <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50">
              <h3 className="text-2xl font-bold text-slate-300 mb-4">Aucun article trouvé</h3>
              <p className="text-slate-400">
                {searchTerm || selectedTag 
                  ? 'Essayez de modifier vos critères de recherche.' 
                  : 'Les premiers articles du blog arrivent bientôt !'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}