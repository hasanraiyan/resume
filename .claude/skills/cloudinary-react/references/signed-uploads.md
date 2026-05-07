# Secure (Signed) Uploads

Complete guide for implementing signed uploads with Cloudinary.

## Golden Rules

1. **Never expose or commit the API secret** - server-only
2. **Never commit API key or secret** - use `server/.env` in `.gitignore`
3. **API key** is not secret (can be sent to client); **API secret** must stay server-only

## Where to Put API Key and Secret

**Do NOT** put in root `.env` used by Vite.

✅ Create `server/.env`:

```
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

✅ Add `server/.env` to `.gitignore`
✅ Load only in server: `dotenv.config({ path: 'server/.env' })`
✅ Read only in server code: `process.env.CLOUDINARY_API_SECRET`
✅ Use Cloudinary Node.js SDK v2: `import { v2 as cloudinary } from 'cloudinary'`

## Client Pattern (Working Implementation)

Use `uploadSignature` as a function (not `signatureEndpoint`):

```tsx
// 1. Fetch api_key from server first
const response = await fetch('/api/sign-image');
const data = await response.json();

// 2. Configure widget
const widgetConfig = {
  cloudName: 'your_cloud',
  api_key: data.api_key, // from server
  uploadPreset: 'ml_default', // or your signed preset
  uploadSignature: function (callback, params_to_sign) {
    const paramsWithPreset = {
      ...params_to_sign,
      upload_preset: 'ml_default',
    };

    fetch('/api/sign-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params_to_sign: paramsWithPreset }),
    })
      .then((r) => r.json())
      .then((data) => (data.signature ? callback(data.signature) : callback('')))
      .catch(() => callback(''));
  },
};

// 3. Create widget with config
window.cloudinary.createUploadWidget(widgetConfig, callback);
```

## Server Pattern (Node/Express with SDK v2)

```ts
import { v2 as cloudinary } from 'cloudinary';

app.post('/api/sign-image', (req, res) => {
  const params = req.body.params_to_sign || {};
  const paramsToSign = {
    ...params,
    upload_preset: params.upload_preset || 'ml_default',
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    signature,
    timestamp: paramsToSign.timestamp,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  });
});
```

## Rules for Secure Uploads

✅ Use signed upload preset (dashboard → Upload presets → Signed)
✅ Default preset: `ml_default` (if not deleted by user)
✅ Generate signature on server only using SDK v2
✅ Keep `server/.env` in `.gitignore`
✅ Use `uploadSignature` as function
✅ Include `uploadPreset` in widget config
✅ Server must include `upload_preset` in signed params

## What NOT to Do

❌ Never put API secret in `VITE_` or `NEXT_PUBLIC_` variable
❌ Never commit API key or secret
❌ Do not generate signature in client-side JavaScript
❌ Do not use unsigned preset for secure uploads
❌ Do not omit `uploadPreset` from widget config
❌ Do not use Cloudinary Node SDK v1 - use v2
❌ Do not rely on `signatureEndpoint` - use `uploadSignature` function

## Debugging Signed Uploads

### "Invalid Signature"

- Check: Using `uploadSignature` function? `api_key` fetched from server? `uploadPreset` in widget config? Server includes `upload_preset` in signature?

### "Missing required parameter - api_key"

- Fetch `api_key` from server before creating widget
- API key is NOT secret - safe to use in client

### Preset doesn't exist

- Use `ml_default` if available (default signed preset)
- Or create signed preset in dashboard

## Next.js Specifics

- Root `.env.local`: Server-only vars (no `NEXT_PUBLIC_`)
- Client vars need `NEXT_PUBLIC_` prefix
- API secret goes in server-only section (no prefix)

## Documentation

- [Upload Widget - Signed Uploads](https://cloudinary.com/documentation/upload_widget.md#signed_uploads)
- [Upload assets in Next.js](https://cloudinary.com/documentation/upload_assets_in_nextjs_tutorial.md)
