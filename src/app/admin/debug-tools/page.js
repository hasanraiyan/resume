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
];

const KEY_MAP = {
  youtube_search: 'GOOGLE_API_KEY',
  tavily_search: 'TAVILY_API_KEY',
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
    </div>
  );
}
