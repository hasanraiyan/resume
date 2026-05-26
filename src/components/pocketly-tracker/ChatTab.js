'use client';

import { useEffect, useRef, useState } from 'react';
import { useFinanceChat } from '@/context/FinanceChatContext';
import { useMoney } from '@/context/MoneyContext';
import { broadcastSavedTransaction } from '@/lib/finance-chat/draftEvents';
import MessageList from '@/components/chatbot/MessageList';
import ChatInput from '@/components/chatbot/ChatInput';

const TYPEWRITER_TOPICS = [
  'How much did I spend on food this month?',
  'Show me my account balances...',
  'What is my largest expense?',
  'Add a transaction for ₹500...',
  'How much is left in my budget?',
  'Show transactions from last week...',
  'What did I spend on groceries?',
  'Transfer ₹2000 to savings...',
];

function useTypewriterPlaceholder(topics) {
  const [displayText, setDisplayText] = useState('');
  const [tick, setTick] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const phaseRef = useRef('typing');
  const topicIndexRef = useRef(0);
  const charIndexRef = useRef(0);

  useEffect(() => {
    if (!topics || topics.length === 0) return;

    const topic = topics[topicIndexRef.current];
    let timer;

    if (phaseRef.current === 'typing') {
      setShowCursor(true);
      if (charIndexRef.current < topic.length) {
        timer = setTimeout(() => {
          charIndexRef.current += 1;
          setDisplayText(topic.slice(0, charIndexRef.current));
        }, 55);
      } else {
        timer = setTimeout(() => {
          phaseRef.current = 'erasing';
          setTick((t) => t + 1);
        }, 2500);
      }
    } else if (phaseRef.current === 'erasing') {
      setShowCursor(true);
      if (charIndexRef.current > 0) {
        timer = setTimeout(() => {
          charIndexRef.current -= 1;
          setDisplayText(topic.slice(0, charIndexRef.current));
        }, 25);
      } else {
        timer = setTimeout(() => {
          setShowCursor(false);
          topicIndexRef.current = (topicIndexRef.current + 1) % topics.length;
          phaseRef.current = 'typing';
          setTick((t) => t + 1);
        }, 800);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, tick, topics]);

  return displayText + (displayText && showCursor ? '▎' : '');
}

export default function ChatTab() {
  const {
    messages,
    sendMessage,
    isStreaming,
    chatMode,
    setChatMode,
    deviceAvailability,
    appendAssistantMessage,
    answeredBlockIds,
    markBlockAsAnswered,
    stopGenerating,
  } = useFinanceChat();
  const { setActiveTab, addTransaction, openEditTransaction } = useMoney();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const toggleListening = () => setIsListening((s) => !s);
  const [activeMCPs, setActiveMCPs] = useState([]);
  const [availableMCPs, setAvailableMCPs] = useState([]);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const chatbotSettings = { aiName: 'Finance Assistant' };
  const typewriterPlaceholder = useTypewriterPlaceholder(TYPEWRITER_TOPICS);
  const activeQuote = null;

  useEffect(() => {
    if (messages.length === 0) {
      setInputMessage('');
      setIsListening(false);
      setActiveMCPs([]);
      setIsToolsMenuOpen(false);
      setIsModelSelectorOpen(false);
      setSelectedAgentId(null);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
  }, [isStreaming, messages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if ((!trimmed && uploadedImages.length === 0) || isStreaming) return;
    sendMessage(trimmed, uploadedImages);
    setInputMessage('');
    setUploadedImages([]);
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
  };

  const handleUIInteract = async (action) => {
    if (!action) return;

    if (action.type === 'switch_tab' && action.tab) {
      setActiveTab(action.tab);
    }

    if (action.type === 'confirm_transaction') {
      const { data, setLocalState } = action;
      if (setLocalState) setLocalState('saving');

      try {
        const payload = {
          type: data.type,
          amount: data.amount,
          description: data.description,
          account: data.accountId,
          date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        };

        if (data.type === 'transfer') {
          payload.toAccount = data.toAccountId;
        } else {
          payload.category = data.categoryId;
        }

        console.log('[ChatTab] Saving transaction:', payload);
        const result = await addTransaction(payload, { switchTab: false });
        console.log('[ChatTab] Transaction saved:', result);

        broadcastSavedTransaction({
          amount: data.amount,
          type: data.type,
          accountId: data.accountId,
          categoryId: data.categoryId,
          toAccountId: data.toAccountId,
          savedAt: Date.now(),
        });

        if (setLocalState) {
          setLocalState('success');
        } else {
          appendAssistantMessage('Transaction confirmed and saved successfully!');
        }
      } catch (err) {
        console.error('[ChatTab] Error saving transaction:', err);
        if (setLocalState) setLocalState('error');
        appendAssistantMessage('Sorry, there was an error saving the transaction.');
      }
    }

    if (action.type === 'cancel_transaction') {
      const { data } = action;
      const preFillData = {
        type: data.type,
        amount: data.amount,
        description: data.description,
        accountId: data.accountId,
        categoryId: data.categoryId,
        toAccountId: data.toAccountId,
      };
      openEditTransaction(preFillData);
    }

    if (action.type === 'mcq_response') {
      const { questionId, selectionMode, selectedOptionIds = [], otherText } = action;

      const parts = [];
      if (selectedOptionIds.length > 0) {
        parts.push(`Selected options: ${selectedOptionIds.join(', ')}`);
      }
      if (otherText) {
        parts.push(`Other: ${otherText}`);
      }

      if (parts.length === 0) return;

      const prefix = questionId ? `[MCQ answer ${questionId}] ` : '';
      const summary = `${prefix}${parts.join(' | ')}`;

      sendMessage(summary);
    }

    if (action.type === 'mcq_group_response') {
      const { groupId, answers = {} } = action;

      const lines = Object.entries(answers)
        .map(([qid, answer]) => {
          const parts = [];
          if (answer.selectedOptionIds?.length) {
            parts.push(`selected: ${answer.selectedOptionIds.join(', ')}`);
          }
          if (answer.otherText) {
            parts.push(`other: ${answer.otherText}`);
          }
          if (parts.length === 0) return null;
          return `Q ${qid}: ${parts.join(' | ')}`;
        })
        .filter(Boolean);

      if (!lines.length) return;

      const prefix = groupId ? `[MCQ group ${groupId}] ` : '';
      const summary = `${prefix}${lines.join(' || ')}`;

      sendMessage(summary);
    }
  };

  const isEmptyChat = messages.length === 0;

  const makeInput = (showTopBorder = true) => (
    <ChatInput
      inputRef={inputRef}
      inputMessage={inputMessage}
      setInputMessage={setInputMessage}
      isLoading={isStreaming}
      handleSubmit={handleSubmit}
      onStop={stopGenerating}
      activeQuote={activeQuote}
      isListening={isListening}
      toggleListening={toggleListening}
      activeMCPs={activeMCPs}
      setActiveMCPs={setActiveMCPs}
      availableMCPs={availableMCPs}
      isToolsMenuOpen={isToolsMenuOpen}
      setIsToolsMenuOpen={setIsToolsMenuOpen}
      isModelSelectorOpen={isModelSelectorOpen}
      setIsModelSelectorOpen={setIsModelSelectorOpen}
      chatbotSettings={chatbotSettings}
      selectedAgentId={selectedAgentId}
      setSelectedAgentId={setSelectedAgentId}
      showModelSelector={false}
      showToolsMenu={false}
      showModeToggle
      theme="green"
      chatMode={chatMode}
      setChatMode={setChatMode}
      deviceAvailability={deviceAvailability}
      onImagesSelected={setUploadedImages}
      uploadedImages={uploadedImages}
      maxImages={2}
      showTopBorder={showTopBorder}
      placeholder={typewriterPlaceholder}
    />
  );

  if (isEmptyChat) {
    return (
      <div className="flex h-[calc(100vh-3.5rem-env(safe-area-inset-bottom))] lg:h-[calc(100vh-4rem)] min-w-0 flex-col overflow-x-hidden bg-[#fcfbf5]">
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-4 overflow-y-auto">
          {/* Branding */}
          <div className="mb-8 flex flex-col items-center text-center">
            <h2 className="text-[17px] font-semibold text-[#1e3a34]">Finance Assistant</h2>
            <p className="mt-1 text-[13px] text-[#5c6e68]">Ask me anything about your finances</p>
          </div>

          {/* Input */}
          <div className="w-full max-w-3xl">{makeInput(false)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem-env(safe-area-inset-bottom))] lg:h-[calc(100vh-4rem)] min-w-0 flex-col overflow-x-hidden bg-[#fcfbf5]">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isStreaming}
          isStreaming={isStreaming}
          messagesEndRef={messagesEndRef}
          handleUIInteract={handleUIInteract}
          handleLinkClick={() => {}}
          theme="green"
          answeredBlockIds={answeredBlockIds}
          markBlockAsAnswered={markBlockAsAnswered}
        />
        {makeInput()}
      </div>
    </div>
  );
}
