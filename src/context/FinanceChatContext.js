'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { useMoney } from '@/context/MoneyContext';
import { getDeviceAiAvailability, runDeviceFinanceChat } from '@/lib/finance-ai/deviceFinanceChat';
import { runCloudFinanceChat } from '@/lib/finance-chat/cloudChatRunner';
import { runDeviceFinanceChatMessage } from '@/lib/finance-chat/deviceChatRunner';
import {
  createAssistantMessage,
  createAssistantPlaceholder,
  createUserMessage,
  setAssistantError,
  WELCOME_MESSAGE,
} from '@/lib/finance-chat/messageState';
import {
  clearDeviceChatState,
  loadFinanceChatState,
  persistChatMode,
  persistDeviceChatState,
} from '@/lib/finance-chat/persistence';

const FinanceChatContext = createContext(null);

export function FinanceChatProvider({ children }) {
  const { accounts, categories, transactions, analysis } = useMoney();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMode, setChatModeState] = useState('cloud');
  const [deviceAvailability, setDeviceAvailability] = useState({
    supported: false,
    reason: '',
  });
  const abortRef = useRef(null);
  const pendingDraftRef = useRef(null);

  useEffect(() => {
    const availability = getDeviceAiAvailability();
    setDeviceAvailability(availability);

    const initialState = loadFinanceChatState({ deviceSupported: availability.supported });
    setChatModeState(initialState.chatMode);
    setMessages(initialState.messages);
    pendingDraftRef.current = initialState.pendingDraft;
  }, []);

  useEffect(() => {
    if (chatMode === 'device') {
      persistDeviceChatState(messages, pendingDraftRef.current);
    }
  }, [chatMode, messages]);

  useEffect(() => {
    persistChatMode(chatMode);
  }, [chatMode]);

  const setChatMode = useCallback(
    (nextMode) => {
      if (nextMode === 'device' && !deviceAvailability.supported) {
        return;
      }

      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      setIsStreaming(false);
      setChatModeState(nextMode);
    },
    [deviceAvailability.supported]
  );

  const appendAssistantMessage = useCallback((content) => {
    if (!content?.trim()) return;
    setMessages((prev) => [...prev, createAssistantMessage(content)]);
  }, []);

  const sendMessage = useCallback(
    async (userMessage) => {
      if (!userMessage.trim() || isStreaming) return;

      if (chatMode === 'device' && !deviceAvailability.supported) {
        appendAssistantMessage(deviceAvailability.reason);
        return;
      }

      const userMsg = createUserMessage(userMessage);
      const assistantMsg = createAssistantPlaceholder();
      const assistantMsgId = assistantMsg.id;

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);
      abortRef.current = new AbortController();

      try {
        if (chatMode === 'device') {
          const result = await runDeviceFinanceChatMessage({
            userMessage,
            history: messages,
            accounts,
            categories,
            transactions,
            analysis,
            pendingDraft: pendingDraftRef.current,
            signal: abortRef.current.signal,
            assistantMsgId,
            setMessages,
          });
          pendingDraftRef.current = result.pendingDraft || null;
        } else {
          await runCloudFinanceChat({
            userMessage,
            history: messages,
            assistantMsgId,
            signal: abortRef.current.signal,
            setMessages,
          });
        }
      } catch (error) {
        if (error.name === 'AbortError') return;

        setMessages((prev) =>
          setAssistantError(
            prev,
            assistantMsgId,
            error.message || 'Something went wrong. Please try again.'
          )
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [
      accounts,
      analysis,
      appendAssistantMessage,
      categories,
      chatMode,
      deviceAvailability.reason,
      deviceAvailability.supported,
      isStreaming,
      messages,
      transactions,
    ]
  );

  const clearChat = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    pendingDraftRef.current = null;
    setIsStreaming(false);
    setMessages([WELCOME_MESSAGE]);
    clearDeviceChatState();
  }, []);

  const value = useMemo(
    () => ({
      messages,
      sendMessage,
      clearChat,
      isStreaming,
      chatMode,
      setChatMode,
      deviceAvailability,
      appendAssistantMessage,
    }),
    [
      appendAssistantMessage,
      chatMode,
      clearChat,
      deviceAvailability,
      isStreaming,
      messages,
      sendMessage,
      setChatMode,
    ]
  );

  return <FinanceChatContext.Provider value={value}>{children}</FinanceChatContext.Provider>;
}

export function useFinanceChat() {
  const context = useContext(FinanceChatContext);
  if (!context) {
    throw new Error('useFinanceChat must be used within a FinanceChatProvider');
  }
  return context;
}
