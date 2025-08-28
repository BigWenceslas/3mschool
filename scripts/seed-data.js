require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Import models
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'moderator'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

const roleSchema = new mongoose.Schema({
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
      validator: function(permissions) {
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
}, {
  timestamps: true
})

// Course Schema
const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'La date est requise']
  },
  duration: {
    type: Number,
    required: [true, 'La durée est requise'],
    min: [15, 'La durée doit être d\'au moins 15 minutes']
  },
  location: {
    type: String,
    required: [true, 'Le lieu est requis'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Le nombre maximum de participants est requis'],
    min: [1, 'Il doit y avoir au moins 1 participant maximum']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Un instructeur est requis']
  },
  status: {
    type: String,
    enum: ['planned', 'ongoing', 'completed', 'cancelled'],
    default: 'planned'
  },
  summary: String
}, {
  timestamps: true
})

// Enrollment Schema
const enrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Le cours est requis']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis']
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  attended: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'exempted'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile_money', 'bank_transfer', 'card', 'other']
  },
  paymentReference: String,
  notes: String
}, {
  timestamps: true
})

enrollmentSchema.index({ courseId: 1, userId: 1 }, { unique: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)
const Role = mongoose.models.Role || mongoose.model('Role', roleSchema)
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema)
const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema)

