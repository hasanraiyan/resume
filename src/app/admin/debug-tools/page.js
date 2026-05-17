'use client';

import { useState, useEffect } from 'react';
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
  Key,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/custom-ui';
import { toast } from 'sonner';

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
  {
    id: 'firecrawl_scrape',
    name: 'Firecrawl Scrape',
    icon: Globe,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    description: 'Scrape a specific URL into clean Markdown',
  },
];

const KEY_MAP = {
  youtube_search: 'GOOGLE_API_KEY',
  tavily_search: 'TAVILY_API_KEY',
  firecrawl_scrape: 'FIRECRAWL_SCRAPE_API_KEY',
};

export default function DebugToolsPage() {
  const [selectedTool, setSelectedTool] = useState(TOOLS[0].id);
  const [query, setQuery] = useState('');
  const [apiKey, setApiKey] = useState(''); // New: API Key override
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const [availableKeys, setAvailableKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [testingKeyIndex, setTestingKeyIndex] = useState(null); // New: tracking which key is being fetched

  const fetchKeys = async () => {
    const keyName = KEY_MAP[selectedTool];
    if (!keyName) return;

    setLoadingKeys(true);
    try {
      // Map to the endpoint's expected toolId format (e.g. 'tavily' instead of 'tavily_search')
      const toolId = selectedTool.split('_')[0];
      const res = await fetch(`/api/admin/tools/usage?toolId=${toolId}&keyName=${keyName}`);
      if (res.ok) {
        const { results } = await res.json();
        setAvailableKeys(results || []);
      }
    } catch (err) {
      console.error('Failed to fetch keys:', err);
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [selectedTool]);

  const selectKeyForTesting = async (idx) => {
    const keyName = KEY_MAP[selectedTool];
    setTestingKeyIndex(idx);
    try {
      const res = await fetch(
        `/api/admin/debug-tools?action=get_decrypted_key&keyName=${keyName}&index=${idx}`
      );
      if (res.ok) {
        const { fullKey } = await res.json();
        setApiKey(fullKey);
        toast.success(`Key selected for testing`);
      } else {
        toast.error('Failed to decrypt key');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setTestingKeyIndex(null);
    }
  };

  const handleTest = async (e) => {
    if (e) e.preventDefault();
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
          params: {
            apiKey: apiKey.trim() || undefined,
          },
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-[#e5e3d8]">
            <form onSubmit={handleTest} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b5c4be]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      selectedTool === 'firecrawl_scrape'
                        ? 'Enter URL to scrape...'
                        : `Enter test query for ${TOOLS.find((t) => t.id === selectedTool).name}...`
                    }
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
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Key size={12} className="text-[#1f644e]" />
                  API Key Override (Optional)
                </h4>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste a specific key to test it individually (Leave empty to use database pool)"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-[#e5e3d8] rounded-xl focus:border-[#1f644e] transition-all outline-none text-xs font-mono"
                />
              </div>
            </form>
          </Card>

          {error && (
            <Card className="p-6 border-red-100 bg-red-50 flex items-start gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-1">Execution Failed</h3>
                <p className="text-sm text-red-700 font-mono bg-white/50 p-2 rounded-lg mt-2 border border-red-200">
                  {error}
                </p>
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

        <div className="space-y-6">
          <h2 className="text-sm font-bold text-[#7c8e88] uppercase tracking-widest flex items-center gap-2">
            <Key className="w-4 h-4" />
            Existing Keys in Pool
          </h2>
          <Card className="p-4 border-[#e5e3d8] bg-gray-50/50">
            {loadingKeys ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="w-6 h-6 text-[#1f644e] animate-spin mb-2" />
                <span className="text-[10px] text-neutral-400">Fetching keys...</span>
              </div>
            ) : availableKeys.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs italic">
                No keys found for this tool
              </div>
            ) : (
              <div className="space-y-2">
                {availableKeys.map((key, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-[#e5e3d8] rounded-xl flex items-center justify-between group"
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-neutral-500 leading-none mb-1">
                        {key.keyId}
                      </span>
                      {key.error ? (
                        <span className="text-[9px] text-red-500 font-bold uppercase">Dead</span>
                      ) : (
                        <span className="text-[9px] text-emerald-600 font-bold uppercase">
                          Working
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={testingKeyIndex !== null}
                      onClick={() => selectKeyForTesting(idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 text-[10px] px-2 text-[#1f644e] flex items-center gap-1"
                    >
                      {testingKeyIndex === idx ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        'Test This Key'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[9px] text-neutral-400 mt-4 leading-relaxed italic">
              Use this sidebar to identify which keys in your pool are working. Masked IDs match the
              ones in the Small Claw {' > '} Tools tab.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
