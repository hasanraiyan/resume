# Homepage Redesign Plan: Business Owner + Developer Views

Date: 2026-07-16
Branch: `arena/019f6af8-resume`

## 1. Current Homepage Analysis

The current homepage is a strong portfolio-style landing page. It is built from CMS-backed sections in `src/app/page.js`:

1. `Navbar`
2. `Hero`
3. `Marquee`
4. `About`
5. `Skills`
6. `Achievements`
7. `Services`
8. `FeaturedWorks`
9. `Stats`
10. `Testimonials`
11. `Contact`
12. `Footer`

### What works now

- Clean personal-brand design with strong visual identity.
- CMS-driven content for hero, about, services, projects, skills, stats, testimonials, and contact.
- Good credibility sections: skills, achievements, stats, testimonials, featured works.
- Clear contact path with form and Calendly after submission.
- Responsive layout and existing reusable UI components: `Section`, `Card`, `Button`, `Badge`.

### Main issue

The homepage currently talks to a general visitor. It does not quickly separate two very different audiences:

- **Business owners** who care about outcomes, trust, speed, pricing clarity, ROI, and project delivery.
- **Developers / technical visitors** who care about stack, architecture, code quality, open source, technical depth, and collaboration.

Because both audiences see the same journey, the page can feel either too portfolio-focused for buyers or too marketing-focused for developers.

## 2. Redesign Goal

Create a homepage that starts with a simple audience choice:

> **Are you a business owner or a developer?**

Then adapt the page copy, CTAs, section order, proof points, and featured content to match that selected audience.

The goal is not to create two completely separate websites. The goal is to create one homepage with two guided views.

## 3. Recommended UX Direction

### Primary pattern: Persona switcher in the hero

Add a prominent but simple selector near the top of the homepage:

```text
I am a...
[ Business Owner ] [ Developer ]
```

Default selection should be **Business Owner**, because this view is more likely to convert leads and clients.

Also support direct links:

- `/#business` or `/?view=business`
- `/#developer` or `/?view=developer`

This makes sharing easier.

### Why not separate pages immediately?

Separate pages such as `/for-business` and `/for-developers` can be added later, but starting with a homepage switcher is better because:

- It keeps SEO and homepage authority concentrated.
- It avoids duplicating many sections.
- It lets visitors change views without leaving the page.
- Existing CMS-backed content can be reused.

## 4. Proposed Homepage Structure

### Shared top-level structure

1. Navbar
2. New persona-aware hero
3. Persona-specific proof bar / trust bar
4. Persona-specific journey sections
5. Shared featured work, but filtered/reframed
6. Shared testimonials, but filtered/reframed if possible
7. Persona-specific final CTA
8. Footer

## 5. Business Owner View

### Visitor mindset

A business owner asks:

- Can this person solve my business problem?
- Have they delivered real projects?
- Will this save me time or make me money?
- Can I trust them?
- What is the next step?

### Hero copy direction

**Badge**

```text
FOR BUSINESS OWNERS
```

**Headline options**

```text
Websites and apps that help your business grow.
```

or

```text
Launch faster with a developer who understands business goals.
```

**Subtext**

```text
I design and build fast, reliable digital products for founders, small businesses, and growing teams — from landing pages to full-stack web apps.
```

**Primary CTA**

```text
Start a Project
```

Link: `#contact`

**Secondary CTA**

```text
See Client Work
```

Link: `#work`

### Recommended section order for Business Owner view

1. Hero with business-focused value proposition
2. Trust / outcome bar
   - `Fast delivery`
   - `Clear communication`
   - `SEO-ready builds`
   - `Scalable systems`
3. Services
   - Website design and development
   - Business automation
   - SaaS / dashboard development
   - E-commerce / booking / CRM integrations
4. Featured Works
   - Focus on business result, not only technology.
   - Example card framing: `Problem → Solution → Result`.
5. Stats
   - Projects shipped, happy clients, years experience, support availability.
6. Testimonials
   - Prefer client/customer testimonials.
7. Process section, new
   - Discover
   - Plan
   - Build
   - Launch
   - Support
8. FAQ section, new
   - How long does a website take?
   - What does it cost?
   - Do you provide maintenance?
   - Can you work with my existing website?
9. Contact
   - Form headline should say: `Tell me what you want to build.`

### Business Owner content priority

Use less technical jargon. Emphasize:

- Outcomes
- Reliability
- Speed
- Support
- Communication
- Examples
- Trust
- Clear next step

## 6. Developer View

### Visitor mindset

A developer asks:

- What does this person build with?
- Is the code quality good?
- What architecture patterns do they use?
- Can I collaborate with them?
- Are there interesting projects, tools, blogs, or open-source examples?

### Hero copy direction

**Badge**

```text
FOR DEVELOPERS
```

**Headline options**

```text
Full-stack builds, AI tools, and clean developer experiences.
```

or

```text
I build practical software with modern web and AI systems.
```

**Subtext**

```text
Explore my projects, stack, technical writing, experiments, and the systems behind my work.
```

**Primary CTA**

```text
Explore Projects
```

Link: `/projects`

**Secondary CTA**

```text
Read Technical Posts
```

Link: `/blog`

### Recommended section order for Developer view

1. Hero with technical value proposition
2. Tech stack / skills
   - Next.js
   - React
   - MongoDB
   - AI / LangChain / MCP-related tooling if relevant
   - Tailwind
   - APIs
3. Featured Works
   - Focus on architecture, repo links, stack, engineering challenges.
4. Apps / tools teaser
   - Link to `/apps`.
5. Blog / articles teaser, new or existing data from `getLatestArticles(3)`
   - Current homepage fetches latest articles but does not render them. This is an opportunity.
