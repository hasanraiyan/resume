const fs = require('fs');
const filePath = 'src/lib/constants/agents.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add SMS_ASSISTANT
content = content.replace(
  "WHATSAPP_ASSISTANT: 'whatsapp_assistant',",
  "WHATSAPP_ASSISTANT: 'whatsapp_assistant',\n  SMS_ASSISTANT: 'sms_assistant',"
);

// Add default config
const smsConfig = `  [AGENT_IDS.SMS_ASSISTANT]: {
    name: 'SMS Assistant',
    description: 'Dedicated agent for handling SMS interactions via Twilio',
    type: AGENT_TYPES.CHAT,
    category: AGENT_CATEGORIES.CONVERSATIONAL,
    icon: 'MessageSquareText',
    defaultModel: 'gpt-4o',
    defaultProvider: 'openai',
    persona: '', // Driven by UI configuration
    isActive: true,
  },`;
content = content.replace(/(\[AGENT_IDS\.WHATSAPP_ASSISTANT\]: \{[^}]+\},)/, `$1\n${smsConfig}`);

// Add agent tools
content = content.replace(
  /(\[AGENT_IDS\.WHATSAPP_ASSISTANT\]: \[\], \/\/ Tools configured dynamically via UI)/,
  `$1\n  [AGENT_IDS.SMS_ASSISTANT]: [], // Tools configured dynamically via UI`
);

// Add rate limit
content = content.replace(
  /(\[AGENT_IDS\.WHATSAPP_ASSISTANT\]: \{ requests: 20, window: 60 \},)/,
  `$1\n  [AGENT_IDS.SMS_ASSISTANT]: { requests: 20, window: 60 },`
);

fs.writeFileSync(filePath, content);
