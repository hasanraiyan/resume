/**
 * @fileoverview API routes for hero section management.
 * Handles fetching, updating, and previewing homepage hero section content.
 * Includes authentication checks for admin-only operations.
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/dbConnect';
import HeroSection from '@/models/HeroSection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Handles GET requests to fetch the active hero section data.
 * Retrieves the currently active hero section from the database.
 * If no hero section exists, automatically seeds default content.
 *
 * @async
 * @function GET
 * @returns {Promise<NextResponse>} JSON response with hero section data or error message
 *
 * @example
 * ```js
 * // Fetch hero section data
 * GET /api/hero
 *
 * // Response:
 * // {
 * //   "success": true,
 * //   "data": {
 * //     "badge": { "text": "CREATIVE DEVELOPER" },
 * //     "heading": { "line1": "Crafting", "line2": "Digital", "line3": "Excellence" },
 * //     "introduction": { "text": "...", "name": "John Doe", "role": "developer" },
 * //     "cta": { "primary": {...}, "secondary": {...} },
 * //     "socialLinks": [...],
 * //     "profile": {...},
 * //     "isActive": true
 * //   }
 * // }
 * ```
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for successful requests
 * @response {Object} data - Hero section document with all content fields
 * @response {Object} data.badge - Badge configuration object
 * @response {string} data.badge.text - Badge text content
 * @response {Object} data.heading - Three-line heading configuration
 * @response {string} data.heading.line1 - First line of heading
 * @response {string} data.heading.line2 - Second line of heading
 * @response {string} data.heading.line3 - Third line of heading
 * @response {Object} data.introduction - Introduction text and name/role
 * @response {Object} data.cta - Call-to-action buttons configuration
 * @response {Array} data.socialLinks - Social media links array
 * @response {Object} data.profile - Profile image and badge configuration
 * @response {boolean} data.isActive - Whether section is currently active
 *
 * @response {Object} Error response
 * @response {boolean} success - Always false for error responses
 * @response {string} error - Error message describing what went wrong
 *
 * @error {500} Internal Server Error - Database connection or query failure
 *
 * @see {@link HeroSection.seedDefault} for default content structure
 */
export async function GET() {
  try {
    await dbConnect();

    let heroData = await HeroSection.findOne({ isActive: true });

    // If no hero data exists, seed with defaults
    if (!heroData) {
      heroData = await HeroSection.seedDefault();
    }

    return NextResponse.json({
      success: true,
      data: heroData,
    });
  } catch (error) {
    console.error('Hero GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hero data' },
      { status: 500 }
    );
  }
}

/**
 * Handles PUT requests to update hero section data (Admin only).
 * Updates the active hero section with new content. Requires admin authentication.
 * Creates a new hero section if none exists, or updates the existing active one.
 *
 * @async
 * @function PUT
 * @param {Request} request - Next.js request object containing hero section data
 * @returns {Promise<NextResponse>} JSON response with updated hero data or error message
 *
 * @example
 * ```js
 * // Update hero section content
 * PUT /api/hero
 * {
 *   "badge": { "text": "SENIOR DEVELOPER" },
 *   "heading": {
 *     "line1": "Building",
 *     "line2": "Amazing",
 *     "line3": "Experiences"
 *   },
 *   "introduction": {
 *     "text": "I create digital solutions that matter...",
 *     "name": "Jane Smith",
 *     "role": "senior developer"
 *   },
 *   "cta": {
 *     "primary": { "text": "View Portfolio", "link": "#work" },
 *     "secondary": { "text": "Get In Touch", "link": "#contact" }
 *   },
 *   "socialLinks": [
 *     { "name": "GitHub", "url": "https://github.com/jane", "icon": "fab fa-github", "order": 1 }
 *   ],
 *   "profile": {
 *     "image": { "url": "https://example.com/profile.jpg", "alt": "Profile photo" },
 *     "badge": { "value": "10+", "label": "Years Experience" }
 *   }
 * }
 * ```
 *
 * @requestBody {Object} heroData - Complete hero section configuration
 * @requestBody {Object} heroData.badge - Badge configuration object
 * @requestBody {string} heroData.badge.text - Badge text content (required)
 * @requestBody {Object} heroData.heading - Three-line heading configuration (required)
 * @requestBody {string} heroData.heading.line1 - First line of heading (required)
 * @requestBody {string} heroData.heading.line2 - Second line of heading (required)
 * @requestBody {string} heroData.heading.line3 - Third line of heading (required)
 * @requestBody {Object} [heroData.introduction] - Introduction text and name/role
 * @requestBody {Object} [heroData.cta] - Call-to-action buttons configuration
 * @requestBody {Array} [heroData.socialLinks] - Social media links array (auto-sorted by order)
 * @requestBody {Object} [heroData.profile] - Profile image and badge configuration
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for successful updates
 * @response {Object} data - Updated hero section document
 * @response {string} message - Success message
 *
 * @response {Object} Error response
 * @response {boolean} success - Always false for error responses
 * @response {string} error - Error message describing what went wrong
 *
 * @error {401} Unauthorized - User is not authenticated or not an admin
 * @error {400} Bad Request - Missing required fields in request body
 * @error {500} Internal Server Error - Database connection or update failure
 *
 * @security Admin-only endpoint requiring valid session with admin role
 * @validation Validates required fields: badge.text, heading.line1, heading.line2, heading.line3
 */
