# Coursify generate API usage

Use this API on the production base URL:

`https://hasanraiyan.me`

## Endpoints

- `POST https://hasanraiyan.me/api/coursify/generate-sync` for a single JSON response.

## Request body

Send JSON with at least a `topic` field:

```json
{
  "topic": "React Server Components",
  "isReferenceEnabled": true
}
```

`topic` is trimmed by the shared parser. If it is missing or empty, the request is rejected.

## Sync example

```bash
curl https://hasanraiyan.me/api/coursify/generate-sync \
  -H "Content-Type: application/json" \
  -d '{"topic":"React Server Components","isReferenceEnabled":true}'
```

That means the route should pass a normalized `topic` into the helper and let the
agent run through the shared execution path.
