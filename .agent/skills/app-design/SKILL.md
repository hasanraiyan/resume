---
name: app-design
description: Design patterns and UI conventions for creating apps in src/app/apps/
---

# App Design Skill

Use this skill when creating new apps in `src/app/apps/` directory.

## Quick Reference

The full design guide is at `docs/apps-design.md`. It contains:

- **Typography**: Pacifico (logo) + Nunito (body) fonts
- **Colors**: Background #fcfbf5, Primary #1f644e, Expense #c94c4c, Border #e5e3d8
- **Layout**: Desktop sidebar w-64 + mobile bottom nav
- **Max width**: max-w-6xl
- **Padding**: px-4 lg:px-6
- **Components**: Summary cards, inputs, buttons, skeletons, bottom sheets
- **File structure**: Follow the pattern in docs/apps-design.md

## Common Patterns

### Font setup (layout.js)

```javascript
import { Pacifico, Nunito } from 'next/font/google';
// Use --font-logo for logo, --font-sans for body
```

### Colors

```javascript
// Background: bg-[#fcfbf5]
// Primary: bg-[#1f644e]
// Expense: text-[#c94c4c]
// Income: text-[#1f644e]
```

### Navigation tabs

```javascript
const tabs = [
  { id: 'records', label: 'Records', icon: ReceiptIcon },
  // ... more tabs
];
```

### Summary card

```javascript
<div className="flex items-center gap-4 rounded-xl border border-[#e5e3d8] bg-white p-5">
  <Icon className="h-6 w-6 text-[#c94c4c]" />
  <div>
    <p className="text-xs font-bold uppercase text-[#7c8e88]">Label</p>
    <p className="text-xl font-bold text-[#c94c4c]">₹1,234</p>
  </div>
</div>
```

---

For detailed patterns, see `docs/apps-design.md`.
