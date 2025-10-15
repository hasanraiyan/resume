/**
 * @fileoverview API routes for statistics section management.
 * Handles fetching and updating homepage statistics content including
 * animated counters and achievement metrics. Includes admin authentication.
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import StatsSection from '@/models/StatsSection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Handles GET requests to fetch the active statistics section data.
 * Retrieves the currently active stats section from the database.
 * If no stats section exists, automatically seeds default content.
 *
 * @async
 * @function GET
 * @returns {Promise<NextResponse>} JSON response with stats section data or error message
 *
 * @example
 * ```js
 * // Fetch stats section data
 * GET /api/stats
 *
 * // Response:
 * // {
 * //   "success": true,
 * //   "data": {
 * //     "heading": {
 * //       "title": "Our Achievements",
 * //       "description": "Numbers that speak for themselves"
 * //     },
 * //     "stats": [
 * //       {
 * //         "id": 1,
 * //         "number": "180+",
 * //         "label": "Projects Completed",
 * //         "icon": "fas fa-project-diagram",
 * //         "description": "Successfully delivered projects"
 * //       }
 * //     ],
 * //     "animation": {
 * //       "countUp": true,
 * //       "duration": 2000
 * //     },
 * //     "isActive": true
 * //   }
 * // }
 * ```
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for successful requests
 * @response {Object} data - Stats section document with all content fields
 * @response {Object} data.heading - Section heading configuration
 * @response {string} data.heading.title - Main heading text
 * @response {string} data.heading.description - Subtitle/description text
 * @response {Array} data.stats - Array of statistical counter objects
 * @response {Object} data.animation - Animation settings for counters
 * @response {boolean} data.animation.countUp - Whether to animate counting up
 * @response {number} data.animation.duration - Animation duration in milliseconds
 * @response {boolean} data.isActive - Whether section is currently active
 *
 * @response {Object} Error response
 * @response {boolean} success - Always false for error responses
 * @response {string} error - Error message describing what went wrong
 *
 * @error {500} Internal Server Error - Database connection or query failure
 *
 * @see {@link StatsSection.seedDefault} for default content structure
 */
export async function GET() {
  try {
    await dbConnect();

    let statsData = await StatsSection.findOne({ isActive: true });

    // If no stats data exists, seed with defaults
    if (!statsData) {
      statsData = await StatsSection.seedDefault();
    }

    return NextResponse.json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    console.error('Stats GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats data' },
      { status: 500 }
    );
  }
}

/**
 * Handles PUT requests to update statistics section data (Admin only).
 * Updates the active stats section with new content. Requires admin authentication.
 * Creates a new stats section if none exists, or updates the existing active one.
 *
 * @async
 * @function PUT
 * @param {Request} request - Next.js request object containing stats section data
 * @returns {Promise<NextResponse>} JSON response with updated stats data or error message
 *
 * @example
 * ```js
 * // Update stats section content
 * PUT /api/stats
 * {
 *   "heading": {
 *     "title": "Our Impact",
 *     "description": "Measurable results that matter"
 *   },
 *   "stats": [
 *     {
 *       "id": 1,
 *       "number": "200+",
 *       "label": "Projects Completed",
 *       "icon": "fas fa-project-diagram",
 *       "description": "Successfully delivered projects"
 *     },
 *     {
 *       "id": 2,
 *       "number": "95+",
 *       "label": "Happy Clients",
 *       "icon": "fas fa-smile",
 *       "description": "Satisfied clients worldwide"
 *     }
 *   ],
 *   "animation": {
 *     "countUp": true,
 *     "duration": 3000
 *   }
 * }
 * ```
 *
 * @requestBody {Object} statsData - Complete stats section configuration
 * @requestBody {Object} statsData.heading - Section heading configuration (required)
 * @requestBody {string} statsData.heading.title - Main heading text (required)
 * @requestBody {string} statsData.heading.description - Subtitle/description text (required)
 * @requestBody {Array} statsData.stats - Array of statistical counter objects (required)
 * @requestBody {number} statsData.stats[].id - Unique identifier for the stat item
 * @requestBody {string} statsData.stats[].number - Display number/value (e.g., '180+', '75+')
 * @requestBody {string} statsData.stats[].label - Label describing what the number represents
 * @requestBody {string} statsData.stats[].icon - CSS icon class for the stat item
 * @requestBody {string} statsData.stats[].description - Detailed explanation of the statistic
 * @requestBody {Object} [statsData.animation] - Animation settings for counters (optional)
 * @requestBody {boolean} [statsData.animation.countUp=true] - Whether to animate counting up
 * @requestBody {number} [statsData.animation.duration=2000] - Animation duration in milliseconds
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for successful updates
 * @response {Object} data - Updated stats section document
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
 * @validation Validates required fields: heading.title, heading.description, stats (must be non-empty array)
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
    const { heading, stats, animation } = body;

    // Validate required fields
    if (!heading?.title || !heading?.description || !stats || !Array.isArray(stats)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find active stats section or create new one
    let statsData = await StatsSection.findOne({ isActive: true });

    if (statsData) {
      // Update existing
      Object.assign(statsData, {
        heading,
        stats,
        animation,
      });
      await statsData.save();
    } else {
      // Create new
      statsData = new StatsSection({
        heading,
        stats,
        animation,
        isActive: true,
      });
      await statsData.save();
    }

    return NextResponse.json({
      success: true,
      data: statsData,
      message: 'Stats section updated successfully',
    });
  } catch (error) {
    console.error('Stats PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update stats data' },
      { status: 500 }
    );
  }
}
