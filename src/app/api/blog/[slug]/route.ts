import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import BlogPost from '@/lib/models/BlogPost'
import BlogComment from '@/lib/models/BlogComment'
import User from '@/lib/models/User'
import { requireAuth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'

// GET - Récupérer un article spécifique par slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectMongoDB()
    
    // Ensure BlogComment model is registered
    BlogComment
    
    const { searchParams } = new URL(request.url)
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true'
    
    let query: any = { slug: params.slug }
    
    // Si ce n'est pas un admin, ne montrer que les articles publiés
    if (!includeUnpublished) {
      query.status = 'published'
    }

    const post = await BlogPost.findOne(query)
      .populate('author', 'firstName lastName email')
      .populate({
        path: 'comments',
        match: { status: 'approved' },
        populate: { 
          path: 'author', 
          select: 'firstName lastName'
        },
        options: { sort: { createdAt: -1 } }
      })

    if (!post) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    // Incrémenter les vues pour les articles publiés
    if (post.status === 'published') {
      await post.incrementViews()
    }

    return NextResponse.json({ post })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un article (Admin seulement)
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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

    const post = await BlogPost.findOne({ slug: params.slug })
    if (!post) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    // Mettre à jour les champs modifiés
    if (title !== undefined) post.title = title
    if (content !== undefined) post.content = content
    if (excerpt !== undefined) post.excerpt = excerpt
    if (status !== undefined) post.status = status
    if (tags !== undefined) post.tags = tags
    if (featuredImage !== undefined) post.featuredImage = featuredImage

    await post.save()
    await post.populate('author', 'firstName lastName email')

    return NextResponse.json({ 
      message: 'Article mis à jour avec succès',
      post 
    })

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'article:', error)
    
    if (error.code === 11000 && error.keyPattern?.slug) {
      return NextResponse.json({ 
        error: 'Un article avec ce slug existe déjà' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un article (Admin seulement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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

    const post = await BlogPost.findOneAndDelete({ slug: params.slug })
    if (!post) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Article supprimé avec succès' })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}