'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useAnalytics } from '@/hooks/useAnalytics';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Badge } from '@/components/ui';
import TabNavigation from '@/components/ui/TabNavigation';
import AnalyticsSkeleton from '@/components/admin/AnalyticsSkeleton';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

export default function AnalyticsDashboard() {
  const { data: session } = useSession();
  const trackEvent = useAnalytics();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Test function to trigger analytics event
  const testAnalytics = () => {
    trackEvent('test_event', {
      source: 'admin_dashboard',
      action: 'test_button_click',
      timestamp: new Date().toISOString(),
    });
    alert('Test analytics event sent! Check the Recent Events tab to see if it appears.');
  };

  // Fetch analytics data
  const fetchAnalytics = async (type = 'overview') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      console.log('Fetching analytics for type:', type, 'with params:', params.toString());
      const response = await fetch(`/api/admin/analytics?${params}`);
      const result = await response.json();

      console.log('Analytics API response for', type, ':', result);

      if (result.success) {
        setAnalyticsData(result.data);
        console.log('Analytics data set for', type, ':', result.data);
      } else {
        console.error('Failed to fetch analytics:', result.error);
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(activeTab);
  }, [activeTab, dateRange]);

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      // Handle different date formats
      let date;
      if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        // Try to convert to string first
        date = new Date(String(dateValue));
      }

      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Date formatting error:', e, 'for value:', dateValue);
      return 'N/A';
    }
  };

  // Chart data preparation
  const chartData = {
    labels:
      analyticsData?.dailyPageviews?.map((day) =>
        new Date(day.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      ) || [],
    datasets: [
      {
        label: 'Pageviews',
        data: analyticsData?.dailyPageviews?.map((day) => day.views) || [],
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Space Grotesk',
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Daily Pageviews (Last 7 Days)',
        font: {
          family: 'Playfair Display',
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Space Grotesk',
            size: 11,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          font: {
            family: 'Space Grotesk',
            size: 11,
          },
        },
        grid: {
          display: false,
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 4,
      },
    },
  };

  if (loading) {
    return (
      <AdminPageWrapper title="Analytics Dashboard" description="Loading analytics data...">
        <AnalyticsSkeleton />
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper
      title="Analytics Dashboard"
      description="Track pageviews, user sessions, and custom events across your portfolio."
      actionButton={
        <div className="flex gap-4 items-center">
          <Button onClick={testAnalytics} variant="outline" className="mr-2">
            <i className="fas fa-flask mr-2"></i>
            Test Analytics
          </Button>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border-2 border-neutral-300 rounded-md focus:border-black focus:outline-none text-sm"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border-2 border-neutral-300 rounded-md focus:border-black focus:outline-none text-sm"
            />
          </div>
        </div>
      }
    >
      {/* Tabs */}
      <TabNavigation
        tabs={[
          { id: 'overview', label: 'Overview', icon: 'chart-line' },
          { id: 'pageviews', label: 'Page Views', icon: 'eye' },
          { id: 'sessions', label: 'Sessions', icon: 'users' },
          { id: 'chatbot', label: 'Chatbot', icon: 'comments' },
          { id: 'search', label: 'Search', icon: 'search' },
          { id: 'events', label: 'Events', icon: 'calendar' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sticky={false}
        fullWidth={true}
        className="-mt-8 mb-8"
      />

      {/* Overview Tab */}
      {activeTab === 'overview' && analyticsData && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                    Total Pageviews
                  </p>
                  <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                    {formatNumber(analyticsData.totalPageviews || 0)}
                  </p>
                  <p className="text-sm text-neutral-500 font-['Space_Grotesk']">Last 30 days</p>
                </div>
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                  <i className="fas fa-eye text-white"></i>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                    Unique Sessions
                  </p>
                  <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                    {formatNumber(analyticsData.totalSessions || 0)}
                  </p>
                  <p className="text-sm text-neutral-500 font-['Space_Grotesk']">Last 30 days</p>
                </div>
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-white"></i>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                    Top Pages
                  </p>
                  <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                    {analyticsData.topPages?.length || 0}
                  </p>
                  <p className="text-sm text-neutral-500 font-['Space_Grotesk']">Tracked pages</p>
                </div>
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                  <i className="fas fa-folder text-white"></i>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                    Daily Average
                  </p>
                  <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                    {analyticsData.dailyPageviews?.length > 0
                      ? formatNumber(
                          Math.round(
                            analyticsData.dailyPageviews.reduce((sum, day) => sum + day.views, 0) /
                              analyticsData.dailyPageviews.length
                          )
                        )
                      : 0}
                  </p>
                  <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                    Pageviews per day
                  </p>
                </div>
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-bar text-white"></i>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                    Chatbot Interactions
                  </p>
                  <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                    {formatNumber(analyticsData.chatbotAnalytics?.totalInteractions || 0)}
                  </p>
                  <p className="text-sm text-neutral-500 font-['Space_Grotesk']">Last 30 days</p>
                </div>
                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                  <i className="fas fa-comments text-white"></i>
                </div>
              </div>
            </Card>
          </div>

          {/* Chart */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
            <div className="h-80">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </Card>

          {/* Top Pages */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
            <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">Top Pages</h3>
            <div className="space-y-3">
              {analyticsData.topPages?.slice(0, 10).map((page, index) => (
                <div
                  key={page.path}
                  className="flex justify-between items-center py-2 border-b border-neutral-200 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-neutral-400 w-8 font-['Space_Grotesk']">
                      #{index + 1}
                    </span>
                    <span className="font-medium font-['Space_Grotesk']">{page.path}</span>
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-neutral-600 font-['Space_Grotesk']">
                      {formatNumber(page.views)} views
                    </span>
                    <span className="text-neutral-500 font-['Space_Grotesk']">
                      {formatNumber(page.uniqueVisitors)} visitors
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Chatbot Analytics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Questions */}
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                Most Frequent Questions
              </h3>
              {!analyticsData.chatbotAnalytics?.topQuestions ||
              analyticsData.chatbotAnalytics.topQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-question-circle text-neutral-400"></i>
                  </div>
                  <p className="text-neutral-500 text-sm">No chatbot interactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analyticsData.chatbotAnalytics.topQuestions.slice(0, 5).map((item, index) => (
                    <div
                      key={item.question}
                      className="flex justify-between items-center py-2 border-b border-neutral-200 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-neutral-400 w-6 font-['Space_Grotesk']">
                          #{index + 1}
                        </span>
                        <span className="font-medium font-['Space_Grotesk'] text-sm">
                          {item.question}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-neutral-600 font-['Space_Grotesk'] text-sm">
                          {formatNumber(item.count)} times
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Tool Usage Card */}
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                AI Tool Usage
              </h3>
              {!analyticsData.chatbotAnalytics?.toolUsage ||
              analyticsData.chatbotAnalytics.toolUsage.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-wrench text-neutral-400"></i>
                  </div>
                  <p className="text-neutral-500 text-sm">No tools used yet</p>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-black mb-2 font-['Playfair_Display']">
                      {formatNumber(analyticsData.chatbotAnalytics.interactionsWithTools)}
                    </p>
                    <p className="text-neutral-600 text-sm font-['Space_Grotesk']">
                      Interactions using tools
                    </p>
                    <p className="text-neutral-500 text-xs mt-1 font-['Space_Grotesk']">
                      {formatNumber(
                        Math.round(
                          (analyticsData.chatbotAnalytics.interactionsWithTools /
                            analyticsData.chatbotAnalytics.totalInteractions) *
                            100
                        )
                      )}
                      % of all conversations
                    </p>
                  </div>
                  <div className="space-y-3 mt-4">
                    <p className="text-xs font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                      Tool Usage Breakdown
                    </p>
                    {analyticsData.chatbotAnalytics.toolUsage.map((tool, index) => (
                      <div key={index} className="border-b border-neutral-200 last:border-b-0 pb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium font-['Space_Grotesk'] text-sm">
                            {tool.toolName}
                          </span>
                          <span className="text-neutral-600 font-['Space_Grotesk'] text-sm">
                            {formatNumber(tool.count)} calls
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-neutral-200 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full"
                              style={{
                                width: `${Math.round(tool.successRate)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Recent Events */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
            <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">Recent Events</h3>
            <div className="space-y-2">
              {analyticsData.recentEvents?.slice(0, 20).map((event, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 text-sm border-b border-neutral-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant="tag"
                      className={`${
                        event.eventType === 'pageview'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : event.eventType === 'chatbot_interaction'
                            ? 'bg-slate-100 text-slate-800 border-slate-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {event.eventType}
                    </Badge>
                    <span className="font-medium font-['Space_Grotesk']">{event.path}</span>
                    {event.eventName && (
                      <span className="text-neutral-500 font-['Space_Grotesk']">
                        ({event.eventName})
                      </span>
                    )}
                  </div>
                  <div className="text-neutral-500 font-['Space_Grotesk']">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Pageviews Tab */}
      {activeTab === 'pageviews' && analyticsData && (
        <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
          <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
            Pageview Statistics
          </h3>
          {!analyticsData.pageviews || analyticsData.pageviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-bar text-neutral-400 text-xl"></i>
              </div>
              <h4 className="text-lg font-medium text-neutral-600 mb-2">No Pageview Data</h4>
              <p className="text-neutral-500 mb-4">
                No pageview statistics are available for the selected date range.
              </p>
              <p className="text-sm text-neutral-400">
                This could be because:
                <br />• No visitors have accessed your site yet
                <br />• Analytics tracking isn't working properly
                <br />• The date range is too restrictive
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyticsData.pageviews?.map((page, index) => (
                <div
                  key={page.path}
                  className="flex justify-between items-center py-3 border-b border-neutral-200 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-neutral-400 w-8 font-['Space_Grotesk']">
                      #{index + 1}
                    </span>
                    <span className="font-medium font-['Space_Grotesk']">{page.path}</span>
                  </div>
                  <div className="flex space-x-6 text-sm">
                    <span className="text-neutral-600 font-['Space_Grotesk']">
                      {formatNumber(page.views)} total views
                    </span>
                    <span className="text-neutral-500 font-['Space_Grotesk']">
                      {formatNumber(page.uniqueVisitors)} unique visitors
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && analyticsData && (
        <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
          <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
            Session Statistics
          </h3>
          {!analyticsData.sessions || analyticsData.sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-neutral-400 text-xl"></i>
              </div>
              <h4 className="text-lg font-medium text-neutral-600 mb-2">No Session Data</h4>
              <p className="text-neutral-500 mb-4">
                No session statistics are available for the selected date range.
              </p>
              <p className="text-sm text-neutral-400">
                This could be because:
                <br />• No visitors have accessed your site yet
                <br />• Analytics tracking isn't working properly
                <br />• The date range is too restrictive
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyticsData.sessions?.slice(0, 50).map((session, index) => (
                <div
                  key={session.sessionId}
                  className="flex justify-between items-center py-3 border-b border-neutral-200 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-neutral-400 w-8 font-['Space_Grotesk']">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="font-medium font-mono text-sm font-['Space_Grotesk']">
                        {session.sessionId.substring(0, 16)}...
                      </div>
                      <div className="text-xs text-neutral-500 font-['Space_Grotesk']">
                        {session.pages} pages • {formatDuration(session.duration)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-6 text-sm">
                    <span className="text-neutral-600 font-['Space_Grotesk']">
                      {session.events} events
                    </span>
                    <span className="text-neutral-500 font-['Space_Grotesk']">
                      {formatDate(session.firstSeen)} - {formatDate(session.lastSeen)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Search Analytics Tab */}
      {activeTab === 'search' && analyticsData && (
        <div className="space-y-6">
          {/* Search Summary Cards */}
          {analyticsData.searchSummary && analyticsData.searchSummary.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                      Total Searches
                    </p>
                    <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                      {formatNumber(analyticsData.searchSummary[0].totalSearches || 0)}
                    </p>
                    <p className="text-sm text-neutral-500 font-['Space_Grotesk']">All time</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-search text-white"></i>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                      Avg Results
                    </p>
                    <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                      {formatNumber(analyticsData.searchSummary[0].avgResultsPerSearch || 0)}
                    </p>
                    <p className="text-sm text-neutral-500 font-['Space_Grotesk']">Per search</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-list text-white"></i>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                      Zero Results
                    </p>
                    <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                      {formatNumber(analyticsData.searchSummary[0].zeroResultSearches || 0)}
                    </p>
                    <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                      Failed searches
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-white"></i>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Top Search Terms */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
            <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
              Top Search Terms
            </h3>
            {!analyticsData.searchAnalytics || analyticsData.searchAnalytics.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-neutral-400 text-xl"></i>
                </div>
                <h4 className="text-lg font-medium text-neutral-600 mb-2">No Search Data</h4>
                <p className="text-neutral-500 mb-4">No search analytics are available yet.</p>
                <p className="text-sm text-neutral-400">
                  Search data will appear here once users start using the search feature.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {analyticsData.searchAnalytics?.slice(0, 25).map((search, index) => (
                  <div
                    key={search.searchTerm}
                    className="flex justify-between items-center py-3 border-b border-neutral-200 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-neutral-400 w-8 font-['Space_Grotesk']">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="font-medium font-['Space_Grotesk']">
                          "{search.searchTerm}"
                        </div>
                        <div className="text-xs text-neutral-500 font-['Space_Grotesk']">
                          Last searched: {new Date(search.lastSearched).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-6 text-sm">
                      <span className="text-neutral-600 font-['Space_Grotesk']">
                        {formatNumber(search.count)} searches
                      </span>
                      <span className="text-neutral-500 font-['Space_Grotesk']">
                        {formatNumber(search.avgResults)} avg results
                      </span>
                      <div className="flex space-x-2">
                        <span className="text-blue-600 font-['Space_Grotesk']">
                          {formatNumber(search.totalProjects)} projects
                        </span>
                        <span className="text-green-600 font-['Space_Grotesk']">
                          {formatNumber(search.totalArticles)} articles
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Chatbot Analytics Tab */}
      {activeTab === 'chatbot' && analyticsData && (
        <div className="space-y-6">
          {/* Chatbot Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                    Total Interactions
                  </p>
                  <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                    {formatNumber(analyticsData.chatbotAnalytics?.totalInteractions || 0)}
                  </p>
                  <p className="text-sm text-neutral-500 font-['Space_Grotesk']">All time</p>
                </div>
                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                  <i className="fas fa-comments text-white"></i>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                    Avg Conversation Length
                  </p>
                  <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                    {analyticsData.chatbotAnalytics?.avgConversationLength
                      ? formatNumber(
                          analyticsData.chatbotAnalytics.avgConversationLength.toFixed(1)
                        )
                      : '0'}
                  </p>
                  <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                    Messages per chat
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exchange-alt text-white"></i>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                    Context Usage
                  </p>
                  <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                    {analyticsData.chatbotAnalytics?.contextUsage
                      ? formatNumber((analyticsData.chatbotAnalytics.contextUsage * 100).toFixed(1))
                      : '0'}
                    %
                  </p>
                  <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                    Chats with page context
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-file-alt text-white"></i>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                    Models Used
                  </p>
                  <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                    {analyticsData.chatbotAnalytics?.modelsUsed?.length || 0}
                  </p>
                  <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                    Different AI models
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-robot text-white"></i>
                </div>
              </div>
            </Card>
          </div>

          {/* Model Performance Comparison */}
          {analyticsData.chatbotAnalytics?.modelPerformance &&
            analyticsData.chatbotAnalytics.modelPerformance.length > 0 && (
              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                  Model Performance Comparison
                </h3>
                <div className="space-y-4">
                  {analyticsData.chatbotAnalytics.modelPerformance.map((model, index) => (
                    <div key={model.modelName} className="p-4 border border-neutral-200 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-neutral-400 w-8 font-['Space_Grotesk']">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="font-semibold font-['Space_Grotesk']">
                              {model.modelName}
                            </div>
                            <div className="text-sm text-neutral-500 font-['Space_Grotesk']">
                              {formatNumber(model.totalInteractions)} interactions
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-black font-['Playfair_Display']">
                            {formatNumber(model.conversionRate.toFixed(1))}%
                          </div>
                          <div className="text-sm text-neutral-500 font-['Space_Grotesk']">
                            conversion rate
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(model.conversionRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          {/* Recent Chatbot Interactions */}
          <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
            <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
              Recent Chatbot Interactions
            </h3>
            {!analyticsData.chatbotInteractions ||
            analyticsData.chatbotInteractions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-comments text-neutral-400 text-xl"></i>
                </div>
                <h4 className="text-lg font-medium text-neutral-600 mb-2">No Chatbot Data</h4>
                <p className="text-neutral-500 mb-4">
                  No chatbot interactions have been recorded yet.
                </p>
                <p className="text-sm text-neutral-400">
                  Chatbot interaction data will appear here once users start chatting with your AI
                  assistant.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {analyticsData.chatbotInteractions?.slice(0, 20).map((interaction, index) => (
                  <div
                    key={index}
                    className="p-4 border border-neutral-200 rounded-lg bg-neutral-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant="tag"
                          className="bg-slate-100 text-slate-800 border-slate-200"
                        >
                          {interaction.modelName}
                        </Badge>
                        <span className="font-medium font-['Space_Grotesk'] text-sm">
                          {interaction.path}
                        </span>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-neutral-600 font-['Space_Grotesk']">
                          {new Date(interaction.timestamp).toLocaleString()}
                        </div>
                        <div className="text-neutral-500 font-['Space_Grotesk']">
                          Session: {interaction.sessionId?.substring(0, 8)}...
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900 font-['Space_Grotesk']">
                            User:
                          </div>
                          <div className="text-sm text-neutral-700 font-['Space_Grotesk'] bg-white p-2 rounded border">
                            {interaction.userQuestion}
                          </div>
                        </div>
                      </div>

                      {interaction.isCallToAction && (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          <div className="flex-1">
                            <Badge
                              variant="tag"
                              className="bg-green-100 text-green-800 border-green-200 text-xs"
                            >
                              Call to Action Triggered
                            </Badge>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-neutral-500 font-['Space_Grotesk']">
                        <span>Conversation length: {interaction.conversationLength} messages</span>
                        {interaction.hasPageContext && (
                          <span className="flex items-center">
                            <i className="fas fa-file-alt mr-1"></i>
                            Page context used
                          </span>
                        )}
                        <span>Chat history: {interaction.chatHistoryLength} previous messages</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Context Effectiveness */}
          {analyticsData.chatbotAnalytics?.contextStats && (
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                Context Effectiveness Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 font-['Space_Grotesk']">
                    Context Usage Breakdown
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600 font-['Space_Grotesk']">
                        Chats with context
                      </span>
                      <span className="font-semibold font-['Space_Grotesk']">
                        {formatNumber(analyticsData.chatbotAnalytics.contextStats.withContext)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600 font-['Space_Grotesk']">
                        Chats without context
                      </span>
                      <span className="font-semibold font-['Space_Grotesk']">
                        {formatNumber(analyticsData.chatbotAnalytics.contextStats.withoutContext)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 font-['Space_Grotesk']">Performance Impact</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600 font-['Space_Grotesk']">
                        Context conversion rate
                      </span>
                      <span className="font-semibold text-green-600 font-['Space_Grotesk']">
                        {formatNumber(
                          analyticsData.chatbotAnalytics.contextStats.contextConversionRate.toFixed(
                            1
                          )
                        )}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600 font-['Space_Grotesk']">
                        No-context conversion rate
                      </span>
                      <span className="font-semibold text-blue-600 font-['Space_Grotesk']">
                        {formatNumber(
                          analyticsData.chatbotAnalytics.contextStats.noContextConversionRate.toFixed(
                            1
                          )
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && analyticsData && (
        <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
          <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">Recent Events</h3>
          {!analyticsData.events || analyticsData.events.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-list text-neutral-400 text-xl"></i>
              </div>
              <h4 className="text-lg font-medium text-neutral-600 mb-2">No Event Data</h4>
              <p className="text-neutral-500 mb-4">
                No events have been recorded for the selected date range.
              </p>
              <p className="text-sm text-neutral-400">
                This could be because:
                <br />• No visitors have accessed your site yet
                <br />• Analytics tracking isn't working properly
                <br />• The date range is too restrictive
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {analyticsData.events?.map((event, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-3 border-b border-neutral-200 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant="tag"
                      className={`${
                        event.eventType === 'pageview'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {event.eventType}
                    </Badge>
                    <div>
                      <div className="font-medium font-['Space_Grotesk']">{event.path}</div>
                      {event.eventName && (
                        <div className="text-sm text-neutral-500 font-['Space_Grotesk']">
                          Event: {event.eventName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-neutral-500 font-['Space_Grotesk']">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {analyticsData.pagination?.hasMore && (
            <div className="mt-6 text-center">
              <Button className="px-4 py-2 bg-black text-white rounded-md hover:bg-neutral-800 transition-colors">
                Load More
              </Button>
            </div>
          )}
        </Card>
      )}
    </AdminPageWrapper>
  );
}
