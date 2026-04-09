'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import SearchBar from '@/components/admin/chatbot/SearchBar';
import { MINI_APPS } from '@/config/miniApps';

export default function AppStoreClient() {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const filteredApps = normalizedQuery
    ? MINI_APPS.filter((app) => {
        const haystack = `${app.name} ${app.tagline} ${app.category}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : MINI_APPS;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">App Store</h1>
          <p className="mt-1 text-sm text-gray-600 max-w-xl">
            Launch the mini apps in this portfolio suite from a single place.
          </p>
        </div>
        <div className="w-full md:w-72">
          <SearchBar
            initialQuery={query}
            onSearch={(value) => setQuery(value)}
            placeholder="Search apps..."
          />
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredApps.map((app) => (
          <Card
            key={app.id}
            variant="flat"
            interactive
            className="h-full p-5 border border-gray-200 hover:border-gray-900 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl overflow-hidden bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <img
                      src={app.iconSrc}
                      alt={`${app.name} icon`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 leading-tight">
                      {app.name}
                    </h2>
                  </div>
                </div>
                <Badge variant="soft" className="text-[10px] uppercase tracking-wide">
                  {app.category}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">{app.tagline}</p>
            </div>

            <div className="flex items-center justify-between mt-2">
              <Button
                asChild
                size="small"
                variant="primary"
                className="text-xs tracking-wide rounded-full px-5"
              >
                <Link href={app.href}>Open</Link>
              </Button>

              <Button asChild size="small" variant="outline">
                <Link href={app.href}>Launch App</Link>
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
