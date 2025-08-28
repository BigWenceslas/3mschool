import mongoose from 'mongoose'

export interface IExpense extends mongoose.Document {
  title: string
  description: string
  amount: number
  category: 'equipment' | 'facility' | 'teaching' | 'events' | 'administration' | 'other'
  type: 'one_time' | 'recurring'
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile' | 'check'
  paymentReference?: string
  vendor?: string
  receiptUrl?: string
  date: Date
  dueDate?: Date
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paidDate?: Date
  approvedBy?: mongoose.Types.ObjectId
  createdBy: mongoose.Types.ObjectId
  tags?: string[]
  notes?: string
  recurringSchedule?: {
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    interval: number
    endDate?: Date
    nextDueDate?: Date
  }
  createdAt: Date
  updatedAt: Date
}

const expenseSchema = new mongoose.Schema<IExpense>(
  {
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
    amount: {
      type: Number,
      required: [true, 'Le montant est requis'],
      min: [0, 'Le montant ne peut pas être négatif']
    },
    category: {
      type: String,
      enum: ['equipment', 'facility', 'teaching', 'events', 'administration', 'other'],
      required: [true, 'La catégorie est requise']
    },
    type: {
      type: String,
      enum: ['one_time', 'recurring'],
      default: 'one_time'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile', 'check'],
      required: [true, 'La méthode de paiement est requise']
    },
    paymentReference: {
      type: String,
      trim: true,
      maxlength: [100, 'La référence ne peut pas dépasser 100 caractères']
    },
    vendor: {
      type: String,
      trim: true,
      maxlength: [200, 'Le fournisseur ne peut pas dépasser 200 caractères']
    },
    receiptUrl: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'La date est requise'],
      default: Date.now
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled'],
      default: 'pending'
    },
    paidDate: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Le créateur est requis']
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Un tag ne peut pas dépasser 50 caractères']
    }],
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Les notes ne peuvent pas dépasser 2000 caractères']
    },
    recurringSchedule: {
      frequency: {
        type: String,
        enum: ['weekly', 'monthly', 'quarterly', 'yearly']
      },
      interval: {
        type: Number,
        min: 1,
        default: 1
      },
      endDate: Date,
      nextDueDate: Date
    }
  },
  {
    timestamps: true
  }
)

// Index pour optimiser les recherches
expenseSchema.index({ status: 1, date: -1 })
expenseSchema.index({ category: 1, date: -1 })
expenseSchema.index({ createdBy: 1, date: -1 })
expenseSchema.index({ dueDate: 1, status: 1 })

// Middleware pour mettre à jour les dates
expenseSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'paid' && !this.paidDate) {
    this.paidDate = new Date()
  }
  
  // Vérifier si la dépense est en retard
  if (this.status === 'pending' && this.dueDate && new Date() > this.dueDate) {
    this.status = 'overdue'
  }
  
  next()
})

// Méthode pour marquer comme payé
expenseSchema.methods.markAsPaid = function(paidDate?: Date, paymentReference?: string) {
  this.status = 'paid'
  this.paidDate = paidDate || new Date()
  if (paymentReference) this.paymentReference = paymentReference
  
  // Créer la prochaine occurrence si c'est récurrent
  if (this.type === 'recurring' && this.recurringSchedule) {
    this.createNextRecurrence()
  }
  
  return this.save()
}

// Méthode pour créer la prochaine récurrence
expenseSchema.methods.createNextRecurrence = function() {
  if (!this.recurringSchedule) return null
  
  const { frequency, interval, endDate } = this.recurringSchedule
  const currentDate = this.dueDate || this.date
  let nextDate = new Date(currentDate)
  
  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * interval))
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval)
      break
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + (3 * interval))
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval)
      break
  }
  
  // Vérifier si on n'a pas dépassé la date de fin
  if (endDate && nextDate > endDate) {
    return null
  }
  
  // Créer la nouvelle occurrence
  const NextExpense = this.constructor as any
  const nextExpense = new NextExpense({
    title: this.title,
    description: this.description,
    amount: this.amount,
    category: this.category,
    type: this.type,
    paymentMethod: this.paymentMethod,
    vendor: this.vendor,
    date: nextDate,
    dueDate: nextDate,
    createdBy: this.createdBy,
    tags: this.tags,
    recurringSchedule: this.recurringSchedule,
    status: 'pending'
  })
  
  return nextExpense.save()
}

// Méthode statique pour les statistiques
expenseSchema.statics.getFinancialStats = function(fromDate?: Date, toDate?: Date) {
  const matchCondition: any = {}
  
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
        totalExpenses: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
          }
        },
        overdueAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'overdue'] }, '$amount', 0]
          }
        },
        expensesByCategory: {
          $push: {
            category: '$category',
            amount: '$amount',
            status: '$status'
          }
        }
      }
    }
  ])
}

// Méthode statique pour les dépenses par mois
expenseSchema.statics.getMonthlyExpenses = function(year?: number) {
  const targetYear = year || new Date().getFullYear()
  
  return this.aggregate([
    {
      $match: {
        date: {
          $gte: new Date(targetYear, 0, 1),
          $lt: new Date(targetYear + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$date' },
        totalAmount: { $sum: '$amount' },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ])
}

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', expenseSchema)