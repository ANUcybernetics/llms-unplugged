---
id: task-058
title: switch to vitepress
status: To Do
assignee: []
created_date: "2025-11-26 21:45"
updated_date: "2025-11-26 21:59"
labels: []
dependencies: []
---

I'd like to investigate the difficulty (and pros/cons generally) of switching
the website (in website/) to [vitepress](https://vitepress.dev) instead of the
currently 11ty + vite + tailwind setup.

It looks like there are several similarities:

- vite
- nunjuks templating

And I'd like to keep the "test/linkcheck/lint" behaviour from the current
approach (although I'm fine if there's a different way to handle that in
vitepress).

I'd also prefer to use typescript (vs js) wherever possible, and it looks like
vitepress has first-class support for that.

Visually, I'd like the site to look _approximately_ the same, but I don't care
about a pixel-for-pixel port. My priority is doing things "the vitepress way",
and porting things over to work with the framework.

I'd also like to keep the same colour scheme, but do it via a vitepress theme.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

# VitePress Migration Investigation Notes

## Updated Assessment (after clarifications)

Based on your feedback, this migration is **simpler than initially assessed**:

- ✅ Happy to do Nunjucks → Vue rewrite
- ✅ Don't need Tailwind if VitePress has idiomatic alternatives
- ✅ Default layout is fine; just need font/colour scheme
- ✅ Park Reveal.js slides for now
- ✅ Drop llms.txt and raw markdown passthrough
- ✅ RSS feed via plugin is fine

**Revised estimate: 1-2 days of focused work**

---

## Simplified Scope

### What needs migration

1. **Content pages** (markdown) — mostly copy across, minimal changes
2. **Custom colour scheme** — VitePress CSS variables
3. **Font (Public Sans)** — CSS import
4. **lmGrid/lmTable shortcodes** — Vue components (only complex custom feature)
5. **RSS feed** — use `vitepress-plugin-rss`
6. **Basic navigation** — VitePress config

### What can be dropped

- llms.txt generation
- Raw markdown passthrough
- Reveal.js slides (park for later)
- Complex Nunjucks template logic
- Custom Vite plugins

---

## VitePress Theming (without Tailwind)

VitePress has its own CSS variable system that's quite comprehensive. You can
customise by overriding variables in `.vitepress/theme/custom.css`:

```css
/* .vitepress/theme/custom.css */
:root {
  /* Brand colours - map to ANU palette */
  --vp-c-brand-1: #be830e; /* anu-gold */
  --vp-c-brand-2: #a87309; /* darker gold */
  --vp-c-brand-3: #d4940f; /* lighter gold */

  /* Background */
  --vp-c-bg: #000; /* anu-black */
  --vp-c-bg-alt: #1a1a1a;
  --vp-c-bg-soft: #1a1a1a;

  /* Text */
  --vp-c-text-1: #fff; /* anu-white */
  --vp-c-text-2: rgba(255, 255, 255, 0.8);

  /* Links */
  --vp-c-brand: #be830e;

  /* Font */
  --vp-font-family-base: "Public Sans", -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Dark mode is default in VitePress, but you can force it */
.dark {
  /* same as above, or tweak */
}
```

Then in your theme's `index.ts`:

```typescript
// .vitepress/theme/index.ts
import DefaultTheme from "vitepress/theme";
import "./custom.css";

export default DefaultTheme;
```

This approach:

- Uses VitePress's native styling system
- No Tailwind complexity or conflicts
- Simple CSS variable overrides
- Font loaded via CSS `@import` or `<link>` in config head

---

## Shortcode → Vue Component Migration

### Only two shortcodes need Vue components:

#### 1. `lmGrid` / `lmGridAuto`

The bigram grid table. Current usage in markdown:

```
{% lmGrid "see spot run . see spot jump ." %}
```

VitePress equivalent:

```vue
<LmGrid tokens="see spot run . see spot jump ." />
```

Or with options:

```vue
<LmGrid tokens="see spot" :nrows="6" :ncols="7" />
```

#### 2. `tally` (used inside lmGrid, rarely standalone)

Converts numbers to tally marks. Mostly internal to lmGrid.

#### 3. `lessonIntro` — can likely be replaced with markdown

Current shortcode generates a styled intro box. Could become:

```markdown
::: info Lesson Info This lesson is part of the
[Fundamentals](/topics/fundamentals/) topic.
[Download PDF](/assets/pdfs/basic-training.pdf) :::
```

VitePress has built-in custom containers (`::: info`, `::: tip`, `::: warning`,
etc.)

#### 4. `lmTable` — rarely used, could be HTML or simple component

---

## Content Migration

Most lesson pages need minimal changes:

**Before (11ty):**

```markdown
---
title: Basic Training
topic: fundamentals
pdf: /assets/pdfs/basic-training.pdf
templateEngineOverride: njk,md
---

# Basic Training

{% lessonIntro topicTitle, topic, pdf %}

{% lmGrid "see spot run ." %}
```

**After (VitePress):**

```markdown
---
title: Basic Training
topic: fundamentals
pdf: /assets/pdfs/basic-training.pdf
---

# Basic Training

::: info This lesson is part of the [Fundamentals](/topics/fundamentals/) topic.
[Download PDF](/assets/pdfs/basic-training.pdf) :::

<LmGrid tokens="see spot run ." />
```

---

## RSS Feed

Use [`vitepress-plugin-rss`](https://github.com/ATQQ/vitepress-plugin-rss):

```typescript
// .vitepress/config.mts
import { RSSOptions, RssPlugin } from "vitepress-plugin-rss";

const RSS: RSSOptions = {
  title: "LLMs Unplugged",
  baseUrl: "https://www.llmsunplugged.org",
  copyright: "© Ben Swift, CC BY-NC-SA 4.0",
  filter: (post) => post.filepath.startsWith("news/"),
};

export default defineConfig({
  vite: {
    plugins: [RssPlugin(RSS)],
  },
});
```

---

## Proposed Directory Structure

```
website/
├── .vitepress/
│   ├── config.mts           # Main config (TypeScript)
│   ├── theme/
│   │   ├── index.ts         # Theme entry
│   │   ├── custom.css       # ANU colours, fonts
│   │   └── components/
│   │       ├── LmGrid.vue   # Bigram grid component
│   │       └── LmTable.vue  # Table component (if needed)
│   └── cache/               # (gitignored)
├── index.md                 # Homepage
├── about.md
├── educators.md
├── faq.md
├── instructor-notes.md
├── topics/
│   ├── index.md
│   ├── fundamentals.md
│   ├── scaling-up.md
│   └── ...
├── lessons/
│   ├── basic-training.md
│   ├── weighted-randomness.md
│   └── ...
├── news/
│   └── *.md
└── public/
    ├── assets/
    │   ├── images/
    │   └── pdfs/
    ├── favicon.svg
    ├── og-image.jpg
    └── CNAME
```

---

## Migration Checklist

### Phase 1: Setup

- [ ] Create new branch
- [ ] Initialize VitePress (`npx vitepress init`)
- [ ] Configure TypeScript
- [ ] Setup custom.css with ANU colours and Public Sans font
- [ ] Configure site metadata (title, description, etc.)

### Phase 2: Components

- [ ] Create `LmGrid.vue` component
- [ ] Create `LmTable.vue` component (if needed)
- [ ] Register components globally in theme
- [ ] Test components render correctly

### Phase 3: Content

- [ ] Copy static pages (about, educators, faq, instructor-notes)
- [ ] Convert lessonIntro shortcode usage to `::: info` blocks
- [ ] Copy lesson pages, update lmGrid syntax
- [ ] Copy topic pages
- [ ] Copy news posts
- [ ] Copy assets (images, PDFs) to public/

### Phase 4: Navigation & Config

- [ ] Configure nav bar
- [ ] Configure sidebar for lessons/topics
- [ ] Setup RSS plugin for news
- [ ] Configure clean URLs
- [ ] Add Open Graph / social meta

### Phase 5: Verification

- [ ] Visual comparison with current site
- [ ] Test all internal links work
- [ ] Verify PDFs accessible
- [ ] Check mobile responsiveness
- [ ] Run link checker

---

## Key Resources

- [VitePress Theme Customisation](https://vitepress.dev/guide/extending-default-theme)
- [VitePress CSS Variables Reference](https://github.com/vuejs/vitepress/blob/main/src/client/theme-default/styles/vars.css)
- [vitepress-plugin-rss](https://github.com/ATQQ/vitepress-plugin-rss)
- [Using Vue in VitePress Markdown](https://vitepress.dev/guide/using-vue)
<!-- SECTION:NOTES:END -->
