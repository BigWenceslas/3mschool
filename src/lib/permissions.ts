// Définition de toutes les permissions disponibles
export const PERMISSIONS = {
  // Gestion utilisateurs
  READ_USERS: 'read_users',
  CREATE_USERS: 'create_users',
  UPDATE_USERS: 'update_users',
  DELETE_USERS: 'delete_users',
  
  // Gestion rôles
  READ_ROLES: 'read_roles',
  CREATE_ROLES: 'create_roles',
  UPDATE_ROLES: 'update_roles',
  DELETE_ROLES: 'delete_roles',
  
  // Gestion cours
  READ_COURSES: 'read_courses',
  CREATE_COURSES: 'create_courses',
  UPDATE_COURSES: 'update_courses',
  DELETE_COURSES: 'delete_courses',
  MANAGE_COURSE_ATTENDANCE: 'manage_course_attendance',
  VIEW_COURSE_ANALYTICS: 'view_course_analytics',
  
  // Gestion inscriptions annuelles
  READ_REGISTRATIONS: 'read_registrations',
  CREATE_REGISTRATIONS: 'create_registrations',
  UPDATE_REGISTRATIONS: 'update_registrations',
  DELETE_REGISTRATIONS: 'delete_registrations',
  
  // Gestion financière
  VIEW_FINANCES: 'view_finances',
  MANAGE_PAYMENTS: 'manage_payments',
  EXPORT_FINANCIAL_DATA: 'export_financial_data',
  VIEW_PAYMENT_HISTORY: 'view_payment_history',
  
  // Administration système
  ACCESS_SETTINGS: 'access_settings',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  
  // Accès aux sections
  ADMIN_DASHBOARD: 'admin_dashboard',
  MEMBER_DASHBOARD: 'member_dashboard',
  
  // Bibliothèque spirituelle
  READ_LIBRARY: 'read_library',
  MANAGE_LIBRARY: 'manage_library',
  
  // Blog
  READ_BLOG: 'read_blog',
  CREATE_BLOG_POSTS: 'create_blog_posts',
  UPDATE_BLOG_POSTS: 'update_blog_posts',
  DELETE_BLOG_POSTS: 'delete_blog_posts',
  MODERATE_BLOG_COMMENTS: 'moderate_blog_comments',
  
  // Support et aide
  ACCESS_HELP: 'access_help'
} as const

// Type pour les permissions
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Interface pour les utilisateurs avec permissions
export interface UserWithPermissions {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  permissions?: Permission[]
}

// Utilitaire pour vérifier si un utilisateur a une permission spécifique
export function hasPermission(user: UserWithPermissions | null, permission: Permission): boolean {
  if (!user) return false
  
  // Si l'utilisateur est admin, il a toutes les permissions
  if (user.role === 'admin') return true
  
  // Vérifier dans les permissions explicites
  return user.permissions?.includes(permission) ?? false
}

// Vérifier plusieurs permissions (ET logique)
export function hasAllPermissions(user: UserWithPermissions | null, permissions: Permission[]): boolean {
  if (!user) return false
  return permissions.every(permission => hasPermission(user, permission))
}

// Vérifier au moins une permission (OU logique)  
export function hasAnyPermission(user: UserWithPermissions | null, permissions: Permission[]): boolean {
  if (!user) return false
  return permissions.some(permission => hasPermission(user, permission))
}

// Obtenir les permissions pour les éléments de menu
export function getMenuPermissions() {
  return {
    dashboard: [PERMISSIONS.ADMIN_DASHBOARD, PERMISSIONS.MEMBER_DASHBOARD],
    calendar: [PERMISSIONS.READ_COURSES, PERMISSIONS.ADMIN_DASHBOARD],
    courses: [PERMISSIONS.READ_COURSES, PERMISSIONS.ADMIN_DASHBOARD],
    registrations: [PERMISSIONS.READ_REGISTRATIONS, PERMISSIONS.ADMIN_DASHBOARD],
    users: [PERMISSIONS.READ_USERS],
    roles: [PERMISSIONS.READ_ROLES], 
    finances: [PERMISSIONS.VIEW_FINANCES],
    blog: [PERMISSIONS.CREATE_BLOG_POSTS, PERMISSIONS.UPDATE_BLOG_POSTS, PERMISSIONS.DELETE_BLOG_POSTS],
    library: [PERMISSIONS.READ_LIBRARY],
    settings: [PERMISSIONS.ACCESS_SETTINGS],
    help: [PERMISSIONS.ACCESS_HELP],
    'payment-history': [PERMISSIONS.VIEW_PAYMENT_HISTORY]
  }
}

// Vérifier l'accès à un élément de menu
export function canAccessMenuItem(user: UserWithPermissions | null, menuItem: string): boolean {
  const menuPermissions = getMenuPermissions()
  const requiredPermissions = menuPermissions[menuItem as keyof typeof menuPermissions]
  
  if (!requiredPermissions) return false
  
  return hasAnyPermission(user, requiredPermissions)
}

// Mapper les rôles simples vers les permissions (pour compatibilité)
export function getPermissionsFromRole(role: string): Permission[] {
  switch (role) {
    case 'admin':
      return Object.values(PERMISSIONS)
    case 'moderator':
      return [
        PERMISSIONS.READ_USERS, PERMISSIONS.CREATE_USERS, PERMISSIONS.UPDATE_USERS,
        PERMISSIONS.READ_COURSES, PERMISSIONS.MANAGE_COURSE_ATTENDANCE,
        PERMISSIONS.READ_REGISTRATIONS, PERMISSIONS.READ_LIBRARY,
        PERMISSIONS.VIEW_PAYMENT_HISTORY, PERMISSIONS.ADMIN_DASHBOARD, PERMISSIONS.ACCESS_HELP
      ]
    case 'user':
    default:
      return [
        PERMISSIONS.MEMBER_DASHBOARD, PERMISSIONS.VIEW_PAYMENT_HISTORY, PERMISSIONS.ACCESS_HELP
      ]
  }
}