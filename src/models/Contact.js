/**
 * @fileoverview MongoDB model for contact form submissions.
 * Stores contact form data including client information, project requirements,
 * and message content. Includes status tracking for workflow management.
 *
 * This model supports the contact form functionality with:
 * - Client contact information and project requirements
 * - Status workflow for managing inquiries (new → read → replied → archived)
 * - IP address and user agent tracking for analytics
 * - Automatic timestamp tracking for response time monitoring
 * - Integration with admin dashboard for inquiry management
 *
 * @example
 * ```js
 * import Contact from '@/models/Contact';
 * import dbConnect from '@/lib/dbConnect';
 *
 * // Create new contact submission
 * const contact = new Contact({
 *   name: 'John Smith',
 *   email: 'john@example.com',
 *   projectType: 'E-commerce Website',
 *   message: 'I need a modern e-commerce website for my business...',
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
 * });
 *
 * await contact.save();
 *
 * // Get unread contacts for admin dashboard
 * const unreadContacts = await Contact.find({ status: 'new' })
 *   .sort({ createdAt: -1 })
 *   .limit(10);
 *
 * // Update contact status after responding
 * contact.status = 'replied';
 * await contact.save();
 *
 * // Archive old contacts
 * await Contact.updateMany(
 *   { createdAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
 *   { status: 'archived' }
 * );
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Contact model.
 * Stores contact form submissions with client information, project details,
 * and workflow status tracking for effective inquiry management.
 *
 * @typedef {Object} Contact
 * @property {string} name - Client's full name (required)
 * @property {string} email - Client's email address for follow-up communication (required)
 * @property {string} projectType - Type of project or service requested (required)
 * @property {string} message - Detailed project description and requirements (required)
 * @property {'new'|'read'|'replied'|'archived'} [status='new'] - Current status in workflow
 * @property {string} [ipAddress] - Client's IP address for analytics (optional)
 * @property {string} [userAgent] - Client's browser/device info for analytics (optional)
 * @property {Date} createdAt - Auto-generated submission timestamp
 * @property {Date} updatedAt - Auto-generated last update timestamp
 */

/**
 * Enumeration of possible contact statuses for workflow management.
 * Provides a clear progression path for handling client inquiries.
 *
 * @enum {string}
 * @readonly
 * @property {'new'} NEW - Fresh contact submission requiring attention
 * @property {'read'} READ - Contact has been reviewed by admin
 * @property {'replied'} REPLIED - Response has been sent to client
 * @property {'archived'} ARCHIVED - Contact archived for record keeping
 */
const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    projectType: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
