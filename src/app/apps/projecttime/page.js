'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SessionProvider from '@/components/SessionProvider';
import { SkeletonProvider, SkeletonWrapper } from 'react-skeletonify';
import 'react-skeletonify/dist/index.css';
import { Toaster } from 'sonner';

import { Clock, LayoutDashboard, FolderKanban, FileText, PieChart, Settings } from 'lucide-react';

import { ProjectTimeProvider, useProjectTime } from '@/components/projecttime/ProjectTimeContext';
import TimerTab from '@/components/projecttime/TimerTab';
import DashboardTab from '@/components/projecttime/DashboardTab';
import ProjectsTab from '@/components/projecttime/ProjectsTab';
import TimesheetTab from '@/components/projecttime/TimesheetTab';
import ReportsTab from '@/components/projecttime/ReportsTab';
import WorkspaceSettingsTab from '@/components/projecttime/WorkspaceSettingsTab';

const tabs = [
  { id: 'timer', label: 'Timer', icon: Clock },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'timesheet', label: 'Timesheet', icon: FileText },
  { id: 'reports', label: 'Reports', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const tabTitles = {
  timer: 'Time Tracker',
  dashboard: 'Project Dashboard',
  projects: 'Projects & Tasks',
  timesheet: 'Weekly Timesheet',
  reports: 'Reports & Analytics',
  settings: 'Workspace Settings',
};

export default function ProjectTimeApp() {
  return (
    <SessionProvider>
      <SkeletonProvider
        config={{
          animation: 'animation-1',
          borderRadius: '8px',
          animationSpeed: 2,
          exceptTags: ['button', 'svg', 'img', 'input', 'select'],
          background: '#e5e3d8',
        }}
      >
        <ProjectTimeProvider>
          <ProjectTimeContent />
          <Toaster position="top-right" />
        </ProjectTimeProvider>
      </SkeletonProvider>
    </SessionProvider>
  );
}

function ProjectTimeContent() {
  const [activeTab, setActiveTab] = useState('timer');
  const { isLoading } = useProjectTime();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'timer':
        return <TimerTab />;
      case 'dashboard':
        return <DashboardTab />;
      case 'projects':
        return <ProjectsTab />;
      case 'timesheet':
        return <TimesheetTab />;
      case 'reports':
        return <ReportsTab />;
      case 'settings':
        return <WorkspaceSettingsTab />;
      default:
        return <TimerTab />;
    }
  };

  return (
    <AppLayout
      appName="ProjectTime"
      appLogo="/images/apps/projecttime.png"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabTitles={tabTitles}
    >
      <div className="pt-2 lg:pt-6 pb-20 lg:pb-0">
        <SkeletonWrapper loading={isLoading}>{renderTabContent()}</SkeletonWrapper>
      </div>
    </AppLayout>
  );
}
