/**
 * @fileoverview API route for project management operations.
 * Handles fetching projects with filtering, sorting, and pagination capabilities.
 * Supports querying by featured status, category, and result limiting.
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';

/**
 * Handles GET requests to fetch projects from the database.
 * Supports filtering by featured status and category, with optional result limiting.
 *
 * @async
 * @function GET
 * @param {Request} request - Next.js request object containing URL search parameters
 * @returns {Promise<NextResponse>} JSON response with projects array or error message
 *
 * @example
 * ```js
 * // Get all projects
 * GET /api/projects
 *
 * // Get only featured projects
 * GET /api/projects?featured=true
 *
 * // Get projects by category
 * GET /api/projects?category=web-development
 *
 * // Get limited number of projects
 * GET /api/projects?limit=5
 *
 * // Combine filters
 * GET /api/projects?featured=true&category=e-commerce&limit=3
 * ```
 *
 * @query {string} [featured] - Filter for featured projects only ('true' to enable)
 * @query {string} [category] - Filter projects by category name
 * @query {string} [limit] - Maximum number of projects to return (integer)
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for successful requests
 * @response {Array} projects - Array of project objects with serialized _id
 * @response {string} projects[].id - Project unique identifier (string)
 * @response {string} projects[]._id - MongoDB ObjectId as string
 * @response {string} projects[].title - Project title
 * @response {string} projects[].slug - URL-friendly project identifier
 * @response {string} projects[].description - Project description
 * @response {string} projects[].category - Project category
 * @response {boolean} projects[].featured - Whether project is featured
 * @response {Object} projects[].links - Project links (live, github, etc.)
 * @response {Array} projects[].tags - Project tags array
 * @response {Date} projects[].createdAt - Project creation date
 * @response {Date} projects[].updatedAt - Project last update date
 *
 * @response {Object} Error response
 * @response {boolean} success - Always false for error responses
 * @response {string} message - Error message describing what went wrong
 *
 * @error {400} Bad Request - Invalid query parameters
 * @error {500} Internal Server Error - Database connection or query failure
 *
 * @throws {Error} When database connection fails
 * @throws {Error} When project query execution fails
 */
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    let query = {};

    if (featured === 'true') {
      query.featured = true;
    }

    if (category) {
      query.category = category;
    }

    let projectQuery = Project.find(query).sort({ createdAt: -1 });

    if (limit) {
      projectQuery = projectQuery.limit(parseInt(limit));
    }

    const projects = await projectQuery.lean();

    // Convert MongoDB _id to string for JSON serialization
    const serializedProjects = projects.map((project) => ({
      ...project,
      _id: project._id.toString(),
      id: project._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      projects: serializedProjects,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
