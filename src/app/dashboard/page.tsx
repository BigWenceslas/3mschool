'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import DashboardLayout from '@/components/DashboardLayout'
import UsersManagement from '@/components/UsersManagement'
import RolesManagement from '@/components/RolesManagement'
import SimpleCourseManagement from '@/components/SimpleCourseManagement'
import MemberDashboard from '@/components/MemberDashboard'
import AttendanceSheet from '@/components/AttendanceSheet'
import AdminCalendarView from '@/components/AdminCalendarView'
import AnnualRegistrationManagement from '@/components/AnnualRegistrationManagement'
import CircularLoader from '@/components/CircularLoader'
import ImprovedDashboardCharts from '@/components/ImprovedDashboardCharts'
import UserProfile from '@/components/UserProfile'
import PaymentHistory from '@/components/PaymentHistory'
import AdminFinancialOverview from '@/components/AdminFinancialOverview'
import BlogManagement from '@/components/BlogManagement'
import { theme } from '@/lib/theme'
import { hasPermission, getPermissionsFromRole, PERMISSIONS, type UserWithPermissions, type Permission } from '@/lib/permissions'

interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'moderator'
  isActive: boolean
  createdAt: string
}

interface CurrentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  permissions?: Permission[]
}

interface MemberData {
  upcomingCourses: any[]
  courseHistory: any[]
  annualRegistration: any | null
  stats: {
    totalCourses: number
    attendedCourses: number
    paidCourses: number
    pendingPayments: number
    totalOwed: number
  }
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [memberData, setMemberData] = useState<MemberData | null>(null)
  const [memberDataLoading, setMemberDataLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      loadMemberData()
    }
  }, [currentUser])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadMemberData = async () => {
    if (!currentUser) return
    
    setMemberDataLoading(true)
    try {
      const [coursesRes, historyRes, registrationRes] = await Promise.all([
        fetch('/api/courses', { credentials: 'include' }),
        fetch(`/api/enrollments?userId=${currentUser.id}`, { credentials: 'include' }),
        fetch(`/api/annual-registration?userId=${currentUser.id}`, { credentials: 'include' })
      ])

      const [coursesData, historyData, registrationData] = await Promise.all([
        coursesRes.json(),
        historyRes.json(), 
        registrationRes.json()
      ])

      // Filtrer les cours à venir
      const now = new Date()
      const upcomingCourses = coursesData.courses?.filter((course: any) => 
        new Date(course.date) > now && course.status === 'planned'
      ) || []

      // Calculer les statistiques
      const enrollments = historyData.enrollments || []
      const stats = {
        totalCourses: enrollments.length,
        attendedCourses: enrollments.filter((e: any) => e.attended).length,
        paidCourses: enrollments.filter((e: any) => e.paymentStatus === 'paid').length,
        pendingPayments: enrollments.filter((e: any) => e.paymentStatus === 'pending').length,
        totalOwed: enrollments
          .filter((e: any) => e.paymentStatus === 'pending')
          .reduce((sum: number, e: any) => sum + (e.courseId?.price || 0), 0)
      }

      setMemberData({
        upcomingCourses,
        courseHistory: enrollments,
        annualRegistration: registrationData.registrations?.[0] || null,
        stats
      })

    } catch (error) {
      console.error('Erreur lors du chargement des données membre:', error)
    } finally {
      setMemberDataLoading(false)
    }
  }

  const renderContent = () => {
    if (!currentUser) return null

    // Créer l'utilisateur avec permissions
    const userWithPermissions: UserWithPermissions = {
      ...currentUser,
      permissions: currentUser.permissions || getPermissionsFromRole(currentUser.role)
    }

    // Si l'utilisateur n'a que les permissions de membre, afficher le dashboard membre
    if (hasPermission(userWithPermissions, PERMISSIONS.MEMBER_DASHBOARD) && 
        !hasPermission(userWithPermissions, PERMISSIONS.ADMIN_DASHBOARD)) {
      if (memberDataLoading || !memberData) {
        return (
          <div className="flex items-center justify-center py-12">
            <CircularLoader size="lg" className="text-blue-600" />
          </div>
        )
      }

      return (
        <MemberDashboard
          user={{
            firstName: currentUser?.firstName || '',
            lastName: currentUser?.lastName || '',
            email: currentUser?.email || ''
          }}
          upcomingCourses={memberData.upcomingCourses}
          courseHistory={memberData.courseHistory}
          annualRegistration={memberData.annualRegistration}
          stats={memberData.stats}
        />
      )
    }

    // Dashboard admin avec vérification des permissions
    switch (currentPage) {
      case 'users':
        if (!hasPermission(userWithPermissions, PERMISSIONS.READ_USERS)) {
          return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
          </div>
        }
        return <UsersManagement />
      case 'roles':
        if (!hasPermission(userWithPermissions, PERMISSIONS.READ_ROLES)) {
          return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
          </div>
        }
        return <RolesManagement />
      case 'courses':
        if (!hasPermission(userWithPermissions, PERMISSIONS.READ_COURSES)) {
          return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
          </div>
        }
        return <SimpleCourseManagement />
      case 'calendar':
        if (!hasPermission(userWithPermissions, PERMISSIONS.READ_COURSES)) {
          return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
          </div>
        }
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Calendrier des cours</h3>
              <AdminCalendarView />
            </div>
          </div>
        )
      case 'registrations':
        if (!hasPermission(userWithPermissions, PERMISSIONS.READ_REGISTRATIONS)) {
          return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
          </div>
        }
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Inscriptions annuelles</h3>
              <AnnualRegistrationManagement />
            </div>
          </div>
        )
      case 'finances':
        if (!hasPermission(userWithPermissions, PERMISSIONS.VIEW_FINANCES)) {
          return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
          </div>
        }
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Gestion financière</h3>
            </div>
            <AdminFinancialOverview />
          </div>
        )
      case 'library':
        if (!hasPermission(userWithPermissions, PERMISSIONS.READ_LIBRARY)) {
          return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
          </div>
        }
        return (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Bibliothèque spirituelle</h3>
            <p className="text-gray-600">Section de la bibliothèque spirituelle en cours de développement.</p>
          </div>
        )
      case 'help':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Centre d'aide</h3>
            <p className="text-gray-600">Centre d'aide en cours de développement.</p>
          </div>
        )
      case 'profile':
        return <UserProfile />
      case 'payment-history':
        if (!hasPermission(userWithPermissions, PERMISSIONS.VIEW_PAYMENT_HISTORY)) {
          return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
          </div>
        }
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Mon historique de paiements</h3>
            </div>
            <PaymentHistory />
          </div>
        )
      case 'settings':
        if (!hasPermission(userWithPermissions, PERMISSIONS.ACCESS_SETTINGS)) {
          return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
          </div>
        }
        return (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Paramètres système</h3>
            
            <div className="space-y-6">
              {/* Section Tarifs */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">Configuration des tarifs</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix par cours (FCFA)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1000"
                      defaultValue="1000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tarif par défaut pour un cours</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inscription annuelle (FCFA)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10000"
                      defaultValue="10000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Cotisation annuelle d'adhésion</p>
                  </div>
                </div>
              </div>

              {/* Section Année */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">Configuration générale</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Année d'exercice
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Année pour les inscriptions annuelles</p>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3">
                <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )
      case 'blog':
        if (!hasPermission(userWithPermissions, PERMISSIONS.ADMIN_DASHBOARD)) {
          return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
          </div>
        }
        return <BlogManagement />
      default:
        return (
          <div>
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bienvenue, {currentUser?.firstName} {currentUser?.lastName}!
              </h2>
              <p className="text-gray-600">
                Gérez votre espace spirituel depuis ce tableau de bord administrateur.
              </p>
            </div>

            {/* Quick Actions - Only 4 main cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg text-white"
                onClick={() => setCurrentPage('calendar')}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">📅</div>
                  <h3 className="text-lg font-bold mb-2">Calendrier</h3>
                  <p className="text-blue-100 text-sm">Vue d'ensemble des cours</p>
                </div>
              </div>

              <div 
                className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 cursor-pointer hover:from-indigo-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg text-white"
                onClick={() => setCurrentPage('courses')}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-lg font-bold mb-2">Cours</h3>
                  <p className="text-indigo-100 text-sm">Gérer les cours spirituels</p>
                </div>
              </div>

              <div 
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg text-white"
                onClick={() => setCurrentPage('registrations')}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-bold mb-2">Inscriptions</h3>
                  <p className="text-purple-100 text-sm">Gérer les adhésions annuelles</p>
                </div>
              </div>

              <div 
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg text-white"
                onClick={() => setCurrentPage('settings')}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">⚙️</div>
                  <h3 className="text-lg font-bold mb-2">Paramètres</h3>
                  <p className="text-orange-100 text-sm">Configuration système</p>
                </div>
              </div>
            </div>

            {/* Visual Charts Section */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Aperçu visuel</h3>
              <ImprovedDashboardCharts />
            </div>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <CircularLoader size="lg" className="mb-4 mx-auto text-blue-600" />
            <p className="text-blue-600 font-medium">Chargement...</p>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <DashboardLayout 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
          currentUser={currentUser || undefined}
        >
          <div className="p-6">
            {renderContent()}
          </div>
        </DashboardLayout>
      </div>
    </ThemeProvider>
  )
}