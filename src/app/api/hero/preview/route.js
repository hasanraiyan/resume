import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// POST /api/hero/preview - Generate preview data
export async function POST(request) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate basic structure
    const previewData = {
      badge: body.badge || { text: 'CREATIVE DEVELOPER' },
      heading: body.heading || { line1: 'Crafting', line2: 'Digital', line3: 'Excellence' },
      introduction: body.introduction || { 
        text: "I'm John Doe, a creative developer focused on building beautiful and functional digital experiences that make a difference.",
        name: 'John Doe',
        role: 'creative developer'
      },
      cta: body.cta || {
        primary: { text: 'View My Work', link: '#work' },
        secondary: { text: 'Contact Me', link: '#contact' }
      },
      socialLinks: body.socialLinks || [],
      profile: body.profile || {
        image: { 
          url: 'https://api.dicebear.com/7.x/personas/svg?seed=Creative',
          alt: 'Portrait'
        },
        badge: { value: '5+', label: 'Years Experience' }
      },
      isPreview: true,
      previewTimestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: previewData,
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
