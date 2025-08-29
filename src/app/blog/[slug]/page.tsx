'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Heart, MessageCircle, Tag, ArrowLeft, Share2, Eye } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

interface BlogPost {
  _id: string
  title: string
  content: string
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
  comments: any[]
}

interface Comment {
  _id: string
  content: string
  author: {
    firstName: string
    lastName: string
  } | null
  createdAt: string
  replies?: Comment[]
}

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  useEffect(() => {
    if (params.slug) {
      loadPost(params.slug as string)
    }
  }, [params.slug])

  const loadPost = async (slug: string) => {
    try {
      const response = await fetch(`/api/blog/${slug}`)
      
      if (response.ok) {
        const data = await response.json()
        setPost(data.post)
      } else if (response.status === 404) {
        setError('Article non trouvé')
      } else {
        setError('Erreur lors du chargement de l\'article')
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'article:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (likeLoading || !post) return
    
    setLikeLoading(true)
    try {
      const response = await fetch(`/api/blog/${post.slug}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: liked ? 'unlike' : 'like' })
      })

      if (response.ok) {
        const data = await response.json()
        setPost(prev => prev ? { ...prev, likes: data.likes } : null)
        setLiked(!liked)
      } else if (response.status === 401) {
        // Rediriger vers la connexion si non connecté
        router.push('/login')
      }
    } catch (error) {
      console.error('Erreur lors du like:', error)
    } finally {
      setLikeLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatContent = (content: string) => {
    // Convertir les sauts de ligne en paragraphes
    return content.split('\n').map((paragraph, index) => {
      if (paragraph.trim() === '') return null
      
      // Gestion basique du markdown
      let formattedParagraph = paragraph
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-slate-700 px-2 py-1 rounded text-amber-300">$1</code>')
      
      return (
        <p
          key={index}
          className="text-slate-300 leading-relaxed mb-6"
          dangerouslySetInnerHTML={{ __html: formattedParagraph }}
        />
      )
    }).filter(Boolean)
  }

  const shareArticle = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        })
      } catch (err) {
        // Fallback: copier dans le presse-papier
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      // Fallback: copier dans le presse-papier
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            {error || 'Article non trouvé'}
          </h1>
          <p className="text-slate-300 mb-6">
            L'article que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 px-6 py-3 rounded-full transition-all duration-300 transform hover:scale-105 font-semibold"
          >
            <ArrowLeft size={16} className="mr-2" />
            Retour au blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Background décoratif */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900"></div>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-400/60 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-blue-400/30 rounded-full animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
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
              <Link
                href="/blog"
                className="flex items-center text-slate-300 hover:text-amber-300 transition-colors duration-300"
              >
                <ArrowLeft size={16} className="mr-2" />
                Retour au blog
              </Link>
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

      {/* Contenu de l'article */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 pb-20">
        <article className="bg-gradient-to-br from-slate-800/80 to-purple-900/30 backdrop-blur-sm rounded-3xl border border-purple-800/30 overflow-hidden">
          {/* Header de l'article */}
          <header className="p-8 lg:p-12 border-b border-purple-800/30">
            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 text-sm bg-purple-500/20 text-purple-300 rounded-full"
                  >
                    <Tag size={12} className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Titre */}
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Métadonnées */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-slate-400">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <User size={16} className="mr-2" />
                  <span className="font-medium">
                    {post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Auteur anonyme'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="mr-2" />
                  <span>{post.readTime} min de lecture</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Eye size={16} className="mr-1" />
                  <span>{post.views} vues</span>
                </div>
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-colors ${
                    liked
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
                  }`}
                >
                  <Heart size={16} className={liked ? 'fill-current' : ''} />
                  <span>{post.likes}</span>
                </button>
                <button
                  onClick={shareArticle}
                  className="flex items-center space-x-1 px-3 py-2 rounded-full bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 transition-colors"
                >
                  <Share2 size={16} />
                  <span>Partager</span>
                </button>
              </div>
            </div>
          </header>

          {/* Contenu */}
          <div className="p-8 lg:p-12">
            <div className="prose prose-invert max-w-none">
              {/* Extrait en début d'article */}
              <div className="text-xl text-slate-300 font-light leading-relaxed mb-8 p-6 bg-slate-700/30 rounded-2xl border-l-4 border-amber-400">
                {post.excerpt}
              </div>

              {/* Contenu principal */}
              <div className="text-lg leading-relaxed">
                {formatContent(post.content)}
              </div>
            </div>
          </div>

          {/* Section commentaires */}
          <div className="p-8 lg:p-12 border-t border-purple-800/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Commentaires ({post.comments.length})
              </h3>
              <Link
                href="/login"
                className="text-amber-400 hover:text-amber-300 transition-colors text-sm"
              >
                Connectez-vous pour commenter
              </Link>
            </div>

            {post.comments.length > 0 ? (
              <div className="space-y-6">
                {post.comments.map((comment: Comment) => (
                  <div
                    key={comment._id}
                    className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {comment.author ? comment.author.firstName.charAt(0).toUpperCase() : 'A'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {comment.author ? `${comment.author.firstName} ${comment.author.lastName}` : 'Auteur anonyme'}
                          </div>
                          <div className="text-sm text-slate-400">
                            {formatDate(comment.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle size={48} className="mx-auto text-slate-500 mb-4" />
                <p className="text-slate-400">
                  Aucun commentaire pour le moment. Soyez le premier à partager vos réflexions !
                </p>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}