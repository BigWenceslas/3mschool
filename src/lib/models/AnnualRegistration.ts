import mongoose from 'mongoose'

export interface IAnnualRegistration extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  year: number
  status: 'pending' | 'paid' | 'exempted'
  amount: number
  paymentDate?: Date
  paymentMethod?: string
  paymentReference?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const annualRegistrationSchema = new mongoose.Schema<IAnnualRegistration>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'ID de l\'utilisateur est requis']
    },
    year: {
      type: Number,
      required: [true, 'L\'année d\'inscription est requise'],
      min: [2020, 'L\'année doit être supérieure à 2020'],
      max: [2050, 'L\'année doit être inférieure à 2050']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'exempted'],
      default: 'pending'
    },
    amount: {
      type: Number,
      required: [true, 'Le montant est requis'],
      min: [0, 'Le montant ne peut pas être négatif'],
      default: 10000 // 10000 XAF par défaut
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

// Index composé pour éviter les doublons (un utilisateur ne peut avoir qu'une inscription par année)
annualRegistrationSchema.index({ userId: 1, year: 1 }, { unique: true })

// Index pour optimiser les recherches
annualRegistrationSchema.index({ status: 1, year: 1 })
annualRegistrationSchema.index({ userId: 1, year: -1 })
annualRegistrationSchema.index({ paymentDate: -1 })

// Middleware pour mettre à jour paymentDate quand status change
annualRegistrationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'paid' && !this.paymentDate) {
    this.paymentDate = new Date()
  }
  next()
})

// Méthode pour marquer le paiement comme effectué
annualRegistrationSchema.methods.markAsPaid = function(method: string, reference?: string) {
  this.status = 'paid'
  this.paymentDate = new Date()
  this.paymentMethod = method
  if (reference) {
    this.paymentReference = reference
  }
  return this.save()
}

// Méthode pour vérifier si l'inscription est valide pour l'année courante
annualRegistrationSchema.methods.isValidForCurrentYear = function(): boolean {
  return this.year === new Date().getFullYear() && this.status === 'paid'
}

// Méthode statique pour obtenir l'inscription d'un utilisateur pour une année donnée
annualRegistrationSchema.statics.getUserRegistration = function(userId: string, year?: number) {
  const targetYear = year || new Date().getFullYear()
  return this.findOne({ userId, year: targetYear })
}

// Méthode statique pour créer ou mettre à jour une inscription annuelle
annualRegistrationSchema.statics.createOrUpdate = async function(
  userId: string, 
  year: number, 
  amount: number,
  status: 'pending' | 'paid' | 'exempted' = 'pending'
) {
  return await this.findOneAndUpdate(
    { userId, year },
    { 
      userId, 
      year, 
      amount, 
      status,
      ...(status === 'paid' && { paymentDate: new Date() })
    },
    { 
      upsert: true, 
      new: true, 
      runValidators: true 
    }
  )
}

// Méthode statique pour obtenir les statistiques des inscriptions
annualRegistrationSchema.statics.getYearStats = function(year?: number) {
  const targetYear = year || new Date().getFullYear()
  return this.aggregate([
    { $match: { year: targetYear } },
    {
      $group: {
        _id: null,
        totalRegistrations: { $sum: 1 },
        totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        totalPending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        totalRevenue: { 
          $sum: { 
            $cond: [
              { $eq: ['$status', 'paid'] }, 
              '$amount', 
              0
            ] 
          } 
        },
        averageAmount: { $avg: '$amount' }
      }
    }
  ])
}

export default mongoose.models.AnnualRegistration || mongoose.model<IAnnualRegistration>('AnnualRegistration', annualRegistrationSchema)