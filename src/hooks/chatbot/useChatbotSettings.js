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
        // Default logic: Priority to setting's defaultEngine, fall back to Fast, then Thinking, then Pro
        const defaultEngine = settings.defaultEngine || 'fast';
        const defaultSlot = `${defaultEngine}Model`;

        const initialModel = settings[defaultSlot]?.model
          ? settings[defaultSlot]
          : settings.fastModel?.model
            ? settings.fastModel
            : settings.thinkingModel?.model
              ? settings.thinkingModel
              : settings.proModel?.model
                ? settings.proModel
                : null;

        setSelectedModel(initialModel);
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
