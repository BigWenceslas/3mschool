'use client'

import React, { useState, useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatFCFA } from '@/lib/currency'

interface ChartData {
  annualRegistrationChart: Array<{ name: string; value: number; fill: string }>
  attendanceChart: Array<{ name: string; présents: number; inscrits: number; date: string }>
  paymentsEvolutionChart: Array<{ name: string; paiements: number; date: string }>
  kpis: {
    annualRegistrationPaymentRate: number
    coursesThisMonth: number
    averageAttendanceThisMonth: number
    pendingCoursePayments: number
  }
}

export default function DashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/metrics/dashboard', {
        credentials: 'include'
      })

      if (response.ok) {
        const metricsData = await response.json()
        setData(metricsData)
      } else {
        throw new Error('Erreur lors de la récupération des métriques')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
            <div className="h-48 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>Chargement...</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">
          {error || 'Erreur lors du chargement des graphiques'}
        </p>
        <button 
          onClick={fetchMetrics}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Donut Chart: Inscription Annuelle */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
        <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">
          Inscriptions Annuelles
        </h4>
        <ResponsiveContainer width="100%" height={192}>
          <PieChart>
            <Pie
              data={data.annualRegistrationChart}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.annualRegistrationChart.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any, name: any) => [`${value} élèves`, name]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart: Présences par cours */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
        <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">
          Présences (6 derniers cours)
        </h4>
        <ResponsiveContainer width="100%" height={192}>
          <BarChart data={data.attendanceChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="présents" fill="#10b981" name="Présents" />
            <Bar dataKey="inscrits" fill="#3b82f6" name="Inscrits" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart: Évolution paiements */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
        <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">
          Évolution Paiements
        </h4>
        <ResponsiveContainer width="100%" height={192}>
          <LineChart data={data.paymentsEvolutionChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip 
              formatter={(value: any) => [`${value} paiements`, 'Paiements']}
            />
            <Line 
              type="monotone" 
              dataKey="paiements" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}