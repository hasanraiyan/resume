// src/app/actions/contactActions.js
'use server';

import dbConnect from '@/lib/dbConnect';
import Contact from '@/models/Contact';
import { revalidatePath } from 'next/cache';

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
    return { success: true, contacts };
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
    return { success: true, message: 'Contact deleted successfully.' };

  } catch (error) {
    console.error('Delete Contact Error:', error);
    return { success: false, message: 'Failed to delete contact.' };
  }
}
