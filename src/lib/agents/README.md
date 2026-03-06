# Scalable Agent Management System

A comprehensive, scalable agent architecture for managing AI agents across the application.

## Overview

The agent system provides:

- **Centralized Configuration**: All agent IDs and defaults defined in constants
- **Registry Pattern**: Single source of truth for agent instances
- **Runtime Management**: Dynamic agent activation/deactivation
- **Consistent Interface**: All agents extend a common base class
- **Database Integration**: Agent settings persisted in MongoDB
- **Admin Dashboard**: UI for monitoring and configuring agents

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent System                              │
├─────────────────────────────────────────────────────────────┤
│  Constants (agents.js)                                       │
│  - AGENT_IDS: Unique identifiers                            │
│  - DEFAULT_AGENT_CONFIGS: Baseline settings                 │
│  - AGENT_TOOLS: Tool mappings                               │
│  - RATE_LIMIT_DEFAULTS: Rate limiting config                │
├─────────────────────────────────────────────────────────────┤
│  BaseAgent Class                                             │
│  - Common lifecycle methods                                 │
│  - Logging & error handling                                 │
│  - Rate limiting                                            │
│  - Statistics tracking                                      │
├─────────────────────────────────────────────────────────────┤
│  AgentRegistry                                               │
│  - Agent discovery & registration                           │
│  - Instance management                                      │
│  - Execution orchestration                                  │
├─────────────────────────────────────────────────────────────┤
│  AgentManager                                                │
│  - Runtime monitoring                                       │
│  - Database sync                                            │
│  - Health tracking                                          │
│  - Event system                                             │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── lib/
│   ├── constants/
│   │   └── agents.js              # Agent IDs, types, defaults
│   └── agents/
│       ├── index.js               # Export barrel
│       ├── BaseAgent.js           # Abstract base class
│       ├── AgentRegistry.js       # Central registry
│       ├── AgentManager.js        # Runtime management
│       └── ai/
│           └── ai-image-agent.js  # Image analysis agent
├── models/
│   └── MediaAgentSettings.js      # Agent settings schema
├── components/admin/
│   ├── MediaAgentSettingsModal.js # Agent configuration UI
│   └── AgentDashboard.js          # Agent monitoring dashboard
└── app/api/admin/
    └── agents/
        ├── route.js               # List all agents
        ├── [id]/route.js          # Single agent CRUD
        ├── health/route.js        # Health check endpoint
        └── execute/route.js       # Manual agent execution
```

## Agent IDs

All agents have unique IDs defined in `constants/agents.js`:

```javascript
export const AGENT_IDS = {
  // Media & Image Agents
  IMAGE_ANALYZER: 'image_analyzer',
  IMAGE_GENERATOR: 'image_generator',
  IMAGE_EDITOR: 'image_editor',
  EMBEDDING_GENERATOR: 'embedding_generator',
  VISUAL_SEARCH: 'visual_search',

  // Chat & Conversation Agents
  CHAT_FAST: 'chat_fast',
  CONTACT_FORM_ASSISTANT: 'contact_form_assistant',

  // Content Agents
  BLOG_WRITER: 'blog_writer',
  CODE_REPORTER: 'code_reporter',
  ISSUE_MANAGER: 'issue_manager',

  // Analytics Agents
  ANALYTICS_TRACKER: 'analytics_tracker',
  ENGAGEMENT_ANALYZER: 'engagement_analyzer',
};
```

## Creating a New Agent

### Step 1: Define the Agent ID

Add your agent to `constants/agents.js`:

```javascript
AGENT_IDS.MY_NEW_AGENT: 'my_new_agent',
```

### Step 2: Add Default Configuration

```javascript
[AGENT_IDS.MY_NEW_AGENT]: {
  name: 'My New Agent',
  description: 'Description of what it does',
  type: AGENT_TYPES.MEDIA, // or CHAT, CONTENT, ANALYTICS
  category: AGENT_CATEGORIES.IMAGE_PROCESSING,
  icon: 'Sparkles',
  defaultModel: 'gemini-1.5-flash',
  defaultProvider: 'google',
  persona: 'You are a helpful assistant...',
  isActive: true,
},
```

### Step 3: Define Tools (Optional)

```javascript
[AGENT_IDS.MY_NEW_AGENT]: ['tool1', 'tool2', 'tool3'],
```

### Step 4: Create the Agent Class

```javascript
// src/lib/agents/my-new-agent.js
import BaseAgent from './BaseAgent';
import { AGENT_IDS } from '@/lib/constants/agents';

class MyNewAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.MY_NEW_AGENT, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    // Initialization logic
  }

  async _onExecute(input) {
    // Main execution logic
    return { success: true, result: '...' };
  }

  async _validateInput(input) {
    // Input validation
    if (!input.data) {
      throw new Error('data is required');
    }
  }
}

