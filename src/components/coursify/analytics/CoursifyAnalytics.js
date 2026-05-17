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
  Download,
  PieChart as PieIcon,
  ChevronRight,
  Search,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
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

export function CoursifyAnalytics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState(30);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-[#f0f5f2] border-t-[#1f644e] rounded-full animate-spin" />
            <BarChart3 className="w-5 h-5 text-[#1f644e] absolute inset-0 m-auto" />
          </div>
          <p className="text-sm font-bold text-[#1e3a34]">Syncing Intelligence Engine...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <Card className="p-12 border-red-100 bg-red-50 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
        <div>
          <h3 className="text-lg font-bold text-red-900">Analytics Outage</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <Button onClick={() => fetchStats()} className="bg-red-600 text-white">
          Retry Sync
        </Button>
      </Card>
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
        barThickness: range === 7 ? 30 : range === 30 ? 10 : 4,
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
      },
    ],
  };

  const successRate = (data.summary.successCount / (data.summary.totalExecutions || 1)) * 100;

  return (
    <div className="space-y-10">
      {/* Filters Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1e3a34]">Intelligence Dashboard</h2>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#e5e3d8]">
          {[7, 30, 90].map((v) => (
            <button
              key={v}
              onClick={() => setRange(v)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                range === v ? 'bg-[#1f644e] text-white' : 'text-[#7c8e88] hover:bg-gray-50'
              }`}
            >
              {v}D
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'System Success',
            value: successRate.toFixed(1) + '%',
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Token Load',
            value: (data.summary.totalTokens / 1000).toFixed(0) + 'k',
            icon: Zap,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Investment',
            value: '$' + (data.summary.estimatedCostUSD || 0).toFixed(3),
            icon: Coins,
            color: 'text-[#1f644e]',
            bg: 'bg-[#f0f5f2]',
          },
          {
            label: 'Library Size',
            value: data.summary.totalCourses,
            icon: BookOpen,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
        ].map((kpi, i) => (
          <Card key={i} className="p-4 border-[#e5e3d8] flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}
            >
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="text-lg font-bold text-[#1e3a34]">{kpi.value}</p>
              <p className="text-[10px] font-bold text-[#b5c4be] uppercase tracking-widest">
                {kpi.label}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-[#e5e3d8]">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-4 h-4 text-[#1f644e]" />
            <h3 className="text-sm font-bold text-[#1e3a34]">Generation Volume</h3>
          </div>
          <div className="h-[250px]">
            <Bar
              data={mainChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </Card>

        <Card className="p-6 border-[#e5e3d8] flex flex-col items-center">
          <h3 className="text-sm font-bold text-[#1e3a34] w-full text-left mb-6">Token Mix</h3>
          <div className="w-full max-w-[150px] relative">
            <Pie
              data={usageBreakdownData}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] font-bold text-[#1e3a34]">
                {(data.summary.totalTokens / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
          <div className="w-full mt-6 space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#7c8e88]">Input</span>
              <span className="font-bold">{(data.summary.promptTokens / 1000).toFixed(1)}k</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#7c8e88]">Output</span>
              <span className="font-bold">
                {(data.summary.completionTokens / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Topics Table */}
      <Card className="p-0 border-[#e5e3d8] overflow-hidden">
        <div className="p-4 border-b border-[#e5e3d8] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1e3a34]">Top Research Topics</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#b5c4be]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter..."
              className="pl-8 pr-3 py-1.5 bg-gray-50 border border-[#e5e3d8] rounded-lg text-[10px] outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-3 w-1/2">Topic</th>
                <th className="px-6 py-3">Frequency</th>
                <th className="px-6 py-3">Tokens</th>
                <th className="px-6 py-3 text-right">Investment</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {filteredTopics.map((topic, i) => (
                <tr key={i} className="hover:bg-[#f0f5f2]/20">
                  <td className="px-6 py-3 font-bold">
                    <div className="line-clamp-2 leading-relaxed" title={topic.title}>
                      {topic.title}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-[#7c8e88] whitespace-nowrap">{topic.count} runs</td>
                  <td className="px-6 py-3 text-[#7c8e88] whitespace-nowrap">
                    {(topic.tokens / 1000).toFixed(1)}k
                  </td>
                  <td className="px-6 py-3 text-right font-bold whitespace-nowrap">
                    ${(topic.costUSD || 0).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
