# Issue: Replace Admin Image Generation with Gemini

**ID**: ISSUE-002

## 🤖 Agent Assignment

**Primary Agent**: Codex
**Collaborators**: Jules (for UI), Antigravity (for review)

---

## 🎯 Objective

Remove the deprecated image generation service (Pollinations) from the admin panel and replace it with Google Gemini for generating images. Include a frontend UI configuration to select the model provider and model specifically for image output. Utilize the provided `ImageService` helper logic.

---

## 🛠️ Implementation Scope

### 📂 Allowed Directories/Files

- `d:\resume\src\components\admin\MediaLibraryClient.js` (Frontend UI update to remove old provider and add new model selection)
- `d:\resume\src\app\api\media\generate\route.js` (or similar generation endpoint, to implement Gemini backend)
- `d:\resume\src\app\api\media\models\route.js` (Update to fetch new available image models instead of Pollinations)
- `d:\resume\src\lib\image-service.js` (Optional: New file for the provided `ImageService` logic)

### ⚠️ Conflict Zones (DO NOT TOUCH)

- `d:\resume\src\app\(admin)\admin\chatbot\page.js` (Unless necessary for global model configuration)

---

## 🚀 Requirements

1. **Backend Integration**: Implement a new image generation endpoint using the provided `ImageService` logic (`@google/genai` based). The model used by default should be `gemini-3.1-flash-image-preview`.
2. **Frontend UI Update**: In `MediaLibraryClient.js` (specifically around lines 27-145 and the generation logic in lines 250-600+), update the image generation UI to remove the old provider. Add a dropdown to select the model provider and specific model for image generation if dynamic options are available.
3. **Helper Utilization**: Utilize the provided `ImageService` code as a foundation or helper for the backend route handling the generation request. Ensure `apiKey` matches the production environment (e.g., `process.env.GEMINI_API_KEY`).
4. **Remove Old Code**: Strip out old logic and API calls related to the deprecated pollinations image generation service.

### Provided Code Reference for Backend

```javascript
const { GoogleGenAI } = require('@google/genai');
const pino = require('pino');

// Helper to handle ESM import of mime in CommonJS
async function getMime() {
  const { default: mime } = await import('mime');
  return mime;
}

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

class ImageService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  init() {
    if (this.genAI) return;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenAI({ apiKey: apiKey });
    // Use the specific model requested by the user
    this.modelName = 'gemini-3.1-flash-image-preview';
  }

  async generateImage(prompt, aspectRatio = '1:1') {
    if (!this.genAI) this.init();

    logger.info({ prompt, aspectRatio }, 'Generating image with Gemini...');
    console.log(`[Gemini] Starting generation for prompt: "${prompt}"...`);

    try {
      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: '1K',
          },
          responseModalities: ['IMAGE'],
        },
      });

      console.log(`[Gemini] Response received from model.`);

      const candidates = response.candidates;
      console.log(`[Gemini] Candidates count: ${candidates ? candidates.length : 0}`);

      if (!candidates || candidates.length === 0 || !candidates[0].content.parts[0].inlineData) {
        console.error(`[Gemini] INVALID RESPONSE STRUCTURE:`, JSON.stringify(response, null, 2));
        throw new Error('No image was generated in the response');
      }

      const inlineData = candidates[0].content.parts[0].inlineData;
      const buffer = Buffer.from(inlineData.data, 'base64');
      const mimeType = inlineData.mimeType;

      const mime = await getMime();
      const extension = mime.getExtension(mimeType) || 'png';

      return {
        buffer,
        mimeType,
        extension,
      };
    } catch (error) {
      logger.error({ err: error }, 'Gemini Image Generation Error');
      console.error(`[Gemini] CRITICAL ERROR:`, error.message);
      if (error.stack) console.error(error.stack);
      throw error;
    }
  }
}

module.exports = new ImageService();
```

## NOte this ai support these aspect ration `1:1` (default), `9:16`, `16:9`, `3:4`, `4:3`, `3:2`, `2:3`, `5:4`, `4:5`, `4:1`, `1:4`, `8:1`, and `1:8`.

## 📝 Coordination Notes

- **Branch**: `agent/codex/admin-gemini-image-gen`
- **Dependencies**: Codex to implement backend API and service first, then Jules or Codex updates `MediaLibraryClient.js` UI.
- **PR Strategy**: Sequential PRs (Backend -> Frontend) or a single collaborative PR.

---

**Priority**: High
**Status**: ✅ Completed
