import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import BlogPost from '@/lib/models/BlogPost'
import BlogComment from '@/lib/models/BlogComment'
import User from '@/lib/models/User'
import { requireAuth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'

// GET - Récupérer les commentaires d'un article
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectMongoDB()
    
    const post = await BlogPost.findOne({ slug: params.slug, status: 'published' })
    if (!post) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    const comments = await BlogComment.find({ 
      postId: post._id, 
      status: 'approved',
      parentComment: null 
    })
      .populate('author', 'firstName lastName')
      .populate({
        path: 'replies',
        match: { status: 'approved' },
        populate: { path: 'author', select: 'firstName lastName' },
        options: { sort: { createdAt: 1 } }
      })
      .sort({ createdAt: -1 })

    return NextResponse.json({ comments })

  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Ajouter un commentaire (Utilisateur connecté)
export async function POST(
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
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const post = await BlogPost.findOne({ slug: params.slug, status: 'published' })
    if (!post) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    const body = await request.json()
    const { content, parentComment } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ 
        error: 'Le contenu du commentaire est requis' 
      }, { status: 400 })
    }

    // Si c'est une réponse, vérifier que le commentaire parent existe
    if (parentComment) {
      const parent = await BlogComment.findById(parentComment)
      if (!parent || parent.postId.toString() !== post._id.toString()) {
        return NextResponse.json({ 
          error: 'Commentaire parent non trouvé' 
        }, { status: 404 })
      }
    }

    const comment = new BlogComment({
      postId: post._id,
      author: user._id,
      content: content.trim(),
      parentComment: parentComment || undefined,
      status: 'pending' // Les commentaires sont en attente de modération par défaut
    })

    await comment.save()
    await comment.populate('author', 'firstName lastName')

    // Ajouter le commentaire à la liste des commentaires du post
    if (!parentComment) {
      post.comments.push(comment._id)
      await post.save()
    }

    return NextResponse.json({ 
      message: 'Commentaire ajouté avec succès. Il sera visible après modération.',
      comment 
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}