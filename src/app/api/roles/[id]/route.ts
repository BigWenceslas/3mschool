import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Role from '@/lib/models/Role'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'ID de rôle invalide' },
        { status: 400 }
      )
    }

    const role = await Role.findById(params.id)
    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Rôle non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, role })
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'ID de rôle invalide' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, permissions, isActive } = body

    if (!name || !description) {
      return NextResponse.json(
        { success: false, message: 'Le nom et la description sont requis' },
        { status: 400 }
      )
    }

    // Vérifier si un autre rôle avec le même nom existe
    const existingRole = await Role.findOne({ 
      name: { $regex: new RegExp(name, 'i') },
      _id: { $ne: params.id }
    })
    if (existingRole) {
      return NextResponse.json(
        { success: false, message: 'Un rôle avec ce nom existe déjà' },
        { status: 400 }
      )
    }

    const role = await Role.findByIdAndUpdate(
      params.id,
      {
        name,
        description,
        permissions: permissions || [],
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    )

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Rôle non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Rôle mis à jour avec succès',
      role
    })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du rôle:', error)
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, message: 'Données invalides', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'ID de rôle invalide' },
        { status: 400 }
      )
    }

    const role = await Role.findByIdAndDelete(params.id)
    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Rôle non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Rôle supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la suppression du rôle:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}