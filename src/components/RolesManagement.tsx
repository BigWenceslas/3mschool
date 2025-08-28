'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  IconButton,
  Alert,
  Switch,
  FormControlLabel,
  Grid,
  FormGroup,
  Checkbox,
  FormLabel,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid'

interface Role {
  _id: string
  name: string
  description: string
  permissions: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface RoleFormData {
  name: string
  description: string
  permissions: string[]
  isActive: boolean
}

const availablePermissions = [
  { id: 'read_users', label: 'Lire les utilisateurs', category: 'Utilisateurs' },
  { id: 'create_users', label: 'Créer des utilisateurs', category: 'Utilisateurs' },
  { id: 'update_users', label: 'Modifier les utilisateurs', category: 'Utilisateurs' },
  { id: 'delete_users', label: 'Supprimer les utilisateurs', category: 'Utilisateurs' },
  { id: 'read_roles', label: 'Lire les rôles', category: 'Rôles' },
  { id: 'create_roles', label: 'Créer des rôles', category: 'Rôles' },
  { id: 'update_roles', label: 'Modifier les rôles', category: 'Rôles' },
  { id: 'delete_roles', label: 'Supprimer les rôles', category: 'Rôles' },
  { id: 'admin_access', label: 'Accès administrateur', category: 'Système' },
  { id: 'moderator_access', label: 'Accès modérateur', category: 'Système' },
]

export default function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
    isActive: true,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      } else {
        setError('Erreur lors du chargement des rôles')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isActive: role.isActive,
      })
    } else {
      setEditingRole(null)
      setFormData({
        name: '',
        description: '',
        permissions: [],
        isActive: true,
      })
    }
    setOpenDialog(true)
    setError('')
    setSuccess('')
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingRole(null)
    setFormData({
      name: '',
      description: '',
      permissions: [],
      isActive: true,
    })
    setError('')
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(p => p !== permissionId)
    }))
  }

  const handleSubmit = async () => {
    try {
      const url = editingRole ? `/api/roles/${editingRole._id}` : '/api/roles'
      const method = editingRole ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(editingRole ? 'Rôle modifié avec succès' : 'Rôle créé avec succès')
        handleCloseDialog()
        fetchRoles()
      } else {
        const data = await response.json()
        setError(data.message || 'Une erreur est survenue')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const handleDelete = async (roleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      try {
        const response = await fetch(`/api/roles/${roleId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setSuccess('Rôle supprimé avec succès')
          fetchRoles()
        } else {
          setError('Erreur lors de la suppression')
        }
      } catch (err) {
        setError('Erreur de connexion')
      }
    }
  }

  const getPermissionLabel = (permissionId: string) => {
    const permission = availablePermissions.find(p => p.id === permissionId)
    return permission ? permission.label : permissionId
  }

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, typeof availablePermissions>)

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nom', flex: 1, minWidth: 150 },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 200 },
    {
      field: 'permissions',
      headerName: 'Permissions',
      flex: 2,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {params.value.slice(0, 3).map((permission: string) => (
            <Chip
              key={permission}
              label={getPermissionLabel(permission)}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
          {params.value.length > 3 && (
            <Chip
              label={`+${params.value.length - 3}`}
              size="small"
              color="default"
              variant="outlined"
            />
          )}
        </Box>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Statut',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Actif' : 'Inactif'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Créé le',
      width: 120,
      valueFormatter: (params) => new Date(params).toLocaleDateString('fr-FR'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Modifier"
          onClick={() => handleOpenDialog(params.row)}
          color="primary"
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Supprimer"
          onClick={() => handleDelete(params.id as string)}
          color="error"
        />,
      ],
    },
  ]

  return (
    <Box>
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

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2">
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
              Gestion des Rôles
            </Typography>
            <Box>
              <IconButton onClick={fetchRoles} disabled={loading} color="primary">
                <RefreshIcon />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ ml: 1 }}
              >
                Nouveau Rôle
              </Button>
            </Box>
          </Box>

          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={roles}
              columns={columns}
              getRowId={(row) => row._id}
              loading={loading}
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              localeText={{
                noRowsLabel: 'Aucun rôle trouvé',
                footerRowSelected: (count) =>
                  count !== 1 ? `${count.toLocaleString()} lignes sélectionnées` : `${count.toLocaleString()} ligne sélectionnée`,
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du rôle"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Rôle actif"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Permissions
              </Typography>
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <Box key={category} sx={{ mb: 2 }}>
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {category}
                  </FormLabel>
                  <FormGroup row>
                    {permissions.map((permission) => (
                      <FormControlLabel
                        key={permission.id}
                        control={
                          <Checkbox
                            checked={formData.permissions.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                          />
                        }
                        label={permission.label}
                        sx={{ minWidth: '250px', mb: 1 }}
                      />
                    ))}
                  </FormGroup>
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingRole ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}