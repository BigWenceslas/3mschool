'use client'

import React, { useState, useEffect } from 'react'
import { formatFCFA } from '@/lib/currency'
import { getPaymentMethodLabel, PAYMENT_METHOD_OPTIONS } from '@/lib/payment-methods'
import CircularLoader from '@/components/CircularLoader'

interface Payment {
  _id: string
  type: 'course' | 'annual_registration'
  amount: number
  paymentMethod: string
  status: 'paid' | 'pending'
  date: string
  courseTitle?: string
  courseName?: string
  year?: number
  description: string
  userName: string
  userEmail: string
  createdAt: string
}

interface FilterOptions {
  type: string
  paymentMethod: string
  status: string
  startDate: string
  endDate: string
  search: string
}

interface Stats {
  totalRevenue: number
  courseRevenue: number
  registrationRevenue: number
  pendingAmount: number
  totalTransactions: number
  averageTransaction: number
}

export default function AdminFinancialOverview() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 15

  const [filters, setFilters] = useState<FilterOptions>({
    type: '',
    paymentMethod: '',
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  })

  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>(filters)

  useEffect(() => {
    fetchPayments()
  }, [currentPage, appliedFilters])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(appliedFilters.type && { type: appliedFilters.type }),
        ...(appliedFilters.paymentMethod && { paymentMethod: appliedFilters.paymentMethod }),
        ...(appliedFilters.status && { status: appliedFilters.status }),
        ...(appliedFilters.startDate && { startDate: appliedFilters.startDate }),
        ...(appliedFilters.endDate && { endDate: appliedFilters.endDate }),
        ...(appliedFilters.search && { search: appliedFilters.search })
      })

      const response = await fetch(`/api/payments/admin?${params}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
        setTotalPages(data.totalPages || 1)
        setStats(data.stats || null)
      } else {
        throw new Error('Erreur lors de la récupération des données financières')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setCurrentPage(1)
    setAppliedFilters(filters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      type: '',
      paymentMethod: '',
      status: '',
      startDate: '',
      endDate: '',
      search: ''
    }
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setCurrentPage(1)
  }

  const exportData = async () => {
    try {
      const params = new URLSearchParams({
        ...(appliedFilters.type && { type: appliedFilters.type }),
        ...(appliedFilters.paymentMethod && { paymentMethod: appliedFilters.paymentMethod }),
        ...(appliedFilters.status && { status: appliedFilters.status }),
        ...(appliedFilters.startDate && { startDate: appliedFilters.startDate }),
        ...(appliedFilters.endDate && { endDate: appliedFilters.endDate }),
        ...(appliedFilters.search && { search: appliedFilters.search }),
        export: 'true'
      })

      const response = await fetch(`/api/payments/admin?${params}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `historique_paiements_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Erreur lors de l\'export:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Payé
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            En attente
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'course':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            📚 Cours
          </span>
        )
      case 'annual_registration':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            📋 Inscription
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {type}
          </span>
        )
    }
  }

  if (loading && !payments.length) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-center py-12">
            <CircularLoader size="lg" className="text-blue-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Revenus totaux</p>
                <p className="text-2xl font-bold">{formatFCFA(stats.totalRevenue)}</p>
              </div>
              <div className="text-3xl opacity-80">💰</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Revenus cours</p>
                <p className="text-2xl font-bold">{formatFCFA(stats.courseRevenue)}</p>
              </div>
              <div className="text-3xl opacity-80">📚</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Revenus inscriptions</p>
                <p className="text-2xl font-bold">{formatFCFA(stats.registrationRevenue)}</p>
              </div>
              <div className="text-3xl opacity-80">📋</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">En attente</p>
                <p className="text-2xl font-bold">{formatFCFA(stats.pendingAmount)}</p>
              </div>
              <div className="text-3xl opacity-80">⏰</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Total transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
              <div className="text-3xl opacity-80">🔢</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm">Transaction moyenne</p>
                <p className="text-2xl font-bold">{formatFCFA(stats.averageTransaction)}</p>
              </div>
              <div className="text-3xl opacity-80">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtres et recherche</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="course">Cours</option>
              <option value="annual_registration">Inscriptions</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="paid">Payé</option>
              <option value="pending">En attente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input
              type="text"
              placeholder="Nom, email, cours..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'Appliquer les filtres'}
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Effacer les filtres
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Exporter (CSV)
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            Historique des paiements
          </h3>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchPayments}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun paiement trouvé
            </h3>
            <p className="text-gray-500">
              Aucun paiement ne correspond aux critères sélectionnés.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode de paiement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.date || payment.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{payment.userName}</div>
                          <div className="text-gray-500 text-xs">{payment.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(payment.type)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          {payment.description}
                          {payment.year && (
                            <div className="text-xs text-gray-500">Année {payment.year}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatFCFA(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> sur{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Précédent
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber
                        if (totalPages <= 5) {
                          pageNumber = i + 1
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i
                        } else {
                          pageNumber = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        )
                      })}

                      <button
                        onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}