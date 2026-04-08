'use client';

import { useEffect, useRef, useState } from 'react';
import { useFinanceChat } from '@/context/FinanceChatContext';
import { useMoney } from '@/context/MoneyContext';
import MessageList from '@/components/chatbot/MessageList';
import ChatInput from '@/components/chatbot/ChatInput';

export default function ChatTab() {
  const {
    messages,
    sendMessage,
    isStreaming,
    chatMode,
    setChatMode,
    deviceAvailability,
    appendAssistantMessage,
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
  const chatbotSettings = { aiName: 'Finance Assistant' };
  const activeQuote = null;

  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 1) {
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
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setInputMessage('');
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

        await addTransaction(payload, { switchTab: false });

        if (setLocalState) {
          setLocalState('success');
        } else {
          appendAssistantMessage('Transaction confirmed and saved successfully!');
        }
      } catch (err) {
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
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-4rem)] min-w-0 flex-col overflow-x-hidden bg-[#fcfbf5]">
      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden custom-chat-scrollbar px-4 py-4 sm:px-6">
        <MessageList
          messages={messages}
          isLoading={isStreaming}
          messagesEndRef={messagesEndRef}
          handleUIInteract={handleUIInteract}
          handleLinkClick={() => {}}
          theme="green"
        />
      </div>

      {/* Input */}
      <ChatInput
        inputRef={inputRef}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        isLoading={isStreaming}
        handleSubmit={handleSubmit}
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
        theme="green"
        chatMode={chatMode}
        setChatMode={setChatMode}
        deviceAvailability={deviceAvailability}
      />
    </div>
  );
}
