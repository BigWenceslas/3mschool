import mongoose from 'mongoose'

export interface IBlogPost extends mongoose.Document {
  title: string
  content: string
  excerpt: string
  author: mongoose.Types.ObjectId
  status: 'draft' | 'published' | 'archived'
  slug: string
  tags: string[]
  featuredImage?: string
  publishedAt?: Date
  readTime?: number
  views: number
  likes: number
  comments: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const blogPostSchema = new mongoose.Schema<IBlogPost>(
  {
    title: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
      maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
    },
    content: {
      type: String,
      required: [true, 'Le contenu est requis'],
      trim: true
    },
    excerpt: {
      type: String,
      required: [true, 'L\'extrait est requis'],
      trim: true,
      maxlength: [300, 'L\'extrait ne peut pas dépasser 300 caractères']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'L\'auteur est requis']
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    slug: {
      type: String,
      required: [true, 'Le slug est requis'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets']
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true,
      maxlength: [50, 'Un tag ne peut pas dépasser 50 caractères']
    }],
    featuredImage: {
      type: String,
      trim: true
    },
    publishedAt: {
      type: Date
    },
    readTime: {
      type: Number,
      min: [1, 'Le temps de lecture minimum est de 1 minute']
    },
    views: {
      type: Number,
      default: 0,
      min: [0, 'Le nombre de vues ne peut pas être négatif']
    },
    likes: {
      type: Number,
      default: 0,
      min: [0, 'Le nombre de likes ne peut pas être négatif']
    },
    comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogComment'
    }]
  },
  {
    timestamps: true
  }
)

// Index pour optimiser les recherches
blogPostSchema.index({ status: 1, publishedAt: -1 })
blogPostSchema.index({ author: 1 })
blogPostSchema.index({ slug: 1 }, { unique: true })
blogPostSchema.index({ tags: 1 })
blogPostSchema.index({ title: 'text', content: 'text', excerpt: 'text' })

// Middleware pour générer le slug automatiquement
blogPostSchema.pre('save', async function(next) {
  if (this.isModified('title') && !this.isModified('slug')) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
    
    let slug = baseSlug
    let counter = 1
    
    // Vérifier l'unicité du slug
    while (await mongoose.model('BlogPost').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    this.slug = slug
  }
  
  // Calculer le temps de lecture (environ 200 mots par minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length
    this.readTime = Math.ceil(wordCount / 200)
  }
  
  // Mettre à jour la date de publication
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }
  
  next()
})

// Méthode pour incrémenter les vues
blogPostSchema.methods.incrementViews = function() {
  this.views += 1
  return this.save()
}

// Méthode pour incrémenter les likes
blogPostSchema.methods.incrementLikes = function() {
  this.likes += 1
  return this.save()
}

// Méthode pour décrémenter les likes
blogPostSchema.methods.decrementLikes = function() {
  if (this.likes > 0) {
    this.likes -= 1
  }
  return this.save()
}

// Méthode pour publier un article
blogPostSchema.methods.publish = function() {
  this.status = 'published'
  if (!this.publishedAt) {
    this.publishedAt = new Date()
  }
  return this.save()
}

// Méthode pour archiver un article
blogPostSchema.methods.archive = function() {
  this.status = 'archived'
  return this.save()
}

// Méthode statique pour obtenir les articles publiés
blogPostSchema.statics.getPublished = function(limit?: number, skip?: number) {
  return this.find({ status: 'published' })
    .populate('author', 'firstName lastName')
    .sort({ publishedAt: -1 })
    .limit(limit || 10)
    .skip(skip || 0)
}

// Méthode statique pour rechercher des articles
blogPostSchema.statics.search = function(query: string, limit?: number) {
  return this.find({
    $and: [
      { status: 'published' },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { excerpt: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  })
    .populate('author', 'firstName lastName')
    .sort({ publishedAt: -1 })
    .limit(limit || 10)
}

// Méthode statique pour obtenir les articles par tag
blogPostSchema.statics.getByTag = function(tag: string, limit?: number) {
  return this.find({ status: 'published', tags: tag })
    .populate('author', 'firstName lastName')
    .sort({ publishedAt: -1 })
    .limit(limit || 10)
}

export default mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', blogPostSchema)