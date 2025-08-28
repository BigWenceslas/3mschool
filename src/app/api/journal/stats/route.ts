import { NextRequest, NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import Journal from '@/lib/models/Journal'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'

// GET - Statistiques du journal
export async function GET(request: NextRequest) {
  try {
    await connectMongoDB()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    let dateFilter: any = {}
    if (fromDate || toDate) {
      dateFilter.date = {}
      if (fromDate) dateFilter.date.$gte = new Date(fromDate)
      if (toDate) dateFilter.date.$lte = new Date(toDate)
    }

    const matchCondition = { userId: user._id, ...dateFilter }

    // Statistiques générales
    const generalStats = await Journal.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalMeditation: { $sum: '$spiritualPractices.meditation' },
          totalPrayer: { $sum: '$spiritualPractices.prayer' },
          totalReading: { $sum: '$spiritualPractices.reading' },
          totalReflection: { $sum: '$spiritualPractices.reflection' },
          averageWordsPerEntry: { 
            $avg: { 
              $size: { 
                $split: ['$content', ' '] 
              } 
            } 
          }
        }
      }
    ])

    // Distribution des humeurs
    const moodDistribution = await Journal.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    // Statistiques mensuelles
    const monthlyStats = await Journal.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          entries: { $sum: 1 },
          totalPractice: {
            $sum: {
              $add: [
                { $ifNull: ['$spiritualPractices.meditation', 0] },
                { $ifNull: ['$spiritualPractices.prayer', 0] },
                { $ifNull: ['$spiritualPractices.reading', 0] },
                { $ifNull: ['$spiritualPractices.reflection', 0] }
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ])

    // Tags les plus utilisés
    const topTags = await Journal.aggregate([
      { $match: matchCondition },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    // Série temporelle des pratiques spirituelles (7 derniers jours)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const practiceTimeSeries = await Journal.aggregate([
      { 
        $match: { 
          userId: user._id, 
          date: { $gte: sevenDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          meditation: { $sum: '$spiritualPractices.meditation' },
          prayer: { $sum: '$spiritualPractices.prayer' },
          reading: { $sum: '$spiritualPractices.reading' },
          reflection: { $sum: '$spiritualPractices.reflection' }
        }
      },
      { $sort: { '_id': 1 } }
    ])

    // Objectifs de pratique (exemple: calculer si on atteint certains seuils)
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    
    const monthlyProgress = await Journal.aggregate([
      { 
        $match: { 
          userId: user._id, 
          date: { $gte: firstDayOfMonth } 
        } 
      },
      {
        $group: {
          _id: null,
          entriesThisMonth: { $sum: 1 },
          meditationThisMonth: { $sum: '$spiritualPractices.meditation' },
          prayerThisMonth: { $sum: '$spiritualPractices.prayer' },
          readingThisMonth: { $sum: '$spiritualPractices.reading' },
          reflectionThisMonth: { $sum: '$spiritualPractices.reflection' }
        }
      }
    ])

    const stats = generalStats[0] || {
      totalEntries: 0,
      totalMeditation: 0,
      totalPrayer: 0,
      totalReading: 0,
      totalReflection: 0,
      averageWordsPerEntry: 0
    }

    const progress = monthlyProgress[0] || {
      entriesThisMonth: 0,
      meditationThisMonth: 0,
      prayerThisMonth: 0,
      readingThisMonth: 0,
      reflectionThisMonth: 0
    }

    // Calculer les totaux
    const totalPracticeTime = stats.totalMeditation + stats.totalPrayer + 
                             stats.totalReading + stats.totalReflection

    return NextResponse.json({
      general: {
        ...stats,
        totalPracticeTime,
        averagePracticePerEntry: stats.totalEntries > 0 ? 
          Math.round(totalPracticeTime / stats.totalEntries) : 0
      },
      moodDistribution,
      monthlyStats,
      topTags: topTags.map(tag => ({
        name: tag._id,
        count: tag.count
      })),
      practiceTimeSeries,
      monthlyProgress: {
        ...progress,
        totalPracticeThisMonth: progress.meditationThisMonth + progress.prayerThisMonth + 
                               progress.readingThisMonth + progress.reflectionThisMonth,
        // Objectifs mensuels (exemple)
        goals: {
          entries: { target: 20, current: progress.entriesThisMonth },
          meditation: { target: 300, current: progress.meditationThisMonth }, // 5h/mois
          prayer: { target: 600, current: progress.prayerThisMonth }, // 10h/mois
          reading: { target: 180, current: progress.readingThisMonth }, // 3h/mois
          reflection: { target: 120, current: progress.reflectionThisMonth } // 2h/mois
        }
      }
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}