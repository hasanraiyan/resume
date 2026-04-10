import {
  restoreMessagesFromStorage,
  serializeMessagesForStorage,
  WELCOME_MESSAGE,
} from './messageState';

export const CHAT_MODE_STORAGE_KEY = 'pocketly-finance-chat-mode';
export const DEVICE_CHAT_STORAGE_KEY = 'pocketly-finance-device-chat';
export const CLOUD_CHAT_STORAGE_KEY = 'pocketly-finance-cloud-chat';

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
    const savedCloudChat = window.localStorage.getItem(CLOUD_CHAT_STORAGE_KEY);

    let messages = [WELCOME_MESSAGE];
    let pendingDraft = null;

    if (savedMode === 'device' && savedDeviceChat) {
      const parsed = JSON.parse(savedDeviceChat);
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        messages = restoreMessagesFromStorage(parsed.messages);
      }
      pendingDraft = parsed.pendingDraft || null;
    } else if (savedMode !== 'device' && savedCloudChat) {
      const parsed = JSON.parse(savedCloudChat);
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        messages = restoreMessagesFromStorage(parsed.messages);
      }
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

export function persistCloudChatState(messages) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      CLOUD_CHAT_STORAGE_KEY,
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
    window.localStorage.removeItem(CLOUD_CHAT_STORAGE_KEY);
  } catch {
    // Ignore local storage removal failures.
  }
}
