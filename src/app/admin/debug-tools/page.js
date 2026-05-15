'use client';

import { useState } from 'react';
import {
  Search,
  Youtube,
  Globe,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Hash,
  ExternalLink,
  Code2,
  Terminal,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/custom-ui';

const TOOLS = [
  {
    id: 'youtube_search',
    name: 'YouTube Search',
    icon: Youtube,
    color: 'text-red-500',
    bg: 'bg-red-50',
    description: 'Find educational videos and tutorials',
  },
  {
    id: 'tavily_search',
    name: 'Tavily Web Search',
    icon: Globe,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    description: 'General web research and fact-finding',
  },
];

export default function DebugToolsPage() {
  const [selectedTool, setSelectedTool] = useState(TOOLS[0].id);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/admin/debug-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: selectedTool,
          query: query.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-[family-name:var(--font-lora)]">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#1e3a34] flex items-center gap-3">
          <Terminal className="w-8 h-8 text-[#1f644e]" />
          Agentic Tool Debugger
        </h1>
        <p className="text-[#7c8e88] text-sm">
          Test and verify tool outputs in isolation before deploying to agent chains.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TOOLS.map((tool) => (
          <Card
            key={tool.id}
            onClick={() => setSelectedTool(tool.id)}
            className={`cursor-pointer transition-all border-2 relative overflow-hidden ${
              selectedTool === tool.id
                ? 'border-[#1f644e] bg-white shadow-lg shadow-[#1f644e]/5 ring-1 ring-[#1f644e]/10'
                : 'border-transparent bg-gray-50 hover:bg-white hover:border-[#d4e6de]'
            }`}
          >
            <div className={`absolute top-0 right-0 p-3 opacity-10 ${tool.color}`}>
              <tool.icon size={64} />
            </div>
            <div className="p-5 relative z-10">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${tool.bg} ${tool.color}`}
              >
                <tool.icon size={20} />
              </div>
              <h3 className="font-bold text-[#1e3a34] mb-1">{tool.name}</h3>
              <p className="text-xs text-[#7c8e88] leading-relaxed">{tool.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 border-[#e5e3d8]">
        <form onSubmit={handleTest} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b5c4be]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Enter test query for ${TOOLS.find((t) => t.id === selectedTool).name}...`}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#e5e3d8] rounded-2xl focus:ring-2 focus:ring-[#1f644e]/20 focus:border-[#1f644e] transition-all outline-none text-[#1e3a34]"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-[#1f644e] hover:bg-[#184d3c] text-white px-8 rounded-2xl flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            Run Test
          </Button>
        </form>
      </Card>

      {error && (
        <Card className="p-6 border-red-100 bg-red-50 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-red-900 mb-1">Execution Failed</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {response && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className="bg-[#f0f5f2] text-[#1f644e] border-[#d4e6de] px-3 py-1"
              >
                <Clock className="w-3 h-3 mr-1.5" />
                {response.duration}
              </Badge>
              <Badge
                variant="outline"
                className="bg-[#f0f5f2] text-[#1f644e] border-[#d4e6de] px-3 py-1"
              >
                <Hash className="w-3 h-3 mr-1.5" />
                {selectedTool === 'tavily_search'
                  ? response.result?.results?.length || 0
                  : Array.isArray(response.result)
                    ? response.result.length
                    : 1}{' '}
                Results
              </Badge>
            </div>
            <div className="text-xs font-bold text-[#b5c4be] uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Success
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visual Results */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#7c8e88] uppercase tracking-widest flex items-center gap-2">
                {selectedTool === 'tavily_search' ? (
                  <Globe className="w-4 h-4" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {selectedTool === 'tavily_search' ? 'Search Results' : 'Visual Output'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedTool === 'tavily_search' && response.result?.answer && (
                  <div className="col-span-full mb-4">
                    <Card className="p-5 border-emerald-100 bg-emerald-50/50 backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-600">
                        <Globe size={48} />
                      </div>
                      <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        AI Summary
                      </h3>
                      <p className="text-sm text-emerald-900 leading-relaxed font-medium">
                        {response.result.answer}
                      </p>
                    </Card>
                  </div>
                )}

                {selectedTool === 'youtube_search' &&
                  Array.isArray(response.result) &&
                  response.result.map((vid, i) => (
                    <Card key={i} className="overflow-hidden group border-[#e5e3d8]">
                      <div className="aspect-video bg-gray-100 relative">
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                            <Play size={20} fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h4
                          className="text-xs font-bold text-[#1e3a34] line-clamp-2 mb-1"
                          title={vid.title}
                        >
                          {vid.title}
                        </h4>
                        <p className="text-[10px] text-[#7c8e88] mb-2">{vid.channelTitle}</p>
                        <a
                          href={vid.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-[#1f644e] flex items-center gap-1 hover:underline"
                        >
                          Watch Video <ExternalLink size={10} />
                        </a>
                      </div>
                    </Card>
                  ))}

                {selectedTool === 'tavily_search' && (
                  <div className="col-span-full space-y-3">
                    {Array.isArray(response.result?.results || response.result) &&
                      (response.result?.results || response.result).map((res, i) => (
                        <Card
                          key={i}
                          className="p-4 border-[#e5e3d8] hover:border-[#1f644e] transition-colors"
                        >
                          <h4 className="text-sm font-bold text-[#1e3a34] mb-2">
                            {res.title || 'Search Result'}
                          </h4>
                          <p className="text-xs text-[#7c8e88] leading-relaxed mb-3 line-clamp-3">
                            {res.content || res.snippet}
                          </p>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-[#1f644e] flex items-center gap-1 hover:underline"
                          >
                            {res.url} <ExternalLink size={10} />
                          </a>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Raw JSON Data */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#7c8e88] uppercase tracking-widest flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Raw JSON Payload
              </h2>
              <div className="bg-[#1e3a34] rounded-2xl p-6 overflow-hidden relative group">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge className="bg-white/10 text-white/60 text-[10px] border-none backdrop-blur-md">
                    Read-only
                  </Badge>
                </div>
                <pre className="text-[11px] font-mono text-[#d4e6de] leading-relaxed overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-white/10">
                  {JSON.stringify(response.result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
