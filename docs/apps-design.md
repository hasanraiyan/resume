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

## 7. Loading States & Skeleton Loaders

### Using react-skeletonify (Recommended)

The app uses `react-skeletonify` for automatic skeleton generation. Instead of manually building skeleton components, wrap your app with `SkeletonProvider` and use `SkeletonWrapper` around content.

#### Setup in App Root (page.js)

```jsx
import { SkeletonProvider, SkeletonWrapper } from 'react-skeletonify';
import 'react-skeletonify/dist/index.css';

export default function AppPage() {
  return (
    <SessionProvider>
      <AppContextProvider>
        <SkeletonProvider
          config={{
            animation: 'animation-1', // shimmer effect
            borderRadius: '8px', // matches design
            animationSpeed: 2, // 2-second cycle
            exceptTags: ['img', 'button', 'svg'], // keep interactive elements visible
            background: '#e5e3d8', // Pocketly skeleton color
          }}
        >
          <AppContent />
        </SkeletonProvider>
      </AppContextProvider>
    </SessionProvider>
  );
}
```

#### Wrapping Content with Skeletons

```jsx
function TabContent() {
  const { data, isLoading } = useAppContext();

  return (
    <SkeletonWrapper loading={isLoading && !data}>
      {/* Actual component content - skeleton auto-generates from this */}
      <div className="space-y-4">
        <div className="border border-[#e5e3d8] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#1e3a34]">Title</h3>
          <p className="text-xs text-[#7c8e88] mt-2">Description</p>
        </div>
      </div>
    </SkeletonWrapper>
  );
}
```

#### Delayed Skeleton Display (Prevent Flash)

For fast loads, use a 200ms delay before showing skeleton:

```jsx
const [showDelayedSkeleton, setShowDelayedSkeleton] = useState(false);

useEffect(() => {
  if (!isLoading) {
    setShowDelayedSkeleton(false);
    return;
  }

  const timer = window.setTimeout(() => {
    setShowDelayedSkeleton(true);
  }, 200);

  return () => window.clearTimeout(timer);
}, [isLoading]);

// Then use in SkeletonWrapper:
<SkeletonWrapper loading={isLoading && showDelayedSkeleton}>{/* content */}</SkeletonWrapper>;
```

#### Configuration Options

| Option           | Type                               | Default         | Purpose                                          |
| ---------------- | ---------------------------------- | --------------- | ------------------------------------------------ |
| `animation`      | `'animation-1'` \| `'animation-2'` | `'animation-1'` | Shimmer or wave animation                        |
| `animationSpeed` | number                             | 3               | Animation speed (1-10)                           |
| `background`     | string                             | `#aeaeae`       | Skeleton placeholder color                       |
| `borderRadius`   | string \| number                   | `'0'`           | Corner radius (e.g., `'8px'`)                    |
| `exceptTags`     | string[]                           | `[]`            | HTML tags to exclude (e.g., `['img', 'button']`) |
| `className`      | string                             | `''`            | Custom CSS class                                 |
| `style`          | object                             | `{}`            | Inline CSS overrides                             |

#### Why react-skeletonify?

✅ **No duplicate markup** - Skeletons auto-generate from actual components  
✅ **DRY principle** - Single source of truth  
✅ **Automatic adaptation** - Skeletons adjust when component layout changes  
✅ **Less code** - No need to maintain separate skeleton components  
✅ **Consistent styling** - Global config ensures uniform appearance

#### Example: Full Tab Implementation

```jsx
function RecordsTab() {
  const { transactions, isBootstrapLoading } = useAppContext();
  const [showDelayedSkeleton, setShowDelayedSkeleton] = useState(false);

  useEffect(() => {
    if (!isBootstrapLoading) {
      setShowDelayedSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowDelayedSkeleton(true), 200);
    return () => clearTimeout(timer);
  }, [isBootstrapLoading]);

  return (
    <SkeletonWrapper loading={isBootstrapLoading && showDelayedSkeleton}>
      <div className="mb-6 pb-4 pt-6">
        {/* Summary Cards - skeleton auto-generates these */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-4 rounded-xl border border-[#e5e3d8] bg-white p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c94c4c]/10">
              <TrendingDown className="w-6 h-6 text-[#c94c4c]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-[#7c8e88]">Total Expense</p>
              <p className="mt-0.5 text-xl font-bold text-[#c94c4c]">₹{transactions.length}</p>
            </div>
          </div>
          {/* More summary cards... */}
        </div>

        {/* Transaction List */}
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="border border-[#e5e3d8] rounded-xl p-4">
              <p className="text-sm font-bold text-[#1e3a34]">{tx.description}</p>
              <p className="text-xs text-[#7c8e88] mt-1">{tx.date}</p>
            </div>
          ))}
        </div>
      </div>
    </SkeletonWrapper>
  );
}
```

