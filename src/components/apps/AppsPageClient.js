'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import SearchBar from '@/components/admin/chatbot/SearchBar';
import { MINI_APPS } from '@/config/miniApps';

export default function AppsPageClient() {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const filteredApps = normalizedQuery
    ? MINI_APPS.filter((app) => {
        const haystack = `${app.name} ${app.tagline} ${app.category}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : MINI_APPS;

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">Apps</h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            Launch and explore the suite of mini applications built into this portfolio
          </p>
        </div>
        <div className="w-full md:w-80 flex-shrink-0">
          <SearchBar
            initialQuery={query}
            onSearch={(value) => setQuery(value)}
            placeholder="Search apps..."
          />
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map((app) => (
          <Card
            key={app.id}
            variant="flat"
            interactive
            className="h-full p-6 border border-gray-200 hover:border-gray-900 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <img
                      src={app.iconSrc}
                      alt={`${app.name} icon`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 leading-tight">
                      {app.name}
                    </h2>
                  </div>
                </div>
                <Badge variant="soft" className="text-[10px] uppercase tracking-wide">
                  {app.category}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">{app.tagline}</p>
            </div>

            <Button
              asChild
              variant="primary"
              className="w-full text-center justify-center rounded-lg"
            >
              <Link href={app.href}>Launch App</Link>
            </Button>
          </Card>
        ))}
      </section>

      {filteredApps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 text-lg">No apps found matching &quot;{query}&quot;</p>
          <Button onClick={() => setQuery('')} variant="ghost" className="mt-4 text-sm">
            Clear search
          </Button>
        </div>
      )}
    </div>
  );
}