export async function PUT(request) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { badge, heading, introduction, cta, socialLinks, profile } = body;

    // Validate required fields
    if (!badge?.text || !heading?.line1 || !heading?.line2 || !heading?.line3) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Sort social links by order
    if (socialLinks && Array.isArray(socialLinks)) {
      socialLinks.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // Find active hero section or create new one
    let heroData = await HeroSection.findOne({ isActive: true });

    if (heroData) {
      // Update existing
      Object.assign(heroData, {
        badge,
        heading,
        introduction,
        cta,
        socialLinks: socialLinks || heroData.socialLinks,
        profile,
      });
      await heroData.save();
    } else {
      // Create new
      heroData = new HeroSection({
        badge,
        heading,
        introduction,
        cta,
        socialLinks: socialLinks || [],
        profile,
        isActive: true,
      });
      await heroData.save();
    }

    revalidatePath('/');

    return NextResponse.json({
      success: true,
      data: heroData,
      message: 'Hero section updated successfully',
    });
  } catch (error) {
    console.error('Hero PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update hero data' },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to preview hero section changes without saving (Admin only).
 * Allows administrators to preview hero section changes in real-time before committing
 * them to the database. Useful for admin interfaces that need live preview functionality.
 *
 * @async
 * @function POST
 * @param {Request} request - Next.js request object containing hero section preview data
 * @returns {Promise<NextResponse>} JSON response with preview data or error message
 *
 * @example
 * ```js
 * // Preview hero changes without saving
 * POST /api/hero/preview
 * {
 *   "badge": { "text": "NEW BADGE" },
 *   "heading": {
 *     "line1": "Preview",
 *     "line2": "Mode",
 *     "line3": "Testing"
 *   },
 *   "introduction": {
 *     "text": "This is a preview of changes...",
 *     "name": "Preview User",
 *     "role": "preview role"
 *   }
 * }
 *
 * // Response:
 * // {
 * //   "success": true,
 * //   "data": { ...preview data... },
 * //   "preview": true
 * // }
 * ```
 *
 * @requestBody {Object} previewData - Hero section configuration for preview
 * @requestBody {Object} [previewData.badge] - Badge configuration for preview
 * @requestBody {Object} [previewData.heading] - Heading configuration for preview
 * @requestBody {Object} [previewData.introduction] - Introduction configuration for preview
 * @requestBody {Object} [previewData.cta] - CTA buttons configuration for preview
 * @requestBody {Array} [previewData.socialLinks] - Social links for preview
 * @requestBody {Object} [previewData.profile] - Profile configuration for preview
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for successful preview generation
 * @response {Object} data - Preview data exactly as submitted
 * @response {boolean} preview - Always true to indicate this is preview mode
 *
 * @response {Object} Error response
 * @response {boolean} success - Always false for error responses
 * @response {string} error - Error message describing what went wrong
 *
 * @error {401} Unauthorized - User is not authenticated or not an admin
 * @error {500} Internal Server Error - Preview generation failure
 *
 * @note This endpoint does not modify database content - it only returns preview data
 * @security Admin-only endpoint requiring valid session with admin role
 * @preview No database writes - safe for real-time preview functionality
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Return the preview data without saving to database
    return NextResponse.json({
      success: true,
      data: body,
      preview: true,
    });
  } catch (error) {
    console.error('Hero Preview Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
