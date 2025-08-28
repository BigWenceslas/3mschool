import mongoose from 'mongoose'

export interface ISpiritualGoal extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  title: string
  description: string
  category: 'meditation' | 'prayer' | 'study' | 'service' | 'personal_growth' | 'other'
  targetType: 'daily' | 'weekly' | 'monthly' | 'one_time'
  targetValue: number // minutes, hours, or count depending on goal type
  currentProgress: number
  unit: 'minutes' | 'hours' | 'days' | 'times' | 'pages'
  startDate: Date
  endDate?: Date
  status: 'active' | 'completed' | 'paused' | 'abandoned'
  priority: 'low' | 'medium' | 'high'
  reminders?: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'custom'
    time?: string
    days?: number[]
  }
  milestones?: {
    percentage: number
    reached: boolean
    reachedDate?: Date
    note?: string
  }[]
  reflections?: {
    date: Date
    content: string
    mood: 'excellent' | 'good' | 'neutral' | 'difficult' | 'challenging'
  }[]
  createdAt: Date
  updatedAt: Date
}

const spiritualGoalSchema = new mongoose.Schema<ISpiritualGoal>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'ID de l\'utilisateur est requis']
    },
    title: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
      maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
    },
    category: {
      type: String,
      enum: ['meditation', 'prayer', 'study', 'service', 'personal_growth', 'other'],
      required: [true, 'La catégorie est requise'],
      default: 'personal_growth'
    },
    targetType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'one_time'],
      required: [true, 'Le type de cible est requis'],
      default: 'daily'
    },
    targetValue: {
      type: Number,
      required: [true, 'La valeur cible est requise'],
      min: [0, 'La valeur cible doit être positive']
    },
    currentProgress: {
      type: Number,
      default: 0,
      min: [0, 'Le progrès ne peut pas être négatif']
    },
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days', 'times', 'pages'],
      required: [true, 'L\'unité est requise'],
      default: 'minutes'
    },
    startDate: {
      type: Date,
      required: [true, 'La date de début est requise'],
      default: Date.now
    },
    endDate: {
      type: Date,
      validate: {
        validator: function(this: ISpiritualGoal, endDate: Date) {
          return !endDate || endDate > this.startDate
        },
        message: 'La date de fin doit être après la date de début'
      }
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'abandoned'],
      default: 'active'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    reminders: {
      enabled: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'custom'],
        default: 'daily'
      },
      time: {
        type: String,
        validate: {
          validator: function(time: string) {
            return !time || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)
          },
          message: 'Le format de l\'heure doit être HH:MM'
        }
      },
      days: [{
        type: Number,
        min: 0,
        max: 6
      }]
    },
    milestones: [{
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      },
      reached: {
        type: Boolean,
        default: false
      },
      reachedDate: Date,
      note: {
        type: String,
        maxlength: [500, 'La note ne peut pas dépasser 500 caractères']
      }
    }],
    reflections: [{
      date: {
        type: Date,
        default: Date.now
      },
      content: {
        type: String,
        required: true,
        maxlength: [2000, 'La réflexion ne peut pas dépasser 2000 caractères']
      },
      mood: {
        type: String,
        enum: ['excellent', 'good', 'neutral', 'difficult', 'challenging'],
        default: 'neutral'
      }
    }]
  },
  {
    timestamps: true
  }
)

// Index pour optimiser les recherches
spiritualGoalSchema.index({ userId: 1, status: 1 })
spiritualGoalSchema.index({ userId: 1, category: 1 })
spiritualGoalSchema.index({ userId: 1, startDate: -1 })
spiritualGoalSchema.index({ status: 1, endDate: 1 })

// Méthode pour calculer le pourcentage de progression
spiritualGoalSchema.methods.getProgressPercentage = function(): number {
  if (this.targetValue <= 0) return 0
  const percentage = (this.currentProgress / this.targetValue) * 100
  return Math.min(percentage, 100)
}

// Méthode pour vérifier si l'objectif est en retard
spiritualGoalSchema.methods.isOverdue = function(): boolean {
  if (!this.endDate || this.status === 'completed') return false
  return new Date() > this.endDate && this.status === 'active'
}

// Méthode pour mettre à jour le progrès
spiritualGoalSchema.methods.updateProgress = function(increment: number, note?: string) {
  this.currentProgress = Math.max(0, this.currentProgress + increment)
  
  // Vérifier si l'objectif est atteint
  if (this.currentProgress >= this.targetValue && this.status === 'active') {
    this.status = 'completed'
  }
  
  // Vérifier les milestones
  const progressPercentage = this.getProgressPercentage()
  this.milestones?.forEach((milestone: any) => {
    if (!milestone.reached && progressPercentage >= milestone.percentage) {
      milestone.reached = true
      milestone.reachedDate = new Date()
      if (note) milestone.note = note
    }
  })
  
  return this.save()
}

// Méthode pour ajouter une réflexion
spiritualGoalSchema.methods.addReflection = function(content: string, mood: string = 'neutral') {
  if (!this.reflections) this.reflections = []
  
  this.reflections.push({
    date: new Date(),
    content,
    mood
  })
  
  return this.save()
}

// Méthode statique pour obtenir les objectifs d'un utilisateur
spiritualGoalSchema.statics.getUserGoals = function(userId: string, status?: string) {
  const query: any = { userId: new mongoose.Types.ObjectId(userId) }
  if (status) query.status = status
  
  return this.find(query)
    .sort({ priority: -1, startDate: -1 })
    .populate('userId', 'firstName lastName')
}

// Méthode statique pour obtenir les statistiques des objectifs
spiritualGoalSchema.statics.getUserGoalStats = function(userId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalGoals: { $sum: 1 },
        completedGoals: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        activeGoals: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        averageProgress: { $avg: { $multiply: [{ $divide: ['$currentProgress', '$targetValue'] }, 100] } },
        goalsByCategory: {
          $push: {
            category: '$category',
            status: '$status'
          }
        }
      }
    }
  ])
}

export default mongoose.models.SpiritualGoal || mongoose.model<ISpiritualGoal>('SpiritualGoal', spiritualGoalSchema)