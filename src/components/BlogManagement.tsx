'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Calendar, Tag, User, Heart, MessageCircle, Search } from 'lucide-react'
import CircularLoader from './CircularLoader'
import { fetchWithCSRF } from '@/lib/use-csrf'

interface BlogPost {
  _id: string
  title: string
  excerpt: string
  author: {
    _id: string
    firstName: string
    lastName: string
  }
  status: 'draft' | 'published' | 'archived'
  slug: string
  tags: string[]
  publishedAt?: string
  readTime?: number
  views: number
  likes: number
  comments: string[]
  createdAt: string
}

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    tags: '',
    featuredImage: ''
  })

  useEffect(() => {
    loadPosts()
  }, [statusFilter])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const loadPosts = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/blog?${queryParams.toString()}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const finalFormData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      }
      
      const url = editingPost 
        ? `/api/blog/${editingPost.slug}`
        : '/api/blog'
      
      const method = editingPost ? 'PUT' : 'POST'
      
      const response = await fetchWithCSRF(url, {
        method,
        body: JSON.stringify(finalFormData)
      })

      if (response.ok) {
        await loadPosts()
        handleCloseDialog()
        showNotification(
          'success', 
          editingPost 
            ? 'Article mis à jour avec succès !' 
            : 'Article créé avec succès !'
        )
      } else {
        const data = await response.json()
        showNotification('error', data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification('error', 'Erreur de connexion. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (post: BlogPost) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        const response = await fetchWithCSRF(`/api/blog/${post.slug}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await loadPosts()
          showNotification('success', 'Article supprimé avec succès !')
        } else {
          const data = await response.json()
          showNotification('error', data.error || 'Erreur lors de la suppression')
        }
      } catch (error) {
        console.error('Erreur:', error)
        showNotification('error', 'Erreur de connexion. Veuillez réessayer.')
      }
    }
  }

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      content: '', // On chargera le contenu complet depuis l'API
      excerpt: post.excerpt,
      status: post.status,
      tags: post.tags.join(', '),
      featuredImage: ''
    })
    
    // Charger le contenu complet de l'article
    loadFullPost(post.slug)
    setOpenDialog(true)
  }

  const loadFullPost = async (slug: string) => {
    try {
      const response = await fetch(`/api/blog/${slug}?includeUnpublished=true`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          content: data.post.content,
          featuredImage: data.post.featuredImage || ''
        }))
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'article complet:', error)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingPost(null)
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      status: 'draft',
      tags: '',
      featuredImage: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Publié'
      case 'draft': return 'Brouillon'
      case 'archived': return 'Archivé'
      default: return status
    }
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CircularLoader size="lg" className="text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion du blog</h2>
          <p className="text-gray-600">Créez et gérez les articles du blog</p>
        </div>
        <button
          onClick={() => setOpenDialog(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nouvel article</span>
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher des articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="published">Publiés</option>
          <option value="draft">Brouillons</option>
          <option value="archived">Archivés</option>
        </select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <Edit className="text-blue-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">{posts.length}</p>
              <p className="text-sm text-gray-500">Total articles</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
              <Eye className="text-green-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {posts.filter(p => p.status === 'published').length}
              </p>
              <p className="text-sm text-gray-500">Publiés</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
              <Edit className="text-yellow-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {posts.filter(p => p.status === 'draft').length}
              </p>
              <p className="text-sm text-gray-500">Brouillons</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
              <Heart className="text-purple-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {posts.reduce((sum, p) => sum + p.views, 0)}
              </p>
              <p className="text-sm text-gray-500">Total vues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des articles */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistiques
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <tr key={post._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">
                        {post.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {post.excerpt}
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                            >
                              <Tag size={10} className="mr-1" />
                              {tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{post.tags.length - 3} autres
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <User size={16} className="mr-2 text-gray-400" />
                      {post.author.firstName} {post.author.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(post.status)}`}>
                      {getStatusLabel(post.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Eye size={14} className="mr-1 text-gray-400" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center">
                        <Heart size={14} className="mr-1 text-gray-400" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle size={14} className="mr-1 text-gray-400" />
                        <span>{post.comments.length}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-1 text-gray-400" />
                      {post.status === 'published' && post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('fr-FR')
                        : new Date(post.createdAt).toLocaleDateString('fr-FR')
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                    {post.status === 'published' && (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900"
                        title="Voir l'article"
                      >
                        <Eye size={16} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm ? 'Aucun article trouvé pour cette recherche.' : 'Aucun article trouvé.'}
            </p>
          </div>
        )}
      </div>

      {/* Dialog de création/édition */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">
              {editingPost ? 'Modifier l\'article' : 'Nouvel article'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Titre de l'article"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extrait *
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  required
                  rows={3}
                  maxLength={300}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Résumé de l'article (max 300 caractères)"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.excerpt.length}/300 caractères
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={15}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contenu de l'article (Markdown supporté)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publier</option>
                    <option value="archived">Archiver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="spiritualité, méditation, développement..."
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Séparez les tags par des virgules
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image de couverture (URL)
                </label>
                <input
                  type="url"
                  value={formData.featuredImage}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {submitting 
                    ? 'En cours...' 
                    : (editingPost ? 'Mettre à jour' : 'Créer')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <Eye size={20} />
              ) : (
                <Trash2 size={20} />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}