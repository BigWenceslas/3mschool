import mongoose from 'mongoose'

export interface IRole extends mongoose.Document {
  name: string
  description: string
  permissions: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const roleSchema = new mongoose.Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'Le nom du rôle est requis'],
      unique: true,
      trim: true,
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
    },
    description: {
      type: String,
      required: [true, 'La description est requise'],
      trim: true,
      maxlength: [200, 'La description ne peut pas dépasser 200 caractères']
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: function(permissions: string[]) {
          const validPermissions = [
            // Gestion utilisateurs
            'read_users', 'create_users', 'update_users', 'delete_users',
            
            // Gestion rôles  
            'read_roles', 'create_roles', 'update_roles', 'delete_roles',
            
            // Gestion cours
            'read_courses', 'create_courses', 'update_courses', 'delete_courses',
            'manage_course_attendance', 'view_course_analytics',
            
            // Gestion inscriptions annuelles
            'read_registrations', 'create_registrations', 'update_registrations', 'delete_registrations',
            
            // Gestion financière
            'view_finances', 'manage_payments', 'export_financial_data', 'view_payment_history',
            
            // Administration système
            'access_settings', 'view_analytics', 'export_data',
            
            // Accès aux sections
            'admin_dashboard', 'member_dashboard',
            
            // Bibliothèque spirituelle
            'read_library', 'manage_library',
            
            // Support et aide
            'access_help'
          ]
          return permissions.every(permission => validPermissions.includes(permission))
        },
        message: 'Permissions invalides'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

export default mongoose.models.Role || mongoose.model<IRole>('Role', roleSchema)