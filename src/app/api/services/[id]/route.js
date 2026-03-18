import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Service from '@/models/Service';
import { requireAdminSession } from '@/lib/auth/admin';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    console.log('API: Received parameter:', id);

    let service;

    // Check if it's a MongoDB ObjectId (24 hex characters) or continue with id
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log('Searching by ObjectId:', id);
      service = await Service.findById(id).lean();
    } else {
      console.log('Searching by id:', id);
      service = await Service.findById(id).lean();
    }

    console.log('Service found:', service ? 'Yes' : 'No');

    if (!service) {
      // For debugging, show some sample services
      const allServices = await Service.find({}, '_id title').limit(5).lean();
      console.log('Sample services in database:', allServices);

      return NextResponse.json(
        { success: false, message: 'Service not found', sampleServices: allServices },
        { status: 404 }
      );
    }

    // Convert MongoDB _id to string for JSON serialization
    const serializedService = {
      ...service,
      _id: service._id.toString(),
      id: service._id.toString(),
    };

    return NextResponse.json({
      success: true,
      service: serializedService,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const adminSession = await requireAdminSession();
    if (adminSession instanceof NextResponse) return adminSession;

    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    let updatedService;

    // Check if it's a MongoDB ObjectId or continue with id
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      updatedService = await Service.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
      }).lean();
    } else {
      updatedService = await Service.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
      }).lean();
    }

    if (!updatedService) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    // Convert MongoDB _id to string for JSON serialization
    const serializedService = {
      ...updatedService,
      _id: updatedService._id.toString(),
      id: updatedService._id.toString(),
    };

    return NextResponse.json({
      success: true,
      service: serializedService,
      message: 'Service updated successfully',
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update service' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const adminSession = await requireAdminSession();
    if (adminSession instanceof NextResponse) return adminSession;

    await dbConnect();

    const { id } = await params;
    let deletedService;

    // Check if it's a MongoDB ObjectId or continue with id
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      deletedService = await Service.findByIdAndDelete(id);
    } else {
      deletedService = await Service.findByIdAndDelete(id);
    }

    if (!deletedService) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
