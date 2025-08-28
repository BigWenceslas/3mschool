import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Role from '@/lib/models/Role'

export async function GET() {
  try {
    await connectDB()
    const roles = await Role.find().sort({ createdAt: -1 })
    return NextResponse.json({ success: true, roles })
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { name, description, permissions, isActive } = body

    if (!name || !description) {
      return NextResponse.json(
        { success: false, message: 'Le nom et la description sont requis' },
        { status: 400 }
      )
    }

    const existingRole = await Role.findOne({ name: { $regex: new RegExp(name, 'i') } })
    if (existingRole) {
      return NextResponse.json(
        { success: false, message: 'Un rôle avec ce nom existe déjà' },
        { status: 400 }
      )
    }

    const role = new Role({
      name,
      description,
      permissions: permissions || [],
      isActive: isActive !== undefined ? isActive : true
    })

    await role.save()
    return NextResponse.json(
      { success: true, message: 'Rôle créé avec succès', role },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erreur lors de la création du rôle:', error)
    
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