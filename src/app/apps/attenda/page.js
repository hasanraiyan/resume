'use client';

import { useState } from 'react';
import { AttendaProvider, useAttenda } from '@/context/AttendaContext';
import AppLayout from '@/components/layout/AppLayout';
import AdminGuard from '@/components/AdminGuard';
import SessionProvider from '@/components/SessionProvider';
import { CalendarDays, BarChart3, Settings } from 'lucide-react';
import CalendarTab from '@/components/attenda/CalendarTab';
import AnalyticsTab from '@/components/attenda/AnalyticsTab';
import SemesterTab from '@/components/attenda/SemesterTab';

const tabs = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'semester', label: 'Semester', icon: Settings },
];

function AttendaContent() {
  const [activeTab, setActiveTab] = useState('calendar');
  const { activeSemester, isLoading, isInitialized, addSemester } = useAttenda();

  // Override activeTab tracking via AppLayout — we manage our own
  const renderTab = () => {
    if (!isInitialized) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-[#1f644e]/30 border-t-[#1f644e] rounded-full animate-spin" />
        </div>
      );
    }

    if (isInitialized && !isLoading && !activeSemester) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#1f644e]/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#1f644e]" />
          </div>
          <h2 className="text-xl font-bold text-[#1e3a34] mb-2">Welcome to Attenda</h2>
          <p className="text-sm text-[#7c8e88] mb-8 max-w-sm">
            Track your college attendance effortlessly. Start by creating your first semester.
          </p>
          <button
            onClick={() => {
              const name = prompt('Enter semester name (e.g., "Semester VI"):');
              if (name?.trim()) {
                addSemester({ name: name.trim() });
                setActiveTab('semester');
              }
            }}
            className="bg-[#1f644e] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors shadow-sm"
          >
            Create Your First Semester
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'calendar':
        return <CalendarTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'semester':
        return <SemesterTab />;
      default:
        return <CalendarTab />;
    }
  };

  const tabTitles = {
    calendar: 'Calendar',
    analytics: 'Analytics',
    semester: 'Semester',
  };

  return (
    <AppLayout
      appName="Attenda"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabTitles={tabTitles}
    >
      {renderTab()}
    </AppLayout>
  );
}

export default function AttendaPage() {
  return (
    <SessionProvider>
      <AdminGuard appName="Attenda">
        <AttendaProvider>
          <AttendaContent />
        </AttendaProvider>
      </AdminGuard>
    </SessionProvider>
  );
}
