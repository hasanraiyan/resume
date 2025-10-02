import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Project from '@/models/Project'

export async function GET(request, { params }) {
  try {
    await dbConnect()
    
    const { id } = params
    console.log('API: Searching for project with ID:', id)
    
    // Check if ID is valid MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Invalid ObjectId format:', id)
      return NextResponse.json(
        { success: false, message: 'Invalid project ID format' },
        { status: 400 }
      )
    }
    
    const project = await Project.findById(id).lean()
    console.log('Project found:', project ? 'Yes' : 'No')
    
    if (!project) {
      // Let's also try to find projects with similar IDs or list all projects for debugging
      const allProjects = await Project.find({}, '_id title').limit(5).lean()
      console.log('Sample projects in database:', allProjects)
      
      return NextResponse.json(
        { success: false, message: 'Project not found', sampleProjects: allProjects },
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

export async function PUT(request, { params }) {
  try {
    await dbConnect()
    
    const { id } = params
    const body = await request.json()
    
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).lean()
    
    if (!updatedProject) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      )
    }
    
    // Convert MongoDB _id to string for JSON serialization
    const serializedProject = {
      ...updatedProject,
      _id: updatedProject._id.toString(),
      id: updatedProject._id.toString(),
    }
    
    return NextResponse.json({ 
      success: true, 
      project: serializedProject,
      message: 'Project updated successfully'
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect()
    
    const { id } = params
    const deletedProject = await Project.findByIdAndDelete(id)
    
    if (!deletedProject) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
