import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import BlogPost from '@/lib/models/BlogPost'
import User from '@/lib/models/User'
import { requireAuth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'

// POST - Liker/unliker un article
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
    const { action } = body // 'like' ou 'unlike'

    if (action === 'like') {
      await post.incrementLikes()
      return NextResponse.json({ 
        message: 'Article liké',
        likes: post.likes
      })
    } else if (action === 'unlike') {
      await post.decrementLikes()
      return NextResponse.json({ 
        message: 'Like retiré',
        likes: post.likes
      })
    } else {
      return NextResponse.json({ 
        error: 'Action non valide. Utilisez "like" ou "unlike"' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Erreur lors du like/unlike:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}