### Optional: Fallback for Extremely Fast Loads

Hold a placeholder frame to prevent layout shift:

```jsx
{
  isBootstrapLoading && !showDelayedSkeleton ? (
    <div className="min-h-[60vh]" />
  ) : (
    <SkeletonWrapper loading={isBootstrapLoading && showDelayedSkeleton}>
      {/* Content */}
    </SkeletonWrapper>
  );
}
```

---

### Legacy: Shimmer Component (Deprecated)

Previously, custom shimmer components were used. This approach is deprecated in favor of react-skeletonify.

```jsx
// OLD - Don't use this anymore
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

---

## 13. Dropdown / Context Menu Pattern

### The Problem: `overflow-hidden` clips absolute dropdowns

Cards commonly use `rounded-2xl overflow-hidden` to clip their children (e.g. images). Any `position: absolute` dropdown inside them gets clipped too — even with high `z-index`.

**Wrong approach** (dropdown gets clipped):

```jsx
// Card with overflow-hidden
<div className="rounded-2xl overflow-hidden">
  <ActionMenu /> {/* absolute dropdown gets clipped */}
</div>
```

**Correct approach** — use `position: fixed` with `getBoundingClientRect()`:

```jsx
export default function ActionMenu({ item }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button ref={buttonRef} onClick={handleOpen}>
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* backdrop — z-40, closes menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          {/* menu — z-50, fixed position from button rect */}
          <div
            className="fixed w-48 bg-white border border-[#e5e3d8] rounded-xl shadow-xl z-50 py-1"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {/* menu items */}
          </div>
        </>
      )}
    </div>
  );
}
```

**Key rules:**

- Backdrop at `z-40`, menu at `z-50`
- Always `e.stopPropagation()` on the trigger button (prevents parent card clicks)
- Always `e.stopPropagation()` on the backdrop click handler
- `right: window.innerWidth - rect.right` keeps the menu right-aligned to the button

---

## 14. Modal Event Propagation Bug

### React bubbles events through the component tree, not the DOM tree

A `position: fixed` modal looks visually detached, but if it's rendered as a React child of a clickable card, **click events still bubble up through React** to that card's `onClick`.

**Symptom**: closing a modal (clicking Save, Cancel, or backdrop) also triggers the parent card's click handler (e.g. navigating into a folder, opening a detail view).

**Fix**: `stopPropagation` on both the backdrop and the modal panel:

```jsx
export default function MyModal({ onClose, onConfirm }) {
  return (
    <>
      {/* Backdrop — stops propagation before calling onClose */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Centering wrapper — pointer-events-none so it doesn't intercept */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        {/* Modal panel — pointer-events-auto, stops all propagation */}
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* content, buttons, inputs */}
        </div>
      </div>
    </>
  );
}
```

**Rule**: Any modal rendered inside a clickable parent must stop propagation on both its backdrop and its content panel. This applies to rename modals, confirmation dialogs, and detail sheets.

---

## 15. Inline Rename Modal

A minimal rename dialog used for renaming files and folders. Follows the same modal propagation rules above.

```jsx
export default function RenameModal({ type, item, onConfirm, onClose }) {
  const currentName = type === 'file' ? item.filename : item.name;
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus and select all on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) {
      onClose();
      return;
    }
    setIsSaving(true);
    await onConfirm(trimmed);
    setIsSaving(false);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-[#f0f5f2] rounded-xl">
              <Pencil className="w-4 h-4 text-[#1f644e]" />
            </div>
            <h2 className="font-bold text-[#1e3a34]">Rename {type}</h2>
          </div>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10 mb-5"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e] disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

**Usage in ActionMenu** — wire Rename to open the modal instead of `prompt()`:

```jsx
const [showRename, setShowRename] = useState(false);

// in menu:
<button
  onClick={(e) => {
    e.stopPropagation();
    setIsOpen(false);
    setShowRename(true);
  }}
>
  <Pencil className="w-4 h-4" /> Rename
</button>;

// outside the dropdown div:
{
  showRename && (
    <RenameModal
      type={type}
      item={item}
      onConfirm={(newName) =>
        updateItem(type, item._id, type === 'file' ? { filename: newName } : { name: newName })
      }
      onClose={() => setShowRename(false)}
    />
  );
}
```

---

## 16. File Upload with Live Progress

`fetch` has no upload progress API. Use `XMLHttpRequest` with `xhr.upload.onprogress` instead. Upload files sequentially (one at a time) to track per-file progress independently.

### XHR upload helper

```jsx
const uploadSingleFile = (file, fileIndex, folderId) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setFileProgress((prev) =>
          prev.map((f, idx) => (idx === fileIndex ? { ...f, progress: percent } : f))
        );
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && data.success) resolve(data);
        else reject(new Error(data.error || 'Upload failed'));
      } catch {
        reject(new Error('Invalid server response'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.open('POST', '/api/your-app/upload');
    xhr.send(formData);
  });
};
```

### Sequential upload loop with per-file state

```jsx
// State: [{ progress: 0-100, status: 'pending'|'uploading'|'done'|'error' }]
const [fileProgress, setFileProgress] = useState([]);

const handleUpload = async (selectedFiles, folderId) => {
  setFileProgress(selectedFiles.map(() => ({ progress: 0, status: 'pending' })));

  for (let i = 0; i < selectedFiles.length; i++) {
    // mark current file as uploading
    setFileProgress((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
    );

    try {
      await uploadSingleFile(selectedFiles[i], i, folderId);
      setFileProgress((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, progress: 100, status: 'done' } : f))
      );
    } catch {
      setFileProgress((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'error' } : f)));
      toast.error(`Failed: ${selectedFiles[i].name}`);
    }
  }
};
```

### Per-file progress bar UI

```jsx
{
  selectedFiles.map((file, idx) => {
    const prog = fileProgress[idx];
    return (
      <div
        key={idx}
        className="flex items-center gap-3 p-2.5 bg-[#fcfbf5] rounded-xl border border-[#e5e3d8]"
      >
        <File className="w-4 h-4 text-[#7c8e88] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium truncate block">{file.name}</span>
          {prog && (
            <div className="mt-1.5 h-1 bg-[#e5e3d8] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  prog.status === 'error' ? 'bg-red-400' : 'bg-[#1f644e]'
                }`}
                style={{ width: `${prog.progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex-shrink-0 w-8 flex justify-end">
          {!prog && <Check className="w-4 h-4 text-[#c8d8d0]" />}
          {prog?.status === 'pending' && <span className="text-[10px] text-[#b0bfba]">—</span>}
          {prog?.status === 'uploading' && (
            <span className="text-[10px] font-bold tabular-nums text-[#1f644e]">
              {prog.progress}%
            </span>
          )}
          {prog?.status === 'done' && <Check className="w-4 h-4 text-[#1f644e]" />}
          {prog?.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
        </div>
      </div>
    );
  });
}
```

**Header progress counter** — show "X of Y uploaded" while uploading:

```jsx
const uploadedCount = fileProgress.filter((f) => f.status === 'done').length;
{
  isUploading && (
    <p className="text-xs text-[#7c8e88]">
      {uploadedCount} of {selectedFiles.length} uploaded
    </p>
  );
}
```

---

## 17. Manual Skeleton Pattern (No Library)

When `react-skeletonify` isn't available, mirror the real layout with `animate-pulse` blocks. Match the exact grid columns, card shapes, and spacing of the real content.

```jsx
// Skeleton that mirrors a 4-col folder grid + 5-col file grid
if (isLoading && items.length === 0) {
  return (
    <div className="space-y-8">
      {/* Section label skeleton */}
      <section>
        <div className="h-3 w-14 bg-[#e5e3d8] rounded animate-pulse mb-4" />
        {/* Folder cards — 4 col grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[#e5e3d8] rounded-2xl p-4 animate-pulse">
              <div className="w-10 h-10 bg-[#e5e3d8] rounded-xl mb-3" />
              <div className="h-3 bg-[#e5e3d8] rounded w-3/4 mb-2" />
              <div className="h-2 bg-[#e5e3d8] rounded w-1/4" />
            </div>
          ))}
        </div>
      </section>

      {/* File cards — 5 col grid with aspect-square thumbnail */}
      <section>
        <div className="h-3 w-10 bg-[#e5e3d8] rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-[#e5e3d8]" />
              <div className="p-3">
                <div className="h-3 bg-[#e5e3d8] rounded w-4/5 mb-2" />
                <div className="h-2 bg-[#e5e3d8] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

**Rules:**

- Use `bg-[#e5e3d8]` (the app border color) as the skeleton fill — it blends with the card style
- Match real grid columns exactly (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`)
- Use `aspect-square` for thumbnail placeholders — same aspect ratio as real cards
- Gate on `isLoading && items.length === 0` so skeletons don't flash when refreshing with existing data

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
- [ ] **Loading skeletons**: Use `SkeletonProvider` + `SkeletonWrapper` from `react-skeletonify`, or manual `animate-pulse` pattern (section 17)
- [ ] Responsive mobile/desktop grids
- [ ] Currency formatting with compact support
- [ ] **Dropdowns inside `overflow-hidden` cards**: use fixed positioning (section 13)
- [ ] **Modals inside clickable cards**: `stopPropagation` on backdrop + content (section 14)
- [ ] **File uploads**: use XHR (not fetch) for progress tracking (section 16)
