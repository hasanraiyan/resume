with open('src/components/finance-tracker/FinanceChatTab.js', 'r') as f:
    content = f.read()

content = content.replace("e.target.style.height = \\`\\${Math.min(e.target.scrollHeight, 200)}px\\`;", "e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;")

with open('src/components/finance-tracker/FinanceChatTab.js', 'w') as f:
    f.write(content)
