'use client'

import React, { useState } from 'react'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  AdminPanelSettings,
  Settings,
  Logout,
  AccountCircle,
  School,
  CalendarMonth,
  HowToReg,
  AccountBalance,
  LibraryBooks,
  Help,
  Payment,
  Article,
} from '@mui/icons-material'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../lib/theme'
import { hasPermission, getPermissionsFromRole, canAccessMenuItem, type UserWithPermissions } from '@/lib/permissions'

const drawerWidth = 240

interface DashboardLayoutProps {
  children: React.ReactNode
  currentPage?: string
  onPageChange?: (page: string) => void
  currentUser?: UserWithPermissions
}

export default function DashboardLayout({ children, currentPage = 'dashboard', onPageChange, currentUser }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    handleClose()
    // Implémentation de la déconnexion
    window.location.href = '/login'
  }

  const getMenuItems = () => {
    if (!currentUser) return []
    
    // Créer l'utilisateur avec permissions pour la vérification
    const userWithPermissions: UserWithPermissions = {
      ...currentUser,
      permissions: currentUser.permissions || getPermissionsFromRole(currentUser.role)
    }
    
    // Tous les éléments de menu possibles
    const allMenuItems = [
      { id: 'dashboard', text: 'Accueil', icon: <Dashboard /> },
      { id: 'calendar', text: 'Calendrier', icon: <CalendarMonth /> },
      { id: 'courses', text: 'Cours', icon: <School /> },
      { id: 'registrations', text: 'Inscriptions', icon: <HowToReg /> },
      { id: 'users', text: 'Utilisateurs', icon: <People /> },
      { id: 'roles', text: 'Rôles', icon: <AdminPanelSettings /> },
      { id: 'finances', text: 'Finances', icon: <AccountBalance /> },
      { id: 'blog', text: 'Blog', icon: <Article /> },
      { id: 'library', text: 'Bibliothèque', icon: <LibraryBooks /> },
      { id: 'settings', text: 'Paramètres', icon: <Settings /> },
      { id: 'payment-history', text: 'Mes paiements', icon: <Payment /> },
      { id: 'help', text: 'Aide', icon: <Help /> }
    ]

    // Filtrer selon les permissions
    return allMenuItems.filter(item => canAccessMenuItem(userWithPermissions, item.id))
  }

  const menuItems = getMenuItems()

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
          3 Mages
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentPage === item.id}
              onClick={() => onPageChange?.(item.id)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '0a',
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemIcon sx={{ color: currentPage === item.id ? theme.palette.primary.main : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  color: currentPage === item.id ? theme.palette.primary.main : 'inherit',
                  '& .MuiTypography-root': { fontWeight: currentPage === item.id ? 600 : 400 }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="ouvrir le menu"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {menuItems.find(item => item.id === currentPage)?.text || 'Dashboard'}
            </Typography>
            <div>
              <IconButton
                size="large"
                aria-label="compte de l'utilisateur actuel"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
                  <AccountCircle />
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => { handleClose(); onPageChange?.('profile') }}>
                  <AccountCircle sx={{ mr: 1 }} />
                  Mon Profil
                </MenuItem>
                <MenuItem onClick={() => { handleClose(); onPageChange?.('settings') }}>
                  <Settings sx={{ mr: 1 }} />
                  Paramètres
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} />
                  Se déconnecter
                </MenuItem>
              </Menu>
            </div>
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="dossiers de boîte aux lettres"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  )
}