import mongoose from 'mongoose'

export interface IJournalEntry extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  title: string
  content: string
  mood?: 'excellent' | 'good' | 'neutral' | 'difficult' | 'challenging'
  tags?: string[]
  isPrivate: boolean
  date: Date
  spiritualPractices?: {
    meditation: number // minutes
    prayer: number // minutes
    reading: number // minutes
    reflection: number // minutes
  }
  gratitude?: string[]
  challenges?: string
  insights?: string
  createdAt: Date
  updatedAt: Date
}

const journalEntrySchema = new mongoose.Schema<IJournalEntry>(
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
    content: {
      type: String,
      required: [true, 'Le contenu est requis'],
      maxlength: [10000, 'Le contenu ne peut pas dépasser 10000 caractères']
    },
    mood: {
      type: String,
      enum: ['excellent', 'good', 'neutral', 'difficult', 'challenging'],
      default: 'neutral'
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Un tag ne peut pas dépasser 50 caractères']
    }],
    isPrivate: {
      type: Boolean,
      default: true
    },
    date: {
      type: Date,
      required: [true, 'La date est requise'],
      default: Date.now
    },
    spiritualPractices: {
      meditation: {
        type: Number,
        min: [0, 'La durée ne peut pas être négative'],
        max: [1440, 'Maximum 24h'],
        default: 0
      },
      prayer: {
        type: Number,
        min: [0, 'La durée ne peut pas être négative'],
        max: [1440, 'Maximum 24h'],
        default: 0
      },
      reading: {
        type: Number,
        min: [0, 'La durée ne peut pas être négative'],
        max: [1440, 'Maximum 24h'],
        default: 0
      },
      reflection: {
        type: Number,
        min: [0, 'La durée ne peut pas être négative'],
        max: [1440, 'Maximum 24h'],
        default: 0
      }
    },
    gratitude: [{
      type: String,
      trim: true,
      maxlength: [500, 'Une gratitude ne peut pas dépasser 500 caractères']
    }],
    challenges: {
      type: String,
      trim: true,
      maxlength: [2000, 'Les défis ne peuvent pas dépasser 2000 caractères']
    },
    insights: {
      type: String,
      trim: true,
      maxlength: [2000, 'Les insights ne peuvent pas dépasser 2000 caractères']
    }
  },
  {
    timestamps: true
  }
)

// Index pour optimiser les recherches
journalEntrySchema.index({ userId: 1, date: -1 })
journalEntrySchema.index({ userId: 1, tags: 1 })
journalEntrySchema.index({ userId: 1, mood: 1 })
journalEntrySchema.index({ date: -1 })

// Méthode pour obtenir le temps total de pratiques spirituelles
journalEntrySchema.methods.getTotalPracticeTime = function(): number {
  const practices = this.spiritualPractices || {}
  return (practices.meditation || 0) + 
         (practices.prayer || 0) + 
         (practices.reading || 0) + 
         (practices.reflection || 0)
}

// Méthode statique pour obtenir les statistiques d'un utilisateur
journalEntrySchema.statics.getUserStats = function(userId: string, fromDate?: Date, toDate?: Date) {
  const matchCondition: any = { userId: new mongoose.Types.ObjectId(userId) }
  
  if (fromDate || toDate) {
    matchCondition.date = {}
    if (fromDate) matchCondition.date.$gte = fromDate
    if (toDate) matchCondition.date.$lte = toDate
  }

  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        totalMeditation: { $sum: '$spiritualPractices.meditation' },
        totalPrayer: { $sum: '$spiritualPractices.prayer' },
        totalReading: { $sum: '$spiritualPractices.reading' },
        totalReflection: { $sum: '$spiritualPractices.reflection' },
        moodDistribution: {
          $push: '$mood'
        },
        averagePracticeTime: {
          $avg: {
            $add: [
              { $ifNull: ['$spiritualPractices.meditation', 0] },
              { $ifNull: ['$spiritualPractices.prayer', 0] },
              { $ifNull: ['$spiritualPractices.reading', 0] },
              { $ifNull: ['$spiritualPractices.reflection', 0] }
            ]
          }
        }
      }
    }
  ])
}

// Méthode statique pour obtenir les entrées récentes d'un utilisateur
journalEntrySchema.statics.getRecentEntries = function(userId: string, limit: number = 10) {
  return this.find({ userId })
    .sort({ date: -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName')
}

// Méthode statique pour rechercher dans le journal
journalEntrySchema.statics.searchEntries = function(userId: string, query: string, options: any = {}) {
  const searchCondition: any = {
    userId: new mongoose.Types.ObjectId(userId),
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  }

  if (options.mood) {
    searchCondition.mood = options.mood
  }

  if (options.fromDate || options.toDate) {
    searchCondition.date = {}
    if (options.fromDate) searchCondition.date.$gte = new Date(options.fromDate)
    if (options.toDate) searchCondition.date.$lte = new Date(options.toDate)
  }

  return this.find(searchCondition)
    .sort({ date: -1 })
    .limit(options.limit || 50)
}

export default mongoose.models.Journal || mongoose.model<IJournalEntry>('Journal', journalEntrySchema)