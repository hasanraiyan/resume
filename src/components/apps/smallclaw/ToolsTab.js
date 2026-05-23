'use client';

import { useState, useEffect } from 'react';
import {
  Wrench,
  Globe,
  Youtube,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Copy,
} from 'lucide-react';
import { Card } from '@/components/custom-ui';
import { toast } from 'sonner';

const TOOLS_LIST = [
  {
    id: 'tavily',
    name: 'Tavily Search',
    description: 'AI-optimized search engine for real-time web research.',
    icon: Globe,
    keyName: 'TAVILY_API_KEY',
    placeholder: 'tvly-...',
    docsUrl: 'https://tavily.com',
    canTrackUsage: true,
  },
  {
    id: 'youtube',
    name: 'YouTube Data API',
    description: 'Find educational videos and tutorials from YouTube.',
    icon: Youtube,
    keyName: 'GOOGLE_API_KEY',
    placeholder: 'AIza...',
    docsUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
    canTrackUsage: false,
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    description: 'Deep website reader. Converts any URL into clean Markdown for LLMs.',
    icon: Globe,
    keyName: 'FIRECRAWL_API_KEY',
    placeholder: 'fc-...',
    docsUrl: 'https://firecrawl.dev',
    canTrackUsage: true,
  },
  {
    id: 'exa',
    name: 'Exa AI Search',
    description: 'Neural search engine designed for AI agents. Finds semantic matches.',
    icon: Globe,
    keyName: 'EXASEARCH_API_KEY',
    placeholder: 'exa-...',
    docsUrl: 'https://dashboard.exa.ai',
    canTrackUsage: false,
  },
];

function UsageGauge({ used, total, size = 110, strokeWidth = 8 }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  let strokeColor = 'stroke-[#1f644e]';
  if (pct >= 85) {
    strokeColor = 'stroke-rose-600';
  } else if (pct >= 50) {
    strokeColor = 'stroke-amber-500';
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-neutral-100 fill-transparent"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`fill-transparent transition-[stroke-dashoffset] duration-700 ease-out ${strokeColor}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-black text-neutral-800">{Math.round(pct)}%</span>
        <span className="text-[8px] text-neutral-400 font-extrabold uppercase tracking-widest">
          Used
        </span>
      </div>
    </div>
  );
}

