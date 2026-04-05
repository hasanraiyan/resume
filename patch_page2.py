with open('src/app/finance/page.js', 'r') as f:
    content = f.read()

content = content.replace("  { id: 'settings', label: 'Settings', icon: Settings },,", "  { id: 'settings', label: 'Settings', icon: Settings },")
content = content.replace("    settings: 'Settings',,", "    settings: 'Settings',")

with open('src/app/finance/page.js', 'w') as f:
    f.write(content)
