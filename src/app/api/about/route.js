/**
 * @fileoverview API routes for about section management.
 * Handles fetching and updating about page content including biography,
 * resume information, and feature highlights. Includes admin authentication.
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AboutSection from '@/models/AboutSection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Handles GET requests to fetch the active about section data.
 * Retrieves the currently active about section from the database.
 * If no about section exists, automatically seeds default content.
 *
 * @async
 * @function GET
 * @returns {Promise<NextResponse>} JSON response with about section data or error message
 *
 * @example
 * ```js
 * // Fetch about section data
 * GET /api/about
 *
 * // Response:
 * // {
 * //   "success": true,
 * //   "data": {
 * //     "sectionTitle": "About Me",
 * //     "bio": {
 * //       "paragraphs": ["I'm a passionate developer...", "..."]
 * //     },
 * //     "resume": {
 * //       "text": "Download Resume",
 * //       "url": "https://example.com/resume.pdf"
 * //     },
 * //     "features": [
 * //       {
 * //         "id": 1,
 * //         "icon": "fas fa-lightbulb",
 * //         "title": "Creative",
 * //         "description": "Innovative solutions..."
 * //       }
 * //     ],
 * //     "isActive": true
 * //   }
 * // }
 * ```
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for successful requests
 * @response {Object} data - About section document with all content fields
 * @response {string} data.sectionTitle - Section heading text
 * @response {Object} data.bio - Biography configuration object
 * @response {string[]} data.bio.paragraphs - Array of biography paragraphs
 * @response {Object} data.resume - Resume download configuration
 * @response {string} data.resume.text - Resume download button text
 * @response {string} data.resume.url - Resume file URL
 * @response {Array} data.features - Array of feature highlight objects
 * @response {boolean} data.isActive - Whether section is currently active
 *
 * @response {Object} Error response
 * @response {boolean} success - Always false for error responses
 * @response {string} error - Error message describing what went wrong
 *
 * @error {500} Internal Server Error - Database connection or query failure
 *
 * @see {@link AboutSection.seedDefault} for default content structure
 */
export async function GET() {
  try {
    await dbConnect();

    let aboutData = await AboutSection.findOne({ isActive: true });

    // If no about data exists, seed with defaults
    if (!aboutData) {
      aboutData = await AboutSection.seedDefault();
    }

    return NextResponse.json({
      success: true,
      data: aboutData,
    });
  } catch (error) {
    console.error('About GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch about data' },
      { status: 500 }
    );
  }
}

/**
 * Handles PUT requests to update about section data (Admin only).
 * Updates the active about section with new content. Requires admin authentication.
 * Creates a new about section if none exists, or updates the existing active one.
 *
 * @async
 * @function PUT
 * @param {Request} request - Next.js request object containing about section data
 * @returns {Promise<NextResponse>} JSON response with updated about data or error message
 *
 * @example
 * ```js
 * // Update about section content
 * PUT /api/about
 * {
 *   "sectionTitle": "About Our Team",
 *   "bio": {
 *     "paragraphs": [
 *       "We are a passionate team of developers...",
 *       "Our mission is to create amazing digital experiences...",
 *       "We specialize in modern web technologies..."
 *     ]
 *   },
 *   "resume": {
 *     "text": "Download Company Profile",
 *     "url": "https://example.com/company-profile.pdf"
 *   },
 *   "features": [
 *     {
 *       "id": 1,
 *       "icon": "fas fa-users",
 *       "title": "Team Work",
 *       "description": "Collaborative approach to every project"
 *     },
 *     {
 *       "id": 2,
 *       "icon": "fas fa-innovation",
 *       "title": "Innovation",
 *       "description": "Cutting-edge solutions and technologies"
 *     }
 *   ]
 * }
 * ```
 *
 * @requestBody {Object} aboutData - Complete about section configuration
 * @requestBody {string} aboutData.sectionTitle - Section heading text (required)
 * @requestBody {Object} aboutData.bio - Biography configuration object (required)
 * @requestBody {string[]} aboutData.bio.paragraphs - Array of biography paragraphs (required, non-empty)
 * @requestBody {Object} [aboutData.resume] - Resume download configuration (optional)
 * @requestBody {string} [aboutData.resume.text] - Resume download button text
 * @requestBody {string} [aboutData.resume.url] - Resume file URL
 * @requestBody {Array} [aboutData.features] - Array of feature highlight objects (optional)
 * @requestBody {number} [aboutData.features[].id] - Unique identifier for the feature
 * @requestBody {string} [aboutData.features[].icon] - CSS icon class for the feature
 * @requestBody {string} [aboutData.features[].title] - Feature title/heading
 * @requestBody {string} [aboutData.features[].description] - Feature description text
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for successful updates
 * @response {Object} data - Updated about section document
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
 * @validation Validates required fields: sectionTitle, bio.paragraphs (must be non-empty array)
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
    const { sectionTitle, bio, resume, features } = body;

    // Validate required fields
    if (
      !sectionTitle ||
      !bio?.paragraphs ||
      !Array.isArray(bio.paragraphs) ||
      bio.paragraphs.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find active about section or create new one
    let aboutData = await AboutSection.findOne({ isActive: true });

    if (aboutData) {
      // Update existing
      Object.assign(aboutData, {
        sectionTitle,
        bio,
        resume,
        features: features || aboutData.features,
      });
      await aboutData.save();
    } else {
      // Create new
      aboutData = new AboutSection({
        sectionTitle,
        bio,
        resume,
        features: features || [],
        isActive: true,
      });
      await aboutData.save();
    }

    return NextResponse.json({
      success: true,
      data: aboutData,
      message: 'About section updated successfully',
    });
  } catch (error) {
    console.error('About PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update about data' },
      { status: 500 }
    );
  }
}
