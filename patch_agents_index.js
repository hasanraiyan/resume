const fs = require('fs');
const filePath = 'src/lib/agents/index.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add import
content = content.replace(
  "import WhatsAppAgent from './ai/whatsapp-agent';",
  "import WhatsAppAgent from './ai/whatsapp-agent';\nimport SmsAgent from './ai/sms-agent';"
);

// Add registration
content = content.replace(
  'agentRegistry.register(AGENT_IDS.WHATSAPP_ASSISTANT, WhatsAppAgent);',
  'agentRegistry.register(AGENT_IDS.WHATSAPP_ASSISTANT, WhatsAppAgent);\n  agentRegistry.register(AGENT_IDS.SMS_ASSISTANT, SmsAgent);'
);

fs.writeFileSync(filePath, content);
