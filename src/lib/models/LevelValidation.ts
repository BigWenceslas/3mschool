import mongoose from 'mongoose'

export interface ILevelValidation extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  currentLevel: number
  requestedLevel: number
  status: 'pending' | 'approved' | 'rejected' | 'revision_required'
  requestDate: Date
  reviewDate?: Date
  reviewedBy?: mongoose.Types.ObjectId
  submissionData: {
    achievements: string[]
    selfAssessment: string
    practiceHours: number
    coursesCompleted: string[]
    testimonials?: string[]
    artifacts?: {
      type: 'document' | 'video' | 'audio' | 'image'
      title: string
      description: string
      url: string
    }[]
  }
  reviewComments?: string
  requirements: {
    minimumPracticeHours: number
    requiredCourses: string[]
    minimumJournalEntries: number
    minimumGoalsCompleted: number
    additionalCriteria?: string[]
  }
  progressTracking: {
    practiceHoursCompleted: number
    coursesCompleted: number
    journalEntriesCount: number
    goalsCompletedCount: number
    lastUpdated: Date
  }
  createdAt: Date
  updatedAt: Date
}

const levelValidationSchema = new mongoose.Schema<ILevelValidation>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'ID de l\'utilisateur est requis']
    },
    currentLevel: {
      type: Number,
      required: [true, 'Le niveau actuel est requis'],
      min: [0, 'Le niveau ne peut pas être négatif'],
      max: [10, 'Le niveau maximum est 10']
    },
    requestedLevel: {
      type: Number,
      required: [true, 'Le niveau demandé est requis'],
      min: [1, 'Le niveau demandé doit être au minimum 1'],
      max: [10, 'Le niveau maximum est 10'],
      validate: {
        validator: function(this: ILevelValidation, requestedLevel: number) {
          return requestedLevel > this.currentLevel
        },
        message: 'Le niveau demandé doit être supérieur au niveau actuel'
      }
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revision_required'],
      default: 'pending'
    },
    requestDate: {
      type: Date,
      default: Date.now
    },
    reviewDate: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submissionData: {
      achievements: [{
        type: String,
        trim: true,
        maxlength: [500, 'Un accomplissement ne peut pas dépasser 500 caractères']
      }],
      selfAssessment: {
        type: String,
        required: [true, 'L\'auto-évaluation est requise'],
        trim: true,
        maxlength: [2000, 'L\'auto-évaluation ne peut pas dépasser 2000 caractères']
      },
      practiceHours: {
        type: Number,
        required: [true, 'Les heures de pratique sont requises'],
        min: [0, 'Les heures de pratique ne peuvent pas être négatives']
      },
      coursesCompleted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      }],
      testimonials: [{
        type: String,
        trim: true,
        maxlength: [1000, 'Un témoignage ne peut pas dépasser 1000 caractères']
      }],
      artifacts: [{
        type: {
          type: String,
          enum: ['document', 'video', 'audio', 'image'],
          required: true
        },
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
        },
        description: {
          type: String,
          trim: true,
          maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
        },
        url: {
          type: String,
          required: true,
          trim: true
        }
      }]
    },
    reviewComments: {
      type: String,
      trim: true,
      maxlength: [2000, 'Les commentaires ne peuvent pas dépasser 2000 caractères']
    },
    requirements: {
      minimumPracticeHours: {
        type: Number,
        required: true,
        min: 0
      },
      requiredCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      }],
      minimumJournalEntries: {
        type: Number,
        required: true,
        min: 0,
        default: 0
      },
      minimumGoalsCompleted: {
        type: Number,
        required: true,
        min: 0,
        default: 0
      },
      additionalCriteria: [{
        type: String,
        trim: true,
        maxlength: [200, 'Un critère ne peut pas dépasser 200 caractères']
      }]
    },
    progressTracking: {
      practiceHoursCompleted: {
        type: Number,
        default: 0,
        min: 0
      },
      coursesCompleted: {
        type: Number,
        default: 0,
        min: 0
      },
      journalEntriesCount: {
        type: Number,
        default: 0,
        min: 0
      },
      goalsCompletedCount: {
        type: Number,
        default: 0,
        min: 0
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    }
  },
  {
    timestamps: true
  }
)

// Index pour optimiser les recherches
levelValidationSchema.index({ userId: 1, status: 1 })
levelValidationSchema.index({ status: 1, requestDate: -1 })
levelValidationSchema.index({ reviewedBy: 1, reviewDate: -1 })

