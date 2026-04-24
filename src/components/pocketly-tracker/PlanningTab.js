'use client';

import { useState } from 'react';
import { Tag, Target } from 'lucide-react';
import TopTabs from '@/components/ui/TopTabs';
import CategoriesTab from './CategoriesTab';
import BudgetsTab from './BudgetsTab';

const viewOptions = [
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'budgets', label: 'Budgets', icon: Target },
];

export default function PlanningTab() {
  const [activeView, setActiveView] = useState('categories');

  return (
    <div className="w-full pb-28 sm:pb-12">
      {/* Top Navigation Tabs */}
      <div className="w-full bg-[#fcfbf5] sticky top-14 lg:top-[61px] z-10 pb-4 pt-2 px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto flex justify-center">
          <TopTabs
            options={viewOptions}
            activeId={activeView}
            onChange={setActiveView}
            showLabelOnMobile={true}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full">
        {activeView === 'categories' ? <CategoriesTab /> : <BudgetsTab />}
      </div>
    </div>
  );
}
