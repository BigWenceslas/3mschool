'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Fab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material'
import { Grid } from '@mui/material'
import { formatFCFA } from '@/lib/currency'
import {
  Add as AddIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material'

interface Course {
  _id: string
  title: string
  description: string
  date: string
  duration: number
  location: string
  maxParticipants: number
  instructor: {
    _id: string
    name: string
    email: string
  }
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  price: number
  summary?: string
  enrollmentCount: number
  createdAt: string
}

interface CourseStats {
  totalCourses: number
  upcomingCourses: number
  completedCourses: number
  totalEnrollments: number
  annualRegistrationPaymentRate: number // % d'élèves ayant payé l'inscription annuelle
  coursesThisMonth: number // Nombre de cours ce mois
  averageAttendanceThisMonth: number // Taux moyen de présence par cours (mois courant)
  pendingCoursePayments: number // Nombre de paiements de cours en attente
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<CourseStats>({
    totalCourses: 0,
    upcomingCourses: 0,
    completedCourses: 0,
    totalEnrollments: 0,
    annualRegistrationPaymentRate: 0,
    coursesThisMonth: 0,
    averageAttendanceThisMonth: 0,
    pendingCoursePayments: 0
  })
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    fetchCourses()
    fetchStats()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      setError('Erreur lors du chargement des cours')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Ces endpoints seraient créés séparément pour les statistiques
      const [coursesRes, enrollmentsRes] = await Promise.all([
        fetch('/api/courses', { credentials: 'include' }),
        fetch('/api/enrollments/stats', { credentials: 'include' })
      ])
      
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        const courses = coursesData.courses || []
        
        const now = new Date()
        const totalCourses = courses.length
        const upcomingCourses = courses.filter((c: Course) => new Date(c.date) > now && c.status === 'planned').length
        const completedCourses = courses.filter((c: Course) => c.status === 'completed').length
        const totalEnrollments = courses.reduce((sum: number, c: Course) => sum + c.enrollmentCount, 0)
        const totalRevenue = courses.reduce((sum: number, c: Course) => sum + (c.enrollmentCount * c.price), 0)
        
        // Calculer les cours de ce mois
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        
        const coursesThisMonth = courses.filter((c: Course) => {
          const courseDate = new Date(c.date)
          return courseDate >= startOfMonth && courseDate <= endOfMonth
        }).length

        setStats({
          totalCourses,
          upcomingCourses,
          completedCourses,
          totalEnrollments,
          coursesThisMonth,
          annualRegistrationPaymentRate: 0, // TODO: Calculate from API
          averageAttendanceThisMonth: 0, // TODO: Calculate from API
          pendingCoursePayments: 0 // TODO: Calculate from API
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    }
  }

  const handleCreateCourse = async () => {
    try {
      const url = editingCourse ? `/api/courses/${editingCourse._id}` : '/api/courses'
      const method = editingCourse ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message || (editingCourse ? 'Cours modifié avec succès' : 'Cours créé avec succès'))
        setOpenDialog(false)
        resetForm()
        fetchCourses()
        fetchStats()
      } else {
        const data = await response.json()
        setError(data.message || 'Erreur lors de la création')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description,
      date: new Date(course.date).toISOString().slice(0, 16), // Format datetime-local
      duration: course.duration,
      location: course.location,
      maxParticipants: course.maxParticipants,
      price: course.price
    })
    setOpenDialog(true)
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message || 'Cours supprimé avec succès')
        fetchCourses()
        fetchStats()
      } else {
        const data = await response.json()
        setError(data.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      setError('Erreur de connexion')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      duration: 120,
      location: '',
      maxParticipants: 30,
      price: 1000
    })
    setEditingCourse(null)
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
      case 'planned': return 'primary'
      case 'ongoing': return 'warning'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
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

  return (
    <div>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalCourses}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Cours Total
                  </Typography>
                </Box>
                <SchoolIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.upcomingCourses}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Cours à Venir
                  </Typography>
                </Box>
                <EventIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalEnrollments}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Inscriptions aux cours
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {Math.round(stats.annualRegistrationPaymentRate)}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Inscriptions annuelles payées
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.coursesThisMonth}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Cours ce mois
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', color: '#333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {Math.round(stats.averageAttendanceThisMonth)}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Taux présence moyen
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', color: '#333' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.pendingCoursePayments}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Paiements en attente
                  </Typography>
                </Box>
                <AccessTimeIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Courses List */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon />
            Gestion des Cours
          </Typography>

          <Grid container spacing={2}>
            {courses.map((course) => (
              <Grid item xs={12} md={6} lg={4} key={course._id}>
                <Card sx={{ 
                  height: '100%', 
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', flex: 1 }}>
                        {course.title}
                      </Typography>
                      <Chip 
                        label={getStatusLabel(course.status)} 
                        color={getStatusColor(course.status) as any}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {course.description.length > 100 
                        ? course.description.substring(0, 100) + '...' 
                        : course.description
                      }
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(course.date)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {course.duration} minutes
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PeopleIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {course.enrollmentCount}/{course.maxParticipants} inscrits
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatFCFA(course.price)}
                      </Typography>
                      <Box>
                        <IconButton 
                          size="small" 
                          color="primary"
                          title="Voir les détails"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditCourse(course)}
                          title="Modifier le cours"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteCourse(course._id)}
                          title="Supprimer le cours"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {courses.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun cours trouvé
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Commencez par créer votre premier cours spirituel
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Course Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCourse ? 'Modifier le Cours' : 'Nouveau Cours Spirituel'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titre du cours"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Date et heure"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Durée (minutes)"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Lieu"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max participants"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Prix (XAF)"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button onClick={handleCreateCourse} variant="contained">
            {editingCourse ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}