function KeyUsageRow({ detail }) {
  const { keyId, used, total, plan, error } = detail;
  const pct = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;

  let barColor = 'bg-[#1f644e]';
  let dotColor = 'bg-[#1f644e]';

  if (pct >= 85) {
    barColor = 'bg-rose-600';
    dotColor = 'bg-rose-500';
  } else if (pct >= 50) {
    barColor = 'bg-amber-500';
    dotColor = 'bg-amber-500';
  }

  return (
    <div className="p-3 bg-neutral-50/50 rounded-xl border border-neutral-100 space-y-1.5 transition-all hover:bg-neutral-50">
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${error ? 'bg-rose-500 animate-pulse' : dotColor}`}
          />
          <span className="font-mono font-medium text-neutral-600 truncate">{keyId}</span>
          <span className="text-[8px] px-1 py-0.5 rounded bg-neutral-100 font-bold text-neutral-500 uppercase tracking-tight shrink-0">
            {plan || 'Free'}
          </span>
        </div>
        {error ? (
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight truncate ml-2">
            Failed
          </span>
        ) : (
          <span className="font-mono text-neutral-500 text-[10px] shrink-0 ml-2">
            <strong className="text-neutral-700">{used.toLocaleString()}</strong> /{' '}
            {total.toLocaleString()}
          </span>
        )}
      </div>
      {!error && (
        <div className="relative w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToolsTab() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null); // stores keyName being saved
  const [formValues, setFormValues] = useState({});
  const [usageStats, setUsageStats] = useState({});
  const [loadingUsage, setLoadingUsage] = useState({});
  const [cardTabs, setCardTabs] = useState({});
  const [showPoolDetails, setShowPoolDetails] = useState({});

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const { settings: dbSettings } = await res.json();
        const settingsMap = {};
        dbSettings.forEach((s) => {
          try {
            if (typeof s.value === 'string' && s.value.startsWith('{')) {
              settingsMap[s.key] = JSON.parse(s.value);
            } else {
              settingsMap[s.key] = s.value;
            }
          } catch (e) {
            settingsMap[s.key] = s.value;
          }
        });
        setSettings(settingsMap);

        // Pre-fill form values with current limits
        const initialForm = {};
        TOOLS_LIST.forEach((tool) => {
          const config = settingsMap[tool.keyName];
          if (config && typeof config === 'object' && !Array.isArray(config)) {
            initialForm[`${tool.keyName}_rpm`] = config.rpm || 4;
            initialForm[`${tool.keyName}_rpd`] = config.rpd || 1000;
            initialForm[`${tool.keyName}_rpmnt`] = config.rpmnt || 1000;
            initialForm[`${tool.keyName}_isActive`] = config.isActive !== false;
          } else {
            initialForm[`${tool.keyName}_rpm`] = 4;
            initialForm[`${tool.keyName}_rpd`] = 1000;
            initialForm[`${tool.keyName}_rpmnt`] = 1000;
            initialForm[`${tool.keyName}_isActive`] = true;
          }
        });
        setFormValues((prev) => ({ ...prev, ...initialForm }));
      }
    } catch (err) {
      console.error('Failed to fetch tool settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async (toolId, keyName) => {
    setLoadingUsage((prev) => ({ ...prev, [toolId]: true }));
    try {
      const res = await fetch(`/api/admin/tools/usage?toolId=${toolId}&keyName=${keyName}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUsageStats((prev) => ({
          ...prev,
          [toolId]: { error: data.error || `HTTP ${res.status}` },
        }));
        return;
      }

      const { results } = await res.json();

      const seenAccounts = [];
      const aggregated = results.reduce(
        (acc, curr) => {
          if (curr.error) return acc;

          const fingerprint = `${curr.used}-${curr.total}-${curr.plan}`;
          const isDuplicate = curr.used > 0 && seenAccounts.includes(fingerprint);

          if (isDuplicate) {
            return acc;
          }

          seenAccounts.push(fingerprint);

          return {
            used: acc.used + (curr.used || 0),
            total: acc.total + (curr.total || 0),
            remaining: acc.remaining + (curr.remaining || 0),
            resetDate: curr.resetDate || acc.resetDate,
          };
        },
        { used: 0, total: 0, remaining: 0, resetDate: null }
      );

      setUsageStats((prev) => ({
        ...prev,
        [toolId]: { ...aggregated, details: results, accountCount: seenAccounts.length },
      }));
    } catch (err) {
      console.error(`Failed to fetch usage for ${toolId}:`, err);
      setUsageStats((prev) => ({
        ...prev,
        [toolId]: { error: err.message || 'Network error fetching stats' },
      }));
    } finally {
      setLoadingUsage((prev) => ({ ...prev, [toolId]: false }));
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!loading) {
      TOOLS_LIST.forEach((tool) => {
        if (settings[tool.keyName]) {
          fetchUsage(tool.id, tool.keyName);
        }
      });
    }
  }, [loading, settings]);

  const handleSave = async (tool) => {
    const keysValue = formValues[tool.keyName];
    const rpm = parseInt(formValues[`${tool.keyName}_rpm`]);
    const rpd = parseInt(formValues[`${tool.keyName}_rpd`]);
    const rpmnt = parseInt(formValues[`${tool.keyName}_rpmnt`]);
    const isActive = formValues[`${tool.keyName}_isActive`];

    if (!keysValue?.trim()) return;

    setSavingKey(tool.keyName);
    try {
      const config = {
        keys: keysValue.trim(),
        rpm: isNaN(rpm) ? 4 : rpm,
        rpd: isNaN(rpd) ? 1000 : rpd,
        rpmnt: isNaN(rpmnt) ? 1000 : rpmnt,
        isActive: isActive !== false,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: tool.keyName,
          value: JSON.stringify(config),
          description: `${tool.name} Config (Keys + Limits)`,
          isEncrypted: true,
        }),
      });

      if (res.ok) {
        toast.success(`${tool.name} configuration updated!`);
        setFormValues({ ...formValues, [tool.keyName]: '' });
        fetchSettings();
      } else {
        toast.error(`Failed to update ${tool.name} config.`);
      }
    } catch (err) {
      toast.error('An error occurred while saving.');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-[#1f644e] animate-spin" />
        <p className="mt-4 text-neutral-500 font-medium">Loading Tools Configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[#1e3a34]">
          External Tools
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Configure API keys and rate limits for search and media tools.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {TOOLS_LIST.map((tool) => {
          const config = settings[tool.keyName];
          const hasConfig = !!config;
          const isConfigObject = config && typeof config === 'object' && !Array.isArray(config);
          const keys = isConfigObject ? config.keys : config;
          const isConfigured = !!keys;
          const activeTab = cardTabs[tool.id] || (isConfigured ? 'metrics' : 'config');

          const Icon = tool.icon;

          const stats = usageStats[tool.id];
          const hasUsageStats = tool.canTrackUsage && stats && !stats.error;
          const statsError = stats?.error;
          const isLoadingUsage = loadingUsage[tool.id];

          return (
            <Card
              key={tool.id}
              className={`p-6 border border-neutral-100 rounded-2xl flex flex-col h-full overflow-hidden transition-all shadow-sm bg-white ${
                !formValues[`${tool.keyName}_isActive`] &&
                'grayscale-[0.5] opacity-80 bg-neutral-50/50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                      isConfigured
                        ? 'bg-emerald-50 border-emerald-100 text-[#1f644e] shadow-sm'
                        : 'bg-neutral-50 border-neutral-100 text-neutral-400'
                    }`}
                  >
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-neutral-900 leading-snug">
                        {tool.name}
                      </h3>
                      <button
                        onClick={() =>
                          setFormValues({
                            ...formValues,
                            [`${tool.keyName}_isActive`]: !formValues[`${tool.keyName}_isActive`],
                          })
                        }
                        className={`w-8 h-4 rounded-full relative transition-colors duration-200 shrink-0 ${
                          formValues[`${tool.keyName}_isActive`] ? 'bg-[#1f644e]' : 'bg-neutral-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${
                            formValues[`${tool.keyName}_isActive`] ? 'left-4.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {!formValues[`${tool.keyName}_isActive`] ? (
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">
                          Globally Disabled
                        </span>
                      ) : isConfigured ? (
                        <>
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                            Configured
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} className="text-amber-500" />
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">
                            Not Configured
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={tool.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-[#1f644e] uppercase hover:underline"
                >
                  Get Key
                </a>
              </div>

              <p className="text-sm text-neutral-600 mb-5 flex-1">{tool.description}</p>

              {/* Tab Selector if usage tracking is supported */}
              {tool.canTrackUsage && isConfigured && (
                <div className="flex border-b border-neutral-100 mb-5 text-xs font-semibold text-neutral-400">
                  <button
                    onClick={() => setCardTabs((prev) => ({ ...prev, [tool.id]: 'metrics' }))}
                    className={`pb-2 px-3 border-b-2 transition-all ${
                      activeTab === 'metrics'
                        ? 'border-[#1f644e] text-[#1f644e] font-bold'
                        : 'border-transparent hover:text-neutral-700'
                    }`}
                  >
                    Usage Stats
                  </button>
                  <button
                    onClick={() => setCardTabs((prev) => ({ ...prev, [tool.id]: 'config' }))}
                    className={`pb-2 px-3 border-b-2 transition-all ${
                      activeTab === 'config'
                        ? 'border-[#1f644e] text-[#1f644e] font-bold'
                        : 'border-transparent hover:text-neutral-700'
                    }`}
                  >
                    Configuration
                  </button>
                </div>
              )}

              {/* Dynamic Body Content */}
              <div className="space-y-4 pt-2 border-t border-neutral-50/50">
                {tool.canTrackUsage && isConfigured && activeTab === 'metrics' ? (
                  <div>
                    {isLoadingUsage ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-[#1f644e] animate-spin" />
                        <span className="text-xs text-neutral-400 font-medium mt-2">
                          Fetching live usage...
                        </span>
                      </div>
                    ) : statsError ? (
                      <div className="mb-2 p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex gap-2 text-xs text-rose-600">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block mb-0.5">Failed to fetch usage</span>
                          <span className="opacity-95">{statsError}</span>
                        </div>
                      </div>
                    ) : stats ? (
                      <div className="space-y-5">
                        {/* Gauge & Key Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 items-center">
                          <div className="flex justify-center py-3 bg-neutral-50/50 rounded-2xl border border-neutral-100/60">
                            <UsageGauge used={stats.used} total={stats.total} />
                          </div>

                          <div className="space-y-2.5">
                            <div className="p-2.5 bg-neutral-50/30 border border-neutral-100/60 rounded-xl">
                              <span className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                                Plan Type
                              </span>
                              <span className="font-bold text-neutral-800 text-xs">
                                {stats.plan || 'Free Plan'}
                              </span>
                            </div>
                            <div className="p-2.5 bg-neutral-50/30 border border-neutral-100/60 rounded-xl">
                              <span className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                                Rotation Pool
                              </span>
                              <span className="font-bold text-neutral-800 text-xs">
                                {stats.accountCount || 1}{' '}
                                {stats.accountCount === 1 ? 'Account' : 'Accounts'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Usage Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-neutral-500 font-medium">
                            <span>Total Pool Used</span>
                            <span>
                              <strong className="text-neutral-800">
                                {stats.used.toLocaleString()}
                              </strong>{' '}
                              / {stats.total.toLocaleString()} requests
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden relative">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                stats.used / (stats.total || 1) >= 0.85
                                  ? 'bg-rose-500'
                                  : stats.used / (stats.total || 1) >= 0.5
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-600'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.max(0, (stats.used / (stats.total || 1)) * 100))}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-neutral-400 font-bold uppercase tracking-wider pt-0.5">
                            <span>Remaining: {(stats.total - stats.used).toLocaleString()}</span>
                            <span>
                              Resets:{' '}
                              {stats.resetDate
                                ? new Date(stats.resetDate).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Monthly'}
                            </span>
                          </div>
                        </div>

                        {/* Pool Details Breakdown */}
                        {stats.details && stats.details.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-neutral-50">
                            <button
                              onClick={() =>
                                setShowPoolDetails((prev) => ({
                                  ...prev,
                                  [tool.id]: !prev[tool.id],
                                }))
                              }
                              className="text-[10px] font-bold text-[#1f644e] uppercase tracking-wider hover:underline flex items-center gap-1.5"
                            >
                              <span>
                                {showPoolDetails[tool.id]
                                  ? 'Hide Key Breakdown'
                                  : 'View Key Breakdown'}
                              </span>
                              <span className="text-[9px] bg-emerald-50 text-[#1f644e] px-1.5 py-0.5 rounded-full font-bold">
                                {stats.details.length}
                              </span>
                            </button>

                            {showPoolDetails[tool.id] && (
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                {stats.details.map((detail, idx) => (
                                  <KeyUsageRow key={idx} detail={detail} />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-neutral-500">
                        No usage data available.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                          RPM Limit
                        </label>
                        <input
                          type="number"
                          value={formValues[`${tool.keyName}_rpm`]}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              [`${tool.keyName}_rpm`]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-lg outline-none text-xs"
                          placeholder="4"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                          RPD Limit
                        </label>
                        <input
                          type="number"
                          value={formValues[`${tool.keyName}_rpd`]}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              [`${tool.keyName}_rpd`]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-lg outline-none text-xs"
                          placeholder="1000"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                          Monthly Limit
                        </label>
                        <input
                          type="number"
                          value={formValues[`${tool.keyName}_rpmnt`]}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              [`${tool.keyName}_rpmnt`]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-lg outline-none text-xs"
                          placeholder="1000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                        API Keys
                        {isConfigured && Array.isArray(keys) && (
                          <span className="ml-2 text-[#1f644e] lowercase font-normal italic">
                            ({keys.length} keys active)
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <textarea
                          value={formValues[tool.keyName] || ''}
                          onChange={(e) =>
                            setFormValues({ ...formValues, [tool.keyName]: e.target.value })
                          }
                          placeholder={
                            isConfigured
                              ? '••••••••••••••••'
                              : `Paste one or more keys (comma/newline separated)...`
                          }
                          className="flex-1 px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl transition-all outline-none text-sm font-mono min-h-[80px] resize-none"
                        />
                        <button
                          onClick={() => handleSave(tool)}
                          disabled={!formValues[tool.keyName]?.trim() || savingKey === tool.keyName}
                          className="h-10 w-10 shrink-0 bg-[#1f644e] text-white rounded-xl hover:bg-[#164d3c] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
                        >
                          {savingKey === tool.keyName ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Save size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <Wrench className="text-neutral-400" size={20} />
          </div>
          <div>
            <h4 className="font-bold text-neutral-800 text-sm">About Managed Tools</h4>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              These tools are used by the <strong>Coursify Search Agent</strong> and other SmallClaw
              orchestrators. API keys are stored encrypted in your database and cached for
              performance. Changes take effect across all agents within 5 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
