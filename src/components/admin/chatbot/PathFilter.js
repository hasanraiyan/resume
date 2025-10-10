'use client';

import { Filter } from 'lucide-react';

export default function PathFilter({ paths, onFilter, currentPath }) {
  return (
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
      <select
        onChange={(e) => onFilter(e.target.value)}
        value={currentPath}
        className="w-full p-3 pl-10 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent appearance-none"
      >
        <option value="">Filter by path...</option>
        {paths.map((path) => (
          <option key={path} value={path}>
            {path}
          </option>
        ))}
      </select>
    </div>
  );
}
