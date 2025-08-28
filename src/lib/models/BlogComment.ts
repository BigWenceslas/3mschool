import mongoose from 'mongoose'

export interface IBlogComment extends mongoose.Document {
  postId: mongoose.Types.ObjectId
  author: mongoose.Types.ObjectId
  content: string
  status: 'pending' | 'approved' | 'rejected'
  parentComment?: mongoose.Types.ObjectId
  likes: number
  createdAt: Date
  updatedAt: Date
}

const blogCommentSchema = new mongoose.Schema<IBlogComment>(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogPost',
      required: [true, 'L\'ID du post est requis']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'auteur est requis']
    },
    content: {
      type: String,
      required: [true, 'Le contenu du commentaire est requis'],
      trim: true,
      maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogComment'
    },
    likes: {
      type: Number,
      default: 0,
      min: [0, 'Le nombre de likes ne peut pas être négatif']
    }
  },
  {
    timestamps: true
  }
)

// Index pour optimiser les recherches
blogCommentSchema.index({ postId: 1, status: 1, createdAt: -1 })
blogCommentSchema.index({ author: 1 })
blogCommentSchema.index({ parentComment: 1 })

// Méthode pour approuver un commentaire
blogCommentSchema.methods.approve = function() {
  this.status = 'approved'
  return this.save()
}

// Méthode pour rejeter un commentaire
blogCommentSchema.methods.reject = function() {
  this.status = 'rejected'
  return this.save()
}

// Méthode pour incrémenter les likes
blogCommentSchema.methods.incrementLikes = function() {
  this.likes += 1
  return this.save()
}

// Méthode pour décrémenter les likes
blogCommentSchema.methods.decrementLikes = function() {
  if (this.likes > 0) {
    this.likes -= 1
  }
  return this.save()
}

// Méthode statique pour obtenir les commentaires approuvés d'un post
blogCommentSchema.statics.getApprovedForPost = function(postId: string) {
  return this.find({ postId, status: 'approved', parentComment: null })
    .populate('author', 'firstName lastName')
    .populate({
      path: 'replies',
      match: { status: 'approved' },
      populate: { path: 'author', select: 'firstName lastName' }
    })
    .sort({ createdAt: -1 })
}

// Virtual pour les réponses
blogCommentSchema.virtual('replies', {
  ref: 'BlogComment',
  localField: '_id',
  foreignField: 'parentComment'
})

// S'assurer que les virtuals sont inclus dans JSON
blogCommentSchema.set('toJSON', { virtuals: true })

export default mongoose.models.BlogComment || mongoose.model<IBlogComment>('BlogComment', blogCommentSchema)