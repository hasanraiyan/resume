import { redirect } from 'next/navigation';
import dbConnect from '@/lib/dbConnect';
import Subscriber from '@/models/Subscriber';
import SubscribersClient from '@/components/admin/SubscribersClient';

/**
 * Admin subscribers management page - Server Component
 * Displays and manages newsletter subscribers
 */
export default async function SubscribersPage() {
  // TODO: Add authentication check
  // For now, we'll assume admin access

  await dbConnect();

  try {
    // Fetch subscribers with pagination and filtering
    const subscribers = await Subscriber.find({})
      .sort({ subscribedAt: -1 })
      .limit(100) // Limit for performance
      .lean();

    // Get statistics
    const totalSubscribers = await Subscriber.countDocuments({});
    const activeSubscribers = await Subscriber.countDocuments({ isActive: true });
    const recentSubscribers = await Subscriber.countDocuments({
      subscribedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    });

    const stats = {
      total: totalSubscribers,
      active: activeSubscribers,
      recent: recentSubscribers,
    };

    // Serialize subscribers for client component
    const serializedSubscribers = subscribers.map((subscriber) => ({
      id: subscriber._id.toString(),
      email: subscriber.email,
      name: subscriber.name,
      isActive: subscriber.isActive,
      source: subscriber.source,
      subscribedAt: subscriber.subscribedAt,
      unsubscribedAt: subscriber.unsubscribedAt,
      metadata: subscriber.metadata,
    }));

    return <SubscribersClient initialSubscribers={serializedSubscribers} initialStats={stats} />;
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error Loading Subscribers</h2>
          <p className="text-red-600 mt-2">
            There was an error loading the subscribers data. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
