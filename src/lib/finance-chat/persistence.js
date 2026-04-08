import {
  restoreMessagesFromStorage,
  serializeMessagesForStorage,
  WELCOME_MESSAGE,
} from './messageState';

export const CHAT_MODE_STORAGE_KEY = 'pocketly-finance-chat-mode';
export const DEVICE_CHAT_STORAGE_KEY = 'pocketly-finance-device-chat';

export function loadFinanceChatState({ deviceSupported }) {
  if (typeof window === 'undefined') {
    return {
      chatMode: 'cloud',
      messages: [WELCOME_MESSAGE],
      pendingDraft: null,
    };
  }

  try {
    const savedMode = window.localStorage.getItem(CHAT_MODE_STORAGE_KEY);
    const savedDeviceChat = window.localStorage.getItem(DEVICE_CHAT_STORAGE_KEY);

    let messages = [WELCOME_MESSAGE];
    let pendingDraft = null;

    if (savedDeviceChat) {
      const parsed = JSON.parse(savedDeviceChat);
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        messages = restoreMessagesFromStorage(parsed.messages);
      }
      pendingDraft = parsed.pendingDraft || null;
    }

    return {
      chatMode: savedMode === 'device' && deviceSupported ? 'device' : 'cloud',
      messages,
      pendingDraft,
    };
  } catch {
    return {
      chatMode: 'cloud',
      messages: [WELCOME_MESSAGE],
      pendingDraft: null,
    };
  }
}

export function persistChatMode(chatMode) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CHAT_MODE_STORAGE_KEY, chatMode);
  } catch {
    // Ignore local storage write failures.
  }
}

export function persistDeviceChatState(messages, pendingDraft) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      DEVICE_CHAT_STORAGE_KEY,
      JSON.stringify({
        messages: serializeMessagesForStorage(messages),
        pendingDraft,
      })
    );
  } catch {
    // Ignore local storage write failures.
  }
}

export function clearDeviceChatState() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(DEVICE_CHAT_STORAGE_KEY);
  } catch {
    // Ignore local storage removal failures.
  }
}
