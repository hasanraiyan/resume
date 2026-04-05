import re

with open('src/app/finance/page.js', 'r') as f:
    content = f.read()

# 1. Import MessageCircle and FinanceChatTab
content = content.replace("import FinanceAgentPanel from '@/components/finance-tracker/FinanceAgentPanel';", "import FinanceChatTab from '@/components/finance-tracker/FinanceChatTab';")
content = content.replace("  Settings,\n  Loader2,\n} from 'lucide-react';", "  Settings,\n  Loader2,\n  MessageCircle,\n} from 'lucide-react';")

# 2. Add 'chat' to tabs
tabs_match = re.search(r'const tabs = \[\n(.*?)\n\];', content, re.DOTALL)
if tabs_match:
    tabs_content = tabs_match.group(1)
    new_tabs_content = tabs_content + ",\n  { id: 'chat', label: 'Chat', icon: MessageCircle }"
    content = content.replace(tabs_content, new_tabs_content)

# 3. Add 'chat' to tabTitles
tab_titles_match = re.search(r'const tabTitles = \{\n(.*?)\n  \};', content, re.DOTALL)
if tab_titles_match:
    tab_titles_content = tab_titles_match.group(1)
    new_tab_titles_content = tab_titles_content + ",\n    chat: 'Chat Assistant'"
    content = content.replace(tab_titles_content, new_tab_titles_content)

# 4. Add case for 'chat' in renderTab
render_tab_match = re.search(r'switch \(activeTab\) \{(.*?)\n      default:', content, re.DOTALL)
if render_tab_match:
    render_tab_content = render_tab_match.group(1)
    new_render_tab_content = render_tab_content + "\n      case 'chat':\n        return <FinanceChatTab />;"
    content = content.replace(render_tab_content, new_render_tab_content)

# 5. Remove FinanceAgentPanel
content = re.sub(r'\{accounts\.length > 0 && activeTab !== \'settings\' && \(\n\s*<FinanceAgentPanel activeTab=\{tabTitles\[activeTab\]\} />\n\s*\)\}\n', '', content)

with open('src/app/finance/page.js', 'w') as f:
    f.write(content)
