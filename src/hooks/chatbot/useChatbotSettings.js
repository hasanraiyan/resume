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
        if (settings.modelName === 'fast' && settings.fastModel) {
          setSelectedModel(settings.fastModel);
        } else if (settings.modelName === 'thinking' && settings.thinkingModel) {
          setSelectedModel(settings.thinkingModel);
        } else if (settings.modelName === 'pro' && settings.proModel) {
          setSelectedModel(settings.proModel);
        } else {
          setSelectedModel(
            settings.fastModel || settings.thinkingModel || settings.proModel || settings.modelName
          );
        }
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
