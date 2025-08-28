'use client'

import React, { useState, useEffect } from 'react'
import { Check, X, Save, User, CreditCard, Clock, MapPin, DollarSign } from 'lucide-react'
import { generatePaymentReference } from '@/lib/reference-generator'

interface Student {
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

interface Course {
  _id: string
  title: string
  description: string
  date: string
  duration: number
  location: string
  price: number
  instructor: {
    firstName: string
    lastName: string
  }
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
}

interface AttendanceSheetProps {
  course: Course
  students: Student[]
  onSave: (attendanceData: any[]) => Promise<void>
  loading?: boolean
}

export default function AttendanceSheet({ course, students, onSave, loading = false }: AttendanceSheetProps) {
  const [attendanceData, setAttendanceData] = useState<Student[]>([])
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setAttendanceData(students)
  }, [students])

  const filteredStudents = attendanceData.filter(student =>
    `${student.userId.firstName} ${student.userId.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.userId.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const updateStudentAttendance = (studentId: string, field: string, value: any) => {
    setAttendanceData(prev =>
      prev.map(student =>
        student.userId._id === studentId
          ? { ...student, [field]: value }
          : student
      )
    )
  }

  const updatePaymentInfo = (studentId: string, paymentData: any) => {
    setAttendanceData(prev =>
      prev.map(student =>
        student.userId._id === studentId
          ? {
              ...student,
              paymentStatus: paymentData.status,
              paymentMethod: paymentData.method,
              paymentReference: paymentData.status === 'paid' && !paymentData.reference 
                ? generatePaymentReference('course')
                : paymentData.reference,
              paymentDate: paymentData.status === 'paid' ? new Date().toISOString() : student.paymentDate
            }
          : student
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updateData = attendanceData.map(student => ({
        userId: student.userId._id,
        attended: student.attended,
        paymentStatus: student.paymentStatus,
        paymentMethod: student.paymentMethod,
        paymentReference: student.paymentReference,
        notes: student.notes
      }))

      await onSave(updateData)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setSaving(false)
    }
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

  const getAttendanceStats = () => {
    const present = attendanceData.filter(s => s.attended).length
    const paid = attendanceData.filter(s => s.paymentStatus === 'paid').length
    const total = attendanceData.length
    
    return { present, paid, total }
  }

  const stats = getAttendanceStats()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header du cours */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <span>{formatDate(course.date)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <span>Durée: {formatDuration(course.duration)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin size={16} />
                <span>{course.location}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign size={16} />
                <span>{course.price.toLocaleString()} XAF</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <User size={16} />
              <span className="text-sm text-gray-600">
                Instructeur: {course.instructor.firstName} {course.instructor.lastName}
              </span>
            </div>
          </div>

          <div className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${course.status === 'planned' ? 'bg-green-100 text-green-800' : ''}
            ${course.status === 'ongoing' ? 'bg-blue-100 text-blue-800' : ''}
            ${course.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
            ${course.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
          `}>
            {course.status === 'planned' && 'Planifié'}
            {course.status === 'ongoing' && 'En cours'}
            {course.status === 'completed' && 'Terminé'}
            {course.status === 'cancelled' && 'Annulé'}
          </div>
        </div>
      </div>

      {/* Statistiques et recherche */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.present}</div>
              <div className="text-sm text-gray-500">Présents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
              <div className="text-sm text-gray-500">Payé</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="flex-1 max-w-md ml-0 md:ml-6">
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Liste des étudiants */}
      <div className="divide-y divide-gray-200">
        {filteredStudents.map((student) => (
          <div key={student.userId._id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-6">
              {/* Informations étudiant */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {student.userId.firstName} {student.userId.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{student.userId.email}</p>
                  </div>
                </div>
              </div>

              {/* Contrôles de présence */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Présence
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateStudentAttendance(student.userId._id, 'attended', true)}
                      className={`
                        p-2 rounded-lg transition-colors
                        ${student.attended
                          ? 'bg-green-100 text-green-700 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-200 hover:bg-green-50'
                        }
                      `}
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => updateStudentAttendance(student.userId._id, 'attended', false)}
                      className={`
                        p-2 rounded-lg transition-colors
                        ${!student.attended
                          ? 'bg-red-100 text-red-700 border-2 border-red-300'
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-200 hover:bg-red-50'
                        }
                      `}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Statut de paiement */}
                <div className="text-center min-w-[120px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paiement
                  </label>
                  <select
                    value={student.paymentStatus}
                    onChange={(e) => updatePaymentInfo(student.userId._id, {
                      status: e.target.value,
                      method: student.paymentMethod,
                      reference: student.paymentReference
                    })}
                    className={`
                      w-full px-3 py-2 text-sm border rounded-lg transition-colors
                      ${student.paymentStatus === 'paid' ? 'bg-green-50 border-green-300 text-green-800' : ''}
                      ${student.paymentStatus === 'pending' ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : ''}
                      ${student.paymentStatus === 'exempted' ? 'bg-blue-50 border-blue-300 text-blue-800' : ''}
                    `}
                  >
                    <option value="pending">En attente</option>
                    <option value="paid">Payé</option>
                    <option value="exempted">Exempté</option>
                  </select>
                </div>

                {/* Méthode de paiement (si payé) */}
                {student.paymentStatus === 'paid' && (
                  <div className="text-center min-w-[100px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Méthode
                    </label>
                    <select
                      value={student.paymentMethod || ''}
                      onChange={(e) => updatePaymentInfo(student.userId._id, {
                        status: student.paymentStatus,
                        method: e.target.value,
                        reference: student.paymentReference
                      })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="">Sélectionner une méthode</option>
                      <option value="cash">Espèces</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Virement bancaire</option>
                      <option value="card">Carte bancaire</option>
                      <option value="exempted">Exempté</option>
                    </select>
                  </div>
                )}

                {/* Référence de paiement */}
                {student.paymentStatus === 'paid' && (
                  <div className="text-center min-w-[120px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Référence
                    </label>
                    <input
                      type="text"
                      value={student.paymentReference || 'Générée automatiquement'}
                      readOnly
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={student.notes || ''}
                onChange={(e) => updateStudentAttendance(student.userId._id, 'notes', e.target.value)}
                placeholder="Ajouter des notes..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center">
            <User size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm 
                ? 'Aucun étudiant ne correspond à votre recherche'
                : 'Aucun étudiant inscrit à ce cours'
              }
            </p>
          </div>
        )}
      </div>

      {/* Footer avec bouton de sauvegarde */}
      {filteredStudents.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {stats.present} présent(s) sur {stats.total} • {stats.paid} paiement(s) effectué(s)
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${saving 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Sauvegarder</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}