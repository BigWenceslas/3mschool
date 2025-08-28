import mongoose from 'mongoose'

export interface IPayment extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  courseId?: mongoose.Types.ObjectId
  type: 'course' | 'annual_subscription' | 'other'
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'exempted'
  paymentMethod: 'cash' | 'mobile_money' | 'bank_transfer' | 'card' | 'exempted'
  reference: string
  description: string
  paymentDate?: Date
  dueDate?: Date
  notes?: string
  processedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const paymentSchema = new mongoose.Schema<IPayment>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'utilisateur est requis']
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: function() {
        return this.type === 'course'
      }
    },
    type: {
      type: String,
      enum: ['course', 'annual_subscription', 'other'],
      required: [true, 'Le type de paiement est requis']
    },
    amount: {
      type: Number,
      required: [true, 'Le montant est requis'],
      min: [0, 'Le montant ne peut pas être négatif']
    },
    currency: {
      type: String,
      default: 'XAF',
      enum: ['XAF', 'EUR', 'USD']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'exempted'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'mobile_money', 'bank_transfer', 'card', 'exempted'],
      required: function() {
        return this.status === 'paid' || this.status === 'exempted'
      }
    },
    reference: {
      type: String,
      required: [true, 'La référence est requise'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'La description est requise'],
      trim: true,
      maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
    },
    paymentDate: {
      type: Date
    },
    dueDate: {
      type: Date
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères']
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

// Index pour optimiser les recherches
paymentSchema.index({ userId: 1, createdAt: -1 })
paymentSchema.index({ courseId: 1 })
paymentSchema.index({ status: 1, dueDate: 1 })
paymentSchema.index({ type: 1, status: 1 })
paymentSchema.index({ reference: 1 }, { unique: true })

// Middleware pour générer une référence unique
paymentSchema.pre('save', async function(next) {
  if (!this.reference) {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    this.reference = `PAY-${timestamp}-${random}`.toUpperCase()
  }
  
  // Mettre à jour la date de paiement si le statut devient 'paid'
  if (this.isModified('status') && this.status === 'paid' && !this.paymentDate) {
    this.paymentDate = new Date()
  }
  
  next()
})

// Méthode pour marquer comme payé
paymentSchema.methods.markAsPaid = function(method: string, processedById?: string, notes?: string) {
  this.status = 'paid'
  this.paymentMethod = method
  this.paymentDate = new Date()
  if (processedById) this.processedBy = processedById
  if (notes) this.notes = notes
  return this.save()
}

// Méthode pour rembourser
paymentSchema.methods.refund = function(reason: string, processedById?: string) {
  this.status = 'refunded'
  this.notes = reason
  if (processedById) this.processedBy = processedById
  return this.save()
}

// Méthode statique pour créer un paiement de cours
paymentSchema.statics.createCoursePayment = async function(userId: string, courseId: string, amount: number, description?: string) {
  return await this.create({
    userId,
    courseId,
    type: 'course',
    amount,
    description: description || `Paiement du cours`,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours pour payer
  })
}

// Méthode statique pour créer un paiement d'inscription annuelle
paymentSchema.statics.createAnnualSubscription = async function(userId: string, amount: number) {
  const year = new Date().getFullYear()
  return await this.create({
    userId,
    type: 'annual_subscription',
    amount,
    description: `Inscription annuelle ${year}`,
    dueDate: new Date(`${year}-12-31`) // Fin de l'année
  })
}

// Méthode statique pour obtenir les statistiques de paiement
paymentSchema.statics.getPaymentStats = async function(filters: any = {}) {
  const pipeline: any[] = [
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]

  return await this.aggregate(pipeline)
}

// Méthode statique pour obtenir les revenus par période
paymentSchema.statics.getRevenueByPeriod = async function(startDate: Date, endDate: Date) {
  return await this.aggregate([
    {
      $match: {
        status: 'paid',
        paymentDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' },
          type: '$type'
        },
        totalRevenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ])
}

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema)