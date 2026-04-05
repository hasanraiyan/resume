import re

with open('src/context/MoneyContext.js', 'r') as f:
    content = f.read()

# Add initial chat state
initial_chat_state = """
  chatMessages: [
    {
      id: 1,
      role: 'assistant',
      content:
        'I am the finance agent for this workspace. The chat UI is now aligned with the main site chatbot, but the finance backend is still placeholder-only.',
      steps: [],
      timestamp: new Date(),
    },
  ],
  chatInput: '',
"""

content = content.replace("periodEnd: getWeekEnd(),\n};", "periodEnd: getWeekEnd(),\n" + initial_chat_state + "};")

# Add reducer cases
reducer_cases = """
    case 'SET_CHAT_MESSAGES':
      return { ...state, chatMessages: action.payload };
    case 'SET_CHAT_INPUT':
      return { ...state, chatInput: action.payload };
"""
content = content.replace("default:\n      return state;", reducer_cases + "    default:\n      return state;")

# Add action dispatchers
actions = """
  const setChatMessages = (messages) => dispatch({ type: 'SET_CHAT_MESSAGES', payload: messages });
  const setChatInput = (input) => dispatch({ type: 'SET_CHAT_INPUT', payload: input });
"""
content = content.replace("const setPeriod = (start, end) => {", actions + "\n  const setPeriod = (start, end) => {")

# Add to value object
content = content.replace("    setActiveTab,\n  };", "    setActiveTab,\n    setChatMessages,\n    setChatInput,\n  };")

with open('src/context/MoneyContext.js', 'w') as f:
    f.write(content)
