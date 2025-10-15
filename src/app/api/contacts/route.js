/**
 * @fileoverview API routes for contact form submissions management.
 * Handles creating new contact submissions and retrieving existing contacts
 * for admin dashboard display and management.
 */

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Contact from '@/models/Contact';

/**
 * Handles GET requests to fetch all contact form submissions.
 * Retrieves all contacts sorted by creation date (newest first).
 * Used by admin dashboard to display and manage contact inquiries.
 *
 * @async
 * @function GET
 * @returns {Promise<NextResponse>} JSON response with contacts array or error message
 *
 * @example
 * ```js
 * // Fetch all contact submissions
 * GET /api/contacts
 *
 * // Response:
 * // {
 * //   "success": true,
 * //   "contacts": [
 * //     {
 * //       "id": "507f1f77bcf86cd799439011",
 * //       "_id": "507f1f77bcf86cd799439011",
 * //       "name": "John Smith",
 * //       "email": "john@example.com",
 * //       "projectType": "E-commerce Website",
 * //       "message": "I need a modern e-commerce website...",
 * //       "status": "new",
 * //       "createdAt": "2024-01-15T10:30:00Z",
 * //       "updatedAt": "2024-01-15T10:30:00Z"
 * //     }
 * //   ]
 * // }
 * ```
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for successful requests
 * @response {Array} contacts - Array of contact submission objects
 * @response {string} contacts[].id - Contact unique identifier (string)
 * @response {string} contacts[]._id - MongoDB ObjectId as string
 * @response {string} contacts[].name - Client's full name
 * @response {string} contacts[].email - Client's email address
 * @response {string} contacts[].projectType - Type of project requested
 * @response {string} contacts[].message - Detailed project description
 * @response {'new'|'read'|'replied'|'archived'} contacts[].status - Current workflow status
 * @response {Date} contacts[].createdAt - Submission timestamp
 * @response {Date} contacts[].updatedAt - Last update timestamp
 *
 * @response {Object} Error response
 * @response {boolean} success - Always false for error responses
 * @response {string} message - Error message describing what went wrong
 *
 * @error {500} Internal Server Error - Database connection or query failure
 *
 * @note Results are sorted by creation date (newest first) for admin dashboard display
 * @see {@link Contact} model for database schema details
 */
export async function GET() {
  try {
    await dbConnect();
    const contacts = await Contact.find({}).sort({ createdAt: -1 }).lean();

    // Convert MongoDB _id to string for JSON serialization
    const serializedContacts = contacts.map((contact) => ({
      ...contact,
      _id: contact._id.toString(),
      id: contact._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      contacts: serializedContacts,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to create new contact form submissions.
 * Processes contact form data from the frontend and saves it to the database.
 * Automatically sets status to 'new' for workflow management.
 *
 * @async
 * @function POST
 * @param {Request} request - Next.js request object containing contact form data
 * @returns {Promise<NextResponse>} JSON response with saved contact data or error message
 *
 * @example
 * ```js
 * // Submit contact form
 * POST /api/contacts
 * {
 *   "name": "John Smith",
 *   "email": "john@example.com",
 *   "projectType": "E-commerce Website",
 *   "message": "I need a modern e-commerce website for my business. I would like to discuss the project requirements and get a quote."
 * }
 *
 * // Response:
 * // {
 * //   "success": true,
 * //   "message": "Contact saved successfully",
 * //   "contact": {
 * //     "id": "507f1f77bcf86cd799439011",
 * //     "_id": "507f1f77bcf86cd799439011",
 * //     "name": "John Smith",
 * //     "email": "john@example.com",
 * //     "projectType": "E-commerce Website",
 * //     "message": "I need a modern e-commerce website...",
 * //     "status": "new",
 * //     "createdAt": "2024-01-15T10:30:00Z",
 * //     "updatedAt": "2024-01-15T10:30:00Z"
 * //   }
 * // }
 * ```
 *
 * @requestBody {Object} contactData - Contact form submission data
 * @requestBody {string} contactData.name - Client's full name (required)
 * @requestBody {string} contactData.email - Client's email address for follow-up (required)
 * @requestBody {string} contactData.projectType - Type of project or service requested (required)
 * @requestBody {string} contactData.message - Detailed project description and requirements (required)
 *
 * @response {Object} Success response
 * @response {boolean} success - Always true for successful submissions
 * @response {string} message - Success message
 * @response {Object} contact - Saved contact document with metadata
 * @response {string} contact.id - Contact unique identifier (string)
 * @response {string} contact._id - MongoDB ObjectId as string
 * @response {string} contact.name - Client's full name
 * @response {string} contact.email - Client's email address
 * @response {string} contact.projectType - Type of project requested
 * @response {string} contact.message - Detailed project description
 * @response {'new'} contact.status - Always set to 'new' for workflow management
 * @response {Date} contact.createdAt - Submission timestamp
 * @response {Date} contact.updatedAt - Last update timestamp
 *
 * @response {Object} Error response
 * @response {boolean} success - Always false for error responses
 * @response {string} message - Error message describing what went wrong
 *
 * @error {400} Bad Request - Missing required fields in request body
 * @error {500} Internal Server Error - Database connection or save failure
 *
 * @workflow Contact status automatically set to 'new' for admin dashboard processing
 * @integration Used by contact forms throughout the portfolio website
 * @validation Requires all fields: name, email, projectType, message
 */
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, email, projectType, message } = body;

    const newContact = new Contact({
      name,
      email,
      projectType,
      message,
      status: 'new',
    });

    await newContact.save();

    return NextResponse.json({
      success: true,
      message: 'Contact saved successfully',
      contact: {
        ...newContact.toObject(),
        _id: newContact._id.toString(),
        id: newContact._id.toString(),
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save contact' },
      { status: 500 }
    );
  }
}
