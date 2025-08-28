'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Users, Eye, Calendar as CalendarIcon, X } from 'lucide-react'
import Calendar from './Calendar'
import AttendanceSheet from './AttendanceSheet'

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

interface Enrollment {
  _id: string
  userId: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  attended: boolean
  paymentStatus: 'pending' | 'paid' | 'exempted'
  paymentDate?: string
  paymentMethod?: string
  paymentReference?: string
  notes?: string
}

export default function AdminCalendarView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [showAttendance, setShowAttendance] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAttendance = async (courseId: string) => {
    setAttendanceLoading(true)
    try {
      const response = await fetch(`/api/courses/${courseId}/attendance`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setEnrollments(data.enrollments || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des présences:', error)
      setEnrollments([])
    } finally {
      setAttendanceLoading(false)
    }
  }

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course)
    setShowAttendance(false)
  }

  const handleViewAttendance = (course: Course) => {
    setSelectedCourse(course)
    setShowAttendance(true)
    loadAttendance(course._id)
  }

  const handleSaveAttendance = async (attendanceData: any[]) => {
    if (!selectedCourse) return

    try {
      const response = await fetch(`/api/courses/${selectedCourse._id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ attendanceList: attendanceData })
      })

      if (response.ok) {
        // Recharger les données
        loadAttendance(selectedCourse._id)
        
        // Optionnel: afficher un message de succès
        alert('Présences sauvegardées avec succès!')
      } else {
        alert('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const getEnrollmentCount = (courseId: string) => {
    // Si on a des enrollments pour ce cours spécifique
    if (selectedCourse && selectedCourse._id === courseId && enrollments.length > 0) {
      return enrollments.length
    }
    // Sinon, utiliser les données du cours
    const course = courses.find(c => c._id === courseId)
    return course ? course.maxParticipants : 0 // Utiliser maxParticipants comme fallback
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}min` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement du calendrier...</span>
      </div>
    )
  }

  if (showAttendance && selectedCourse) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAttendance(false)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <CalendarIcon size={16} />
            <span>← Retour au calendrier</span>
          </button>
        </div>
        
        <AttendanceSheet
          course={selectedCourse}
          students={enrollments}
          onSave={handleSaveAttendance}
          loading={attendanceLoading}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <CalendarIcon className="text-blue-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">{courses.length}</p>
              <p className="text-sm text-gray-500">Cours total</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
              <CalendarIcon className="text-green-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {courses.filter(c => c.status === 'planned').length}
              </p>
              <p className="text-sm text-gray-500">Planifiés</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
              <CalendarIcon className="text-yellow-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {courses.filter(c => c.status === 'ongoing').length}
              </p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
              <CalendarIcon className="text-gray-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {courses.filter(c => c.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-500">Terminés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <Calendar
        courses={courses}
        onCourseSelect={(course: any) => handleCourseSelect(course)}
      />

      {/* Détails du cours sélectionné */}
      {selectedCourse && !showAttendance && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 relative">
          <button
            onClick={() => setSelectedCourse(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            title="Fermer"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-start justify-between mb-4 pr-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {selectedCourse.title}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Date:</strong> {formatDate(selectedCourse.date)}</p>
                <p><strong>Durée:</strong> {formatDuration(selectedCourse.duration)}</p>
                <p><strong>Lieu:</strong> {selectedCourse.location}</p>
                <p><strong>Prix:</strong> {selectedCourse.price.toLocaleString()} XAF</p>
                <p><strong>Places max:</strong> {selectedCourse.maxParticipants}</p>
                <p><strong>Instructeur:</strong> {selectedCourse.instructor.firstName} {selectedCourse.instructor.lastName}</p>
              </div>
              
              {selectedCourse.description && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                  <p className="text-gray-700">{selectedCourse.description}</p>
                </div>
              )}
            </div>

            <div className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${selectedCourse.status === 'planned' ? 'bg-green-100 text-green-800' : ''}
              ${selectedCourse.status === 'ongoing' ? 'bg-blue-100 text-blue-800' : ''}
              ${selectedCourse.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
              ${selectedCourse.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
            `}>
              {selectedCourse.status === 'planned' && 'Planifié'}
              {selectedCourse.status === 'ongoing' && 'En cours'}
              {selectedCourse.status === 'completed' && 'Terminé'}
              {selectedCourse.status === 'cancelled' && 'Annulé'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleViewAttendance(selectedCourse)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Users size={16} />
              <span>Gérer les présences</span>
            </button>
            
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users size={14} />
              <span>Participants inscrits: {getEnrollmentCount(selectedCourse._id)}/{selectedCourse.maxParticipants}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}