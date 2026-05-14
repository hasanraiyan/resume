import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Lead from '@/models/Lead';
import LeadsClient from '@/components/admin/LeadsClient';

/**
 * Admin leads management page - Server Component
 * Displays and manages form responses, waitlists, and leads.
 */
export default async function LeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  await dbConnect();

  try {
    // Fetch initial leads (latest 50)
    const leads = await Lead.find({}).sort({ createdAt: -1 }).limit(50).lean();

    // Get statistics for the dashboard
    const stats = await Lead.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byType: [{ $group: { _id: '$type', count: { $sum: 1 } } }],
          recent: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const formattedStats = {
      total: stats[0].total[0]?.count || 0,
      recent: stats[0].recent[0]?.count || 0,
      byStatus: stats[0].byStatus.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byType: stats[0].byType.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
    };

    // Serialize MongoDB docs for client component
    const serializedLeads = leads.map((lead) => ({
      id: lead._id.toString(),
      type: lead.type,
      email: lead.email,
      name: lead.name,
      status: lead.status,
      data: lead.data,
      metadata: lead.metadata,
      notes: lead.notes,
      createdAt: lead.createdAt.toISOString(),
    }));

    return <LeadsClient initialLeads={serializedLeads} stats={formattedStats} />;
  } catch (error) {
    console.error('Error loading leads:', error);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error Loading Leads</h2>
          <p className="text-red-600 mt-2">Failed to fetch lead data. Please try again later.</p>
        </div>
      </div>
    );
  }
}
