'use client';

import { useState } from 'react';
import { Search, Loader2, Calendar, Hash, Smile, ChevronRight, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function SearchTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch('/api/journaly/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setHasSearched(true);
      } else {
        toast.error(data.message || 'Search failed');
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-3 text-center sm:text-left">Semantic Search</h1>
        <p className="text-[#7c8e88] text-lg max-w-2xl text-center sm:text-left">
          Find memories by meaning, not just keywords. Ask things like &quot;When was I feeling most productive?&quot;
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative mb-12">
        <div className="relative group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isSearching ? 'text-[#1f644e]' : 'text-[#7c8e88]'}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe a memory or a feeling..."
            className="w-full pl-12 pr-32 py-4 rounded-2xl border-2 border-[#e5e3d8] bg-white text-lg outline-none focus:border-[#1f644e] shadow-sm transition-all"
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#1f644e] text-white rounded-xl font-bold hover:bg-[#17503e] disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
            Search
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-[#7c8e88]">
          <Info className="w-3.5 h-3.5" />
          <span>Powered by Qdrant Vector Search</span>
        </div>
      </form>

      {isSearching ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-[#e5e3d8] bg-white animate-pulse">
              <div className="h-4 bg-[#e5e3d8] rounded w-1/3 mb-4" />
              <div className="h-3 bg-[#e5e3d8] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#e5e3d8] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#e5e3d8] rounded-2xl">
          <p className="text-[#7c8e88] text-lg italic">No matching memories found.</p>
          <p className="text-sm text-[#7c8e88]/70 mt-2">Try rephrasing your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((result) => (
            <div
              key={result._id}
              className="group p-6 rounded-2xl border border-[#e5e3d8] bg-white hover:border-[#1f644e]/30 transition-all duration-300 shadow-sm flex flex-col sm:flex-row gap-6"
            >
              <div className="sm:w-24 shrink-0 flex flex-col items-center justify-center py-4 bg-[#fcfbf5] rounded-xl border border-[#e5e3d8]/50">
                <span className="text-4xl mb-2">{getMoodEmoji(result.mood)}</span>
                <span className="text-[10px] font-bold text-[#1f644e] bg-[#1f644e]/10 px-2 py-0.5 rounded-full">
                  {Math.round(result.score * 100)}% Match
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-xl text-[#1e3a34] group-hover:text-[#1f644e] transition-colors mb-1">
                      {result.title || 'Untitled Entry'}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(result.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      {result.tags?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5" />
                          {result.tags.slice(0, 2).join(', ')}
                          {result.tags.length > 2 && ` +${result.tags.length - 2}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#7c8e88] leading-relaxed line-clamp-3 mb-4">
                  {result.body}
                </p>

                <div className="flex items-center justify-end">
                  <button className="flex items-center gap-1.5 text-xs font-bold text-[#1f644e] hover:underline">
                    Read Memory <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getMoodEmoji(mood) {
  const moods = { 1: '😔', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩' };
  return moods[mood] || '🙂';
}
