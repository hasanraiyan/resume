# Apps Design Guide

This document captures the design patterns from the Pocketly finance tracker app. Use this guide when creating new apps in the `src/app/apps/` directory.

## 1. Typography

### Font Setup (layout.js)

```javascript
import { Pacifico, Nunito } from 'next/font/google';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-logo',
  display: 'swap',
});

const nunito = Nunito({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export default function AppLayout({ children }) {
  return <div className={`${pacifico.variable} ${nunito.variable}`}>{children}</div>;
}
```

- **Logo font**: Pacifico (`--font-logo`) - Use for app name/logo
- **Body font**: Nunito (`--font-sans`) - Use for all UI text
- Both fonts use `display: 'swap'` for performance

### Font Usage

- Logo: `font-[family-name:var(--font-logo)] text-2xl`
- Body: `font-[family-name:var(--font-sans)]`
- Sizes: text-xs (10px), text-sm (14px), text-lg (18px), text-xl (20px), text-2xl (24px)

---

## 2. Color Palette

### CSS Variables / Tailwind Classes

| Role         | Color     | Usage                            |
| ------------ | --------- | -------------------------------- |
| Background   | `#fcfbf5` | Main app background (warm ivory) |
| Primary      | `#1f644e` | Buttons, active states, income   |
| Primary Dark | `#17503e` | Button hover states              |
| Text Primary | `#1e3a34` | Main text color                  |
| Text Muted   | `#7c8e88` | Secondary text, labels           |
| Expense      | `#c94c4c` | Expense amounts, warnings        |
| Income       | `#1f644e` | Income amounts                   |
| Border       | `#e5e3d8` | Card borders, dividers           |
| Transfer     | `#4a86e8` | Transfer type                    |

### Example Usage

```jsx
// Primary background
<div className="bg-[#fcfbf5]">

// Primary button
<button className="bg-[#1f644e] text-white hover:bg-[#17503e]">

// Card with border
<div className="border border-[#e5e3d8] bg-white rounded-xl">

// Expense amount
<p className="text-[#c94c4c]">-₹500</p>

// Income amount
<p className="text-[#1f644e]">+₹1000</p>
```

---

## 3. Layout Structure

### Desktop + Mobile Layout

```jsx
export default function AppPage() {
  return (
    <div className="min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e5e3d8] fixed inset-y-0 left-0 z-30">
        {/* Sidebar content */}
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64 min-h-screen overflow-x-hidden pb-20 lg:pb-0 pt-14 lg:pt-0">
        {/* Mobile Header */}
        <header className="lg:sticky lg:top-0 fixed top-0 left-0 right-0 z-50 bg-[#fcfbf5] border-b border-[#e5e3d8]">
          {/* Header content */}
        </header>

        {/* Main Area */}
        <main className="min-w-0 flex-1 w-full overflow-x-hidden">{/* Page content */}</main>
      </div>

      {/* Mobile Bottom Nav (without Settings tab) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#fcfbf5] border-t border-[#e5e3d8] z-30 flex">
        {/* Bottom nav content */}
      </nav>
    </div>
  );
}
```

### Key Layout Classes

- `max-w-6xl` - Max content width
- `px-4 lg:px-6` - Horizontal padding
- `mb-6 pb-4 pt-6` - Section spacing
- `lg:ml-64` - Desktop content margin from sidebar

---

## 4. Navigation

### Tab Definition Format

```javascript
const tabs = [
  { id: 'records', label: 'Records', icon: ReceiptIcon },
  { id: 'analysis', label: 'Analysis', icon: ChartIcon },
  { id: 'accounts', label: 'Accounts', icon: WalletIcon },
  { id: 'categories', label: 'Categories', icon: TagIcon },
  { id: 'chat', label: 'Chat', icon: MessageCircleIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];
```

### Desktop Sidebar Button

```jsx
<button
  onClick={() => setActiveTab(tab.id)}
  className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
    activeTab === tab.id
      ? 'bg-[#1f644e] text-white'
      : 'text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1e3a34]'
  }`}
>
  <tab.icon className="w-5 h-5" strokeWidth={activeTab === tab.id ? 2 : 1.5} />
  {tab.label}
</button>
```

### Mobile Bottom Nav Button

```jsx
<button
  onClick={() => setActiveTab(tab.id)}
  className={`flex-1 flex flex-col items-center py-2 ${
    activeTab === tab.id ? 'text-[#1f644e]' : 'text-[#7c8e88]'
  }`}
>
  <tab.icon className="w-[22px] h-[22px] mb-0.5" strokeWidth={activeTab === tab.id ? 2 : 1.5} />
  <span className="text-[10px] font-bold">{tab.label}</span>
</button>
```

---

## 5. Cards & Components

### Summary Card (Desktop)

```jsx
<div className="flex items-center gap-4 rounded-xl border border-[#e5e3d8] bg-white p-5">
  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#c94c4c]/10">
    <Icon className="h-6 w-6 text-[#c94c4c]" />
  </div>
  <div>
    <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">Label</p>
    <p className="mt-0.5 text-xl font-bold text-[#c94c4c]">₹1,234</p>
  </div>
</div>
```

### Summary Card (Mobile)

```jsx
<div className="rounded-xl border border-[#e5e3d8] bg-white px-2.5 py-2 text-center">
  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7c8e88]">Label</p>
  <p className="mt-0.5 text-sm font-bold text-[#c94c4c]">₹1,234</p>
