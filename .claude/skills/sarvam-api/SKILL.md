---
name: sarvam-api
description: Use when generating code or answering questions about Sarvam AI APIs — chat completions, speech-to-text, text-to-speech, translation, transliteration, language detection, and document intelligence. Covers SDK signatures, gotchas, auth, models, and language codes.
version: 0.1.0
---

# Sarvam AI API Skill

Sarvam AI provides purpose-built APIs for Indian languages. This skill covers SDK signatures, gotchas, models, and patterns that AI agents commonly get wrong.

## Quick Links

- Full docs index: https://docs.sarvam.ai/llms.txt
- OpenAPI spec: https://docs.sarvam.ai/openapi.json
- AsyncAPI spec: https://docs.sarvam.ai/asyncapi.json
- Cookbook: https://github.com/sarvamai/sarvam-ai-cookbook
- Dashboard: https://dashboard.sarvam.ai
- MCP server: `https://docs.sarvam.ai/_mcp/server`

## Authentication

All non-chat endpoints use the `api-subscription-key` header. The chat endpoint (`/v1/chat/completions`) uses `Authorization: Bearer <token>`.

```python
from sarvamai import SarvamAI
client = SarvamAI(api_subscription_key="sk_xxx")
```

```js
import { SarvamAIClient } from 'sarvamai';
const client = new SarvamAIClient({ apiSubscriptionKey: 'sk_xxx' });
```

**Gotcha: Auth failures return HTTP 403, not 401.** Check `error.code` for `invalid_api_key_error` vs other error codes.

## SDK Installation

```bash
pip install -U sarvamai         # Python
npm install sarvamai@latest     # JS/TS
```

## Models

| Model                 | Type                | Languages                | Notes                            |
| --------------------- | ------------------- | ------------------------ | -------------------------------- |
| `sarvam-105b`         | Chat LLM            | 23 (22 Indian + English) | Flagship 105B, 128K context      |
| `sarvam-30b`          | Chat LLM            | 23 (22 Indian + English) | 30B, 64K context, cost-effective |
| `saaras:v3`           | Speech-to-Text      | 23 (22 Indian + English) | Multiple output modes            |
| `bulbul:v3`           | Text-to-Speech      | 11 (10 Indian + English) | 30+ voices                       |
| `mayura:v1`           | Translation         | 11 (10 Indian + English) | Multiple modes, auto-detect      |
| `sarvam-translate:v1` | Translation         | 23 (22 Indian + English) | Formal mode only                 |
| `saarika:v2.5`        | Speech Rec (legacy) | 11 Indian languages      | Migrate to Saaras v3             |

Language codes use BCP-47 format: `hi-IN`, `bn-IN`, `ta-IN`, `te-IN`, `kn-IN`, `ml-IN`, `mr-IN`, `gu-IN`, `pa-IN`, `od-IN`, `en-IN`, plus `as-IN`, `ur-IN`, `ne-IN`, `kok-IN`, `ks-IN`, `sd-IN`, `sa-IN`, `sat-IN`, `mni-IN`, `brx-IN`, `mai-IN`, `doi-IN`.

## API Reference

### Chat Completions

```
POST https://api.sarvam.ai/v1/chat/completions
Authorization: Bearer <token>
```

```python
client.chat.completions(
    model="sarvam-105b",
    messages=[{"role": "user", "content": "..."}],
    temperature=0.2,
    reasoning_effort="medium",  # "low" | "medium" | "high" | None
    stream=False,
    max_tokens=2048,
    wiki_grounding=False,
    seed=None,
    frequency_penalty=0,
    presence_penalty=0,
    tools=[...],
    tool_choice="auto",
)
```

```js
client.chat.completions({
  model: 'sarvam-105b',
  messages: [{ role: 'user', content: '...' }],
  temperature: 0.2,
  reasoning_effort: 'medium',
  stream: false,
  max_tokens: 2048,
  wiki_grounding: false,
});
```

**Gotchas:**

- SDK call is `client.chat.completions()` — NOT `client.chat.completions.create()`
- When `reasoning_effort` is enabled, `content` may be `None` and the reasoning text is in `reasoning_content` field
- Chat uses `Authorization: Bearer` header (NOT `api-subscription-key`)
- The REST API is at `/v1/chat/completions` (with the `/v1/` prefix)

### Speech-to-Text (Saaras v3)

```
POST https://api.sarvam.ai/speech-to-text
Content-Type: multipart/form-data
api-subscription-key: <key>
```

```python
client.speech_to_text.transcribe(
    file=open("audio.wav", "rb"),
    model="saaras:v3",
    mode="transcribe",  # "transcribe" | "translate" | "verbatim" | "translit" | "codemix"
    language_code="hi-IN",
)
```

```js
client.speechToText.transcribe({
  file: fs.createReadStream('audio.wav'),
  model: 'saaras:v3',
  mode: 'transcribe',
  language_code: 'hi-IN',
});
```

