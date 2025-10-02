import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import HeroSection from '@/models/HeroSection'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/hero - Fetch active hero section data
export async function GET() {
  try {
    await dbConnect()
    
    let heroData = await HeroSection.findOne({ isActive: true })
    
    // If no hero data exists, seed with defaults
    if (!heroData) {
      heroData = await HeroSection.seedDefault()
    }
    
    return NextResponse.json({
      success: true,
      data: heroData
    })
  } catch (error) {
    console.error('Hero GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hero data' },
      { status: 500 }
    )
  }
}

// PUT /api/hero - Update hero section data (Admin only)
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
      badge,
      heading,
      introduction,
      cta,
      socialLinks,
      profile
    } = body

    // Validate required fields
    if (!badge?.text || !heading?.line1 || !heading?.line2 || !heading?.line3) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Sort social links by order
    if (socialLinks && Array.isArray(socialLinks)) {
      socialLinks.sort((a, b) => (a.order || 0) - (b.order || 0))
    }

    // Find active hero section or create new one
    let heroData = await HeroSection.findOne({ isActive: true })
    
    if (heroData) {
      // Update existing
      Object.assign(heroData, {
        badge,
        heading,
        introduction,
        cta,
        socialLinks: socialLinks || heroData.socialLinks,
        profile
      })
      await heroData.save()
    } else {
      // Create new
      heroData = new HeroSection({
        badge,
        heading,
        introduction,
        cta,
        socialLinks: socialLinks || [],
        profile,
        isActive: true
      })
      await heroData.save()
    }

    return NextResponse.json({
      success: true,
      data: heroData,
      message: 'Hero section updated successfully'
    })
  } catch (error) {
    console.error('Hero PUT Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update hero data' },
      { status: 500 }
    )
  }
}

// POST /api/hero/preview - Preview hero changes without saving
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Return the preview data without saving to database
    return NextResponse.json({
      success: true,
      data: body,
      preview: true
    })
  } catch (error) {
    console.error('Hero Preview Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