export const myNewAgent = new MyNewAgent();
export default MyNewAgent;
```

### Step 5: Register the Agent

In your application initialization or API route:

```javascript
import agentRegistry from '@/lib/agents/AgentRegistry';
import MyNewAgent, { AGENT_IDS } from '@/lib/agents';

// Register the agent class
agentRegistry.register(AGENT_IDS.MY_NEW_AGENT, MyNewAgent, {
  // Optional config overrides
});
```

### Step 6: Update Database Schema

Add the agent to `MediaAgentSettings.ensureDefaultAgents()`:

```javascript
{
  id: AGENT_IDS.MY_NEW_AGENT,
  name: DEFAULT_AGENT_CONFIGS[AGENT_IDS.MY_NEW_AGENT].name,
  description: DEFAULT_AGENT_CONFIGS[AGENT_IDS.MY_NEW_AGENT].description,
  icon: DEFAULT_AGENT_CONFIGS[AGENT_IDS.MY_NEW_AGENT].icon,
  type: DEFAULT_AGENT_CONFIGS[AGENT_IDS.MY_NEW_AGENT].type,
  category: DEFAULT_AGENT_CONFIGS[AGENT_IDS.MY_NEW_AGENT].category,
  isActive: true,
},
```

## Usage Examples

### Execute an Agent via Registry

```javascript
import agentRegistry from '@/lib/agents/AgentRegistry';

const result = await agentRegistry.execute(AGENT_IDS.IMAGE_ANALYZER, {
  base64Data: '...',
  mimeType: 'image/jpeg',
});
```

### Get Agent Status

```javascript
import agentManager from '@/lib/agents/AgentManager';

const status = agentManager.getAgentStatus(AGENT_IDS.IMAGE_ANALYZER);
console.log(status);
// { isActive: true, isInitialized: true, canExecute: true, ... }
```

### Listen to Agent Events

```javascript
import agentManager from '@/lib/agents/AgentManager';

agentManager.on('agent:activated', (data) => {
  console.log(`Agent ${data.agentId} activated`);
});

agentManager.on('metrics:collected', (data) => {
  console.log('New metrics collected at', data.timestamp);
});
```

### Update Agent Configuration

```javascript
import agentManager from '@/lib/agents/AgentManager';

await agentManager.updateAgentConfig(AGENT_IDS.IMAGE_ANALYZER, {
  model: 'gpt-4o',
  providerId: 'openai',
  isActive: true,
});
```

## API Endpoints

### GET `/api/admin/agents`

List all registered agents with their status.

### GET `/api/admin/agents/:id`

Get details for a specific agent.

### PUT `/api/admin/agents/:id`

Update agent configuration.

```json
{
  "providerId": "google",
  "model": "gemini-1.5-flash",
  "persona": "New persona...",
  "isActive": true
}
```

### DELETE `/api/admin/agents/:id`

Unregister an agent from runtime.

### GET `/api/admin/agents/health`

Get system health report.

### POST `/api/admin/agents/execute`

Manually execute an agent (for testing).

```json
{
  "agentId": "image_analyzer",
  "input": { "base64Data": "...", "mimeType": "image/jpeg" }
}
```

## Admin Dashboard

Access the agent dashboard at `/admin/agents` (or your configured route).

Features:

- View all agents with status indicators
- Activate/deactivate agents
- Configure agent settings
- Monitor execution metrics
- View health score

## Best Practices

1. **Always use constants**: Never hardcode agent IDs
2. **Extend BaseAgent**: Ensures consistent behavior
3. **Validate inputs**: Use `_validateInput()` method
4. **Log appropriately**: Use `this.logger` for logging
5. **Handle errors**: Catch and log errors in `_onExecute()`
6. **Respect rate limits**: Check `canExecute()` before execution
7. **Monitor health**: Use the dashboard and health endpoint

## Troubleshooting

### Agent not initializing

- Check if provider is configured in ChatbotSettings
- Verify API keys are properly encrypted/decrypted
- Check logs for specific errors

### Agent not executing

- Ensure agent is active: `agent.isActive === true`
- Check rate limits: `agent.canExecute()`
- Verify input format matches expectations

### Settings not persisting

- Ensure MediaAgentSettings model is properly indexed
- Check MongoDB connection
- Verify admin permissions

## Migration Notes

If migrating from the old system:

1. Update existing agent references to use `AGENT_IDS` constants
2. Run database migration to update agent IDs in MediaAgentSettings
3. Update API routes to use the registry pattern
4. Test all agent functionality before deploying

## Future Enhancements

- [ ] Agent versioning support
- [ ] A/B testing for agent configurations
- [ ] Agent performance analytics
- [ ] Automatic agent scaling based on load
- [ ] Agent marketplace for sharing configurations
