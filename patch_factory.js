const fs = require('fs');
const filePath = 'src/lib/integrations/IntegrationFactory.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add import
content = content.replace(
  "import { TwilioAdapter } from './adapters/TwilioAdapter.js';",
  "import { TwilioAdapter } from './adapters/TwilioAdapter.js';\nimport { TwilioSmsAdapter } from './adapters/TwilioSmsAdapter.js';"
);

// Add case
content = content.replace(
  "case 'twilio':\n        return new TwilioAdapter(credentials);",
  "case 'twilio':\n        return new TwilioAdapter(credentials);\n      case 'sms':\n        return new TwilioSmsAdapter(credentials);"
);

fs.writeFileSync(filePath, content);
