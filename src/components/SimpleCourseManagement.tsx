'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calendar, Clock, MapPin, Users, X } from 'lucide-react'
import { fetchWithCSRF } from '@/lib/use-csrf'

interface Course {
  _id: string
  title: string
  description: string
  date: string
  duration: number
  location: string
  price: number
  maxParticipants: number
  instructor: {
    firstName: string
    lastName: string
  }
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
}

export default function SimpleCourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    duration: 120,
    location: '',
    maxParticipants: 30,
    price: 1000
  })

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/courses', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // Sort courses by date descending (most recent first)
        const sortedCourses = (data.courses || []).sort((a: Course, b: Course) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setCourses(sortedCourses)
      } else {
        throw new Error('Erreur lors du chargement des cours')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const url = editingCourse 
        ? `/api/courses/${editingCourse._id}`
        : '/api/courses'
      
      const method = editingCourse ? 'PUT' : 'POST'
      
      const response = await fetchWithCSRF(url, {
        method,
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await loadCourses()
        handleCloseDialog()
        showNotification(
          'success', 
          editingCourse 
            ? 'Cours mis à jour avec succès !' 
            : 'Cours créé avec succès !'
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

  const handleDelete = async (course: Course) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le cours "${course.title}" ?`)) {
      try {
        const response = await fetchWithCSRF(`/api/courses/${course._id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await loadCourses()
          showNotification('success', 'Cours supprimé avec succès !')
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

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description,
      date: new Date(course.date).toISOString().slice(0, 16),
      duration: course.duration,
      location: course.location,
      maxParticipants: course.maxParticipants,
      price: course.price
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingCourse(null)
    setFormData({
      title: '',
      description: '',
      date: '',
      duration: 120,
      location: '',
      maxParticipants: 30,
      price: 1000
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800'
      case 'ongoing': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Planifié'
      case 'ongoing': return 'En cours'
      case 'completed': return 'Terminé'
      case 'cancelled': return 'Annulé'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Chargement des cours...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadCourses}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Cours</h2>
        <button 
          onClick={() => setOpenDialog(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nouveau Cours</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Total Cours</h3>
          <p className="text-3xl font-bold">{courses.length}</p>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Planifiés</h3>
          <p className="text-3xl font-bold">{courses.filter(c => c.status === 'planned').length}</p>
        </div>
        <div className="bg-yellow-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">En Cours</h3>
          <p className="text-3xl font-bold">{courses.filter(c => c.status === 'ongoing').length}</p>
        </div>
        <div className="bg-purple-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Terminés</h3>
          <p className="text-3xl font-bold">{courses.filter(c => c.status === 'completed').length}</p>
        </div>
      </div>

      {/* Courses Cards */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Liste des Cours</h3>
        
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun cours trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold text-gray-900 flex-1">{course.title}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                      {getStatusLabel(course.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar size={16} className="mr-2" />
                      {formatDate(course.date)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={16} className="mr-2" />
                      {course.duration} minutes
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin size={16} className="mr-2" />
                      {course.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users size={16} className="mr-2" />
                      Max {course.maxParticipants} participants
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t pt-4">
                    <div className="text-lg font-bold text-blue-600">
                      {course.price.toLocaleString()} FCFA
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier le cours"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(course)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer le cours"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form Modal */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingCourse ? 'Modifier le Cours' : 'Nouveau Cours'}
              </h3>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du cours
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date et heure
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    required
                    min="30"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum participants
                  </label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                    required
                    min="1"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                    required
                    min="0"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
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
                    : (editingCourse ? 'Mettre à jour' : 'Créer')
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
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}