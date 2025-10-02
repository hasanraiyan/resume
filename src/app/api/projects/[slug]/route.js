import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Project from '@/models/Project'

export async function GET(request, { params }) {
  try {
    await dbConnect()
    
    const { slug } = params
    const project = await Project.findOne({ slug }).lean()
    
    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      )
    }
    
    // Convert MongoDB _id to string for JSON serialization
    const serializedProject = {
      ...project,
      _id: project._id.toString(),
      id: project._id.toString(),
    }
    
    return NextResponse.json({ 
      success: true, 
      project: serializedProject 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}
