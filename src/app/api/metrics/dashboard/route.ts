import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { connectMongoDB } from '@/lib/mongodb'
// Import all the models we need
import Course from '@/lib/models/Course'
import User from '@/lib/models/User'
import AnnualRegistration from '@/lib/models/AnnualRegistration'
import Enrollment from '@/lib/models/Enrollment'

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    // Only admins can view metrics
    if (auth.user.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Accès refusé' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await connectMongoDB()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - (now.getDay() || 7) + 1) // Start of current week (Monday)

    // 1. Donut Chart Data: Annual Registration Status
    const totalUsers = await User.countDocuments({ role: 'user' })
    const paidRegistrations = await AnnualRegistration.countDocuments({ 
      status: 'paid',
      year: now.getFullYear()
    })
    
    const annualRegistrationData = [
      { name: 'Payées', value: paidRegistrations, fill: '#10b981' },
      { name: 'Non payées', value: totalUsers - paidRegistrations, fill: '#ef4444' }
    ]

    // 2. Bar Chart Data: Attendance for last 6 courses
    const recentCourses = await Course.find({ status: { $in: ['completed', 'ongoing'] } })
      .sort({ date: -1 })
      .limit(6)
      .populate('instructor', 'name')

    const attendanceData = []
    for (const course of recentCourses) {
      const enrollments = await Enrollment.find({ courseId: course._id })
      const attendedCount = enrollments.filter(e => e.attended).length
      const totalEnrolled = enrollments.length
      
      attendanceData.push({
        name: course.title.length > 20 ? course.title.substring(0, 20) + '...' : course.title,
        présents: attendedCount,
        inscrits: totalEnrolled,
        date: course.date.toISOString().split('T')[0]
      })
    }

    // 3. Line Chart Data: Course payments evolution over 8-12 weeks
    const weeklyPayments = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(startOfWeek)
      weekStart.setDate(startOfWeek.getDate() - (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      // Count course payments in this week
      const coursesInWeek = await Course.find({
        date: { $gte: weekStart, $lte: weekEnd }
      })

      let weeklyPaymentCount = 0
      for (const course of coursesInWeek) {
        const paidEnrollments = await Enrollment.countDocuments({
          courseId: course._id,
          paymentStatus: 'paid'
        })
        weeklyPaymentCount += paidEnrollments
      }

      const weekLabel = `Sem ${Math.floor(i / 4) + 1}`
      weeklyPayments.push({
        name: weekLabel,
        paiements: weeklyPaymentCount,
        date: weekStart.toISOString().split('T')[0]
      })
    }

    // 4. Additional KPIs
    const coursesThisMonth = await Course.countDocuments({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    })

    // Calculate average attendance for this month
    const monthCourses = await Course.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $in: ['completed', 'ongoing'] }
    })

    let totalAttendanceRate = 0
    let courseCount = 0
    for (const course of monthCourses) {
      const enrollments = await Enrollment.find({ courseId: course._id })
      if (enrollments.length > 0) {
        const attendedCount = enrollments.filter(e => e.attended).length
        const rate = (attendedCount / enrollments.length) * 100
        totalAttendanceRate += rate
        courseCount++
      }
    }

    const averageAttendanceThisMonth = courseCount > 0 ? totalAttendanceRate / courseCount : 0

    // Calculate pending course payments
    const pendingPayments = await Enrollment.countDocuments({
      attended: true,
      paymentStatus: { $in: ['pending', 'unpaid'] }
    })

    return NextResponse.json({
      annualRegistrationChart: annualRegistrationData,
      attendanceChart: attendanceData.reverse(), // Most recent first
      paymentsEvolutionChart: weeklyPayments,
      kpis: {
        annualRegistrationPaymentRate: totalUsers > 0 ? Math.round((paidRegistrations / totalUsers) * 100) : 0,
        coursesThisMonth,
        averageAttendanceThisMonth: Math.round(averageAttendanceThisMonth),
        pendingCoursePayments: pendingPayments
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques' },
      { status: 500 }
    )
  }
}