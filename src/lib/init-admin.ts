import dbConnect from './mongodb'
import User from './models/User'

export async function initializeAdmin() {
  try {
    await dbConnect()
    
    const adminExists = await User.findOne({ role: 'admin' })
    
    if (!adminExists) {
      const adminUser = new User({
        name: 'Administrateur 3 Mages',
        email: 'admin@3mages.org',
        password: 'admin123456',
        role: 'admin',
        isActive: true
      })
      
      await adminUser.save()
      console.log('✅ Utilisateur administrateur créé avec succès')
      console.log('📧 Email: admin@3mages.org')
      console.log('🔑 Mot de passe: admin123456')
    } else {
      console.log('✅ Utilisateur administrateur déjà existant')
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de l\'admin:', error)
  }
}