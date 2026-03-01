# Bug: Next.js 15 Async Dynamic API Error

A console error is appearing in the development logs regarding the use of `params` in dynamic routes. This is due to a breaking change in Next.js 15 where dynamic route parameters must be awaited.

## Error Details

- **Message**: `Error: Route "/api/admin/chatbot/providers/[id]/models" used params.id. params should be awaited before using its properties.`
- **Location**: `src/app/api/admin/chatbot/providers/[id]/models/route.js:16:13`
- **Cause**: Next.js 15 requires `params` and `searchParams` to be treated as Promises in Route Handlers and Server Components.

## Affected Files

- `src/app/api/admin/chatbot/providers/[id]/models/route.js`

## Proposed Fix

Change the synchronous destructuring to an asynchronous one:

```javascript
// From:
const { id } = params;

// To:
const { id } = await params;
```

## Technical Notes

- Leaving this unaddressed causes a warning/error in development and will likely break the build in production.
- Any other dynamic routes added during this refactor must also follow the `await params` pattern.
