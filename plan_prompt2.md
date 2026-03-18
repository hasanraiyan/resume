The user wants to upgrade the AI generation flow to use a dedicated "App Builder Agent" that operates using LangGraph state, giving it tools, memory, a to-do list, and a workspace to generate the final `index.html`. They also want the ability to select the design schema/style from the admin panel, which will be passed to the agent as a system instruction.

This means I need to:

1. Register a new agent ID in `src/lib/constants/agents.js` (e.g., `APP_BUILDER_AGENT`).
2. Add it to `DEFAULT_AGENT_CONFIGS` with a strong persona that focuses on generating complete, single-file HTML/JS/Tailwind CSS web apps.
3. Create `src/lib/agents/ai/app-builder-agent.js` that extends `BaseAgent` and uses LangGraph to manage state, potentially with tools like "write_html", "preview", etc., or simply a structured output that produces the final HTML string. Since LangGraph is requested with state/tools/todo list, I will set up a basic LangGraph workflow for it (e.g., plan -> generate -> review -> finish).
4. Update the App creation UI to allow selecting a "design schema" (e.g., Minimalist, Dashboard, Playful) which will be passed to the agent.
