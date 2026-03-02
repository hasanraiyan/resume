---
description: How to research, write, and publish high-quality blog posts for the portfolio
---

# Blog Writing Skill

This skill teaches you how to write professional, high-quality blog posts for Raiyan Hasan's developer portfolio blog at `https://hasanraiyan.vercel.app/blog`.

Visit this website to see all existing blog

---

## Step 1: Topic Research

Before writing, research trending and high-value topics:

1.  **MANDATORY: Check Existing Blogs**: You MUST first fetch the list of currently published articles to avoid duplicates.
    - **Action**: Use `read_url_content` on `https://hasanraiyan.vercel.app/blog`.
    - **Analysis**: Parse the returned markdown to extract all existing titles and slugs.
    - **Constraint**: If your proposed topic or a very similar one already exists, you MUST pivot to a different angle or a new topic entirely.
2.  **Search the web** for trending developer topics (use `search_web`).
3.  **Pick a topic** that:
    - Is different from existing articles (diversify the blog).
    - Is timely OR evergreen (both work).
    - Shows technical depth and authority.
    - Would attract developer traffic (think: "what would I Google?").

### Good topic categories:

- AI & emerging tech (agentic AI, WebMCP, new standards)
- JavaScript/web fundamentals (event loop, closures, async)
- Practical tutorials (setting up tools, integrations)
- Security & best practices
- System design & architecture
- Developer productivity & workflows

---

## Step 2: Blog Structure

Every blog post MUST follow this structure:

```markdown
# Title: Clear, Compelling, Specific

_Subtitle/hook in italics — one line that makes the reader care_

---

[Opening hook — 2-3 paragraphs that draw the reader in with a relatable scenario or provocative question]

---

## Section 1: The Problem / Context

[Set up why this topic matters]

## Section 2-5: The Core Content

[Deep, well-structured sections with code examples, comparisons, and visuals]

## Section N-1: Practical Application / Common Mistakes

[Real-world tips, mistakes to avoid, or hands-on exercises]

## Final Thoughts

[2-3 paragraph conclusion — summarize the key insight, call to action]

---

_Follow line — one sentence inviting readers to follow_

**Further Reading:**

- [Resource 1](url)
- [Resource 2](url)
- [Resource 3](url)
```

### Writing Rules:

1. **Tone**: Conversational but authoritative. Like explaining to a smart colleague, not lecturing a student.
2. **Length**: 1,800–2,800 words (6-9 min read). Never under 1,500.
3. **Code examples**: MUST include real, runnable code. Not pseudocode.
4. **Analogies**: Use at least one strong real-world analogy per article.
5. **Tables**: Use comparison tables when contrasting concepts (e.g., Traditional AI vs Agentic AI).
6. **No fluff**: Every paragraph must teach something. Cut sentences that don't add value.
7. **Subheadings**: Use `##` and `###` liberally. No section should be more than 4-5 paragraphs without a heading break.
8. **Bold key terms**: Use `**bold**` for important concepts on first mention.
9. **Apostrophes**: Always use double quotes `"` for strings in code AND for prose strings that contain apostrophes (e.g., `"I'm"` not `'I'm'`).

---

## Step 3: Images

Blog posts SHOULD include inline images using markdown syntax:

```markdown
![Description of the image](IMAGE_URL)
```

### Image Prompt Rules:

When writing image generation prompts (either for the user or for `generate_image`):

1. **ALWAYS use white/light background** — never dark backgrounds
2. **Style**: Clean, minimal, infographic-style illustration
3. **No text in images** — labels and text should be in the blog content, not baked into images
4. **Aspect ratio**: Always 16:9
5. **Colors**: Use soft, harmonious pastels or the brand palette (neutral-900 for dark accents)

### Image prompt template:

```
A clean, minimal infographic-style illustration on a white background.
[Describe the visual concept — diagrams, flow charts, comparisons, metaphors].
Soft pastel colors, geometric shapes, modern editorial style.
No text. 16:9 aspect ratio.
```

### Cover image prompt template:

```
A clean, modern tech blog cover illustration on a white background.
[Describe the central visual concept related to the article topic].
Soft gradients, minimal geometric shapes, premium editorial aesthetic.
No text. 16:9 aspect ratio (to fit the 1200x480 container).
```

### When to include images:

- **Cover image**: Always provide a cover image prompt
- **Diagrams**: For any concept that involves a flow, architecture, or comparison
- **Before/after**: When showing transformations or improvements
- Aim for **2-5 images** per article for visual richness

### Automated Image Generation:

You can now generate these images automatically using the provided tool:

#### How to use the Image Generation Tool:

To generate images, you MUST use the batch generation method with a JSON file:

```bash
node .agent/skills/blog-writing/tool/image-gen-tool.js --inputFile="prompts.json" [--outputFile="results.json"]
```

- `--inputFile`: Path to a JSON file containing an array of objects: `[{ "id": "Cover", "prompt": "...", "aspectRatio": "16:9" }]`. Use the prompt rules above.
- `--outputFile`: (Optional) Where to save the results. Defaults to `image-results.json`.
- `--aspectRatio` (in JSON): Supported values are `1:1` (default), `9:16`, `16:9`, `3:4`, `4:3`, `3:2`, `2:3`, `5:4`, `4:5`, `4:1`, `1:4`, `8:1`, and `1:8`.

**Example `prompts.json`**:

```json
[
  {
    "id": "Cover",
    "prompt": "A clean minimal illustration of agentic AI on a white background, soft pastels, geometric shapes, 16:9, no text",
    "aspectRatio": "16:9"
  }
]
```

