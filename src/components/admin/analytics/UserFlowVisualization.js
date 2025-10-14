'use client';

import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { SankeyController, Flow } from 'chartjs-chart-sankey';
import { Card } from '@/components/ui';
import TopPathsTable from './TopPathsTable';

// Register the Sankey controller and elements
ChartJS.register(...registerables, SankeyController, Flow);

// Replace the generateColor function with a controlled palette
const PALETTE = ['#2563eb', '#8b5cf6', '#db2777', '#16a34a', '#f97316', '#ca8a04', '#64748b'];
const colorCache = new Map();
let colorIndex = 0;

const getConsistentColor = (str) => {
  if (colorCache.has(str)) {
    return colorCache.get(str);
  }
  const color = PALETTE[colorIndex % PALETTE.length];
  colorCache.set(str, color);
  colorIndex++;
  return color;
};

export default function UserFlowVisualization({ data }) {
  if (!data || !data.links || data.links.length === 0) {
    return (
      <Card className="p-6 text-center text-neutral-500">
        <i className="fas fa-route text-4xl mb-4 text-neutral-300"></i>
        <h3 className="font-semibold text-lg text-neutral-700">Not Enough Data</h3>
        <p>
          There's not enough user flow data for the selected date range to generate a visualization.
        </p>
        <p className="text-sm text-neutral-400 mt-2">
          Try extending the date range or wait for more user interactions to generate meaningful
          flow data.
        </p>
      </Card>
    );
  }

  const chartData = {
    datasets: [
      {
        label: 'User Flow',
        data: data.links,
        // Use the new consistent color function
        colorFrom: (c) => getConsistentColor(c.raw.from),
        colorTo: (c) => getConsistentColor(c.raw.to),
        colorMode: 'gradient',
        size: 'max',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Top User Flow Paths',
        font: { size: 18, family: 'Playfair Display' },
      },
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const { from, to, flow } = context.raw;
            return `${flow} sessions: ${from} → ${to}`;
          },
        },
      },
    },
    // NEW: Add layout options for better spacing
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 10,
        right: 10,
      },
    },
    // You can experiment with these for node positioning
    // priority: {
    //   '(/)': 0,
    //   '(start)': 1,
    //   '(end)': 1,
    // }
  };

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="h-[700px]">
          <Chart type="sankey" data={chartData} options={chartOptions} />
        </div>
      </Card>
      <TopPathsTable journeys={data.topJourneys} />
    </div>
  );
}
