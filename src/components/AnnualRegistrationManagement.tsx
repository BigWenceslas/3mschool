'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Calendar, CreditCard } from 'lucide-react'
import CircularLoader from './CircularLoader'
import { PAYMENT_METHOD_OPTIONS, getPaymentMethodLabel } from '@/lib/payment-methods'
import { formatFCFA } from '@/lib/currency'
import { generatePaymentReference } from '@/lib/reference-generator'
import { fetchWithCSRF } from '@/lib/use-csrf'

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
}

interface AnnualRegistration {
  _id: string
  userId: User
  year: number
  amount: number
  status: 'pending' | 'paid' | 'exempted'
  paymentDate?: string
  paymentMethod?: string
  paymentReference?: string
  exemptionReason?: string
  notes?: string
  createdAt: string
}

export default function AnnualRegistrationManagement() {
  const [registrations, setRegistrations] = useState<AnnualRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRegistration, setEditingRegistration] = useState<AnnualRegistration | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [currentYear] = useState(new Date().getFullYear())
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    year: currentYear,
    amount: 10000,
    status: 'pending' as 'pending' | 'paid' | 'exempted',
    paymentMethod: '',
    paymentReference: '',
    exemptionReason: '',
    notes: ''
  })

  useEffect(() => {
    loadRegistrations()
    loadUsers()
  }, [])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const loadRegistrations = async () => {
    try {
      const response = await fetch('/api/annual-registration', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setRegistrations(data.registrations || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des inscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Générer automatiquement une référence unique si le statut est payé et qu'il n'y en a pas
      const finalFormData = {
        ...formData,
        paymentReference: formData.status === 'paid' && !formData.paymentReference 
          ? generatePaymentReference('annual_registration')
          : formData.paymentReference
      }
      
      const url = editingRegistration 
        ? `/api/annual-registration/${editingRegistration._id}`
        : '/api/annual-registration'
      
      const method = editingRegistration ? 'PUT' : 'POST'
      
      const response = await fetchWithCSRF(url, {
        method,
        body: JSON.stringify(finalFormData)
      })

      if (response.ok) {
        await loadRegistrations()
        handleCloseDialog()
        showNotification(
          'success', 
          editingRegistration 
            ? 'Inscription annuelle mise à jour avec succès !' 
            : 'Inscription annuelle créée avec succès !'
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

  const handleDelete = async (registration: AnnualRegistration) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
      try {
        const response = await fetchWithCSRF(`/api/annual-registration/${registration._id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await loadRegistrations()
          showNotification('success', 'Inscription supprimée avec succès !')
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

  const handleEdit = (registration: AnnualRegistration) => {
    setEditingRegistration(registration)
    setFormData({
      userId: registration.userId._id,
      year: registration.year,
      amount: registration.amount,
      status: registration.status,
      paymentMethod: registration.paymentMethod || '',
      paymentReference: registration.paymentReference || '',
      exemptionReason: registration.exemptionReason || '',
      notes: registration.notes || ''
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingRegistration(null)
    setFormData({
      userId: '',
      year: currentYear,
      amount: 10000,
      status: 'pending',
      paymentMethod: '',
      paymentReference: '',
      exemptionReason: '',
      notes: ''
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="text-green-600" size={16} />
      case 'exempted':
        return <Eye className="text-blue-600" size={16} />
      default:
        return <XCircle className="text-red-600" size={16} />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Payé'
      case 'exempted': return 'Exempté'
      default: return 'En attente'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'exempted': return 'bg-blue-100 text-blue-800'
      default: return 'bg-red-100 text-red-800'
    }
  }

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
          <h2 className="text-2xl font-bold text-gray-800">Inscriptions annuelles</h2>
          <p className="text-gray-600">Gestion des cotisations annuelles des membres</p>
        </div>
        <button
          onClick={() => setOpenDialog(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nouvelle inscription</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <Calendar className="text-blue-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">{registrations.length}</p>
              <p className="text-sm text-gray-500">Total {currentYear}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
              <CheckCircle className="text-green-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {registrations.filter(r => r.status === 'paid').length}
              </p>
              <p className="text-sm text-gray-500">Payées</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
              <XCircle className="text-red-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {registrations.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500">En attente</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
              <CreditCard className="text-purple-600" size={16} />
            </div>
            <div className="ml-3">
              <p className="text-lg font-semibold text-gray-900">
                {formatFCFA(registrations
                  .filter(r => r.status === 'paid')
                  .reduce((sum, r) => sum + r.amount, 0)
                )}
              </p>
              <p className="text-sm text-gray-500">Collecté</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des inscriptions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Année
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrations.map((registration) => (
                <tr key={registration._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {registration.userId?.firstName || ''} {registration.userId?.lastName || ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {registration.userId?.email || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {registration.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFCFA(registration.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(registration.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(registration.status)}`}>
                        {getStatusLabel(registration.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(registration.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(registration)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(registration)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {registrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune inscription annuelle trouvée.</p>
          </div>
        )}
      </div>

      {/* Dialog de création/édition */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">
              {editingRegistration ? 'Modifier l\'inscription' : 'Nouvelle inscription annuelle'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Utilisateur
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user?.firstName || ''} {user?.lastName || ''} - {user?.email || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Année
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                  min="2020"
                  max="2030"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant (XAF)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                  required
                  min="0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut de paiement
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="exempted">Exempté</option>
                </select>
              </div>

              {formData.status === 'paid' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Méthode de paiement
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Sélectionner une méthode</option>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Référence de paiement
                      <span className="text-xs text-gray-500 ml-2">(Générée automatiquement)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.paymentReference || 'Sera générée automatiquement'}
                      readOnly
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </>
              )}

              {formData.status === 'exempted' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raison de l'exemption
                  </label>
                  <textarea
                    value={formData.exemptionReason}
                    onChange={(e) => setFormData({ ...formData, exemptionReason: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
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
                    : (editingRegistration ? 'Mettre à jour' : 'Créer')
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
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
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