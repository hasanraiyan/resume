# Cloudinary Video Player

Complete implementation guide for Cloudinary Video Player in React.

## When to Use

- ✅ Use **Cloudinary Video Player** when user asks for a "video player" (styled UI, controls, playlists)
- ✅ Use **AdvancedVideo** when just displaying a video (no full player needed)

## Critical Rule: Imperative Element Only

**Do NOT** pass a React-managed `<video ref={...} />` to the player. The library mutates the DOM and React will throw removeChild errors.

✅ Create element with `document.createElement('video')`
✅ Append to container ref
✅ Pass that element to `videoPlayer(el, ...)`

## Installation

```bash
npm install cloudinary-video-player
```

## Imports

```tsx
import { videoPlayer } from 'cloudinary-video-player';
import 'cloudinary-video-player/cld-video-player.min.css';
```

Note: No `dist/` in CSS path - package exposes `lib/` paths via exports

## Complete Implementation Pattern

```tsx
import { useRef, useLayoutEffect } from 'react';
import { videoPlayer } from 'cloudinary-video-player';
import 'cloudinary-video-player/cld-video-player.min.css';

function VideoPlayerComponent({ cloudName, publicId }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videoPlayer> | null>(null);

  useLayoutEffect(() => {
    // Check container is in DOM
    if (!cloudName || !containerRef.current?.isConnected) return;

    // Create imperative video element
    const el = document.createElement('video');
    el.className = 'cld-video-player cld-fluid';
    containerRef.current.appendChild(el);

    try {
      const player = videoPlayer(el, {
        cloudName,
        secure: true,
        controls: true,
        fluid: true,
        posterOptions: {
          transformation: { startOffset: '0' }, // Use first frame
          posterColor: '#0f0f0f', // Fallback color
        },
      });

      // Source takes an object, not a string
      player.source({ publicId });
      playerRef.current = player;
    } catch (err) {
      console.error('Video player init failed:', err);
      // Fallback to AdvancedVideo if init fails
    }

    // Cleanup
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.warn('Player disposal error:', e);
        }
        playerRef.current = null;
      }
      // Only remove if still has parent
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, [cloudName, publicId]);

  return <div ref={containerRef} />;
}
```

## Key Points

### Poster Options

Always include `posterOptions` for reliable poster display:

```tsx
posterOptions: {
  transformation: { startOffset: '0' },  // First frame (reliable)
  posterColor: '#0f0f0f',                // Dark fallback if poster fails
}
```

Override via props if needed (e.g. `startOffset: '5'` for 5 seconds in)

### player.source()

Takes an **object**, not a string:

```tsx
✅ player.source({ publicId: 'samples/elephants' })
❌ player.source('samples/elephants')  // WRONG
```

### Cleanup Pattern

1. Call `player.dispose()` (wrap in try-catch)
2. Set ref to null
3. Remove element only if `el.parentNode` exists (avoids NotFoundError)

### If Init Fails

- CSP restrictions or browser extensions may block player
- **Do NOT** relax CSP or ask user to disable extensions
- ✅ Fall back to **AdvancedVideo** with same publicId

## Common Errors

### "Invalid target for null#on" or React removeChild error

❌ Problem: Passed React-managed `<video ref>` to player
✅ Solution: Use imperative element (createElement, append to container)

### "source is not a function"

❌ Problem: Wrong import or calling source incorrectly
✅ Solution: `import { videoPlayer }` (named), call `player.source({ publicId })`

### Poster image missing or broken

❌ Problem: No posterOptions configured
✅ Solution: Always include `posterOptions` with `startOffset: '0'` and `posterColor`

### Failed HEAD requests or CORS console noise

- Analytics/telemetry from player - doesn't necessarily mean playback fails
- Do not add preflight GET
- If video doesn't play, check imperative pattern and fall back to AdvancedVideo

### Memory leak

❌ Problem: Not disposing player in cleanup
✅ Solution: Always dispose in cleanup (see pattern above)

## AdvancedVideo vs Video Player

| Feature   | AdvancedVideo       | Video Player              |
| --------- | ------------------- | ------------------------- |
| Purpose   | Display video       | Full player               |
| Package   | `@cloudinary/react` | `cloudinary-video-player` |
| CSS       | Not needed          | Required                  |
| Setup     | Declarative         | Imperative                |
| Controls  | Native HTML5        | Styled custom             |
| Playlists | No                  | Yes                       |
| Use when  | Show video          | Need player UI            |

## Documentation

- [Cloudinary Video Player](https://cloudinary.com/documentation/cloudinary_video_player.md)
- [Video Player API Reference](https://cloudinary.com/documentation/video_player_api_reference.md)
- [Video Player React Tutorial](https://cloudinary.com/documentation/video_player_react_tutorial.md)