</div>
```

### Input Field

```jsx
<input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Placeholder text"
  className="w-full rounded-xl border border-[#e5e3d8] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#7c8e88] focus:border-[#1f644e]"
/>
```

### Button Variants

```jsx
// Primary button
<button className="bg-[#1f644e] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#17503e] transition cursor-pointer">
  Label
</button>

// Secondary button
<button className="border border-[#1f644e] text-[#1f644e] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1f644e] hover:text-white transition cursor-pointer">
  Label
</button>

// Ghost button
<button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
  <Icon className="w-4 h-4" />
  Label
</button>
```

---

## 6. Icons

### Recommended Icons (Lucide React)

Import from `lucide-react`:

```javascript
import {
  Receipt,
  BarChart3,
  Tag,
  Wallet,
  Plus,
  Settings,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Search,
  MoreVertical,
  Trash2,
  Pencil,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
```

### Icon Sizes

| Context      | Size     | Class               |
| ------------ | -------- | ------------------- |
| Summary card | 24px (6) | `w-6 h-6`           |
| List item    | 20px (5) | `w-5 h-5`           |
| Button       | 16px (4) | `w-4 h-4`           |
| Mobile nav   | 22px     | `w-[22px] h-[22px]` |
| Category     | 24px     | `w-6 h-6`           |

---

## 7. Loading States

### FAB Button (Loading)

```jsx
<button className="bg-[#1f644e] text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer disabled:opacity-60 flex items-center gap-2">
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
    <path
      d="M4 12a8 8 0 018-8"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      className="opacity-75"
    />
  </svg>
  Saving...
</button>
```

### Shimmer Effect

```jsx
function Shimmer({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded bg-[#e5e3d8] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#fcfbf5]/60 to-transparent" />
    </div>
  );
}
```

---

## 8. Data Display

### Currency Formatting

```javascript
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactNumberFormatter = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatCurrencyWithCompact = (amount) => {
  const abs = Math.abs(amount);
  const useCompact = abs >= 100000; // 1L+ uses compact
  const formatted = useCompact ? compactNumberFormatter.format(abs) : currencyFormatter.format(abs);
  return `₹${formatted}`;
};
```

### Date Formatting

```javascript
const periodRangeLabel =
  new Date(periodStart).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) +
  ' - ' +
  new Date(periodEnd).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
```

---

## 9. Modal / Bottom Sheet Patterns

### Modal Overlay

```jsx
{
  showModal && (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-[#fcfbf5] w-full max-w-sm rounded-xl border border-[#e5e3d8] shadow-xl p-5 animate-in zoom-in-95 duration-200">
        {/* Modal content */}
      </div>
    </div>
  );
}
```

### Bottom Sheet (Mobile)

```jsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence>
  {open && (
    <motion.div
      className="fixed inset-0 z-40 sm:hidden flex items-end justify-center bg-black/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-t-2xl bg-white px-4 pt-4 pb-6 shadow-xl"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 h-1 w-10 mx-auto rounded-full bg-[#e5e3d8]" onClick={onClose} />
        {children}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>;
```

---

## 10. Responsive Patterns

### Grid Layouts

```jsx
// 1 column mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Mobile hidden / Desktop show
<div className="hidden sm:flex ...">
<div className="sm:hidden ...">
```

### Mobile-First Summary

```jsx
<div className="grid grid-cols-3 gap-3">
  {/* Mobile: compact 3-column */}
</div>
<div className="hidden sm:grid sm:grid-cols-3 sm:gap-4">
  {/* Desktop: icon cards */}
</div>
```

---

## 11. Context & Providers

Typically apps wrap their content with providers:

```jsx
export default function AppPage() {
  return (
    <SessionProvider>
      <AppContextProvider>
        <AppContent />
      </AppContextProvider>
    </SessionProvider>
  );
}
```

---

## 12. File Structure

```
src/
├── app/
│   └── apps/
│       └── [app-name]/
│           ├── layout.js      # Font setup, metadata
│           └── page.js      # Main app page + navigation
├── components/
│   └── [app-name]/
│       ├── Tab1.js        # e.g., RecordsTab
│       ├── Tab2.js        # e.g., AccountsTab
│       ├── Tab3.js        # e.g., CategoriesTab
│       ├── Tab4.js        # e.g., AnalysisTab
│       ├── Tab5.js        # e.g., ChatTab
│       ├── Tab6.js        # e.g., SettingsTab
│       ├── AddModal.js    # e.g., AddTransactionModal
│       ├── BottomSheet.js
│       ├── IconRenderer.js
│       └── Skeletons.js
└── context/
    └── AppContext.js
```

---

## Quick Reference Checklist

When creating a new app, ensure:

- [ ] Fonts: Pacifico (logo), Nunito (body) in layout.js
- [ ] Colors: Use exact hex codes from palette
- [ ] Background: `bg-[#fcfbf5]`
- [ ] Layout: Desktop sidebar + mobile bottom nav
- [ ] Max content width: `max-w-6xl`
- [ ] Padding: `px-4 lg:px-6`
- [ ] Border color: `border-[#e5e3d8]`
- [ ] Active tab: `bg-[#1f644e] text-white`
- [ ] Inactive tab: `text-[#7c8e88]`
- [ ] Card styles consistent
- [ ] Empty states for all lists
- [ ] Loading skeletons matching layouts
- [ ] Responsive mobile/desktop grids
- [ ] Currency formatting with compact support
