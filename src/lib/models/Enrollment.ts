import mongoose from 'mongoose'

export interface IEnrollment extends mongoose.Document {
  courseId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  enrolledAt: Date
  attended: boolean
  paymentStatus: 'pending' | 'paid' | 'exempted'
  paymentDate?: Date
  paymentMethod?: string
  paymentReference?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const enrollmentSchema = new mongoose.Schema<IEnrollment>(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'L\'ID du cours est requis']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'ID de l\'utilisateur est requis']
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
      enum: ['cash', 'mobile_money', 'bank_transfer', 'card', 'exempted'],
      trim: true
    },
    paymentReference: {
      type: String,
      trim: true,
      maxlength: [100, 'La référence de paiement ne peut pas dépasser 100 caractères']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères']
    }
  },
  {
    timestamps: true
  }
)

// Index composé pour éviter les doublons
enrollmentSchema.index({ courseId: 1, userId: 1 }, { unique: true })

// Index pour optimiser les recherches
enrollmentSchema.index({ userId: 1, createdAt: -1 })
enrollmentSchema.index({ courseId: 1, attended: 1 })
enrollmentSchema.index({ paymentStatus: 1, paymentDate: 1 })

// Middleware pour mettre à jour paymentDate quand paymentStatus change
enrollmentSchema.pre('save', function(next) {
  if (this.isModified('paymentStatus') && this.paymentStatus === 'paid' && !this.paymentDate) {
    this.paymentDate = new Date()
  }
  next()
})

// Méthode pour marquer le paiement comme effectué
enrollmentSchema.methods.markAsPaid = function(method: string, reference?: string) {
  this.paymentStatus = 'paid'
  this.paymentDate = new Date()
  this.paymentMethod = method
  if (reference) {
    this.paymentReference = reference
  }
  return this.save()
}

// Méthode pour marquer la présence
enrollmentSchema.methods.markAttendance = function(attended: boolean, notes?: string) {
  this.attended = attended
  if (notes) {
    this.notes = notes
  }
  return this.save()
}

// Méthode statique pour obtenir les statistiques d'un cours
enrollmentSchema.statics.getCourseStats = function(courseId: string) {
  return this.aggregate([
    { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalEnrolled: { $sum: 1 },
        totalAttended: { $sum: { $cond: ['$attended', 1, 0] } },
        totalPaid: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } },
        totalRevenue: { 
          $sum: { 
            $cond: [
              { $eq: ['$paymentStatus', 'paid'] }, 
              { $multiply: ['$courseId.price', 1] }, // TODO: Get actual course price
              0
            ] 
          } 
        }
      }
    }
  ])
}

export default mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', enrollmentSchema)