6. Achievements / certifications
7. Developer-focused process
   - Product thinking
   - Architecture
   - Implementation
   - Testing / performance
   - Documentation
8. Collaboration CTA
   - `Want to collaborate?`
   - `Need help with a technical build?`
9. Contact

### Developer content priority

Use more technical detail. Emphasize:

- Stack
- Architecture
- Code quality
- AI/tools/projects
- Technical writing
- Collaboration
- GitHub/LinkedIn links
- System design thinking

## 7. New Components to Add

### `PersonaSwitcher`

Location suggestion:

```text
src/components/home/PersonaSwitcher.js
```

Responsibilities:

- Show two options: Business Owner and Developer.
- Save selected persona in local state and optionally `localStorage`.
- Update URL query param: `?view=business` or `?view=developer`.
- Dispatch selected persona to child sections.

### `PersonaHero`

Can replace or wrap the existing `Hero`.

Responsibilities:

- Render current hero layout but with persona-specific copy, CTA, and proof chips.
- Keep CMS fallback support.
- Preserve existing profile image and social links.

### `AudienceProofBar`

A compact trust/value strip below hero.

Business examples:

- `Launch-ready builds`
- `Clear project roadmap`
- `Conversion-focused UX`
- `Ongoing support`

Developer examples:

- `Modern full-stack systems`
- `Clean component architecture`
- `AI/tooling experiments`
- `Documented builds`

### `ProcessSection`

Persona-aware workflow section.

Business process:

1. Discovery
2. Scope
3. Build
4. Launch
5. Support

Developer process:

1. Requirements
2. Architecture
3. Implementation
4. Review
5. Iterate

### `LatestArticles` or `DeveloperWritingTeaser`

The homepage already fetches `latestArticles`, but it currently does not render them. Add a section for the Developer view.

### `FAQSection`

Especially useful for Business Owner view to reduce uncertainty before contact.

## 8. Data / CMS Plan

### Short-term implementation

Hardcode persona copy in a config file:

```text
src/config/homepagePersonas.js
```

Suggested shape:

```js
export const homepagePersonas = {
  business: {
    label: 'Business Owner',
    hero: {},
    proofPoints: [],
    process: [],
    faq: [],
    cta: {},
  },
  developer: {
    label: 'Developer',
    hero: {},
    proofPoints: [],
    process: [],
    featuredLinks: [],
    cta: {},
  },
};
```

### Long-term implementation

Move persona content into CMS/admin so it can be edited without code changes.

Possible model:

```text
HomepagePersona
- key: business | developer
- label
- heroBadge
- heroTitle
- heroDescription
- primaryCtaText
- primaryCtaHref
- secondaryCtaText
- secondaryCtaHref
- proofPoints[]
- processSteps[]
- faqs[]
- finalCta
```

## 9. Technical Implementation Plan

### Phase 1: UX foundation

- Add `src/config/homepagePersonas.js`.
- Add `src/components/home/PersonaSwitcher.js`.
- Add `src/components/home/PersonaAwareHome.js` as a client wrapper.
- Pass server-fetched CMS data from `src/app/page.js` into this wrapper.
- Use the wrapper to decide which sections to show and in which order.

### Phase 2: Hero redesign

- Either refactor `Hero.js` to accept persona overrides or create `PersonaHero.js`.
- Add persona switcher inside/near hero.
- Update CTAs based on selected persona.
- Keep existing image, social links, and CMS data.

### Phase 3: Persona sections

- Add `AudienceProofBar`.
- Add `ProcessSection`.
- Add `FAQSection` for business view.
- Add `LatestArticles` for developer view.

### Phase 4: Project/card reframing

- For business view, project cards should emphasize result and business value.
- For developer view, project cards should emphasize stack, architecture, and technical challenge.
- If project data does not yet include these fields, use current title/category/description first, then add CMS fields later.

### Phase 5: Polish

- Add smooth transition between views.
- Persist selected persona in `localStorage`.
- Respect query param on load.
- Ensure mobile selector is simple and thumb-friendly.
- Check accessibility: buttons, selected states, keyboard support, aria labels.

## 10. Proposed Page Flow Details

### Business Owner flow

```text
Navbar
Hero: business value proposition + persona switcher
Proof bar: business outcomes
Services
Featured work: business/result framing
Stats
Testimonials
Process
FAQ
Contact
Footer
```

### Developer flow

```text
Navbar
Hero: technical value proposition + persona switcher
Proof bar: technical strengths
Skills
Featured work: technical/project framing
Latest articles / technical writing
Achievements
Services or collaboration options
Contact
Footer
```

## 11. Design Direction

Keep the current black/white premium style, but make the hero more conversion-focused.

Recommended visual changes:

- Replace the generic hero with a more editorial split layout.
- Add a segmented control for audience selection.
- Use proof chips/cards directly under hero CTAs.
- Use stronger section hierarchy and clearer copy.
- Reduce long justified text in early sections; use scan-friendly bullets/cards.
- Make CTAs specific to each persona.

## 12. Acceptance Criteria

The redesign is successful when:

- Visitors immediately understand they can choose Business Owner or Developer view.
- Business Owner view clearly explains what can be built, why to trust you, and how to start.
- Developer view clearly shows technical depth, stack, projects, and writing/tools.
- The homepage still uses existing CMS-backed data where practical.
- The page remains responsive and accessible.
- The default journey has a strong lead-generation path to contact.

## 13. Recommended First Build

Start with the smallest useful implementation:

1. Add persona switcher.
2. Add persona-specific hero copy and CTAs.
3. Reorder existing sections based on persona.
4. Add proof bar.
5. Add process section.

Then add FAQ, latest articles, and deeper CMS integration in the next iteration.
