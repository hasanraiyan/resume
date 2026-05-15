import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';

const FALLBACK_TOPICS = [
  "Dijkstra's Algorithm",
  'React Hooks in depth',
  'SQL Window Functions',
  'Machine Learning Basics',
  'TCP/IP Networking',
  'Dynamic Programming',
  'System Design: URL Shortener',
  'Async/Await in JavaScript',
  'Compiler Design',
  'Quantum Computing 101',
  'Microservices Architecture',
  'Kubernetes Fundamentals',
  'Clean Code Principles',
  'Rust Programming',
  'Advanced CSS Layouts',
];

export async function GET() {
  try {
    await dbConnect();

    // Get titles and tags from published courses
    const courses = await CoursifyCourse.find(
      { status: 'published', deletedAt: null },
      { title: 1, tags: 1 }
    )
      .limit(20)
      .lean();

    let dynamicTopics = [];

    if (courses && courses.length > 0) {
      // Add titles
      dynamicTopics.push(...courses.map((c) => c.title));

      // Add tags (flattened and unique)
      const tags = courses.flatMap((c) => c.tags || []);
      dynamicTopics.push(...new Set(tags));
    }

    // Combine with fallbacks and shuffle
    const combined = [...new Set([...dynamicTopics, ...FALLBACK_TOPICS])];
    const shuffled = combined.sort(() => 0.5 - Math.random());

    // Return top 12 unique suggestions
    return NextResponse.json({
      success: true,
      suggestions: shuffled.slice(0, 12),
    });
  } catch (error) {
    console.error('[Suggestions API] Error:', error);
    // Return fallbacks on error so UI doesn't break
    return NextResponse.json({
      success: false,
      suggestions: FALLBACK_TOPICS.slice(0, 8),
    });
  }
}
