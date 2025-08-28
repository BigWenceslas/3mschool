'use client'

import React, { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { formatFCFA } from '@/lib/currency'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

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

export default function ImprovedDashboardCharts() {
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
          <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
            <div className="h-64 flex items-center justify-center">
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

  // Configuration du graphique en donut pour les inscriptions annuelles
  const doughnutData = {
    labels: data.annualRegistrationChart.map(item => item.name),
    datasets: [
      {
        data: data.annualRegistrationChart.map(item => item.value),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // green-500
          'rgba(239, 68, 68, 0.8)',  // red-500
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = data.annualRegistrationChart.reduce((sum, item) => sum + item.value, 0)
            const percentage = ((context.raw / total) * 100).toFixed(1)
            return `${context.label}: ${context.raw} (${percentage}%)`
          }
        }
      }
    },
    cutout: '60%'
  }

  // Configuration du graphique en barres pour les présences
  const barData = {
    labels: data.attendanceChart.map(item => item.name),
    datasets: [
      {
        label: 'Présents',
        data: data.attendanceChart.map(item => item.présents),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Inscrits',
        data: data.attendanceChart.map(item => item.inscrits),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const item = data.attendanceChart[context[0].dataIndex]
            return `${item.name} (${new Date(item.date).toLocaleDateString('fr-FR')})`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  // Configuration du graphique en ligne pour l'évolution des paiements
  const lineData = {
    labels: data.paymentsEvolutionChart.map(item => item.name),
    datasets: [
      {
        label: 'Paiements',
        data: data.paymentsEvolutionChart.map(item => item.paiements),
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const item = data.paymentsEvolutionChart[context[0].dataIndex]
            return `Semaine du ${new Date(item.date).toLocaleDateString('fr-FR')}`
          },
          label: function(context: any) {
            return `${context.parsed.y} paiement${context.parsed.y > 1 ? 's' : ''}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Inscriptions payées</p>
              <p className="text-2xl font-bold">{data.kpis.annualRegistrationPaymentRate}%</p>
            </div>
            <div className="text-3xl opacity-80">💳</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Cours ce mois</p>
              <p className="text-2xl font-bold">{data.kpis.coursesThisMonth}</p>
            </div>
            <div className="text-3xl opacity-80">📚</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Taux présence</p>
              <p className="text-2xl font-bold">{data.kpis.averageAttendanceThisMonth}%</p>
            </div>
            <div className="text-3xl opacity-80">👥</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Paiements en attente</p>
              <p className="text-2xl font-bold">{data.kpis.pendingCoursePayments}</p>
            </div>
            <div className="text-3xl opacity-80">⏰</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut Chart: Inscription Annuelle */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">
            Inscriptions Annuelles
          </h4>
          <div className="h-64">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>

        {/* Bar Chart: Présences par cours */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">
            Présences (6 derniers cours)
          </h4>
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Line Chart: Évolution paiements */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-gray-700 mb-4 text-center">
            Évolution Paiements (12 semaines)
          </h4>
          <div className="h-64">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

      </div>
    </div>
  )
}