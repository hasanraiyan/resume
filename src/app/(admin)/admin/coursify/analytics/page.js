'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Coins,
  BookOpen,
  ArrowUpRight,
  Clock,
  Hash,
  Zap,
  RefreshCw,
  ExternalLink,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Download,
  PieChart as PieIcon,
  ChevronDown,
  Search,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/custom-ui';
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
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { toast } from 'sonner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function CoursifyAnalyticsPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState(30); // 7, 30, 90
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('tokens');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchStats = async (days = range) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/coursify/stats?days=${days}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(range);
  }, [range]);

  const handleExportCSV = () => {
    if (!data?.recentLogs?.length) return;

    const headers = [
      'Time',
      'Topic',
      'Status',
      'Prompt Tokens',
      'Completion Tokens',
      'Total Tokens',
      'Duration (ms)',
    ];
    const rows = data.recentLogs.map((log) => [
      new Date(log.createdAt).toLocaleString(),
      log.input?.topic || 'N/A',
      log.status,
      log.usage?.promptTokens || 0,
      log.usage?.completionTokens || 0,
      log.usage?.totalTokens || 0,
      log.durationMs || 0,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `coursify_usage_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics exported to CSV');
  };

  const filteredTopics = useMemo(() => {
    if (!data?.topTopics) return [];
    return data.topTopics
      .filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [data, searchQuery, sortField, sortOrder]);

  if (isLoading && !data)
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#f0f5f2] border-t-[#1f644e] rounded-full animate-spin" />
            <BarChart3 className="w-6 h-6 text-[#1f644e] absolute inset-0 m-auto" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#1e3a34]">Syncing Data Engine</p>
            <p className="text-sm text-[#7c8e88]">
              Crunching token logs and calculating investments...
            </p>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-8">
        <Card className="p-12 border-red-100 bg-red-50 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-900">Analytics Outage</h3>
            <p className="text-sm text-red-700 max-w-md mx-auto">{error}</p>
          </div>
          <Button
            onClick={() => fetchStats()}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
          >
            Retry Sync
          </Button>
        </Card>
      </div>
    );

  const mainChartData = {
    labels: data.dailyUsage.map((d) =>
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Tokens',
        data: data.dailyUsage.map((d) => d.tokens),
        backgroundColor: '#1f644e',
        borderRadius: 4,
        barThickness: range === 7 ? 40 : range === 30 ? 12 : 6,
      },
    ],
  };

  const usageBreakdownData = {
    labels: ['Prompt', 'Completion'],
    datasets: [
      {
        data: [data.summary.promptTokens, data.summary.completionTokens],
        backgroundColor: ['#1f644e', '#50c878'],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const successRate = (data.summary.successCount / (data.summary.totalExecutions || 1)) * 100;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 font-[family-name:var(--font-lora)] animate-in fade-in duration-700">
      {/* Header & Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Badge className="bg-[#f0f5f2] text-[#1f644e] border-[#d4e6de] px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-widest">
              Admin Dashboard
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-[#b5c4be]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live System
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#1e3a34] tracking-tight">Analytics Engine</h1>
          <p className="text-[#7c8e88] text-sm">
            Monitoring the heartbeat of Coursify's AI generation pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-[#e5e3d8] shadow-sm shadow-[#1f644e]/5">
          {[
            { label: '7D', value: 7 },
            { label: '30D', value: 30 },
            { label: '90D', value: 90 },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setRange(btn.value)}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                range === btn.value
                  ? 'bg-[#1f644e] text-white shadow-md shadow-[#1f644e]/20'
                  : 'text-[#7c8e88] hover:bg-gray-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-100 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchStats()}
            className="w-9 h-9 rounded-xl hover:bg-[#f0f5f2] text-[#1f644e]"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'System Success',
            value: successRate.toFixed(1) + '%',
            sub: `${data.summary.successCount} successful runs`,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Resource Load',
            value: (data.summary.totalTokens / 1000).toFixed(0) + 'k',
            sub: 'Total tokens generated',
            icon: Zap,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Token Investment',
            value: '₹' + data.summary.estimatedCostINR.toFixed(2),
            sub: 'Estimated API spend',
            icon: Coins,
            color: 'text-[#1f644e]',
            bg: 'bg-[#f0f5f2]',
          },
          {
            label: 'Active Courses',
            value: data.summary.totalCourses,
            sub: 'Saved in library',
            icon: BookOpen,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
        ].map((kpi, i) => (
          <Card key={i} className="p-6 border-[#e5e3d8] relative overflow-hidden group">
            <div
              className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-700 ${kpi.color}`}
            >
              <kpi.icon size={100} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}
              >
                <kpi.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a34]">{kpi.value}</p>
                <p className="text-[10px] font-bold text-[#b5c4be] uppercase tracking-widest mt-1">
                  {kpi.label}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[10px] text-[#7c8e88] font-medium">{kpi.sub}</span>
                  <ArrowUpRight className="w-3 h-3 text-[#1f644e] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Usage Trend */}
        <Card className="lg:col-span-2 p-8 border-[#e5e3d8] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f0f5f2] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#1f644e]" />
              </div>
              <h2 className="text-lg font-bold text-[#1e3a34]">Generation Volume</h2>
            </div>
            <Badge className="bg-gray-50 text-[#7c8e88] border-[#e5e3d8] font-mono text-[10px]">
              {range} Day Window
            </Badge>
          </div>
          <div className="h-[350px]">
            <Bar
              data={mainChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: '#f8faf9', drawBorder: false },
                    ticks: { color: '#b5c4be', font: { size: 10 } },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: '#b5c4be', font: { size: 10 } },
                  },
                },
              }}
            />
          </div>
        </Card>

        {/* Token Mix */}
        <Card className="p-8 border-[#e5e3d8] flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <PieIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a34]">Token Mix</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full aspect-square max-w-[200px] mb-8 relative">
              <Pie
                data={usageBreakdownData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: { legend: { display: false } },
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-[#b5c4be] font-bold uppercase tracking-widest">Total</p>
                <p className="text-xl font-bold text-[#1e3a34]">
                  {(data.summary.totalTokens / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
            <div className="w-full space-y-3">
              {[
                {
                  label: 'Prompt',
                  value: data.summary.promptTokens,
                  color: 'bg-[#1f644e]',
                  pct: (data.summary.promptTokens / data.summary.totalTokens) * 100,
                },
                {
                  label: 'Completion',
                  value: data.summary.completionTokens,
                  color: 'bg-[#50c878]',
                  pct: (data.summary.completionTokens / data.summary.totalTokens) * 100,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-[#7c8e88] font-bold">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#1e3a34] font-bold">{item.pct.toFixed(0)}%</span>
                    <span className="text-[#b5c4be] ml-2">({(item.value / 1000).toFixed(1)}k)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Top Topics Table - FULL WIDTH */}
      <Card className="p-0 border-[#e5e3d8] overflow-hidden flex flex-col shadow-sm">
        <div className="p-6 border-b border-[#e5e3d8] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Hash className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a34]">Popular Research Topics</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#b5c4be]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter topics..."
              className="pl-9 pr-4 py-2 bg-gray-50 border border-[#e5e3d8] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#1f644e]/30 w-full sm:w-64 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest border-b border-[#e5e3d8]">
              <tr>
                <th className="px-6 py-4">Topic</th>
                <th
                  className="px-6 py-4 cursor-pointer hover:text-[#1f644e]"
                  onClick={() => {
                    setSortField('count');
                    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                  }}
                >
                  <div className="flex items-center gap-1">
                    Frequency <ArrowUpDown size={10} />
                  </div>
                </th>
                <th
                  className="px-6 py-4 cursor-pointer hover:text-[#1f644e]"
                  onClick={() => {
                    setSortField('tokens');
                    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                  }}
                >
                  <div className="flex items-center gap-1">
                    Tokens <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="px-6 py-4 text-right">Investment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTopics.map((topic, i) => (
                <tr key={i} className="hover:bg-[#f0f5f2]/20 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-[#1e3a34] group-hover:text-[#1f644e] transition-colors">
                      {topic.title}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-gray-50 text-[#7c8e88] font-mono text-[10px] border-none">
                      {topic.count} runs
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#4a5d57] font-mono">
                    {(topic.tokens / 1000).toFixed(1)}k
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#1e3a34] text-sm">
                    ₹{topic.cost.toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredTopics.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-[#7c8e88]">
                    No matching topics found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Live Logs - FULL WIDTH */}
      <Card className="p-0 border-[#e5e3d8] overflow-hidden flex flex-col shadow-sm">
        <div className="p-6 border-b border-[#e5e3d8] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-[#1e3a34]">Execution Log</h2>
          </div>
          <Button
            variant="outline"
            size="small"
            onClick={handleExportCSV}
            className="text-[10px] h-8 font-bold border-[#d4e6de] text-[#1f644e] hover:bg-[#f0f5f2] rounded-xl flex items-center gap-2"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest border-b border-[#e5e3d8]">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4 text-right">Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentLogs.map((log, i) => (
                <tr key={i} className="hover:bg-[#f0f5f2]/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#1e3a34]">
                        {new Date(log.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-[10px] text-[#b5c4be]">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {log.status === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${log.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#7c8e88]">
                    {(log.durationMs / 1000).toFixed(1)}s
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-[#1e3a34]">
                        {log.usage?.totalTokens?.toLocaleString() || 0} t
                      </span>
                      <span className="text-[9px] text-[#b5c4be] font-bold uppercase">
                        Estimated
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t border-[#e5e3d8] flex items-center justify-center">
          <button className="text-[10px] font-bold text-[#1f644e] uppercase tracking-widest hover:underline flex items-center gap-1">
            View Full System Logs <ChevronRight size={10} />
          </button>
        </div>
      </Card>
    </div>
  );
}
