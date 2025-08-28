require('dotenv').config()

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { seedAll } = require('./seed-data')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3mages'

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user', 'moderator'], default: 'user' },
  avatar: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

async function initDB() {
  try {
    console.log('🔗 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB')
    
    const adminExists = await User.findOne({ role: 'admin' })
    
    if (!adminExists) {
      console.log('👤 Création de l\'utilisateur administrateur...')
      
      const admin = new User({
        name: 'Administrateur 3 Mages',
        email: 'admin@3mages.org',
        password: 'admin123456',
        role: 'admin',
        isActive: true
      })
      
      await admin.save()
      console.log('✅ Utilisateur administrateur créé avec succès!')
      console.log('📧 Email: admin@3mages.org')
      console.log('🔑 Mot de passe: admin123456')
    } else {
      console.log('✅ Utilisateur administrateur déjà existant')
    }
    
    // Demander si l'utilisateur veut aussi exécuter le seeding complet
    const args = process.argv.slice(2)
    if (args.includes('--with-seed')) {
      console.log('\n🌱 Lancement du seeding complet...')
      await seedAll()
    } else {
      console.log('\n💡 Astuce: Utilisez "npm run init-db -- --with-seed" pour également créer des données de test')
      console.log('   Ou utilisez "npm run seed" pour créer uniquement les données de test')
    }
    
    console.log('🎉 Initialisation terminée!')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

initDB()