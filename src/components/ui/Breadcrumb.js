'use client';

// src/components/ui/Breadcrumb.js

import React from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Home,
  FolderOpen,
  FileText,
  Globe,
  Smartphone,
  Palette,
  Code,
} from 'lucide-react';

const getIconComponent = (iconName) => {
  switch (iconName) {
    case 'Home':
      return Home;
    case 'FolderOpen':
      return FolderOpen;
    case 'FileText':
      return FileText;
    case 'Globe':
      return Globe;
    case 'Smartphone':
      return Smartphone;
    case 'Palette':
      return Palette;
    case 'Code':
      return Code;
    default:
      return null;
  }
};

/**
 * A reusable breadcrumb component for navigation
 *
 * @param {object} props - Component props
 * @param {Array} props.breadcrumbs - Array of breadcrumb items: [{ label, path?, icon?: 'Home' | 'FolderOpen' | 'FileText' | 'Globe' | 'Smartphone' | 'Palette' | 'Code' }]
 * @returns {JSX.Element} The rendered Breadcrumb component
 */
const Breadcrumb = ({ breadcrumbs }) => {
  // If 3 or fewer breadcrumbs, show all
  if (breadcrumbs.length <= 3) {
    return (
      <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 overflow-x-auto scrollbar-hide min-w-0 max-w-full px-4">
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />}
            {item.path && index < breadcrumbs.length - 1 ? (
              <Link
                href={item.path}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors flex-shrink-0"
              >
                {item.icon &&
                  React.createElement(getIconComponent(item.icon), {
                    size: 12,
                    className: 'sm:w-4 sm:h-4',
                  })}
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            ) : (
              <span
                className={`flex items-center gap-1 flex-shrink-0 ${index === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : ''}`}
              >
                {item.icon &&
                  React.createElement(getIconComponent(item.icon), {
                    size: 12,
                    className: 'sm:w-4 sm:h-4',
                  })}
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  }

  // If more than 3, show first, ellipsis, last
  const displayItems = [
    { ...breadcrumbs[0], originalIndex: 0 },
    { label: '...', isEllipsis: true },
    { ...breadcrumbs[breadcrumbs.length - 1], originalIndex: breadcrumbs.length - 1 },
  ];

  return (
    <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 overflow-x-auto scrollbar-hide min-w-0 max-w-full px-4">
      {displayItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />}
          {item.isEllipsis ? (
            <span className="flex items-center gap-1 flex-shrink-0">...</span>
          ) : item.path && item.originalIndex < breadcrumbs.length - 1 ? (
            <Link
              href={item.path}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors flex-shrink-0"
            >
              {item.icon &&
                React.createElement(getIconComponent(item.icon), {
                  size: 12,
                  className: 'sm:w-4 sm:h-4',
                })}
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          ) : (
            <span
              className={`flex items-center gap-1 flex-shrink-0 ${item.originalIndex === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : ''}`}
            >
              {item.icon &&
                React.createElement(getIconComponent(item.icon), {
                  size: 12,
                  className: 'sm:w-4 sm:h-4',
                })}
              <span className="truncate whitespace-nowrap">{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
