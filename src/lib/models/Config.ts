import mongoose from 'mongoose'

export interface IConfig extends mongoose.Document {
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  category: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

const configSchema = new mongoose.Schema<IConfig>(
  {
    key: {
      type: String,
      required: [true, 'La clé de configuration est requise'],
      unique: true,
      trim: true,
      maxlength: [100, 'La clé ne peut pas dépasser 100 caractères']
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'La valeur est requise']
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'object', 'array'],
      required: [true, 'Le type est requis']
    },
    description: {
      type: String,
      required: [true, 'La description est requise'],
      trim: true,
      maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
    },
    category: {
      type: String,
      required: [true, 'La catégorie est requise'],
      enum: ['pricing', 'general', 'courses', 'payments', 'notifications', 'system'],
      default: 'general'
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

// Index pour optimiser les recherches
configSchema.index({ category: 1, key: 1 })
configSchema.index({ isSystem: 1 })

// Méthode statique pour obtenir une valeur de configuration
configSchema.statics.getValue = async function(key: string, defaultValue: any = null) {
  const config = await this.findOne({ key })
  return config ? config.value : defaultValue
}

// Méthode statique pour définir une valeur de configuration
configSchema.statics.setValue = async function(key: string, value: any, description?: string, category: string = 'general') {
  const type = Array.isArray(value) ? 'array' : 
               typeof value === 'object' && value !== null ? 'object' : 
               typeof value

  return await this.findOneAndUpdate(
    { key },
    { 
      value, 
      type, 
      description: description || `Configuration pour ${key}`,
      category 
    },
    { 
      upsert: true, 
      new: true, 
      runValidators: true 
    }
  )
}

// Méthode statique pour obtenir toutes les configurations d'une catégorie
configSchema.statics.getByCategory = async function(category: string) {
  return await this.find({ category }).sort({ key: 1 })
}

// Méthodes statiques pour les tarifs
configSchema.statics.getPricing = async function() {
  const configs = await this.find({ category: 'pricing' })
  const pricing: any = {}
  
  configs.forEach((config: IConfig) => {
    pricing[config.key] = config.value
  })
  
  // Valeurs par défaut si non configurées
  return {
    tarif_inscription_annuelle: pricing.tarif_inscription_annuelle || 10000,
    tarif_cours: pricing.tarif_cours || 1000,
    ...pricing
  }
}

// Initialiser les configurations par défaut
configSchema.statics.initializeDefaults = async function() {
  const defaults = [
    {
      key: 'tarif_inscription_annuelle',
      value: 10000,
      type: 'number',
      description: 'Tarif de l\'inscription annuelle en XAF',
      category: 'pricing'
    },
    {
      key: 'tarif_cours',
      value: 1000,
      type: 'number',
      description: 'Tarif par cours en XAF',
      category: 'pricing'
    },
    {
      key: 'max_participants_par_cours',
      value: 30,
      type: 'number',
      description: 'Nombre maximum de participants par cours',
      category: 'courses'
    },
    {
      key: 'delai_annulation_cours',
      value: 24,
      type: 'number',
      description: 'Délai d\'annulation en heures avant le cours',
      category: 'courses'
    },
    {
      key: 'nom_organisation',
      value: '3 Mages',
      type: 'string',
      description: 'Nom de l\'organisation spirituelle',
      category: 'general'
    },
    {
      key: 'email_contact',
      value: 'contact@3mages.org',
      type: 'string',
      description: 'Email de contact principal',
      category: 'general'
    },
    {
      key: 'notifications_enabled',
      value: true,
      type: 'boolean',
      description: 'Activer les notifications par email',
      category: 'notifications'
    }
  ]

  for (const config of defaults) {
    await this.findOneAndUpdate(
      { key: config.key },
      config,
      { upsert: true, new: true }
    )
  }

  return defaults
}

export default mongoose.models.Config || mongoose.model<IConfig>('Config', configSchema)