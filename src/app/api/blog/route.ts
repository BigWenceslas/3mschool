import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import BlogPost from '@/lib/models/BlogPost'
import User from '@/lib/models/User'
import { requireAuth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'

// GET - Récupérer les articles de blog
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = parseInt(searchParams.get('skip') || '0')
    const author = searchParams.get('author')

    let query: any = {}
    
    // Filtre par statut (par défaut published pour les visiteurs)
    if (status) {
      query.status = status
    } else {
      query.status = 'published'
    }
    
    // Filtre par auteur
    if (author) {
      query.author = author
    }
    
    // Filtre par tag
    if (tag) {
      query.tags = tag
    }
    
    // Recherche textuelle
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    const posts = await BlogPost.find(query)
      .populate('author', 'firstName lastName email')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-content') // Exclure le contenu complet pour la liste

    // Compter le total pour la pagination
    const total = await BlogPost.countDocuments(query)

    return NextResponse.json({ 
      posts,
      total,
      hasMore: skip + limit < total
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouvel article (Admin seulement)
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    const csrf = requireCSRF(request)
    if ('error' in csrf) {
      return csrf.error
    }

    await connectMongoDB()
    
    const user = await User.findById(auth.user.userId)
    if (!user || auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, excerpt, status, tags, featuredImage } = body

    // Validation des champs requis
    if (!title || !content || !excerpt) {
      return NextResponse.json({ 
        error: 'Le titre, le contenu et l\'extrait sont requis' 
      }, { status: 400 })
    }

    const post = new BlogPost({
      title,
      content,
      excerpt,
      author: user._id,
      status: status || 'draft',
      tags: tags || [],
      featuredImage,
      ...(status === 'published' && { publishedAt: new Date() })
    })

    await post.save()
    await post.populate('author', 'firstName lastName email')

    return NextResponse.json({ 
      message: 'Article créé avec succès',
      post 
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de la création de l\'article:', error)
    
    if (error.code === 11000 && error.keyPattern?.slug) {
      return NextResponse.json({ 
        error: 'Un article avec ce slug existe déjà' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}