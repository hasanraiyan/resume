# Common Errors & Solutions

This reference contains detailed solutions for common Cloudinary React errors.

## Environment Variable Errors

### "Where do I create the Cloudinary instance?" / "Config with Vite prefix"

- ❌ Problem: No config file or wrong env prefix
- ✅ Create `src/cloudinary/config.ts` with: `import { Cloudinary } from '@cloudinary/url-gen'`, read `import.meta.env.VITE_CLOUDINARY_CLOUD_NAME`, create and export `cld` instance

### "Cloud name is required"

- ❌ Problem: `VITE_CLOUDINARY_CLOUD_NAME` not set
- ✅ Solution: Check `.env` exists, has `VITE_` prefix, restart dev server

### "VITE\_ prefix required" or env var is undefined

- ❌ Problem: Wrong prefix or Vite cached old value
- ✅ Vite: Use `VITE_` prefix and `import.meta.env.VITE_*`
- ✅ Other bundlers: CRA uses `REACT_APP_`, Next.js client uses `NEXT_PUBLIC_`
- ✅ If still undefined: Clear `node_modules/.vite/`, restart, hard refresh (Cmd+Shift+R)

### Using literal placeholder "your_cloud_name" causes 401

- ❌ Problem: Used placeholder string instead of actual cloud name
- ✅ Solution: Replace with your actual cloud name from dashboard

## Import Errors

### "Cannot find module" or wrong import

- ❌ Problem: Wrong package or subpath
- ✅ Use ONLY exact paths from Import reference table
- ✅ Components/plugins: `@cloudinary/react`
- ✅ Transformations: `@cloudinary/url-gen` with exact subpaths (e.g. `actions/resize`, `qualifiers/source`)

## Transformation Errors

### "Transformation not working" or image looks wrong

- ✅ Check: transformation is chained, correct imports, valid public_id, v2 syntax
- ✅ Format/quality must be separate: `.delivery(format(auto())).delivery(quality(autoQuality()))`

### Wrong transformation syntax

- ❌ WRONG: `<AdvancedImage src="image.jpg" width={800} />`
- ✅ CORRECT: `const img = cld.image('id').resize(fill().width(800)); <AdvancedImage cldImg={img} />`

## Plugin Errors

### "Responsive images not working" or "Placeholder issues"

- ✅ Must use `responsive()` with `fill()` resize
- ✅ Include both `placeholder()` and `lazyload()` plugins
- ✅ Always add `width` and `height` attributes

### Plugins not working

- ❌ WRONG: `<AdvancedImage cldImg={img} lazyLoad placeholder />`
- ✅ CORRECT: `<AdvancedImage cldImg={img} plugins={[lazyload(), placeholder()]} />`

## Upload Widget Errors

### Upload fails (unsigned) — check upload preset first

- ✅ Debug checklist: 1) Preset configured in `.env`? 2) Exists in dashboard? 3) Is Unsigned? 4) Dev server restarted?

### "Upload preset not found"

- ✅ Create unsigned preset in dashboard, copy exact name to `.env`, restart

### Widget not opening

- ✅ Script in `index.html`
- ✅ Poll with `setInterval` until `typeof window.cloudinary?.createUploadWidget === 'function'`

### "createUploadWidget is not a function"

- ❌ Problem: Race condition - script loads async
- ✅ Always poll in useEffect: `setInterval` checking `typeof window.cloudinary?.createUploadWidget === 'function'`
- ❌ Do NOT: Check only `window.cloudinary`; single check in `onload`

### User needs secure/signed uploads

- ✅ See [signed-uploads.md](signed-uploads.md) for complete implementation

### "Invalid Signature" or "Missing required parameter - api_key"

- ✅ Use `uploadSignature` as function (not `signatureEndpoint`)
- ✅ Fetch `api_key` from server first
- ✅ Include `uploadPreset` in widget config
- ✅ Server must include `upload_preset` in signed params
- ✅ Use Cloudinary Node.js SDK v2

## Video Errors

### "AdvancedVideo not working"

- ✅ Verify: using `AdvancedVideo` from `@cloudinary/react`, video instance created, NO CSS import needed
- ❌ WRONG: `import '@cloudinary/react/dist/cld-video-player.css'` (doesn't exist)

### "Video player not working"

- ✅ Use imperative element: `document.createElement('video')`, append to container ref
- ✅ See [video-player.md](video-player.md) for complete pattern

### Confusion between AdvancedVideo and Video Player

- **AdvancedVideo**: For displaying a video (not a full player)
- **Cloudinary Video Player**: The player (styled UI, controls, playlists)

### Video player: poster image missing or broken

- ✅ Always include `posterOptions: { transformation: { startOffset: '0' }, posterColor: '#0f0f0f' }`

## Overlay Errors

### "Cannot read properties of undefined" or overlay not showing

- ✅ Import `source` from `actions/overlay`
- ✅ Use string values for compass: `compass('south_east')` (underscores)
- ✅ Use `new Transformation()` inside `.transformation()`
- ✅ `fontWeight` on TextStyle, `textColor` on text source

### Wrong import path for `text` or `image`

- ❌ Wrong: Importing from `actions/overlay`
- ✅ Correct: `text` and `image` from `qualifiers/source`

## TypeScript Errors

See [typescript-patterns.md](typescript-patterns.md) for complete TypeScript patterns and solutions.

### Common TypeScript issues:

- Missing types: Import from `@cloudinary/url-gen`
- Using `any`: Define proper interfaces or use `unknown`
- Missing window.cloudinary type: Add global declaration
- Missing env var types: Create `vite-env.d.ts`
- Incorrect ref typing: Use proper HTML element types

## Quick Debug Checklist

When something isn't working:

- [ ] Environment variables use correct bundler prefix (VITE*, REACT_APP*, NEXT*PUBLIC*)
- [ ] Dev server restarted after .env changes
- [ ] Env var undefined? Clear `node_modules/.vite/`, restart, hard refresh
- [ ] Imports use exact paths from Import reference table
- [ ] Upload Widget: script in index.html, poll for createUploadWidget
- [ ] Video Player: imperative element only, include posterOptions
- [ ] Upload fails? Check preset exists and is Unsigned (for unsigned uploads)
- [ ] Signed uploads? See signed-uploads.md for complete pattern
