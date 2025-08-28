import mongoose from 'mongoose'

export interface ICourse extends mongoose.Document {
  title: string
  description: string
  date: Date
  duration: number // en minutes
  location: string
  maxParticipants: number
  instructor: mongoose.Types.ObjectId
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  price: number
  summary?: string
  createdAt: Date
  updatedAt: Date
}

const courseSchema = new mongoose.Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Le titre du cours est requis'],
      trim: true,
      maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
    },
    description: {
      type: String,
      required: [true, 'La description est requise'],
      trim: true,
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    date: {
      type: Date,
      required: [true, 'La date du cours est requise'],
      validate: {
        validator: function(date: Date) {
          return date > new Date()
        },
        message: 'La date du cours doit être dans le futur'
      }
    },
    duration: {
      type: Number,
      required: [true, 'La durée est requise'],
      min: [15, 'La durée minimum est de 15 minutes'],
      max: [480, 'La durée maximum est de 8 heures']
    },
    location: {
      type: String,
      required: [true, 'Le lieu est requis'],
      trim: true,
      maxlength: [200, 'Le lieu ne peut pas dépasser 200 caractères']
    },
    maxParticipants: {
      type: Number,
      required: [true, 'Le nombre maximum de participants est requis'],
      min: [1, 'Il faut au minimum 1 participant'],
      max: [100, 'Maximum 100 participants']
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'instructeur est requis']
    },
    status: {
      type: String,
      enum: ['planned', 'ongoing', 'completed', 'cancelled'],
      default: 'planned'
    },
    price: {
      type: Number,
      required: [true, 'Le prix est requis'],
      min: [0, 'Le prix ne peut pas être négatif'],
      default: 1000 // 1000 XAF
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [2000, 'Le résumé ne peut pas dépasser 2000 caractères']
    }
  },
  {
    timestamps: true
  }
)

// Index pour optimiser les recherches
courseSchema.index({ date: 1, status: 1 })
courseSchema.index({ instructor: 1 })

// Middleware pour mettre à jour automatiquement le statut avant les requêtes find
courseSchema.pre(/^find/, function() {
  // Cette fonction sera appelée avant toute requête find
  const now = new Date()
  
  // Mettre à jour les cours planifiés qui sont maintenant en cours
  this.updateMany(
    { 
      status: 'planned',
      date: { $lte: now },
      $expr: { $gt: [{ $add: ['$date', { $multiply: ['$duration', 60000] }] }, now] }
    },
    { status: 'ongoing' }
  )
  
  // Mettre à jour les cours en cours ou planifiés qui sont maintenant terminés  
  this.updateMany(
    { 
      status: { $in: ['planned', 'ongoing'] },
      $expr: { $lte: [{ $add: ['$date', { $multiply: ['$duration', 60000] }] }, now] }
    },
    { status: 'completed' }
  )
})

// Méthode virtuelle pour calculer la date de fin
courseSchema.virtual('endDate').get(function() {
  return new Date(this.date.getTime() + this.duration * 60 * 1000)
})

// Méthode pour vérifier si le cours est modifiable
courseSchema.methods.isEditable = function(): boolean {
  return this.status === 'planned' && this.date > new Date()
}

// Méthode pour vérifier si les inscriptions sont ouvertes
courseSchema.methods.isEnrollmentOpen = function(): boolean {
  return this.status === 'planned' && this.date > new Date()
}

// Méthode pour calculer le statut automatique basé sur la date
courseSchema.methods.getAutoStatus = function(): 'planned' | 'ongoing' | 'completed' | 'cancelled' {
  if (this.status === 'cancelled') return 'cancelled'
  
  const now = new Date()
  const endDate = new Date(this.date.getTime() + this.duration * 60 * 1000)
  
  if (now < this.date) {
    return 'planned'
  } else if (now >= this.date && now < endDate) {
    return 'ongoing'
  } else {
    return 'completed'
  }
}

// Méthode pour mettre à jour le statut automatiquement
courseSchema.methods.updateAutoStatus = function() {
  const newStatus = this.getAutoStatus()
  if (this.status !== newStatus && this.status !== 'cancelled') {
    this.status = newStatus
  }
  return this
}

export default mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema)