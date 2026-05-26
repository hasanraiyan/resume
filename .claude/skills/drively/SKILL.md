---
name: drively
description: Full-stack reference for Drively, the private cloud storage mini-app. Use this when building file management features in other apps, adding upload/trash/share/search/activity patterns, or porting Drively patterns (bulk actions, infinite scroll, XHR upload progress, keyboard shortcuts, drag-and-drop, preview panels, storage analytics). Also covers cross-app reuse — other apps (e.g. Coursify) consume Drively models and service functions.
version: 0.1.0
---

# Drively — Private Cloud Storage App

Drively is a Google Drive clone for the admin user. Files are stored on Cloudinary. The app has 5 tabs, 14 API routes, 5 Mongoose models, and 20 components.

## Architecture

```
src/app/apps/drively/page.js       ← Main shell (tabs, search bar, sidebar)
src/app/api/drively/                ← 14 REST endpoints
src/components/drively/             ← 20 UI components
src/context/DrivelyContext.js       ← useState-based state management
src/models/Drively{File,Folder,Activity,Share,Settings}.js
src/lib/apps/drively/service/service.js    ← 614-line business logic + 4 reusable exports
src/lib/apps/drively/service/validators.js ← Zod schemas
```

## Models (5)

All models use `{ timestamps: true }` and the `mongoose.models.X || mongoose.model('X', Schema)` pattern.

| Model             | Key Fields                                                                                                                                        | Purpose                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `DrivelyFile`     | `filename`, `mimeType`, `size`, `cloudinaryPublicId`, `secureUrl`, `resourceType`, `folderId` (ref Folder), `starred`, `deletedAt`, `syncVersion` | File metadata                                             |
| `DrivelyFolder`   | `name`, `parentId` (self-ref), `path` (string like `"/parentId/selfId"`), `color`, `starred`, `deletedAt`                                         | Folder hierarchy                                          |
| `DrivelyActivity` | `action` (enum), `itemType`, `itemName`, `targetFolder`                                                                                           | Audit log                                                 |
| `DrivelyShare`    | `fileId` (ref File), `token` (unique 64-char hex), `expiresAt`                                                                                    | Time-limited shares                                       |
| `DrivelySettings` | `autoEmptyTrash` (bool, default true)                                                                                                             | Singleton via static `getSettings()` + `pre('save')` hook |

## API Routes (14)

| Route                               | Method    | Purpose                                                                                                                           |
| ----------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/api/drively/bootstrap`            | GET       | Fetch all initial data (folders, files paginated, stats, recent, starred, activity, shares, trash count). Optional `?trash=true`. |
| `/api/drively/upload`               | POST      | File upload via FormData. Validates <50MB. Rate-limited 20/min.                                                                   |
| `/api/drively/folders`              | POST      | Create folder                                                                                                                     |
| `/api/drively/folders/[id]`         | PATCH     | Update/move/rename/star/restore folder                                                                                            |
| `/api/drively/folders/[id]`         | DELETE    | Soft or permanent delete folder                                                                                                   |
| `/api/drively/files/[id]`           | PATCH     | Update/move/rename/star/restore file                                                                                              |
| `/api/drively/files/[id]`           | DELETE    | Soft or permanent delete file                                                                                                     |
| `/api/drively/files/[id]/duplicate` | POST      | Duplicate file with "(copy)" suffix                                                                                               |
| `/api/drively/files/[id]/share`     | POST      | Create/get share link (7-day expiry)                                                                                              |
| `/api/drively/files/[id]/share`     | DELETE    | Revoke share                                                                                                                      |
| `/api/drively/search`               | GET       | Case-insensitive regex search on filename + folder name                                                                           |
| `/api/drively/bulk`                 | POST      | Bulk: delete/restore/star/unstar/move/download ZIP                                                                                |
| `/api/drively/settings`             | GET/PATCH | Fetch/update settings                                                                                                             |
| `/api/drively/trash/expire`         | DELETE    | Purge items in trash >30 days                                                                                                     |
| `/api/drively/trash/empty`          | DELETE    | Empty all trash (destroys Cloudinary assets)                                                                                      |
| `/api/drively/download/[id]`        | GET       | 302 redirect to Cloudinary URL                                                                                                    |
| `/api/drively/public/[token]`       | GET       | Public (unauthenticated) access to shared file via token                                                                          |

## Context (`DrivelyContext.js`)

Uses plain **useState** (not useReducer). State shape:

```js
{
  (files,
    folders,
    stats,
    recent,
    activity,
    starred,
    shares,
    settings,
    trashCount,
    trashFiles,
    trashFolders,
    currentFolderId,
    page,
    hasMore,
    isLoading,
    searchQuery,
    sortConfig,
    selectedItems,
    previewFile,
    uploadProgress,
    renameTarget);
}
```

Key methods: `fetchBootstrap()`, `uploadFiles()`, `createNewFolder()`, `deleteItem()` (optimistic), `updateItem()` (optimistic + descendant check), `duplicateItem()`, `shareItem()`, `revokeShare()`, `updateSettings()`, `emptyTrash()`, `executeBulk()` (with descendant validation for folder moves), `toggleSelection()`, `clearSelection()`.

## Key Components (20)

| Component           | File                   | Purpose                                                                                                    |
| ------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `MyDriveTab`        | `MyDriveTab.js`        | Main tab — breadcrumbs, view toggles, sort, infinite scroll, drag-and-drop zone, folder/file cards         |
| `FileCard`          | `FileCard.js`          | File item — thumbnail, icon fallback, checkbox, star, download, share indicator, ActionMenu, drag-and-drop |
| `FolderCard`        | `FolderCard.js`        | Folder item — color icon, checkbox, star, item count, ActionMenu, drag-and-drop target                     |
| `ActionMenu`        | `ActionMenu.js`        | Context menu — fixed positioning via `getBoundingClientRect()`, avoids `overflow-hidden` clipping          |
| `UploadModal`       | `UploadModal.js`       | Upload — drag-and-drop zone, click-to-browse, XHR per-file progress, sequential upload loop                |
| `FilePreviewPanel`  | `FilePreviewPanel.js`  | Slide-in preview — images (zoom), PDF (iframe), video, audio (visualizer), text/code, metadata             |
| `SearchResults`     | `SearchResults.js`     | Search — category filters (All/Images/Documents/Videos/Other), folder path indicators                      |
| `BulkActionToolbar` | `BulkActionToolbar.js` | Floating toolbar on selection — Star/Move/Download ZIP/Delete                                              |
| `Breadcrumbs`       | `Breadcrumbs.js`       | Hierarchical path — home icon, item count badge                                                            |
| `SortDropdown`      | `SortDropdown.js`      | Sort — name (A-Z/Z-A), date modified, date created, size                                                   |
| `MoveModal`         | `MoveModal.js`         | Folder picker — search/filter, path breadcrumbs, tree view                                                 |
| `RenameModal`       | `RenameModal.js`       | Inline rename — auto-focus, Enter/Exit keys, `stopPropagation`                                             |
| `ActivityFeed`      | `ActivityFeed.js`      | Sidebar log — filter pills (All/Uploads/Deletes/Moves/Renames)                                             |
| `StorageTab`        | `StorageTab.js`        | Storage analytics — bar, type breakdown, largest files, folder usage                                       |
| `StorageDashboard`  | `StorageDashboard.js`  | Chart.js doughnut — storage distribution, top 10 consumers                                                 |
| `RecentTab`         | `RecentTab.js`         | Recently modified files                                                                                    |
| `StarredTab`        | `StarredTab.js`        | Starred folders + files sections                                                                           |
| `TrashTab`          | `TrashTab.js`          | Trashed items with expiry countdown, empty-trash action                                                    |
| `ErrorBoundary`     | `ErrorBoundary.js`     | React class error boundary with retry                                                                      |
| `utils.js`          | `utils.js`             | `getFileIcon(mimeType)` → Lucide icon, `formatSize(bytes)`                                                 |

## Service Layer Exports

`src/lib/apps/drively/service/service.js` exports reusable functions consumable by other apps:

| Function                                                                                              | Signature                                                                                            | Purpose                                                                               |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `saveFileRecord({ filename, mimeType, size, cloudinaryPublicId, secureUrl, resourceType, folderId })` | Upserts DrivelyFile by `cloudinaryPublicId`, logs activity                                           | Idempotent — callers manage Cloudinary upload, delegate DrivelyFile/Activity creation |
| `uploadFile(file, folderId)`                                                                          | Full pipeline: validate 50MB, sanitize filename, Cloudinary upload, create DrivelyFile, log activity | General-purpose file upload                                                           |
| `logDrivelyAction(action, itemType, itemName, targetFolder)`                                          | Standalone activity logging                                                                          | Any app needing audit log entries                                                     |
| `getStorageStats()`                                                                                   | Aggregation: total size, type breakdown, largest files                                               | Storage analytics                                                                     |
| `softDeleteFile(id)` / `permanentDeleteFile(id)`                                                      | Soft-delete + Cloudinary destroy                                                                     | Trash management                                                                      |
| `duplicateFile(id)`                                                                                   | Cloudinary re-upload with "(copy)" suffix                                                            | File duplication                                                                      |

### Cross-App Reuse (Coursify Example)

Coursify imports `saveFileRecord` to persist thumbnail metadata without duplicating DrivelyFile/DrivelyActivity boilerplate:

```js
import { saveFileRecord } from '@/lib/apps/drively/service/service';
import DrivelyFolder from '@/models/DrivelyFolder';

