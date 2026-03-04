import { useState, useCallback, useEffect } from 'react';
import { AGENT_IDS } from '@/lib/constants/agents';

export function useChatbotSettings() {
  const [chatbotSettings, setChatbotSettings] = useState(null);
  const [settingsFetched, setSettingsFetched] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(AGENT_IDS.CHAT_FAST);

  const fetchSettings = useCallback(async () => {
    if (settingsFetched) return;
    setSettingsFetched(true);
    try {
      const response = await fetch('/api/admin/chatbot');
      if (response.ok) {
        const settings = await response.json();
        setChatbotSettings(settings);

        // Default logic: Priority to setting's defaultEngine, fall back to Fast
        const defaultEngine = settings.defaultEngine || 'fast';
        const agentId =
          defaultEngine === 'thinking'
            ? AGENT_IDS.CHAT_THINKING
            : defaultEngine === 'pro'
              ? AGENT_IDS.CHAT_PRO
              : AGENT_IDS.CHAT_FAST;

        setSelectedAgentId(agentId);
      } else {
        setChatbotSettings({ isActive: false });
      }
    } catch {
      setChatbotSettings({ isActive: false });
    }
  }, [settingsFetched]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    chatbotSettings,
    settingsFetched,
    selectedAgentId,
    setSelectedAgentId,
    fetchSettings,
  };
}
