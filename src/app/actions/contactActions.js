/**
 * @fileoverview Contact form actions for handling contact submissions, Telegram notifications, and contact management.
 * Provides server-side functions for creating, retrieving, updating, and deleting contact submissions.
 */

'use server';

import dbConnect from '@/lib/dbConnect';
import Contact from '@/models/Contact';
import TelegramSettings from '@/models/TelegramSettings';
import { decrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

// Simple in-memory rate limiting for server actions
const contactRateLimitMap = new Map();

/**
 * Rate limiting logic for contact submissions
 */
function checkRateLimit(ip) {
  const maxRequests = 3;
  const windowMs = 60000; // 1 minute
  const now = Date.now();
  const windowStart = now - windowMs;

  let rateLimitData = contactRateLimitMap.get(ip);

  if (!rateLimitData) {
    rateLimitData = { requests: [], blocked: false, blockUntil: 0 };
    contactRateLimitMap.set(ip, rateLimitData);
  }

  // Clean old requests
  rateLimitData.requests = rateLimitData.requests.filter((timestamp) => timestamp > windowStart);

  // Check block status
  if (rateLimitData.blocked && now < rateLimitData.blockUntil) {
    return false;
  }

  // Check if over limit
  if (rateLimitData.requests.length >= maxRequests) {
    rateLimitData.blocked = true;
    rateLimitData.blockUntil = now + 5 * 60 * 1000; // Block for 5 minutes
    return false;
  }

  rateLimitData.requests.push(now);

  // Clean up old entries
  if (contactRateLimitMap.size > 1000) {
    for (const [key, data] of contactRateLimitMap.entries()) {
      if (data.requests.length === 0 && !data.blocked) {
        contactRateLimitMap.delete(key);
      }
    }
  }

  return true;
}

/**
 * Sends a Telegram notification for new contact submissions.
 * Uses encrypted bot token and chat ID from TelegramSettings to send formatted message.
 * Logs errors but doesn't throw them to avoid breaking form submission flow.
 *
 * @param {Object} contactData - Contact form data containing name, email, projectType, and message
 * @param {string} contactData.name - Name of the person submitting the form
 * @param {string} contactData.email - Email address of the submitter
 * @param {string} contactData.projectType - Type of project inquiry
 * @param {string} contactData.message - Message content from the form
 */
async function sendTelegramNotification(contactData) {
  try {
    const settings = await TelegramSettings.findOne({ isEnabled: true }).lean();
    if (!settings || !settings.botToken || !settings.chatId) {
      return;
    }

    const botToken = decrypt(settings.botToken);
    if (!botToken) {
      console.error('Failed to decrypt bot token.');
      return;
    }

    // Format the message using Telegram's MarkdownV2 syntax
    const message = `
*New Contact Message* 📩

*Name:* ${contactData.name.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1')}
*Email:* ${contactData.email.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1')}
*Project Type:* \`${contactData.projectType}\`

*Message:*
${contactData.message.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1')}
    `.trim();

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.chatId,
        text: message,
        parse_mode: 'MarkdownV2',
      }),
    });
  } catch (error) {
    // IMPORTANT: Log the error, but don't throw it.
    // The form submission should still succeed even if the notification fails.
    console.error('Failed to send Telegram notification:', error);
  }
}

/**
 * Creates a new contact submission in the database and sends a Telegram notification.
 * Handles form data processing, database storage, cache revalidation, and notification sending.
 *
 * @param {FormData} formData - Form data containing name, email, projectType, message, and optional IP/user agent data
 * @returns {Object} Success or error object with message
 */
export async function createContactSubmission(formData) {
  await dbConnect();

  // Basic IP rate limiting
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return { success: false, message: 'Too many submissions. Please try again later.' };
  }

  try {
    const contactData = {
      name: formData.get('name'),
      email: formData.get('email'),
      projectType: formData.get('projectType'),
      message: formData.get('message'),
      // Optional: Add IP and User Agent for spam detection
      ipAddress: formData.get('ipAddress') || null,
      userAgent: formData.get('userAgent') || null,
    };

    const newContact = new Contact(contactData);
    await newContact.save();

    // Refresh admin pages
    revalidatePath('/admin/contacts');

    // ** NEW: Send Telegram notification **
    await sendTelegramNotification(contactData);

    return { success: true, message: 'Contact submission saved successfully.' };
  } catch (error) {
    console.error('Create Contact Error:', error);
    return { success: false, message: 'Failed to save contact submission.' };
  }
}

/**
 * Retrieves all contact submissions from the database, sorted by creation date in descending order.
 * Used in admin interfaces for displaying and managing contact submissions.
 * Serializes MongoDB ObjectIds and dates for client-side compatibility.
 *
 * @returns {Object} Object containing success status and array of serialized contact submissions, or error object
 */
export async function getAllContacts() {
  await dbConnect();

  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 }).lean();

    const serializedContacts = contacts.map((contact) => ({
      ...contact,
      _id: contact._id?.toString(),
      id: contact._id?.toString(),
      createdAt: contact.createdAt ? contact.createdAt.toISOString() : null,
      updatedAt: contact.updatedAt ? contact.updatedAt.toISOString() : null,
    }));

    return { success: true, contacts: serializedContacts };
  } catch (error) {
    console.error('Get Contacts Error:', error);
    return { success: false, contacts: [] };
  }
}

/**
 * Updates the status of a contact submission in the database.
 * Used for marking contacts as read, responded, or archived in the admin interface.
 * Triggers cache revalidation for admin pages to reflect the status change.
 *
 * @param {string} id - The MongoDB ObjectId of the contact to update
 * @param {string} status - The new status to assign to the contact
 * @returns {Object} Success or error object with message
 */
export async function updateContactStatus(id, status) {
  await dbConnect();

  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedContact) {
      return { success: false, message: 'Contact not found.' };
    }

    revalidatePath('/admin/contacts');
    revalidatePath('/admin/dashboard');
    return { success: true, message: 'Contact status updated successfully.' };
  } catch (error) {
    console.error('Update Contact Status Error:', error);
    return { success: false, message: 'Failed to update contact status.' };
  }
}

/**
 * Deletes a contact submission from the database by its ID.
 * Used for removing unwanted or spam contact submissions from the admin interface.
 * Triggers cache revalidation for admin pages to reflect the deletion.
 *
 * @param {string} id - The MongoDB ObjectId of the contact to delete
 * @returns {Object} Success or error object with message
 */
export async function deleteContact(id) {
  await dbConnect();

  try {
    const deletedContact = await Contact.findByIdAndDelete(id);

    if (!deletedContact) {
      return { success: false, message: 'Contact not found.' };
    }

    revalidatePath('/admin/contacts');
    revalidatePath('/admin/dashboard');
    return { success: true, message: 'Contact deleted successfully.' };
  } catch (error) {
    console.error('Delete Contact Error:', error);
    return { success: false, message: 'Failed to delete contact.' };
  }
}
