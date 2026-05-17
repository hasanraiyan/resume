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
  },
  {
    id: 'youtube',
    name: 'YouTube Data API',
    description: 'Find educational videos and tutorials from YouTube.',
    icon: Youtube,
    keyName: 'GOOGLE_API_KEY',
    placeholder: 'AIza...',
    docsUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    description: 'Deep website reader. Converts any URL into clean Markdown for LLMs.',
    icon: Globe,
    keyName: 'FIRECRAWL_API_KEY',
    placeholder: 'fc-...',
    docsUrl: 'https://firecrawl.dev',
  },
];

export default function ToolsTab() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null); // stores keyName being saved
  const [formValues, setFormValues] = useState({});
  const [usageStats, setUsageStats] = useState({});

  const [showPoolDetails, setShowPoolDetails] = useState({});

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const { settings: dbSettings } = await res.json();
        const settingsMap = {};
        dbSettings.forEach((s) => {
          try {
            // Try to parse as JSON if it looks like a config object
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
    try {
      const res = await fetch(`/api/admin/tools/usage?toolId=${toolId}&keyName=${keyName}`);
      if (res.ok) {
        const { results } = await res.json();

        // SMART AGGREGATION: Detect shared quotas but be careful with fresh (0 usage) accounts
        const seenAccounts = [];
        const aggregated = results.reduce(
          (acc, curr) => {
            if (curr.error) return acc;

            // Fingerprint: usage-limit-plan
            const fingerprint = `${curr.used}-${curr.total}-${curr.plan}`;

            // If usage is 0, we can't reliably detect shared accounts, so assume unique
            // If usage > 0, check if we've seen this exact fingerprint before
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
      }
    } catch (err) {
      console.error(`Failed to fetch usage for ${toolId}:`, err);
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
      // Save as a structured config object string
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
          value: JSON.stringify(config), // Save as JSON string
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

          const Icon = tool.icon;

          return (
            <Card
              key={tool.id}
              className={`p-6 border-2 rounded-2xl flex flex-col h-full overflow-hidden transition-all ${
                formValues[`${tool.keyName}_isActive`]
                  ? 'border-neutral-100 bg-white'
                  : 'border-neutral-200 bg-neutral-50/50 grayscale-[0.5] opacity-80'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                      isConfigured
                        ? 'bg-emerald-50 border-emerald-100 text-[#1f644e]'
                        : 'bg-neutral-50 border-neutral-100 text-neutral-400'
                    }`}
                  >
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-neutral-900">{tool.name}</h3>
                      <button
                        onClick={() =>
                          setFormValues({
                            ...formValues,
                            [`${tool.keyName}_isActive`]: !formValues[`${tool.keyName}_isActive`],
                          })
                        }
                        className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${
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

              <p className="text-sm text-neutral-600 mb-6 flex-1">{tool.description}</p>

              {/* Live Usage Stats */}
              {usageStats[tool.id] && !usageStats[tool.id].error && (
                <div className="mb-6 space-y-2">
                  <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div>
                      <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-tighter mb-0.5">
                        Total Pool Usage
                      </span>
                      <div className="flex items-end gap-1">
                        <span className="text-sm font-bold text-neutral-800">
                          {usageStats[tool.id].used.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-neutral-400 mb-0.5">
                          / {usageStats[tool.id].total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-tighter mb-0.5">
                        Pool Refresh
                      </span>
                      <span className="text-xs font-semibold text-neutral-700">
                        {usageStats[tool.id].resetDate
                          ? new Date(usageStats[tool.id].resetDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Monthly'}
                      </span>
                    </div>
                  </div>

                  {usageStats[tool.id].details?.length > 1 && (
                    <button
                      onClick={() =>
                        setShowPoolDetails((prev) => ({ ...prev, [tool.id]: !prev[tool.id] }))
                      }
                      className="text-[10px] font-bold text-[#1f644e] uppercase px-1 hover:underline"
                    >
                      {showPoolDetails[tool.id] ? 'Hide Pool Details' : 'View Pool Details'}
                    </button>
                  )}

                  {showPoolDetails[tool.id] && (
                    <div className="mt-2 space-y-1.5 p-3 bg-neutral-50/50 rounded-xl border border-neutral-100 animate-in slide-in-from-top-1 duration-200">
                      {usageStats[tool.id].details.map((detail, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-[#1f644e]" />
                            <span className="font-mono text-neutral-500">{detail.keyId}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-400">
                              {detail.error ? (
                                <span className="text-red-500">Failed: {detail.error}</span>
                              ) : (
                                <>
                                  <strong className="text-neutral-700">{detail.used}</strong> /{' '}
                                  {detail.total}
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-neutral-50">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                      RPM Limit
                    </label>
                    <input
                      type="number"
                      value={formValues[`${tool.keyName}_rpm`]}
                      onChange={(e) =>
                        setFormValues({ ...formValues, [`${tool.keyName}_rpm`]: e.target.value })
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
                        setFormValues({ ...formValues, [`${tool.keyName}_rpd`]: e.target.value })
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
                        setFormValues({ ...formValues, [`${tool.keyName}_rpmnt`]: e.target.value })
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
