// src/app/api/admin/cron/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

/**
 * GET /api/admin/cron - Get cron job data from cron-job.org (admin only)
 *
 * @returns {Promise<NextResponse>} JSON response with cron job data
 */
export async function GET() {
  try {
    // Check admin session
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.CRON_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Cron API key not configured' }, { status: 500 });
    }

    const jobId = '6738477'; // From the user's cron-job.org link
    const baseUrl = 'https://api.cron-job.org';

    // Fetch job details
    const jobResponse = await fetch(`${baseUrl}/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!jobResponse.ok) {
      throw new Error(`Failed to fetch job details: ${jobResponse.status}`);
    }

    const jobData = await jobResponse.json();

    // Fetch job history
    const historyResponse = await fetch(`${baseUrl}/jobs/${jobId}/history`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!historyResponse.ok) {
      throw new Error(`Failed to fetch job history: ${historyResponse.status}`);
    }

    const historyData = await historyResponse.json();

    return NextResponse.json({
      job: jobData.jobDetails,
      history: historyData.history,
      predictions: historyData.predictions,
    });
  } catch (error) {
    console.error('Error fetching cron job data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