**Gotchas:**

- `mode` is **required** for Saaras v3 — does not default
- SDK method is `client.speech_to_text.transcribe()` (snake_case) with file as positional arg
- For REST, use `multipart/form-data`, not JSON
- Batch API (long audio, diarization): Initiate → Upload → Start → Poll → Download (5-step chain)

### Speech-to-Text Translate (Saaras v3)

Translates audio speech to English text directly:

```
POST https://api.sarvam.ai/speech-to-text/translate
```

Same parameters as transcribe but model always converts speech to English text.

### Text-to-Speech (Bulbul v3)

```
POST https://api.sarvam.ai/text-to-speech
```

```python
client.text_to_speech.convert(
    text="Hello, how are you?",
    target_language_code="hi-IN",
    speaker="anushka",  # 30+ voices available
    pace=1.0,
    audio_sample_rate=16000,
)
```

```js
client.textToSpeech.convert({
  text: 'Hello, how are you?',
  target_language_code: 'hi-IN',
  speaker: 'anushka',
  pace: 1.0,
  audio_sample_rate: 16000,
});
```

**Gotchas:**

- `pitch` and `loudness` parameters return 400 on `bulbul:v3` — they only work on `bulbul:v2`
- SDK method is `client.text_to_speech.convert()` — NOT `client.text_to_speech.synthesize()`
- HTTP streaming: `client.text_to_speech.stream()` (POST, returns audio chunks)
- WebSocket streaming: connect to `wss://api.sarvam.ai/text-to-speech/stream` for progressive audio
- Pronunciation dictionaries: create via `POST /pronunciation-dictionary` and reference by ID

### Translation

```
POST https://api.sarvam.ai/translate
```

```python
client.text.translate(
    input="Hello, how are you?",
    source_language_code="auto",  # "auto" for auto-detect (mayura:v1 only)
    target_language_code="hi-IN",
    speaker_gender="Male",        # "Male" | "Female"
    model="mayura:v1",            # "mayura:v1" | "sarvam-translate:v1"
    mode="formal",                # "formal" | "modern-colloquial" | "classic-colloquial" | "code-mixed"
    output_script=None,           # None | "roman" | "fully-native" | "spoken-form-in-native"
    numerals_format="international", # "international" | "native"
)
```

```js
client.text.translate({
  input: 'Hello, how are you?',
  source_language_code: 'auto',
  target_language_code: 'hi-IN',
  speaker_gender: 'Male',
  model: 'mayura:v1',
  mode: 'formal',
});
```

**Gotchas:**

- SDK method is `client.text.translate()` — flat on `text` subpackage, NOT `client.translate.translate()`
- `output_script` is silently ignored on `sarvam-translate:v1` (only works on `mayura:v1`)
- `auto` source language only works with `mayura:v1`, NOT `sarvam-translate:v1`
- Input max: 1000 characters for `mayura:v1`, 2000 for `sarvam-translate:v1`

### Transliteration

```
POST https://api.sarvam.ai/transliterate
```

```python
client.text.transliterate(
    input="Namaste",
    source_language_code="hi-IN",
    target_language_code="hi-IN",
    target_script_code="dev\nagari",  # or "roman"
)
```

### Language Detection

```
POST https://api.sarvam.ai/language/detect
```

```python
client.text.identify_language(
    input="नमस्ते, आप कैसे हैं?"
)
```

Returns detected language code and confidence score.

### Document Intelligence (Sarvam Vision)

Batch pipeline: Initiate → Get Upload URLs → Upload → Start → Poll Status → Download Results

```
POST /document-intelligence/initialise
POST /document-intelligence/get-upload-links
POST /document-intelligence/start
GET  /document-intelligence/get-status
GET  /document-intelligence/get-download-links
```

## REST API Headers Summary

| Endpoint Group                | Auth Header                     |
| ----------------------------- | ------------------------------- |
| Chat (`/v1/chat/completions`) | `Authorization: Bearer <token>` |
| Everything else               | `api-subscription-key: <key>`   |

## Common Gotchas Summary

1. **SDK method names differ from conventions**: `client.chat.completions()` (no `.create`), `client.text.translate()` (not `client.translate.translate()`), `client.text_to_speech.convert()` (not `.synthesize()`)
2. **Auth returns 403 not 401** for both missing and invalid keys
3. **`content` can be `None`** in chat responses when `reasoning_effort` is active — read `reasoning_content` instead
4. **`mode` is required** for Saaras v3 speech-to-text (no default)
5. **`output_script` silently fails** on `sarvam-translate:v1`
6. **`pitch`/`loudness` error on `bulbul:v3`** — only supported on `bulbul:v2`
7. **Chat endpoint uses Bearer token**, all others use `api-subscription-key` header
8. **Language codes are BCP-47** with `-IN` suffix (e.g., `hi-IN`, not `hi`)
9. **File uploads are multipart/form-data** for speech-to-text, not JSON
