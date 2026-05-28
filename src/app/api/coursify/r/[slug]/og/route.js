import { ImageResponse } from 'next/og';
import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return new Response('Slug required', { status: 400 });
    }

    await dbConnect();
    const research = await CoursifyResearch.findOne({ slug, deletedAt: null })
      .select('-topic')
      .lean();

    // Fallback data if article is not found
    const title = research?.title || 'AI Research & Insights';
    const date = research?.createdAt ? new Date(research.createdAt) : new Date();

    // Clean markdown and LaTeX tags
    const cleanTitle = title
      .replace(/\$[^$]+\$/g, (match) => match.replace(/\$/g, ''))
      .replace(/[*_#`[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 10% 20%, #1e3a34 0%, #0d1e1a 90%)',
          padding: '40px 60px',
          color: '#fcfbf5',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Decorative Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(rgba(31, 100, 78, 0.12) 1.5px, transparent 0)',
            backgroundSize: '24px 24px',
            opacity: 0.8,
          }}
        />

        {/* Main Card Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            background: 'rgba(30, 58, 52, 0.4)',
            borderRadius: '24px',
            border: '1.5px solid rgba(229, 227, 216, 0.12)',
            padding: '50px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#1f644e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fcfbf5',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              >
                C
              </div>
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                  color: '#fcfbf5',
                }}
              >
                Coursify AI Research
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(31, 100, 78, 0.25)',
                border: '1px solid rgba(31, 100, 78, 0.4)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#8be5c8',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Verified Sources
            </div>
          </div>

          {/* Title & Topic Niche */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              margin: '25px 0',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#7c8e88',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              AI Research Paper
            </span>
            <span
              style={{
                fontSize: '44px',
                fontWeight: '800',
                lineHeight: '1.25',
                color: '#ffffff',
                maxHeight: '170px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {cleanTitle}
            </span>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(229, 227, 216, 0.1)',
              paddingTop: '20px',
              fontSize: '13px',
              color: '#7c8e88',
            }}
          >
            <span>Published • {formattedDate}</span>
            <span style={{ fontWeight: 'bold', color: '#1f644e' }}>hasanraiyan.me/coursify</span>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('[CoursifyOG] Error generating OG image:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
