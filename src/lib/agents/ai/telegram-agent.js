import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { portfolioTools } from '../utils/portfolio-tools';

class TelegramAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.TELEGRAM_BOT, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Telegram Agent Initialized');
  }

  async _validateInput(input) {
    if (!input || !input.message) {
      throw new Error('Message is required for Telegram Agent');
    }
    if (!input.chatId) {
      throw new Error('Chat ID is required for Telegram Agent');
    }
  }

  async sendTelegramMessage(chatId, text, token) {
    if (!token) {
      this.logger.error('No Telegram Bot Token configured');
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('Failed to send Telegram message:', errorData);
      }
    } catch (error) {
      this.logger.error('Error sending Telegram message:', error);
    }
  }

  async _onExecute(input) {
    const { message, chatId } = input;

    // Retrieve configuration token
    const metadata = this.config.metadata || {};
    const token = metadata.telegramBotToken;

    this.logger.info('Telegram Bot execution started. Metadata keys:', Object.keys(metadata));

    if (!token) {
      this.logger.warn('Telegram Bot Token not configured in metadata. Execution aborted.');
      return { success: false, error: 'Token not configured' };
    }

    const llm = await this.createChatModel();

    // Get tools enabled for the agent
    const enabledToolNames = this.config.tools || [];
    const tools = portfolioTools.filter((t) => enabledToolNames.includes(t.name));

    // Fallback if no specific tools are mapped/requested, just use all available
    const finalTools = enabledToolNames.length > 0 ? tools : portfolioTools;

    // Use persona as system prompt, fallback if empty
    const systemPrompt =
      this.config.persona ||
      'You are a helpful portfolio assistant interacting via Telegram. Be concise, polite, and format text using Markdown when helpful.';

    const agent = createReactAgent({ llm, tools: finalTools });

    try {
      const finalState = await agent.invoke({
        messages: [new SystemMessage(systemPrompt), new HumanMessage(message)],
      });

      const lastMessage = finalState.messages[finalState.messages.length - 1];
      const responseText = lastMessage.content;

      // Send the response back to Telegram
      await this.sendTelegramMessage(chatId, responseText, token);

      return {
        success: true,
        responseText,
        chatId,
      };
    } catch (error) {
      this.logger.error('Telegram Agent execution error:', error);

      // Attempt to send an error message to user
      await this.sendTelegramMessage(
        chatId,
        "I'm sorry, I encountered an error while processing your request.",
        token
      );

      throw error;
    }
  }
}

export default TelegramAgent;