// Coursify handles its own Cloudinary upload (needs specific public_id + transformations)
const uploadResult = await cloudinaryUpload(buffer, {
  public_id: `coursify/thumbnail_${courseId}`,
  overwrite: true,
  transformation: [{ width: 1280, height: 720, crop: 'fill', quality: 'auto' }],
});

// Then delegates Drively record-keeping to the shared helper
await saveFileRecord({
  filename: `${courseTitle} - Thumbnail.webp`,
  mimeType: 'image/webp',
  size: uploadResult.bytes,
  cloudinaryPublicId: uploadResult.public_id,
  secureUrl: uploadResult.secure_url,
  resourceType: 'image',
  folderId: await getOrCreateCoursifyFolder(),
});
```

**Rules for cross-app reuse:**

- Keep Cloudinary upload in the consumer app if you need a **predictable public_id** with `overwrite: true` or **custom transformations** (Drively's `uploadFile()` generates unique public_ids)
- Use `saveFileRecord()` for the DrivelyFile + DrivelyActivity boilerplate — it upserts by `cloudinaryPublicId` so it's safe to call repeatedly
- Create a dedicated `DrivelyFolder` per consumer app (e.g., "Coursify Thumbnails") for organization
- All apps share the same Cloudinary folder (`drively/`) with sub-namespace public*ids (e.g., `coursify/thumbnail*\*`)
- Import `ensureDb()` from the service before any Drively model operation outside the service functions

## Reusable Patterns

### 1. Fixed-Position Context Menu

`ActionMenu.js` uses `getBoundingClientRect()` to position menus relative to the trigger button, avoiding `overflow-hidden` clipping inside scrollable cards. Backdrop at `z-40`, menu at `z-50`.

### 2. XHR Upload with Per-File Progress

Uses `XMLHttpRequest` (not `fetch`) for `upload.onprogress` events. Sequential uploads per file with status matrix: `pending` → `uploading` → `done`/`error`. Files uploaded in concurrent chunks of 3 via `Promise.allSettled`.

### 3. Infinite Scroll via IntersectionObserver

`MyDriveTab.js` places a sentinel `<div ref={sentinelRef}>` at the bottom. `IntersectionObserver` triggers `loadMore()` when visible. Prevents re-fetch with `isLoading` guard. Uses `setTimeout(..., 200)` debounce.

### 4. Optimistic Updates with Rollback

`deleteItem()` / `updateItem()` cache previous state before mutation. On API failure, restore cached state. Folder move validates that target is not a descendant of source (tree-cycle prevention).

### 5. Path-Based Recursive Folder Operations

`DrivelyFolder.path` stores `"/parentId/selfId"`. Queries use `{ path: { $regex: `^${oldPath}` } }` for recursive descendant traversal on cascade delete/move/rename.

### 6. Keyboard Shortcuts

Single `useEffect` keydown handler in the page shell:

- **Escape** — clear selection, close preview/rename/share modals
- **Delete** — soft-delete selected items (with confirm)
- **F2** — rename selected item
- **Ctrl+A** — select all visible items

### 7. StopPropagation on Modals in Clickable Parents

Both backdrop (`onClick` → close) and content panel call `e.stopPropagation()` to prevent bubbling to parent `onClick` (e.g., card click to open preview).

### 8. Singleton Settings Model

`DrivelySettings.getSettings()` static method ensures one settings doc. `pre('save')` hook sets `isActive=false` on all other docs before saving the new one.

### 9. Separate Zod Validators

All request validation in `validators.js`, imported by both the service layer and API route handlers. Schemas: `CreateFolderSchema`, `UpdateFolderSchema`, `UpdateFileSchema`, `BulkActionSchema`.

### 10. Skeleton Loading States

Manual skeleton grids in MyDriveTab, StarredTab, RecentTab, TrashTab, StorageTab. Use `animate-pulse` with `bg-[#e5e3d8]` blocks mirroring the real grid layout. Gate: `isLoading && items.length === 0`.

### 11. Cloudinary Thumbnail Transforms

Image URLs transformed by replacing `/upload/` with `/upload/w_400,c_fill,q_auto,f_auto/` for responsive thumbnails.

### 12. Drag-and-Drop File/Folder Moves

Custom protocol via `dataTransfer.setData('drivelyItem', JSON.stringify(item))`. Drag-over visual feedback on folders. Tree-cycle validation prevents moving parent into its own descendant.

### 13. Bulk Selection + Floating Toolbar

Array-based `selectedItems` state. Floating toolbar appears on any selection. Actions dispatched via `executeBulk()`.

### 14. Rate-Limited Uploads

`@/lib/rateLimit` with `10 req / 60 sec` window for upload endpoint. Returns 429 on excess.

## Gotchas

- All API routes require `requireAdminAuth(request)` from `@/lib/money-auth.js` — must check `if (result instanceof NextResponse) return result`
- File upload max is 50MB per file (validated both client and server)
- Folder `path` field must be updated recursively on move/rename (regex on all descendants)
- Soft-delete recursive: deleting a folder cascades to all files/folders whose `path` starts with the folder's path
- Permanent delete destroys Cloudinary asset via `cloudinary.uploader.destroy(publicId)`
- Share tokens are 64-char random hex via `crypto.randomBytes(32).toString('hex')`
- Public share route (`/api/drively/public/[token]`) does NOT check auth — validates share exists + not expired
- ZIP download uses `archiver` streaming — must handle pipe errors and clean up temp
- File sizes in bytes on the model, formatted via `formatSize()` util
- MIME type icons from Lucide via `getFileIcon()` in `utils.js` — maps common MIME categories to icon components
- Sort queries use `{ $sort: { [sortField]: sortOrder } }` — sortField must be validated against an allowlist to prevent injection
- Env var `NEXT_PUBLIC_DRIVELY_QUOTA_MB` (default `1000`) controls per-user storage quota
- The Coursify app also stores thumbnails in `/drively` Cloudinary folder and imports `saveFileRecord` from Drively's service
- `saveFileRecord()` calls `ensureDb()` internally — consumers don't need to call `dbConnect()` before it
- When consuming Drively models directly (e.g., `DrivelyFolder.find()`), you must call `await ensureDb()` or `await dbConnect()` first
- `saveFileRecord()` uses `findOneAndUpdate` with `upsert: true` by `cloudinaryPublicId` — safe for repeated calls with the same Cloudinary asset

## Sharing This Skill

To use in Cursor / Claude Code / Windsurf:

```bash
npx skills add .agent/skills/drively
```
