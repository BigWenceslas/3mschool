import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'
import { connectMongoDB } from '@/lib/mongodb'
import Config from '@/lib/models/Config'
import { DEFAULT_AMOUNTS } from '@/lib/currency'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    await connectMongoDB()

    // Récupérer tous les paramètres de configuration
    const configs = await Config.find({})
    
    const settings = {
      coursePriceDefault: DEFAULT_AMOUNTS.COURSE_PRICE,
      annualRegistrationDefault: DEFAULT_AMOUNTS.ANNUAL_REGISTRATION,
      currentYear: new Date().getFullYear()
    }

    // Appliquer les valeurs configurées
    for (const config of configs) {
      switch (config.key) {
        case 'tarif_cours':
          settings.coursePriceDefault = config.value
          break
        case 'tarif_inscription_annuelle':
          settings.annualRegistrationDefault = config.value
          break
        case 'annee_exercice':
          settings.currentYear = config.value
          break
      }
    }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const csrf = requireCSRF(request)
    if ('error' in csrf) {
      return csrf.error
    }

    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    // Only admin can update settings
    if (auth.user.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Accès refusé - permissions administrateur requises' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await connectMongoDB()

    const body = await request.json()
    const { coursePriceDefault, annualRegistrationDefault, currentYear } = body

    // Valider les données
    if (coursePriceDefault && (coursePriceDefault < 0 || coursePriceDefault > 1000000)) {
      return NextResponse.json(
        { error: 'Le prix par cours doit être entre 0 et 1,000,000 FCFA' },
        { status: 400 }
      )
    }

    if (annualRegistrationDefault && (annualRegistrationDefault < 0 || annualRegistrationDefault > 1000000)) {
      return NextResponse.json(
        { error: 'Le prix de l\'inscription annuelle doit être entre 0 et 1,000,000 FCFA' },
        { status: 400 }
      )
    }

    const currentYearInt = new Date().getFullYear()
    if (currentYear && (currentYear < currentYearInt - 1 || currentYear > currentYearInt + 5)) {
      return NextResponse.json(
        { error: 'L\'année d\'exercice doit être valide' },
        { status: 400 }
      )
    }

    // Mettre à jour les paramètres
    const updates = []
    
    if (coursePriceDefault !== undefined) {
      updates.push(
        Config.findOneAndUpdate(
          { key: 'tarif_cours' },
          { key: 'tarif_cours', value: coursePriceDefault, updatedAt: new Date() },
          { upsert: true, new: true }
        )
      )
    }

    if (annualRegistrationDefault !== undefined) {
      updates.push(
        Config.findOneAndUpdate(
          { key: 'tarif_inscription_annuelle' },
          { key: 'tarif_inscription_annuelle', value: annualRegistrationDefault, updatedAt: new Date() },
          { upsert: true, new: true }
        )
      )
    }

    if (currentYear !== undefined) {
      updates.push(
        Config.findOneAndUpdate(
          { key: 'annee_exercice' },
          { key: 'annee_exercice', value: currentYear, updatedAt: new Date() },
          { upsert: true, new: true }
        )
      )
    }

    await Promise.all(updates)

    return NextResponse.json({
      message: 'Paramètres mis à jour avec succès'
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    )
  }
}