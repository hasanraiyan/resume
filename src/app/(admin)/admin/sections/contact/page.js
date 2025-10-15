// src/app/(admin)/admin/sections/contact/page.js
'use client';

import { useState, useEffect } from 'react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import FormSection from '@/components/admin/FormSection';
import ActionButton from '@/components/admin/ActionButton';
import Switch from '@/components/admin/Switch';

export default function ContactSettingsPage() {
  const [formData, setFormData] = useState({
    isEnabled: false,
    botToken: '',
    chatId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/admin/telegram-settings')
      .then((res) => res.json())
      .then((data) => {
        setFormData(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const res = await fetch('/api/admin/telegram-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', ...formData }),
    });

    const result = await res.json();
    setMessage({ type: res.ok ? 'success' : 'error', text: result.message });
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage({ type: '', text: '' });

    const res = await fetch('/api/admin/telegram-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test',
        botToken: formData.botToken,
        chatId: formData.chatId,
      }),
    });

    const result = await res.json();
    setMessage({ type: res.ok ? 'success' : 'error', text: result.message });
    setTesting(false);
  };

  if (loading) {
    return <AdminPageWrapper title="Contact Notifications">Loading...</AdminPageWrapper>;
  }

  return (
    <AdminPageWrapper
      title="Contact Form Notifications"
      description="Get instant Telegram notifications for new messages."
    >
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <FormSection
          title="Telegram Settings"
          description="Enter your Telegram Bot Token and Chat ID to enable notifications."
        >
          <div className="space-y-6">
            <Switch
              label="Enable Telegram Notifications"
              description="Toggle notifications for new contact messages."
              checked={formData.isEnabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isEnabled: checked }))
              }
            />

            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Telegram Bot Token
              </label>
              <input
                name="botToken"
                type="password"
                value={formData.botToken || ''}
                onChange={handleChange}
                placeholder="Enter your bot token"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Get this from BotFather on Telegram. Stored securely.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Telegram Chat ID
              </label>
              <input
                name="chatId"
                type="text"
                value={formData.chatId || ''}
                onChange={handleChange}
                placeholder="Enter your personal or group Chat ID"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg"
              />
              <p className="text-xs text-neutral-500 mt-1">
                For a private chat, message @userinfobot. For groups, add your bot and type
                `/start`.
              </p>
            </div>
          </div>
        </FormSection>

        <div className="flex flex-wrap gap-4 pt-6 border-t border-neutral-200">
          <ActionButton isSaving={saving} text="Save Settings" savingText="Saving..." />
          <ActionButton
            type="button"
            onClick={handleTest}
            isSaving={testing}
            text="Send Test Notification"
            savingText="Sending..."
            variant="secondary"
          />
        </div>
      </form>
    </AdminPageWrapper>
  );
}
