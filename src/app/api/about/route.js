import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import AboutSection from '@/models/AboutSection'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/about - Fetch active about section data
export async function GET() {
  try {
    await dbConnect()

    let aboutData = await AboutSection.findOne({ isActive: true })

    // If no about data exists, seed with defaults
    if (!aboutData) {
      aboutData = await AboutSection.seedDefault()
    }

    return NextResponse.json({
      success: true,
      data: aboutData
    })
  } catch (error) {
    console.error('About GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch about data' },
      { status: 500 }
    )
  }
}

// PUT /api/about - Update about section data (Admin only)
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
      sectionTitle,
      bio,
      resume,
      features
    } = body

    // Validate required fields
    if (!sectionTitle || !bio?.paragraphs || !Array.isArray(bio.paragraphs) || bio.paragraphs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find active about section or create new one
    let aboutData = await AboutSection.findOne({ isActive: true })

    if (aboutData) {
      // Update existing
      Object.assign(aboutData, {
        sectionTitle,
        bio,
        resume,
        features: features || aboutData.features
      })
      await aboutData.save()
    } else {
      // Create new
      aboutData = new AboutSection({
        sectionTitle,
        bio,
        resume,
        features: features || [],
        isActive: true
      })
      await aboutData.save()
    }

    return NextResponse.json({
      success: true,
      data: aboutData,
      message: 'About section updated successfully'
    })
  } catch (error) {
    console.error('About PUT Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update about data' },
      { status: 500 }
    )
  }
}
