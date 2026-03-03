---
description: How to research, write, and publish high-quality blog posts for the portfolio
---

# Blog Writing Skill

This skill teaches you how to write professional, high-quality blog posts for Raiyan Hasan's developer portfolio blog at `https://hasanraiyan.vercel.app/blog`.

Visit this website to see all existing blog

---

## Step 1: Topic Selection & Deep Research

Before writing, you must select a topic and then deeply research it:

### Part A: Select a Topic

1.  **MANDATORY: Check Existing Blogs**: You MUST first fetch the list of currently published articles to avoid duplicates.
    - **Action**: Run the fetch-all-blogs tool:
      ```bash
      node .agent/skills/blog-writing/tool/fetch-all-blogs.js
      ```
      This calls the `/api/articles` endpoint and returns **all** published articles as JSON (bypasses pagination).
      **Fallback**: If the API is not deployed yet, list markdown files in `d:\resume\blogs\` and extract topic names from filenames (ignore `.metadata.md` files).
    - **Analysis**: Parse the returned JSON array of `{ title, slug, tags, publishedAt }` to check for duplicates.
    - **Constraint**: If your proposed topic or a very similar one already exists, you MUST pivot to a different angle or a new topic entirely.
2.  **Search the web** for trending developer topics (use `search_web`).
3.  **Pick a topic** that:
    - Is different from existing articles (diversify the blog).
    - Is timely OR evergreen (both work).
    - Shows technical depth and authority.
    - Would attract developer traffic (think: "what would I Google?").

### Part B: Structured Research Plan

Selection is only the beginning. You MUST create a formal research plan to ensure technical authority:

1.  **Create a `research_plan.md` artifact**: Define exactly what questions you need to answer.
2.  **Use `search_web` extensively**: Do multiple deep-dive searches on the specific concepts, libraries, and paradigms.
3.  **Identify Specifications**: Look for RFCs, W3C standards (like WebMCP), or major framework documentation (Next.js 16).
4.  **Gather context & examples**: Look for how leading companies are using the tech, find specific open-source libraries, and collect real-world analogies.

### Part C: Deep Synthesis (The Bridge to Drafting)

Before writing the draft, you MUST synthesize your findings into a `gathered_research.md` artifact:

1.  **Summarize Key Findings**: Document technical APIs, mechanisms, and error recovery patterns found.
2.  **Identify Code Examples**: Outline the "Resilient Action" or "Intent Hooks" you will demonstrate.
3.  **Anchor the Analogy**: Select the strongest real-world analogy and how it maps to the tech.
4.  **Constraint**: Do not start writing until you have enough technical depth to write an authoritative, 2,000+ word article without relying solely on your pre-trained knowledge.

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

1. **Be EXTREMELY specific and detailed**: Describe exactly what elements, objects, or actions should be in the image.
2. **ALWAYS use white/light background** — never dark backgrounds.
3. **Style**: Clean, minimal, infographic-style illustration.
4. **No text in images** — labels and text should be in the blog content, not baked into images.
5. **Aspect ratio**: Always 16:9.
6. **Colors**: Use soft, harmonious pastels or the brand palette.

### Image prompt template:

```
A clean, minimal infographic-style illustration on a white background.
[Provide a long, highly detailed description of the exact visual scenario — specify the objects, layout, and metaphorical action].
Soft pastel colors, geometric shapes, modern editorial style.
No text. 16:9 aspect ratio.
```

### Cover image prompt template:

```
A clean, modern tech blog cover illustration on a white background.
[Provide a long, highly detailed description of the core theme. Specify central objects, abstract shapes, layout, and how they interact visually].
Soft gradients, minimal geometric shapes, premium editorial aesthetic.
No text. 16:9 aspect ratio (to fit the 1200x480 container).
```

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

---

## Step 5: SEO & Cross-Posting Strategy

Writing is only half the battle. Every blog post MUST be optimized for distribution.

### SEO Best Practices

Ensure the metadata and content are structured for search intent. The first tag should be the primary category (e.g., `javascript`, `react`, `architecture`).

### Cross-Posting Playbook

Always instruct the user to cross-post the article to Dev.to and Hashnode with a **Canonical URL** pointing back to the original blog post at `https://hasanraiyan.vercel.app/blog/[slug]`.

---

## Step 6: Output Files

You MUST produce exactly **3 files**:

### File 1: Blog Content

**Path**: `d:\resume\blogs\[topic-name].md`

Contains ONLY the article markdown content.

### File 2: Metadata

**Path**: `d:\resume\blogs\[topic-name].metadata.md`

Contains all admin panel fields, cross-posting front-matter, and image prompts.

### File 3: Image Prompts (Temporary)

**Path**: `d:\tmp\[topic-name]-prompts.json`

A JSON array of all prompts for the image generation tool.

---

## Step 7: Automated Image Insertion Workflow

1.  **Generate Initial Files**: Create `File 1` (Content) and `File 2` (Metadata). Use placeholders like `![...](IMAGE_URL_1)` in the content.
2.  **Extract Prompts**: Identify all image prompts in `File 2`.
3.  **Generate Images**: Execute the image generation tool:
    ```bash
    node .agent/skills/blog-writing/tool/image-gen-tool.js --inputFile="prompts.json"
    ```
4.  **Update Content**: Replace `IMAGE_URL_N` placeholders in `File 1` with the actual URLs.
5.  **Final Polish**: Ensure the content looks as intended.

---

## Step 8: Multi-Stage Verification

Once the blog is finalized, run these verification steps:

1.  **Word Count & Readability**:

    ```powershell
    powershell -Command "(Get-Content d:\resume\blogs\[topic-name].md) -match '\w+' | Measure-Object -Word | Select-Object -ExpandProperty Words"
    ```

    - Aim for **2,000+ words** for high-authority content.

2.  **Link Validation**: Manually check all custom links.
3.  **Image URL verification**: Ensure the URLs in the markdown match the generation results exactly.

---

## Quality Checklist

Before delivering the blog, verify:

- [ ] Mandatory Research Plan created & followed
- [ ] Detailed `gathered_research.md` synthesis complete
- [ ] Title is compelling and specific (not generic)
- [ ] Opening hook grabs attention in the first 2 sentences
- [ ] At least one real-world analogy is used
- [ ] Code examples are real, runnable, and well-commented
- [ ] At least one comparison table is included
- [ ] Common mistakes or practical tips section exists (Section N-1)
- [ ] Conclusion summarizes the key insight
- [ ] Further Reading links are provided (3-4 relevant URLs)
- [ ] Metadata table is complete
- [ ] Dev.to cross-posting front matter is included
- [ ] All image prompts specify WHITE background
- [ ] Article is 1,800-2,800 words (Verified via PowerShell)
