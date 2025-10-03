import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import StatsSection from '@/models/StatsSection'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/stats - Fetch active stats section data
export async function GET() {
  try {
    await dbConnect()

    let statsData = await StatsSection.findOne({ isActive: true })

    // If no stats data exists, seed with defaults
    if (!statsData) {
      statsData = await StatsSection.seedDefault()
    }

    return NextResponse.json({
      success: true,
      data: statsData
    })
  } catch (error) {
    console.error('Stats GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats data' },
      { status: 500 }
    )
  }
}

// PUT /api/stats - Update stats section data (Admin only)
export async function PUT(request) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const body = await request.json()
    const {
      heading,
      stats,
      animation
    } = body

    // Validate required fields
    if (!heading?.title || !heading?.description || !stats || !Array.isArray(stats)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find active stats section or create new one
    let statsData = await StatsSection.findOne({ isActive: true })

    if (statsData) {
      // Update existing
      Object.assign(statsData, {
        heading,
        stats,
        animation
      })
      await statsData.save()
    } else {
      // Create new
      statsData = new StatsSection({
        heading,
        stats,
        animation,
        isActive: true
      })
      await statsData.save()
    }

    return NextResponse.json({
      success: true,
      data: statsData,
      message: 'Stats section updated successfully'
    })
  } catch (error) {
    console.error('Stats PUT Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update stats data' },
      { status: 500 }
    )
  }
}
