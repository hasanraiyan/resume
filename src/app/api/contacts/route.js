import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Contact from '@/models/Contact'

export async function GET() {
  try {
    await dbConnect()
    const contacts = await Contact.find({}).sort({ createdAt: -1 }).lean()
    
    // Convert MongoDB _id to string for JSON serialization
    const serializedContacts = contacts.map(contact => ({
      ...contact,
      _id: contact._id.toString(),
      id: contact._id.toString(),
    }))
    
    return NextResponse.json({ 
      success: true, 
      contacts: serializedContacts 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    await dbConnect()
    
    const body = await request.json()
    const { name, email, projectType, message } = body
    
    const newContact = new Contact({
      name,
      email,
      projectType,
      message,
      status: 'new'
    })
    
    await newContact.save()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Contact saved successfully',
      contact: {
        ...newContact.toObject(),
        _id: newContact._id.toString(),
        id: newContact._id.toString(),
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to save contact' },
      { status: 500 }
    )
  }
}
