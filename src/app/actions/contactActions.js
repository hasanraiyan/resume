// src/app/actions/contactActions.js
'use server';

import dbConnect from '@/lib/dbConnect';
import Contact from '@/models/Contact';
import TelegramSettings from '@/models/TelegramSettings';
import { decrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

// Helper function to send notification
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

export async function createContactSubmission(formData) {
  await dbConnect();

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
