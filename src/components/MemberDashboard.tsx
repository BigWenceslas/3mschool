'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  AlertTriangle, 
  User, 
  BookOpen, 
  TrendingUp,
  MapPin,
  CreditCard
} from 'lucide-react'
import Calendar from './Calendar'

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

interface Enrollment {
  _id: string
  courseId: Course
  attended: boolean
  paymentStatus: 'pending' | 'paid' | 'exempted'
  paymentDate?: string
  paymentMethod?: string
  enrolledAt: string
}

interface AnnualRegistration {
  _id: string
  year: number
  status: 'pending' | 'paid' | 'exempted'
  amount: number
  paymentDate?: string
  paymentMethod?: string
}

interface MemberStats {
  totalCourses: number
  attendedCourses: number
  paidCourses: number
  pendingPayments: number
  totalOwed: number
}

interface MemberDashboardProps {
  user: {
    firstName: string
    lastName: string
    email: string
  }
  upcomingCourses: Course[]
  courseHistory: Enrollment[]
  annualRegistration: AnnualRegistration | null
  stats: MemberStats
  loading?: boolean
}

export default function MemberDashboard({ 
  user, 
  upcomingCourses = [], 
  courseHistory = [], 
  annualRegistration, 
  stats,
  loading = false 
}: MemberDashboardProps) {
  const [selectedView, setSelectedView] = useState<'calendar' | 'history'>('calendar')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const getAttendanceRate = () => {
    if (stats.totalCourses === 0) return 0
    return Math.round((stats.attendedCourses / stats.totalCourses) * 100)
  }

  const getPaymentRate = () => {
    if (stats.totalCourses === 0) return 0
    return Math.round((stats.paidCourses / stats.totalCourses) * 100)
  }

  const currentYear = new Date().getFullYear()

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec bienvenue */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Bienvenue, {user?.firstName || ''} {user?.lastName || ''}
            </h1>
            <p className="opacity-90">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              <p className="text-sm text-gray-500">Cours suivis</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{getAttendanceRate()}%</p>
              <p className="text-sm text-gray-500">Taux de présence</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CreditCard className="text-emerald-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{getPaymentRate()}%</p>
              <p className="text-sm text-gray-500">Paiements à jour</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              stats.totalOwed > 0 ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <DollarSign className={stats.totalOwed > 0 ? 'text-red-600' : 'text-gray-600'} size={24} />
            </div>
            <div className="ml-4">
              <p className={`text-2xl font-bold ${stats.totalOwed > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.totalOwed.toLocaleString()} XAF
              </p>
              <p className="text-sm text-gray-500">Montant dû</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statut de l'inscription annuelle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              annualRegistration?.status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <TrendingUp className={
                annualRegistration?.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
              } size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Inscription annuelle {currentYear}
              </h3>
              <p className="text-sm text-gray-500">
                {annualRegistration?.amount.toLocaleString()} XAF
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              annualRegistration?.status === 'paid' 
                ? 'bg-green-100 text-green-800'
                : annualRegistration?.status === 'exempted'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {annualRegistration?.status === 'paid' && 'Payée'}
              {annualRegistration?.status === 'exempted' && 'Exemptée'}
              {annualRegistration?.status === 'pending' && 'En attente'}
              {!annualRegistration && 'Non enregistrée'}
            </div>
            
            {annualRegistration?.paymentDate && (
              <p className="text-xs text-gray-500 mt-1">
                Payée le {formatDate(annualRegistration.paymentDate)}
              </p>
            )}
          </div>
        </div>
        
        {annualRegistration?.status !== 'paid' && annualRegistration?.status !== 'exempted' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="text-yellow-600" size={16} />
              <p className="text-sm text-yellow-800">
                Votre inscription annuelle n'est pas encore réglée. Contactez l'administration pour régulariser votre situation.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation des vues */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setSelectedView('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedView === 'calendar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CalendarIcon size={16} />
                <span>Calendrier des cours</span>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedView('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedView === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <span>Historique des cours</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {selectedView === 'calendar' ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cours à venir
              </h3>
              
              {upcomingCourses.length > 0 ? (
                <Calendar
                  courses={upcomingCourses}
                  onCourseSelect={setSelectedCourse}
                  className="border-0 shadow-none"
                />
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Aucun cours prévu pour le moment</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Historique de vos cours
              </h3>
              
              {courseHistory.length > 0 ? (
                <div className="space-y-4">
                  {courseHistory.map((enrollment) => (
                    <div
                      key={enrollment._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {enrollment.courseId.title}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Clock size={14} />
                              <span>{formatDate(enrollment.courseId.date)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <MapPin size={14} />
                              <span>{enrollment.courseId.location}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <User size={14} />
                              <span>
                                {enrollment.courseId.instructor?.firstName || ''} {enrollment.courseId.instructor?.lastName || ''}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-2">
                            Inscrit le {formatDate(enrollment.enrolledAt)}
                          </p>
                        </div>
                        
                        <div className="text-right space-y-2">
                          {/* Statut de présence */}
                          <div className={`
                            flex items-center justify-end space-x-1 px-2 py-1 rounded-full text-xs font-medium
                            ${enrollment.attended 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                            }
                          `}>
                            {enrollment.attended ? (
                              <>
                                <CheckCircle size={12} />
                                <span>Présent</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={12} />
                                <span>Absent</span>
                              </>
                            )}
                          </div>
                          
                          {/* Statut de paiement */}
                          <div className={`
                            flex items-center justify-end space-x-1 px-2 py-1 rounded-full text-xs font-medium
                            ${enrollment.paymentStatus === 'paid' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : enrollment.paymentStatus === 'exempted'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                            }
                          `}>
                            <CreditCard size={12} />
                            <span>
                              {enrollment.paymentStatus === 'paid' && 'Payé'}
                              {enrollment.paymentStatus === 'exempted' && 'Exempté'}
                              {enrollment.paymentStatus === 'pending' && 'Impayé'}
                            </span>
                          </div>
                          
                          <div className="text-sm font-semibold text-gray-900">
                            {enrollment.courseId.price.toLocaleString()} XAF
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Aucun cours dans votre historique</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alertes de paiement */}
      {(stats.pendingPayments > 0 || (annualRegistration?.status === 'pending')) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Paiements en attente
              </h3>
              <div className="mt-2 text-sm text-yellow-700 space-y-1">
                {annualRegistration?.status === 'pending' && (
                  <p>• Inscription annuelle {currentYear}: {annualRegistration.amount.toLocaleString()} XAF</p>
                )}
                {stats.pendingPayments > 0 && (
                  <p>• {stats.pendingPayments} cours impayé(s): {stats.totalOwed.toLocaleString()} XAF</p>
                )}
              </div>
              <p className="mt-2 text-sm text-yellow-700">
                Contactez l'administration pour régulariser votre situation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}