import {
  restoreMessagesFromStorage,
  serializeMessagesForStorage,
  WELCOME_MESSAGE,
} from './messageState';

export const CHAT_MODE_STORAGE_KEY = 'pocketly-finance-chat-mode';
export const DEVICE_CHAT_STORAGE_KEY = 'pocketly-finance-device-chat';
export const CLOUD_CHAT_STORAGE_KEY = 'pocketly-finance-cloud-chat';
export const REMOTE_CHAT_STORAGE_KEY = 'pocketly-finance-remote-chat';

function normalizeChatMode(mode, deviceSupported) {
  if (mode === 'device') return deviceSupported ? 'device' : 'pro';
  if (mode === 'pro') return 'pro';
  if (mode === 'cloud' || mode === 'flash') return 'pro';
  return 'pro';
}

export function loadFinanceChatState({ deviceSupported }) {
  if (typeof window === 'undefined') {
    return {
      chatMode: 'pro',
      messages: [WELCOME_MESSAGE],
      pendingDraft: null,
    };
  }

  try {
    const savedMode = window.localStorage.getItem(CHAT_MODE_STORAGE_KEY);
    const savedDeviceChat = window.localStorage.getItem(DEVICE_CHAT_STORAGE_KEY);
    const savedRemoteChat =
      window.localStorage.getItem(REMOTE_CHAT_STORAGE_KEY) ||
      window.localStorage.getItem(CLOUD_CHAT_STORAGE_KEY);
    const chatMode = normalizeChatMode(savedMode, deviceSupported);

    let messages = [WELCOME_MESSAGE];
    let pendingDraft = null;

    if (chatMode === 'device' && savedDeviceChat) {
      const parsed = JSON.parse(savedDeviceChat);
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        messages = restoreMessagesFromStorage(parsed.messages);
      }
      pendingDraft = parsed.pendingDraft || null;
    } else if (savedRemoteChat) {
      const parsed = JSON.parse(savedRemoteChat);
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        messages = restoreMessagesFromStorage(parsed.messages);
      }
    }

    return {
      chatMode,
      messages,
      pendingDraft,
    };
  } catch {
    return {
      chatMode: 'pro',
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

export function persistCloudChatState(messages) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      REMOTE_CHAT_STORAGE_KEY,
      JSON.stringify({
        messages: serializeMessagesForStorage(messages),
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

export function clearCloudChatState() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(REMOTE_CHAT_STORAGE_KEY);
    window.localStorage.removeItem(CLOUD_CHAT_STORAGE_KEY);
  } catch {
    // Ignore local storage removal failures.
  }
}