const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState) {
      console.log('✅ Already connected to MongoDB')
      return
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

const seedUsers = async () => {
  try {
    await connectDB()
    
    console.log('🌱 Début du seeding des utilisateurs...')
    
    // Supprimer les utilisateurs existants
    await User.deleteMany({})
    console.log('🗑️ Utilisateurs existants supprimés')
    
    // Créer l'admin par défaut
    const adminUser = {
      name: 'Administrateur Principal',
      email: 'admin@3mages.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    }
    
    // Créer 10 utilisateurs de test
    const testUsers = [
      {
        name: 'Marie Dubois',
        email: 'marie.dubois@example.com',
        password: 'password123',
        role: 'user',
        isActive: true
      },
      {
        name: 'Pierre Martin',
        email: 'pierre.martin@example.com',
        password: 'password123',
        role: 'moderator',
        isActive: true
      },
      {
        name: 'Sophie Leroy',
        email: 'sophie.leroy@example.com',
        password: 'password123',
        role: 'user',
        isActive: true
      },
      {
        name: 'Jean Moreau',
        email: 'jean.moreau@example.com',
        password: 'password123',
        role: 'user',
        isActive: false
      },
      {
        name: 'Claire Simon',
        email: 'claire.simon@example.com',
        password: 'password123',
        role: 'moderator',
        isActive: true
      },
      {
        name: 'Michel Laurent',
        email: 'michel.laurent@example.com',
        password: 'password123',
        role: 'user',
        isActive: true
      },
      {
        name: 'Anne Petit',
        email: 'anne.petit@example.com',
        password: 'password123',
        role: 'user',
        isActive: true
      },
      {
        name: 'Philippe Roux',
        email: 'philippe.roux@example.com',
        password: 'password123',
        role: 'moderator',
        isActive: false
      },
      {
        name: 'Nathalie Bernard',
        email: 'nathalie.bernard@example.com',
        password: 'password123',
        role: 'user',
        isActive: true
      },
      {
        name: 'François Girard',
        email: 'francois.girard@example.com',
        password: 'password123',
        role: 'user',
        isActive: true
      }
    ]
    
    // Insérer l'admin
    await User.create(adminUser)
    console.log('👑 Administrateur créé')
    
    // Insérer les utilisateurs de test
    await User.create(testUsers)
    console.log(`👥 ${testUsers.length} utilisateurs de test créés`)
    
    console.log('✅ Seeding des utilisateurs terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding des utilisateurs:', error)
    throw error
  }
}

const seedRoles = async () => {
  try {
    await connectDB()
    
    console.log('🌱 Début du seeding des rôles...')
    
    // Supprimer les rôles existants
    await Role.deleteMany({})
    console.log('🗑️ Rôles existants supprimés')
    
    // Créer les rôles par défaut
    const defaultRoles = [
      {
        name: 'Administrateur Système',
        description: 'Accès complet à toutes les fonctionnalités du système',
        permissions: [
          // Toutes les permissions
          'read_users', 'create_users', 'update_users', 'delete_users',
          'read_roles', 'create_roles', 'update_roles', 'delete_roles',
          'read_courses', 'create_courses', 'update_courses', 'delete_courses',
          'manage_course_attendance', 'view_course_analytics',
          'read_registrations', 'create_registrations', 'update_registrations', 'delete_registrations',
          'view_finances', 'manage_payments', 'export_financial_data', 'view_payment_history',
          'access_settings', 'view_analytics', 'export_data',
          'admin_dashboard', 'member_dashboard',
          'read_library', 'manage_library',
          'access_help'
        ],
        isActive: true
      },
      {
        name: 'Gestionnaire de Cours',
        description: 'Peut gérer les cours, les inscriptions et voir les présences',
        permissions: [
          'read_courses', 'create_courses', 'update_courses',
          'manage_course_attendance', 'view_course_analytics',
          'read_registrations', 'create_registrations', 'update_registrations',
          'read_users', 'view_payment_history',
          'admin_dashboard', 'access_help'
        ],
        isActive: true
      },
      {
        name: 'Gestionnaire Financier',
        description: 'Spécialisé dans la gestion financière et les paiements',
        permissions: [
          'view_finances', 'manage_payments', 'export_financial_data', 'view_payment_history',
          'read_registrations', 'update_registrations',
          'read_courses', 'view_course_analytics',
          'read_users', 'admin_dashboard', 'access_help'
        ],
        isActive: true
      },
      {
        name: 'Modérateur',
        description: 'Peut gérer les utilisateurs et assister aux cours',
        permissions: [
          'read_users', 'create_users', 'update_users',
          'read_courses', 'manage_course_attendance',
          'read_registrations', 'read_library',
          'view_payment_history', 'admin_dashboard', 'access_help'
        ],
        isActive: true
      },
      {
        name: 'Membre Standard',
        description: 'Accès membre avec dashboard personnel et historique de paiements',
        permissions: [
          'member_dashboard', 'view_payment_history', 'access_help'
        ],
        isActive: true
      },
      {
        name: 'Bibliothécaire Spirituel',
        description: 'Gestion de la bibliothèque spirituelle et support aux membres',
        permissions: [
          'read_library', 'manage_library',
          'read_users', 'read_courses',
          'admin_dashboard', 'access_help'
        ],
        isActive: true
      }
    ]
    
    // Insérer les rôles
    await Role.create(defaultRoles)
    console.log(`🔐 ${defaultRoles.length} rôles créés`)
    
    console.log('✅ Seeding des rôles terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding des rôles:', error)
    throw error
  }
}

// Fonction pour calculer les 5 prochains dimanches
const getNext5Sundays = () => {
  const sundays = []
  const today = new Date()
  
  // Trouver le prochain dimanche
  let nextSunday = new Date(today)
  const daysUntilSunday = (7 - today.getDay()) % 7
  nextSunday.setDate(today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday))
  
  // Générer 5 dimanches consécutifs à 10h00
  for (let i = 0; i < 5; i++) {
    const sunday = new Date(nextSunday)
    sunday.setDate(nextSunday.getDate() + (i * 7))
    sunday.setHours(10, 0, 0, 0) // 10h00
    sundays.push(sunday)
  }
  
  return sundays
}

const seedCourses = async () => {
  try {
    await connectDB()
    
    console.log('🌱 Début du seeding des cours...')
    
    // Supprimer les cours existants
    await Course.deleteMany({})
    console.log('🗑️ Cours existants supprimés')
    
    // Récupérer l'admin comme instructeur
    const admin = await User.findOne({ email: 'admin@3mages.com' })
    if (!admin) {
      throw new Error('Administrateur non trouvé. Veuillez d\'abord créer les utilisateurs.')
    }
    
    const sundays = getNext5Sundays()
    
    const courseTopics = [
      {
        title: 'Méditation et Contemplation Spirituelle',
        description: 'Une séance profonde de méditation guidée pour développer la connexion avec le divin. Nous explorerons les techniques ancestrales de contemplation et de centrage spirituel.'
      },
      {
        title: 'Les Mystères de la Sagesse Ancienne',
        description: 'Découverte des enseignements ésotériques et de la sagesse transmise à travers les âges. Étude des textes sacrés et de leur application moderne.'
      },
      {
        title: 'Purification Énergétique et Harmonisation',
        description: 'Techniques de nettoyage énergétique et d\'harmonisation des chakras. Apprentissage des méthodes de protection spirituelle et de guérison intérieure.'
      },
      {
        title: 'Éveil de la Conscience Supérieure',
        description: 'Exploration des niveaux de conscience et des états modifiés de perception. Pratiques pour développer l\'intuition et la clairvoyance spirituelle.'
      },
      {
        title: 'Rituel de Manifestation et Abondance',
        description: 'Enseignements sur les lois universelles de la manifestation. Création de rituels personnels pour attirer l\'abondance et réaliser ses aspirations spirituelles.'
      }
    ]
    
    const courses = sundays.map((sunday, index) => ({
      title: courseTopics[index].title,
      description: courseTopics[index].description,
      date: sunday,
      duration: 120, // 2 heures
      location: 'Sanctuaire des 3 Mages - Salle de Méditation',
      price: 1000, // XAF
      maxParticipants: 15,
      instructor: admin._id,
      status: 'planned'
    }))
    
    await Course.create(courses)
    console.log(`📚 ${courses.length} cours créés pour les prochains dimanches`)
    
    console.log('✅ Seeding des cours terminé avec succès!')
    return await Course.find().populate('instructor', 'name email')
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding des cours:', error)
    throw error
  }
}

const seedEnrollments = async () => {
  try {
    await connectDB()
    
    console.log('🌱 Début du seeding des inscriptions...')
    
    // Supprimer les inscriptions existantes
    await Enrollment.deleteMany({})
    console.log('🗑️ Inscriptions existantes supprimées')
    
    // Récupérer tous les cours et utilisateurs
    const courses = await Course.find()
    const users = await User.find({ role: { $in: ['user', 'moderator'] } })
    
    if (courses.length === 0 || users.length === 0) {
      console.log('⚠️ Aucun cours ou utilisateur trouvé pour créer des inscriptions')
      return
    }
    
    const enrollments = []
    const paymentMethods = ['cash', 'mobile_money', 'bank_transfer']
    const paymentStatuses = ['paid', 'pending', 'exempted']
    
    // Pour chaque cours, inscrire entre 5 et 10 utilisateurs aléatoires
    for (const course of courses) {
      const numEnrollments = Math.floor(Math.random() * 6) + 5 // 5-10 inscriptions
      const selectedUsers = users.sort(() => 0.5 - Math.random()).slice(0, numEnrollments)
      
      for (const user of selectedUsers) {
        const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)]
        const enrollment = {
          courseId: course._id,
          userId: user._id,
          enrolledAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Inscrit dans les 7 derniers jours
          attended: Math.random() > 0.3, // 70% de chance d'avoir assisté
          paymentStatus,
          paymentDate: paymentStatus === 'paid' ? new Date() : undefined,
          paymentMethod: paymentStatus === 'paid' ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : undefined,
          paymentReference: paymentStatus === 'paid' ? `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined,
          notes: Math.random() > 0.7 ? 'Participant très engagé dans les discussions spirituelles' : undefined
        }
        
        enrollments.push(enrollment)
      }
    }
    
    await Enrollment.create(enrollments)
    console.log(`👥 ${enrollments.length} inscriptions créées`)
    
    console.log('✅ Seeding des inscriptions terminé avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding des inscriptions:', error)
    throw error
  }
}

const seedAll = async () => {
  try {
    console.log('🚀 Début du seeding complet...')
    
    await seedUsers()
    await seedRoles()
    await seedCourses()
    await seedEnrollments()
    
    console.log('🎉 Seeding complet terminé avec succès!')
    console.log('')
    console.log('📋 Informations de connexion:')
    console.log('   Email: admin@3mages.com')
    console.log('   Mot de passe: admin123')
    console.log('')
    console.log('📅 5 cours programmés pour les prochains dimanches à 10h00')
    console.log('👥 Inscriptions et présences aléatoires générées')
    console.log('')
    
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    process.exit(1)
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.includes('--users-only')) {
    seedUsers()
  } else if (args.includes('--roles-only')) {
    seedRoles()
  } else if (args.includes('--courses-only')) {
    seedCourses()
  } else if (args.includes('--enrollments-only')) {
    seedEnrollments()
  } else {
    seedAll()
  }
}

module.exports = { seedUsers, seedRoles, seedCourses, seedEnrollments, seedAll }