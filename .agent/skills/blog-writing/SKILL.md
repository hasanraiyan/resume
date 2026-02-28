---
description: How to research, write, and publish high-quality blog posts for the portfolio
---

# Blog Writing Skill

This skill teaches you how to write professional, high-quality blog posts for Raiyan Hasan's developer portfolio blog at `https://hasanraiyan.vercel.app/blog`.

Visit this website to see all existing blog

---

## Step 1: Topic Research

Before writing, research trending and high-value topics:

1. **Search the web** for trending developer topics (use `search_web`)
2. **Check existing blog articles** to avoid duplicates — view the blog listing or check the database
3. **Pick a topic** that:
   - Is different from existing articles (diversify the blog)
   - Is timely OR evergreen (both work)
   - Shows technical depth and authority
   - Would attract developer traffic (think: "what would I Google?")

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
No text. 16:9 aspect ratio.
```

### When to include images:

- **Cover image**: Always provide a cover image prompt
- **Diagrams**: For any concept that involves a flow, architecture, or comparison
- **Before/after**: When showing transformations or improvements
- Aim for **2-5 images** per article for visual richness

If embedding image prompts for the user to generate later, use this format:

```markdown
![PROMPT: Description of what to generate on a white background, minimal style, 16:9](IMAGE_URL_N)
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

- [ ] Cover image generated and uploaded
- [ ] All inline images generated and uploaded
- [ ] IMAGE_URL_N placeholders replaced with real URLs in blog content
- [ ] Content pasted into admin editor
- [ ] Metadata fields filled in admin panel
- [ ] Preview checked before publishing
- [ ] **Cross-Post**: Copy Dev.to front matter and markdown to dev.to
- [ ] **Cross-Post**: Import to Hashnode and set Canonical URL to the original post

```

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
```
