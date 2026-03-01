import { useState, useCallback, useEffect } from 'react';

export function useChatbotSettings() {
  const [chatbotSettings, setChatbotSettings] = useState(null);
  const [settingsFetched, setSettingsFetched] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  const fetchSettings = useCallback(async () => {
    if (settingsFetched) return;
    setSettingsFetched(true);
    try {
      const response = await fetch('/api/admin/chatbot');
      if (response.ok) {
        const settings = await response.json();
        setChatbotSettings(settings);
        // Default to Fast, then Thinking, then Pro
        const firstAvailable = settings.fastModel?.model
          ? settings.fastModel
          : settings.thinkingModel?.model
            ? settings.thinkingModel
            : settings.proModel?.model
              ? settings.proModel
              : null;

        setSelectedModel(firstAvailable);
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

  return { chatbotSettings, settingsFetched, selectedModel, setSelectedModel, fetchSettings };
}
