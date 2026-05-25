'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { BarChart3, Info, AlertCircle } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

// Dynamic loader for Chart.js components
const ChartComponent = dynamic(
  async () => {
    const {
      Chart: ChartJS,
      CategoryScale,
      LinearScale,
      BarElement,
      LineElement,
      PointElement,
      ArcElement,
      RadialLinearScale,
      BarController,
      LineController,
      PieController,
      DoughnutController,
      PolarAreaController,
      RadarController,
      ScatterController,
      BubbleController,
      Title,
      Tooltip,
      Legend,
    } = await import('chart.js');
    const { Bar, Line, Pie, Doughnut, PolarArea, Radar, Scatter, Bubble } =
      await import('react-chartjs-2');

    ChartJS.register(
      CategoryScale,
      LinearScale,
      BarElement,
      LineElement,
      PointElement,
      ArcElement,
      RadialLinearScale,
      BarController,
      LineController,
      PieController,
      DoughnutController,
      PolarAreaController,
      RadarController,
      ScatterController,
      BubbleController,
      Title,
      Tooltip,
      Legend
    );

    // Return a wrapper that can handle all chart types
    return function Charts({ type, data, options, style }) {
      const components = { Bar, Line, Pie, Doughnut, PolarArea, Radar, Scatter, Bubble };
      const ChartToRender = components[type.charAt(0).toUpperCase() + type.slice(1)] || Bar;
      return <ChartToRender data={data} options={options} style={style} />;
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] bg-[#fcfbf5] rounded-2xl overflow-hidden">
        <div className="h-full flex flex-col justify-between p-6">
          {/* Y-axis skeleton bars */}
          <div className="flex items-end justify-between gap-3 h-4/5">
            {[0.8, 0.6, 0.9, 0.5, 0.7, 0.85].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-b from-[#e5e3d8] to-[#d9d7cc] rounded-t-lg animate-pulse"
                  style={{ height: `${height * 100}%` }}
                />
              </div>
            ))}
          </div>
          {/* X-axis skeleton labels */}
          <div className="flex justify-between gap-3 mt-4">
            {[0.4, 0.35, 0.45, 0.3, 0.5, 0.38].map((width, i) => (
              <div
                key={i}
                className="h-3 bg-[#e5e3d8] rounded animate-pulse"
                style={{ width: `${width * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

const CHART_COLORS = [
  '#1f644e', // Coursify Green
  '#4a90d9', // Blue
  '#e67e22', // Orange
  '#9b59b6', // Purple
  '#e74c3c', // Red
  '#1abc9c', // Teal
  '#f1c40f', // Yellow
  '#34495e', // Navy
  '#7f8c8d', // Gray
  '#27ae60', // Emerald
];

export function ChartBlock({ block }) {
  const chartData = block.chart;

  // Destructure with safe defaults
  const {
    type = 'bar',
    title,
    description,
    data = { labels: [], datasets: [] },
    options = {},
  } = chartData || {};

  const processedData = useMemo(() => {
    if (!data || !data.datasets || !Array.isArray(data.datasets)) return null;

    return {
      labels: data.labels || [],
      datasets: data.datasets.map((ds, idx) => ({
        label: ds.label || `Series ${idx + 1}`,
        data: ds.data || [],
        backgroundColor: ds.color || CHART_COLORS[idx % CHART_COLORS.length],
        borderColor: ds.color || CHART_COLORS[idx % CHART_COLORS.length],
        borderWidth: type === 'line' || type === 'radar' ? 2 : 1,
        tension: 0.3,
      })),
    };
  }, [data, type]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: options.showLegend !== false,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            padding: 20,
            font: { size: 12, weight: 'bold', family: 'inherit' },
            color: '#1e3a34',
          },
        },
        tooltip: {
          backgroundColor: '#1e3a34',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          cornerRadius: 8,
          displayColors: true,
        },
      },
      scales:
        type === 'bar' || type === 'line' || type === 'scatter' || type === 'bubble'
          ? {
              x: {
                stacked: options.stacked || false,
                grid: { display: options.showGrid !== false, color: '#f0f0f0' },
                ticks: { color: '#7c8e88', font: { size: 11, weight: '600' } },
              },
              y: {
                beginAtZero: options.beginAtZero !== false,
                stacked: options.stacked || false,
                grid: { display: options.showGrid !== false, color: '#f0f0f0' },
                ticks: { color: '#7c8e88', font: { size: 11, weight: '600' } },
              },
            }
          : undefined,
      indexAxis: options.indexAxis || 'x',
      ...options,
    }),
    [type, options]
  );

  // Error Placeholder
  if (!chartData || !data || !data.datasets || data.datasets.length === 0) {
    return (
      <div className="my-6 p-8 rounded-3xl border-2 border-dashed border-[#e5e3d8] bg-[#fcfbf5] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-[#c94c4c]" />
        </div>
        <p className="text-[#1e3a34] font-bold">Invalid Chart Configuration</p>
        <p className="text-xs text-[#7c8e88] mt-1 max-w-[280px]">
          Make sure your datasets and labels are properly defined in the editor.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-8 overflow-hidden rounded-3xl border border-[#e5e3d8] bg-white"
    >
      {(title || description) && (
        <div className="p-6 border-b border-[#fcfbf5] bg-[#fcfbf5]/50">
          {title && (
            <h3 className="text-lg font-bold text-[#1e3a34]">
              <MarkdownRenderer content={title} bare={true} />
            </h3>
          )}
          {description && (
            <div className="text-sm text-[#7c8e88] mt-1 [&_p]:!text-[#7c8e88] [&_p]:!text-sm [&_p]:!leading-relaxed">
              <MarkdownRenderer content={description} isInline={true} />
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="h-[350px] relative">
          <ChartComponent
            type={type}
            data={processedData}
            options={chartOptions}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {options.footer && (
        <div className="px-6 py-4 bg-[#fcfbf5]/30 border-t border-[#fcfbf5] flex items-center gap-2 [&_p]:!text-[#7c8e88] [&_p]:!text-[11px] [&_p]:!font-medium">
          <Info className="w-3.5 h-3.5 text-[#1f644e] shrink-0" />
          <div className="flex-1 text-[11px] font-medium text-[#7c8e88]">
            <MarkdownRenderer content={options.footer} isInline={true} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
