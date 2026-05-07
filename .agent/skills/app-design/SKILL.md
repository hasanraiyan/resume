---
name: app-design
description: Design patterns and UI conventions for creating apps in src/app/apps/. Covers colors, layout, dropdowns, modals, skeletons, file uploads, and rename flows learned from Pocketly and Drively.
---

# App Design Skill

Use this skill when creating or modifying apps in `src/app/apps/`. Full reference: `docs/apps-design.md`.

---

## Color Palette

| Role         | Hex       | Usage                        |
| ------------ | --------- | ---------------------------- |
| Background   | `#fcfbf5` | App background (warm ivory)  |
| Primary      | `#1f644e` | Buttons, active states       |
| Primary dark | `#17503e` | Button hover                 |
| Text         | `#1e3a34` | Body text                    |
| Muted        | `#7c8e88` | Labels, secondary text       |
| Danger       | `#c94c4c` | Destructive actions, errors  |
| Border       | `#e5e3d8` | Card borders, dividers       |
| Hover bg     | `#f0f5f2` | Row/button hover backgrounds |
| Surface      | `#f8f9fa` | Thumbnail / icon backgrounds |

---

## Fonts

```javascript
import { Pacifico, Nunito } from 'next/font/google';
// --font-logo → logo/brand name (Pacifico)
// --font-sans → all UI text (Nunito 400/600/700/800)
```

---

## Layout Shell

Desktop sidebar (`w-64`, fixed left) + mobile bottom nav. Main content: `lg:ml-64 pb-20 lg:pb-0`. See `docs/apps-design.md` section 3 for the full shell.

---

## Common Components

### Primary button

```jsx
<button className="bg-[#1f644e] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors shadow-sm flex items-center gap-2">
  Label
</button>
```

### Input field

```jsx
<input className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10" />
```

### Section label

```jsx
<h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">Folders</h2>
```

---

## Dropdown / Context Menu (§13)

**Problem**: `overflow-hidden` on a card clips `position: absolute` dropdowns even with high `z-index`.

**Fix**: Use `position: fixed` + `getBoundingClientRect()`:

```jsx
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

// Render:
<div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
<div className="fixed w-48 bg-white border border-[#e5e3d8] rounded-xl shadow-xl z-50 py-1"
     style={{ top: menuPos.top, right: menuPos.right }}>
  {/* items */}
</div>
```

- Backdrop `z-40`, menu `z-50`
- Always `e.stopPropagation()` on trigger button and backdrop

---

## Modal Event Propagation Bug (§14)

**Problem**: A `position: fixed` modal is visually detached, but React still bubbles its click events up through the component tree — triggering the parent card's `onClick` (e.g. navigating into a folder when you click Cancel).

**Fix**: Stop propagation on both the backdrop and the modal panel:

```jsx
<div
  className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
  onClick={(e) => { e.stopPropagation(); onClose(); }}
/>
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
  <div
    className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 pointer-events-auto"
    onClick={(e) => e.stopPropagation()}
  >
    {/* content */}
  </div>
</div>
```

**Rule**: Any modal rendered inside a clickable parent must stop propagation on backdrop AND content panel.

---

## Inline Rename Modal (§15)

Auto-focuses and selects all text on mount. Enter saves, Escape cancels.

```jsx
const inputRef = useRef(null);
useEffect(() => {
  inputRef.current?.focus();
  inputRef.current?.select();
}, []);

const handleKeyDown = (e) => {
  if (e.key === 'Enter') handleSave();
  if (e.key === 'Escape') onClose();
};
```

Wire to ActionMenu: on Rename click → `setShowRename(true)`. Render `<RenameModal>` outside the dropdown div so it's not clipped. See `src/components/drively/RenameModal.js` for the full component.

---

## File Upload with Live Progress (§16)

`fetch` has no upload progress API. Use `XMLHttpRequest`:

```jsx
const uploadSingleFile = (file, fileIndex) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setFileProgress((prev) =>
          prev.map((f, i) => (i === fileIndex ? { ...f, progress: pct } : f))
        );
      }
    });
    xhr.addEventListener('load', () => {
      const data = JSON.parse(xhr.responseText);
      xhr.status === 200 && data.success ? resolve(data) : reject(new Error(data.error));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.open('POST', '/api/your-app/upload');
    xhr.send(fd);
  });

// Upload sequentially for per-file progress:
for (let i = 0; i < files.length; i++) {
  setFileProgress((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f)));
  await uploadSingleFile(files[i], i);
  setFileProgress((prev) =>
    prev.map((f, idx) => (idx === i ? { ...f, progress: 100, status: 'done' } : f))
  );
}
```

State shape: `[{ progress: 0–100, status: 'pending'|'uploading'|'done'|'error' }]`

See `src/components/drively/UploadModal.js` for the full progress bar UI.

---

## Manual Skeleton Pattern (§17)

When `react-skeletonify` isn't available, mirror the real grid with `animate-pulse` blocks:

```jsx
if (isLoading && items.length === 0) {
  return (
    <div className="space-y-8">
      <section>
        <div className="h-3 w-14 bg-[#e5e3d8] rounded animate-pulse mb-4" />
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
    </div>
  );
}
```

- Use `bg-[#e5e3d8]` (border color) as skeleton fill
- Match real grid columns exactly
- Gate on `isLoading && items.length === 0` — prevents flash on refresh

---

## Quick Checklist

- [ ] Fonts: Pacifico + Nunito in layout.js
- [ ] Colors: exact hex codes from palette above
- [ ] Layout: desktop sidebar + mobile bottom nav
- [ ] Empty states for every list
- [ ] Skeleton loading (§17 or react-skeletonify)
- [ ] Dropdowns inside `overflow-hidden` → fixed positioning (§13)
- [ ] Modals inside clickable parents → stopPropagation on backdrop + panel (§14)
- [ ] File uploads → XHR not fetch (§16)
- [ ] Rename flows → RenameModal with autoFocus + keyboard shortcuts (§15)