// Méthode pour vérifier si les exigences sont remplies
levelValidationSchema.methods.checkRequirements = function(): {
  met: boolean
  details: {
    practiceHours: { required: number, current: number, met: boolean }
    courses: { required: number, current: number, met: boolean }
    journalEntries: { required: number, current: number, met: boolean }
    goalsCompleted: { required: number, current: number, met: boolean }
  }
} {
  const tracking = this.progressTracking
  const requirements = this.requirements

  const details = {
    practiceHours: {
      required: requirements.minimumPracticeHours,
      current: tracking.practiceHoursCompleted,
      met: tracking.practiceHoursCompleted >= requirements.minimumPracticeHours
    },
    courses: {
      required: requirements.requiredCourses?.length || 0,
      current: tracking.coursesCompleted,
      met: tracking.coursesCompleted >= (requirements.requiredCourses?.length || 0)
    },
    journalEntries: {
      required: requirements.minimumJournalEntries,
      current: tracking.journalEntriesCount,
      met: tracking.journalEntriesCount >= requirements.minimumJournalEntries
    },
    goalsCompleted: {
      required: requirements.minimumGoalsCompleted,
      current: tracking.goalsCompletedCount,
      met: tracking.goalsCompletedCount >= requirements.minimumGoalsCompleted
    }
  }

  const met = details.practiceHours.met && 
              details.courses.met && 
              details.journalEntries.met && 
              details.goalsCompleted.met

  return { met, details }
}

// Méthode pour mettre à jour le suivi des progrès
levelValidationSchema.methods.updateProgress = async function() {
  const Journal = mongoose.model('Journal')
  const SpiritualGoal = mongoose.model('SpiritualGoal')
  const Enrollment = mongoose.model('Enrollment')

  // Compter les entrées de journal
  const journalCount = await Journal.countDocuments({ userId: this.userId })

  // Compter les objectifs complétés
  const goalsCompleted = await SpiritualGoal.countDocuments({ 
    userId: this.userId, 
    status: 'completed' 
  })

  // Calculer les heures de pratique totales
  const journalStats = await Journal.aggregate([
    { $match: { userId: this.userId } },
    {
      $group: {
        _id: null,
        totalPracticeMinutes: {
          $sum: {
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

  const practiceHours = journalStats.length > 0 ? 
    Math.floor(journalStats[0].totalPracticeMinutes / 60) : 0

  // Compter les cours complétés
  const coursesCompleted = await Enrollment.countDocuments({
    userId: this.userId,
    attended: true
  })

  this.progressTracking = {
    practiceHoursCompleted: practiceHours,
    coursesCompleted,
    journalEntriesCount: journalCount,
    goalsCompletedCount: goalsCompleted,
    lastUpdated: new Date()
  }

  return this.save()
}

// Méthode pour approuver/rejeter la demande
levelValidationSchema.methods.review = function(
  status: 'approved' | 'rejected' | 'revision_required',
  reviewedBy: string,
  comments?: string
) {
  this.status = status
  this.reviewDate = new Date()
  this.reviewedBy = reviewedBy
  if (comments) this.reviewComments = comments

  // Si approuvé, mettre à jour le niveau de l'utilisateur
  if (status === 'approved') {
    // Cette logique devra être implémentée dans l'API pour mettre à jour le User
  }

  return this.save()
}

// Méthode statique pour obtenir les demandes en attente
levelValidationSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending' })
    .populate('userId', 'firstName lastName email')
    .sort({ requestDate: -1 })
}

// Méthode statique pour obtenir l'historique d'un utilisateur
levelValidationSchema.statics.getUserHistory = function(userId: string) {
  return this.find({ userId })
    .populate('reviewedBy', 'firstName lastName')
    .sort({ requestDate: -1 })
}

// Méthode statique pour créer les exigences par défaut selon le niveau
levelValidationSchema.statics.getDefaultRequirements = function(level: number) {
  const baseRequirements = {
    1: { practiceHours: 50, courses: 2, journalEntries: 10, goals: 1 },
    2: { practiceHours: 100, courses: 5, journalEntries: 25, goals: 3 },
    3: { practiceHours: 200, courses: 8, journalEntries: 50, goals: 5 },
    4: { practiceHours: 350, courses: 12, journalEntries: 75, goals: 8 },
    5: { practiceHours: 500, courses: 15, journalEntries: 100, goals: 12 },
    6: { practiceHours: 700, courses: 20, journalEntries: 150, goals: 15 },
    7: { practiceHours: 950, courses: 25, journalEntries: 200, goals: 20 },
    8: { practiceHours: 1250, courses: 30, journalEntries: 300, goals: 25 },
    9: { practiceHours: 1600, courses: 40, journalEntries: 400, goals: 30 },
    10: { practiceHours: 2000, courses: 50, journalEntries: 500, goals: 40 }
  }

  const req = baseRequirements[level as keyof typeof baseRequirements] || baseRequirements[1]
  
  return {
    minimumPracticeHours: req.practiceHours,
    requiredCourses: [], // À définir selon les cours disponibles
    minimumJournalEntries: req.journalEntries,
    minimumGoalsCompleted: req.goals,
    additionalCriteria: []
  }
}

export default mongoose.models.LevelValidation || mongoose.model<ILevelValidation>('LevelValidation', levelValidationSchema)