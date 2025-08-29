'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User } from 'lucide-react'

interface Course {
  _id: string
  title: string
  description: string
  date: string
  duration: number
  location: string
  price: number
  maxParticipants?: number
  instructor: {
    firstName: string
    lastName: string
  }
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
}

interface CalendarProps {
  courses: Course[]
  onCourseSelect?: (course: Course) => void
  className?: string
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function Calendar({ courses, onCourseSelect, className = '' }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Calculer les jours du mois
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())

  const days: Date[] = []
  let currentCalendarDate = new Date(startDate)
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentCalendarDate))
    currentCalendarDate.setDate(currentCalendarDate.getDate() + 1)
  }

  // Grouper les cours par date
  const coursesByDate = courses.reduce((acc, course) => {
    const courseDate = new Date(course.date)
    const dateKey = `${courseDate.getFullYear()}-${courseDate.getMonth()}-${courseDate.getDate()}`
    
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(course)
    
    return acc
  }, {} as Record<string, Course[]>)

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
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

  const getCoursesForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return coursesByDate[dateKey] || []
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header du calendrier */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Aujourd'hui
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendrier */}
      <div className="p-6">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {DAYS.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const daysCourses = getCoursesForDate(date)
            const hasCoursesToday = daysCourses.length > 0
            
            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-2 border border-gray-100 rounded-md cursor-pointer
                  transition-all duration-200 hover:bg-gray-50
                  ${!isCurrentMonth(date) ? 'text-gray-400 bg-gray-50/50' : ''}
                  ${isToday(date) ? 'bg-blue-50 border-blue-200' : ''}
                  ${selectedDate?.toDateString() === date.toDateString() ? 'ring-2 ring-blue-400' : ''}
                `}
                onClick={() => setSelectedDate(date)}
              >
                {/* Numéro du jour */}
                <div className={`
                  text-sm font-medium mb-1
                  ${isToday(date) ? 'text-blue-600' : ''}
                  ${!isCurrentMonth(date) ? 'text-gray-400' : 'text-gray-900'}
                `}>
                  {date.getDate()}
                </div>

                {/* Cours du jour */}
                {hasCoursesToday && (
                  <div className="space-y-1">
                    {daysCourses.slice(0, 2).map(course => (
                      <div
                        key={course._id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onCourseSelect?.(course)
                        }}
                        className={`
                          text-xs p-1 rounded text-white truncate
                          transition-colors hover:opacity-80
                          ${course.status === 'planned' ? 'bg-green-500' : ''}
                          ${course.status === 'ongoing' ? 'bg-blue-500' : ''}
                          ${course.status === 'completed' ? 'bg-gray-500' : ''}
                          ${course.status === 'cancelled' ? 'bg-red-500' : ''}
                        `}
                        title={`${course.title} - ${formatTime(course.date)}`}
                      >
                        <div className="flex items-center space-x-1">
                          <Clock size={10} />
                          <span>{formatTime(course.date)}</span>
                        </div>
                        <div className="truncate font-medium">{course.title}</div>
                      </div>
                    ))}
                    
                    {daysCourses.length > 2 && (
                      <div className="text-xs text-gray-600 text-center">
                        +{daysCourses.length - 2} autre(s)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Détails de la date sélectionnée */}
      {selectedDate && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-4">
            {selectedDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>

          {getCoursesForDate(selectedDate).length > 0 ? (
            <div className="space-y-4">
              {getCoursesForDate(selectedDate).map(course => (
                <div
                  key={course._id}
                  onClick={() => onCourseSelect?.(course)}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">{course.title}</h4>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock size={14} />
                          <span>{formatTime(course.date)} - {formatDuration(course.duration)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <MapPin size={14} />
                          <span>{course.location}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <User size={14} />
                          <span>
                            {course.instructor?.firstName || ''} {course.instructor?.lastName || ''}
                          </span>
                        </div>
                      </div>
                      
                      {course.description && (
                        <p className="text-sm text-gray-600 mt-2">{course.description}</p>
                      )}
                    </div>
                    
                    <div className="ml-4 text-right">
                      <div className={`
                        px-2 py-1 rounded-full text-xs font-medium
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
                      
                      <div className="text-lg font-semibold text-gray-900 mt-2">
                        {course.price.toLocaleString()} XAF
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun cours prévu pour cette date</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}