The tool will output the image URL. Use this URL directly in your blog markdown:

```markdown
![Description](https://utfs.io/f/generated-12345.png)
```

The user will generate the images, upload them, and replace `IMAGE_URL_N` with real URLs.

---

## Step 4: Metadata

After writing the blog, ALWAYS provide this metadata block for the user to copy into the admin panel:

```
| Field        | Value |
|--------------|-------|
| **Title**    | [Exact title from the blog] |
| **Slug**     | [lowercase-hyphenated-version-of-title] |
| **Excerpt**  | [2-3 sentence summary, compelling, ~150-200 characters] |
| **Tags**     | [5-8 lowercase comma-separated tags] |
| **Visibility** | Public - Anyone can view |
```

### Tag rules:

- Always lowercase
- Use hyphens for multi-word tags (e.g., `web-development`)
- Include 1-2 broad tags (e.g., `javascript`, `ai`) and 3-5 specific tags
- Check existing tags on the blog to reuse when relevant

### Slug rules:

- All lowercase
- Hyphens between words
- Remove articles (a, an, the) if the slug gets too long
- Max ~10 words

---

## Step 5: SEO & Cross-Posting Strategy

Writing is only half the battle. Every blog post MUST be optimized for distribution.

### SEO Best Practices

Ensure the metadata and content are structured for search intent. The tags chosen will be used for the `articleSection` JSON-LD schema on the blog, so the first tag should be the primary category (e.g., `javascript`, `react`, `architecture`).

### Cross-Posting Playbook

Always instruct the user to cross-post the article to Dev.to and Hashnode to maximize reach.
The cross-posting must always use a **Canonical URL** pointing back to the original blog post at `https://hasanraiyan.vercel.app/blog/[slug]`.

---

## Step 6: Output Files

You MUST produce exactly **2 files**:

### File 1: Blog Content

**Path**: `d:\resume\blogs\[topic-name].md`

Contains ONLY the article markdown content (what gets pasted into the Content editor). No metadata in this file.

### File 2: Metadata

**Path**: `d:\resume\blogs\[topic-name].metadata.md`

Contains everything needed to publish the article in the admin panel:

````markdown
# Blog Metadata: [Article Title]

## Admin Panel Fields

| Field          | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| **Title**      | [Exact title]                                                    |
| **Slug**       | [lowercase-hyphenated-slug]                                      |
| **Excerpt**    | [2-3 sentence summary - optimized for search intent]             |
| **Tags**       | [comma-separated lowercase tags - first tag is primary category] |
| **Visibility** | Public - Anyone can view                                         |

## Dev.to Cross-Posting Front Matter

Copy and paste this block at the very top of your Dev.to editor before pasting the markdown content:

```yaml
---
title: '[Exact Title]'
published: true
canonical_url: https://hasanraiyan.vercel.app/blog/[slug]
tags: [tag1, tag2, tag3, tag4]
---
```
````

## Cover Image

**Prompt** (generate this and upload as Cover Image URL):

> [Cover image prompt — MUST specify white background, minimal, 16:9]

## Inline Images

Images referenced in the blog content as `![...](IMAGE_URL_N)`:

### IMAGE 1

**Used in**: [Section name]
**Prompt**:

> [Full prompt — white background, 16:9]

### IMAGE 2

**Used in**: [Section name]
**Prompt**:

> [Full prompt — white background, 16:9]

[...repeat for all images]

## Publishing Checklist

- [ ] All images (Cover + Inline) generated using `image-gen-tool.js`
- [ ] All `IMAGE_URL_N` placeholders in the blog content file replaced with real URLs
- [ ] Content pasted into admin editor
- [ ] Metadata fields filled in admin panel
- [ ] Preview checked before publishing
- [ ] **Cross-Post**: Copy Dev.to front matter and markdown to dev.to
- [ ] **Cross-Post**: Import to Hashnode and set Canonical URL to the original post

````

---

## Step 7: Automated Image Insertion Workflow

Once you have drafted the blog and metadata, follow this specific workflow to finalize the images:

1.  **Generate Initial Files**: Create `File 1` (Content) and `File 2` (Metadata) as described in Step 6. Use placeholders like `![...](IMAGE_URL_1)` in the content.
2.  **Extract Prompts**: Read through `File 2` (`.metadata.md`) and identify all image prompts (Cover, Image 1, Image 2, etc.).
3.  **Generate Images**: For each identified prompt, execute the image generation tool:
    ```bash
    node .agent/skills/blog-writing/tool/image-gen-tool.js --inputFile="prompts.json"
    ```
4.  **Update Content**: Take the URLs returned by the tool and replace the `IMAGE_URL_N` placeholders in `File 1` (`[topic-name].md`) with the actual generated URLs.
5.  **Final Polish**: Ensure the content looks as intended before notifying the user.

---

## Quality Checklist

Before delivering the blog, verify:

- [ ] Title is compelling and specific (not generic)
- [ ] Opening hook grabs attention in the first 2 sentences
- [ ] At least one real-world analogy is used
- [ ] Code examples are real, runnable, and well-commented
- [ ] At least one comparison table is included (if applicable)
- [ ] Common mistakes or practical tips section exists
- [ ] Conclusion summarizes the key insight
- [ ] Further Reading links are provided (3-4 relevant URLs)
- [ ] Metadata table is complete (title, slug, excerpt, tags)
- [ ] Dev.to cross-posting front matter is included in the metadata file
- [ ] All image prompts specify WHITE background
- [ ] No unescaped apostrophes in single-quoted strings
- [ ] Article is 1,800-2,800 words
````
