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
import { Button, Card, Badge } from '@/components/custom-ui';
import TabNavigation from '@/components/custom-ui/TabNavigation';
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

// UserFlowVisualization removed as it depends on chartjs-chart-sankey

export default function AnalyticsDashboard() {
  const { data: session } = useSession();
  const trackEvent = useAnalytics();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [cronData, setCronData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCron, setLoadingCron] = useState(true);
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

  // Fetch cron job data
  const fetchCronData = async () => {
    try {
      setLoadingCron(true);
      console.log('Fetching cron job data');
      const response = await fetch('/api/admin/cron');
      const result = await response.json();

      console.log('Cron API response:', result);

      if (response.ok) {
        setCronData(result);
        console.log('Cron data set:', result);
      } else {
        console.error('Failed to fetch cron data:', result.error);
      }
    } catch (error) {
      console.error('Cron fetch error:', error);
    } finally {
      setLoadingCron(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(activeTab);
  }, [activeTab, dateRange]);

  useEffect(() => {
    fetchCronData();
  }, []);

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateValue) => {
    return new Date(dateValue).toLocaleDateString();
  };

  // Chart data for overview tab
  const allDates = analyticsData?.dailyPageviews
    ? [...new Set(analyticsData.dailyPageviews.map((d) => new Date(d.date).toLocaleDateString()))]
    : [];

  const visitorData = allDates.map((dateLabel) => {
    const dayData = analyticsData.dailyPageviews.find(
      (d) => new Date(d.date).toLocaleDateString() === dateLabel && d.userRole === 'visitor'
    );
    return dayData ? dayData.views : 0;
  });

  const adminData = allDates.map((dateLabel) => {
    const dayData = analyticsData.dailyPageviews.find(
      (d) => new Date(d.date).toLocaleDateString() === dateLabel && d.userRole === 'admin'
    );
    return dayData ? dayData.views : 0;
  });

  const chartData = {
    labels: allDates,
    datasets: [
      {
        label: 'Visitors',
        data: visitorData,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
      {
        label: 'Admin',
        data: adminData,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
        stacked: true,
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
        stacked: true,
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
      {/* Tabs - Always visible */}
      <TabNavigation
        tabs={[
          { id: 'overview', label: 'Overview', icon: 'chart-line' },
          { id: 'pageviews', label: 'Page Views', icon: 'eye' },
          { id: 'sessions', label: 'Sessions', icon: 'users' },
          { id: 'chatbot', label: 'Chatbot', icon: 'comments' },
          { id: 'search', label: 'Search', icon: 'search' },
          { id: 'events', label: 'Events', icon: 'calendar' },
          { id: 'cron', label: 'Cron Jobs', icon: 'clock' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sticky={false}
        fullWidth={true}
        className="-mt-8 mb-8"
      />

      {/* Content - Conditionally rendered based on loading */}
      {!loading && analyticsData ? (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
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
                        {formatNumber(analyticsData.totalPageviews?.visitor || 0)}
                      </p>
                      <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                        Visitors ({formatNumber(analyticsData.totalPageviews?.admin || 0)} admin)
                      </p>
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
                        {formatNumber(analyticsData.totalSessions?.visitor || 0)}
                      </p>
                      <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                        Visitors ({formatNumber(analyticsData.totalSessions?.admin || 0)} admin)
                      </p>
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
                      <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                        Tracked pages
                      </p>
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
                                analyticsData.dailyPageviews.reduce(
                                  (sum, day) => sum + day.views,
                                  0
                                ) / analyticsData.dailyPageviews.length
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
                      <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                        Last 30 days
                      </p>
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
                      {analyticsData.chatbotAnalytics.topQuestions
                        .slice(0, 5)
                        .map((item, index) => (
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
                          <div
                            key={index}
                            className="border-b border-neutral-200 last:border-b-0 pb-2"
                          >
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
                <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                  Recent Events
                </h3>
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

          {/* UserFlow Tab Removed */}

          {/* Pageviews Tab */}
          {activeTab === 'pageviews' && (
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
          {activeTab === 'sessions' && (
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
                          <div className="font-medium text-sm font-['Space_Grotesk']">
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
          {activeTab === 'search' && (
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
                        <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                          Per search
                        </p>
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
          {activeTab === 'chatbot' && (
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
                          ? formatNumber(
                              (analyticsData.chatbotAnalytics.contextUsage * 100).toFixed(1)
                            )
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

              {/* Additional chatbot content would go here */}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
              <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                Recent Events
              </h3>
              <div className="space-y-2">
                {analyticsData.events?.slice(0, 50).map((event, index) => (
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
          )}

          {/* Cron Jobs Tab */}
          {activeTab === 'cron' && (
            <div className="space-y-6">
              {/* Export Actions */}
              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold font-['Playfair_Display']">
                      Export Cron Data
                    </h3>
                    <p className="text-sm text-neutral-600 font-['Space_Grotesk'] mt-1">
                      Download your cron job execution history for analysis or backup
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        if (!cronData?.history) return;

                        const csvData = [
                          ['Date', 'Status', 'Duration (ms)', 'HTTP Status', 'Status Text'],
                          ...cronData.history.map((h) => [
                            new Date(h.date * 1000).toISOString(),
                            h.status === 1 ? 'Success' : 'Failed',
                            h.duration,
                            h.httpStatus || 'N/A',
                            h.statusText,
                          ]),
                        ];

                        const csvContent = csvData.map((row) => row.join(',')).join('');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `cron-history-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <i className="fas fa-download"></i>
                      Export CSV
                    </Button>
                    <Button
                      onClick={() => {
                        if (!cronData) return;

                        const jsonData = {
                          exportedAt: new Date().toISOString(),
                          job: cronData.job,
                          history: cronData.history,
                          predictions: cronData.predictions,
                        };

                        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
                          type: 'application/json',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `cron-data-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <i className="fas fa-file-code"></i>
                      Export JSON
                    </Button>
                  </div>
                </div>
              </Card>
              {/* Cron Job Overview Cards */}
              {!loadingCron && cronData ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                          Current Status
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge
                            variant="tag"
                            className={`${
                              cronData.job?.enabled
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}
                          >
                            {cronData.job?.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                        <i className="fas fa-clock text-white"></i>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                          Total Executions
                        </p>
                        <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                          {cronData.history?.length || 0}
                        </p>
                        <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                          In history
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <i className="fas fa-play-circle text-white"></i>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                          Success Rate
                        </p>
                        <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                          {cronData.history?.length > 0
                            ? Math.round(
                                (cronData.history.filter((h) => h.status === 1).length /
                                  cronData.history.length) *
                                  100
                              )
                            : 0}
                          %
                        </p>
                        <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                          Last 20 runs
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                        <i className="fas fa-check-circle text-white"></i>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                          Uptime (Last 24h)
                        </p>
                        <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                          {(() => {
                            if (!cronData.history?.length) return '0%';

                            // Calculate uptime for last 24 hours
                            const last24h = Date.now() / 1000 - 24 * 60 * 60;
                            const recentHistory = cronData.history.filter((h) => h.date >= last24h);

                            if (recentHistory.length === 0) return 'N/A';

                            const successCount = recentHistory.filter((h) => h.status === 1).length;
                            const uptimePercent = Math.round(
                              (successCount / recentHistory.length) * 100
                            );

                            return `${uptimePercent}%`;
                          })()}
                        </p>
                        <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                          Based on health checks
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                        <i className="fas fa-shield-alt text-white"></i>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600 uppercase tracking-wider font-['Space_Grotesk']">
                          Avg Response Time
                        </p>
                        <p className="text-3xl font-bold text-black mt-2 font-['Playfair_Display']">
                          {cronData.history?.length > 0
                            ? Math.round(
                                cronData.history.reduce((sum, h) => sum + h.duration, 0) /
                                  cronData.history.length
                              )
                            : 0}
                          ms
                        </p>
                        <p className="text-sm text-neutral-500 font-['Space_Grotesk']">
                          Last 20 runs
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                        <i className="fas fa-tachometer-alt text-white"></i>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-6 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                          <div className="h-8 bg-neutral-200 rounded mb-2"></div>
                          <div className="h-3 bg-neutral-200 rounded"></div>
                        </div>
                        <div className="w-12 h-12 bg-neutral-200 rounded-lg"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Cron Job Charts */}
              {!loadingCron && cronData?.history && cronData.history.length > 0 && (
                <>
                  {/* Response Time Chart */}
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                    <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                      Response Time Trend
                    </h3>
                    <div className="h-64">
                      <Line
                        data={{
                          labels: cronData.history
                            .slice(-10)
                            .reverse()
                            .map((h) =>
                              new Date(h.date * 1000).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            ),
                          datasets: [
                            {
                              label: 'Response Time (ms)',
                              data: cronData.history
                                .slice(-10)
                                .reverse()
                                .map((h) => h.duration),
                              borderColor: 'rgb(0, 0, 0)',
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              tension: 0.4,
                              pointBackgroundColor: cronData.history
                                .slice(-10)
                                .reverse()
                                .map((h) =>
                                  h.status === 1 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                                ),
                              pointBorderColor: cronData.history
                                .slice(-10)
                                .reverse()
                                .map((h) =>
                                  h.status === 1 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                                ),
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            title: { display: false },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { font: { family: 'Space Grotesk', size: 11 } },
                              grid: { color: 'rgba(0, 0, 0, 0.1)' },
                            },
                            x: {
                              ticks: { font: { family: 'Space Grotesk', size: 11 } },
                              grid: { display: false },
                            },
                          },
                          elements: {
                            point: { radius: 4, hoverRadius: 6 },
                          },
                        }}
                      />
                    </div>
                  </Card>

                  {/* Success/Failure Chart */}
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                    <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                      Execution Status Distribution
                    </h3>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: ['Success', 'Failed'],
                          datasets: [
                            {
                              label: 'Executions',
                              data: [
                                cronData.history.filter((h) => h.status === 1).length,
                                cronData.history.filter((h) => h.status !== 1).length,
                              ],
                              backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                              borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
                              borderWidth: 1,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            title: { display: false },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                font: { family: 'Space Grotesk', size: 11 },
                                precision: 0,
                              },
                              grid: { color: 'rgba(0, 0, 0, 0.1)' },
                            },
                            x: {
                              ticks: { font: { family: 'Space Grotesk', size: 11 } },
                              grid: { display: false },
                            },
                          },
                          elements: {
                            bar: { borderRadius: 4 },
                          },
                        }}
                      />
                    </div>
                  </Card>

                  {/* HTTP Status Chart */}
                  {cronData.history.some((h) => h.httpStatus) && (
                    <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                      <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                        HTTP Status Codes
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(
                          cronData.history.reduce((acc, h) => {
                            if (h.httpStatus) {
                              acc[h.httpStatus] = (acc[h.httpStatus] || 0) + 1;
                            }
                            return acc;
                          }, {})
                        )
                          .sort(([a], [b]) => a - b)
                          .map(([status, count]) => (
                            <div key={status} className="text-center p-4 bg-neutral-50 rounded-lg">
                              <div
                                className={`text-2xl font-bold font-['Playfair_Display'] ${
                                  status >= 200 && status < 300
                                    ? 'text-green-600'
                                    : status >= 300 && status < 400
                                      ? 'text-blue-600'
                                      : status >= 400 && status < 500
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                }`}
                              >
                                {status}
                              </div>
                              <div className="text-sm text-neutral-600 font-['Space_Grotesk'] mt-1">
                                {count} times
                              </div>
                            </div>
                          ))}
                      </div>
                    </Card>
                  )}

                  {/* Incident Timeline */}
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                    <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                      Incident Timeline (Last 24h)
                    </h3>
                    <div className="space-y-3">
                      {(() => {
                        if (!cronData.history?.length)
                          return (
                            <p className="text-neutral-500 text-center py-4">No data available</p>
                          );

                        const last24h = Date.now() / 1000 - 24 * 60 * 60;
                        const recentHistory = cronData.history
                          .filter((h) => h.date >= last24h)
                          .sort((a, b) => b.date - a.date)
                          .slice(0, 10); // Show last 10 executions

                        if (recentHistory.length === 0) {
                          return (
                            <p className="text-neutral-500 text-center py-4">
                              No executions in the last 24 hours
                            </p>
                          );
                        }

                        return recentHistory.map((execution, index) => (
                          <div
                            key={execution.identifier}
                            className="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg"
                          >
                            <div
                              className={`w-3 h-3 rounded-full ${
                                execution.status === 1 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            ></div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium font-['Space_Grotesk'] text-sm">
                                  {execution.status === 1
                                    ? 'Health Check OK'
                                    : 'Health Check Failed'}
                                </span>
                                <span className="text-xs text-neutral-500 font-['Space_Grotesk']">
                                  {new Date(execution.date * 1000).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-xs text-neutral-600 font-['Space_Grotesk'] mt-1">
                                Response: {execution.duration}ms
                                {execution.httpStatus && ` • HTTP ${execution.httpStatus}`}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </Card>
                </>
              )}

              {/* Execution History */}
              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                  Execution History
                </h3>
                {!loadingCron && cronData?.history ? (
                  <div className="space-y-3">
                    {cronData.history.slice(0, 20).map((execution, index) => (
                      <div
                        key={execution.identifier}
                        className="flex justify-between items-center py-3 border-b border-neutral-200 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-neutral-400 w-8 font-['Space_Grotesk']">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="font-medium font-['Space_Grotesk'] text-sm">
                              {new Date(execution.date * 1000).toLocaleString()}
                            </div>
                            <div className="text-xs text-neutral-500 font-['Space_Grotesk']">
                              Planned: {new Date(execution.datePlanned * 1000).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-6 text-sm">
                          <div className="text-center">
                            <Badge
                              variant="tag"
                              className={`${
                                execution.status === 1
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }`}
                            >
                              {execution.statusText}
                            </Badge>
                            <div className="text-xs text-neutral-500 font-['Space_Grotesk'] mt-1">
                              {execution.httpStatus ? `HTTP ${execution.httpStatus}` : ''}
                            </div>
                          </div>
                          <span className="text-neutral-600 font-['Space_Grotesk']">
                            {execution.duration}ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-history text-neutral-400"></i>
                    </div>
                    <p className="text-neutral-500">Loading execution history...</p>
                  </div>
                )}
              </Card>

              {/* Upcoming Executions */}
              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-black">
                <h3 className="text-lg font-semibold mb-4 font-['Playfair_Display']">
                  Upcoming Executions
                </h3>
                {!loadingCron && cronData?.predictions ? (
                  <div className="space-y-2">
                    {cronData.predictions.map((prediction, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 text-sm border-b border-neutral-100 last:border-b-0"
                      >
                        <span className="font-medium font-['Space_Grotesk']">
                          Execution #{index + 1}
                        </span>
                        <span className="text-neutral-600 font-['Space_Grotesk']">
                          {new Date(prediction * 1000).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-calendar text-neutral-400"></i>
                    </div>
                    <p className="text-neutral-500">Loading upcoming executions...</p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      ) : (
        <AnalyticsSkeleton />
      )}
    </AdminPageWrapper>
  );
}
