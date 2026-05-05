# Astromotion MDX Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace astromotion's bespoke `.deck.md`/`.deck.svelte` pipeline with a thin layer over Astro's MDX integration plus custom remark plugins, so deck authors get one unified `.deck.mdx` format with islands-style per-component hydration while preserving the existing authoring DX (bg images, includes, slide classes, notes, QR codes, slide-on-`---` splitting).

**Architecture:** Astromotion becomes an Astro integration that (1) registers `@astrojs/mdx` with a set of deck-scoped remark plugins, (2) injects the catch-all deck route, and (3) keeps the existing asset-copy build hook. The route imports `.deck.mdx` files via `import.meta.glob({ eager: true })`, wraps each compiled MDX `<Content />` in `.reveal/.slides`, and initialises Reveal.js client-side. Custom deck syntax (`<!-- @include -->`, `<!-- _class: -->`, `<!-- notes: -->`, `![bg ...]`, `![qr]`, `---` slide separators) is preserved by remark plugins that only fire on files matching `*.deck.mdx`. The old `src/preprocessor.ts`, `src/vite-plugin.ts` deck loader, and `components/DeckLoader.svelte` are deleted.

**Tech Stack:**

- Astromotion: TypeScript, unified/remark, `@astrojs/mdx` (new peer dep), Astro integration API, Vitest
- Llms-unplugged: Astro 6, Svelte 5, MDX (new dep)
- Reuse: `parse-helpers.ts` (parseClassDirective, parseNotesDirective, parseIncludeDirective, parseBgModifiers, parseHtmlComment), `meta.ts` (parseDeckFrontmatter), `svg/qr-code.ts` (generateQrCode)

**Repos involved:**

- `~/projects/astromotion/` — the package being rewritten
- `~/projects/llms-unplugged/website/` — primary consumer being migrated
- `~/projects/astro-theme-anu/` — no changes required (deck.css is unaffected)

**Out of scope:** Migrating other astromotion consumers (comp4020-agentic-coding-studio, teaching-archive's sites, astro-theme-anu/docs). They will need follow-up work using the same migration recipe — file a separate plan.

**Breaking change:** This is a major version bump for astromotion. `.deck.md` and `.deck.svelte` extensions stop working — consumers must migrate to `.deck.mdx`. Document in CHANGELOG.

---

## Pre-flight

Use the `superpowers:using-git-worktrees` skill to set up isolated worktrees for both repos before starting:

- `~/projects/astromotion/` → worktree on a feature branch (e.g. `mdx-rewrite`)
- `~/projects/llms-unplugged/website/` → worktree on a feature branch (e.g. `astromotion-mdx`)

Then in the llms-unplugged worktree, override the astromotion dependency to point at the astromotion worktree:

```jsonc
// package.json
{
  "pnpm": {
    "overrides": {
      "astromotion": "file:/absolute/path/to/astromotion/worktree"
    }
  }
}
```

Run `pnpm install` in the llms-unplugged worktree to wire it up. **Remove this override before committing/merging.**

Confirm the dev server runs in the consumer worktree before starting (`pnpm run dev` → http://localhost:4321/decks/fundamentals/) so you have a working baseline to compare against.

---

## Phase 1: Build remark plugins (in astromotion worktree)

All plugins live in `astromotion/plugins/` (new directory). Each plugin:

1. Receives `(tree, file)` from unified
2. Returns early unless `file.path?.endsWith('.deck.mdx')` (so non-deck MDX files are unaffected)
3. Mutates `tree` in place

Reusable helpers (`parseClassDirective`, `parseNotesDirective`, `parseIncludeDirective`, `parseBgModifiers`, `parseHtmlComment`) come from `astromotion/src/parse-helpers.ts` --- import them, don't reimplement.

### Task 1: remark-deck-includes plugin

Inlines `<!-- @include path -->` directives by reading the referenced file and splicing its parsed AST into the current tree. Must run **before** `remark-deck-sections` so that `---` separators inside included files are recognised. Uses `remark-mdx` for `.mdx` includes so component tags inside partials work as components (not literal HTML); falls back to plain markdown parsing for `.md` includes.

**Add dep:** `cd ~/projects/astromotion && pnpm add remark-mdx@^3.0.0` before starting (also captured in Task 8).

**Files:**

- Create: `astromotion/plugins/remark-deck-includes.ts`
- Create: `astromotion/test/remark-deck-includes.test.ts`
- Create: `astromotion/test/fixtures/includes/main.md`, `astromotion/test/fixtures/includes/partial.md`

- [ ] **Step 1: Write the failing test**

```ts
// astromotion/test/remark-deck-includes.test.ts
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkDeckIncludes } from "../plugins/remark-deck-includes.ts";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("remarkDeckIncludes", () => {
  it("inlines a single @include directive", async () => {
    const input = "# Header\n\n<!-- @include ./fixtures/includes/partial.md -->\n\n# After\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckIncludes)
      .run(tree, { path: path.join(__dirname, "main.deck.mdx") });
    const headings = tree.children.filter((n: any) => n.type === "heading");
    const headingTexts = headings.map((h: any) => h.children[0].value);
    expect(headingTexts).toEqual(["Header", "Partial heading", "After"]);
  });

  it("does nothing for non-.deck.mdx files", async () => {
    const input = "<!-- @include ./fixtures/includes/partial.md -->\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckIncludes)
      .run(tree, { path: path.join(__dirname, "ordinary.md") });
    expect(tree.children.length).toBe(1);
    expect(tree.children[0].type).toBe("html");
  });

  it("recurses into included files", async () => {
    const input = "<!-- @include ./fixtures/includes/main.md -->\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckIncludes)
      .run(tree, { path: path.join(__dirname, "wrapper.deck.mdx") });
    const headings = tree.children.filter((n: any) => n.type === "heading");
    expect(headings.length).toBeGreaterThan(0);
  });
});
```

Create the fixtures:

```md
<!-- astromotion/test/fixtures/includes/partial.md -->
# Partial heading

partial body
```

```md
<!-- astromotion/test/fixtures/includes/main.md -->
# Main heading

<!-- @include ./partial.md -->
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-includes
```

Expected: FAIL with "Cannot find module '../plugins/remark-deck-includes.ts'"

- [ ] **Step 3: Implement the plugin**

The plugin uses `remark-mdx` for parsing so that `.mdx` partials with embedded components produce proper `mdxJsxFlowElement` nodes (rather than literal `html` nodes that would lose component semantics). Imports and `export const` declarations are NOT supported inside partials --- they must live in the parent `.deck.mdx` file. (This is documented in the README; partials are pure content, parents own scope.)

```ts
// astromotion/plugins/remark-deck-includes.ts
import type { Root, Html } from "mdast";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdx from "remark-mdx";
import { parseIncludeDirective } from "../src/parse-helpers.ts";

const MAX_DEPTH = 10;

const mdxParseProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFrontmatter)
  .use(remarkMdx);

const mdParseProcessor = unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter);

function parseInclude(content: string, includePath: string): Root {
  const processor = includePath.endsWith(".mdx") ? mdxParseProcessor : mdParseProcessor;
  return processor.parse(content);
}

function resolveIncludesIn(root: Root, dir: string, depth: number): void {
  if (depth > MAX_DEPTH) return;
  for (let i = root.children.length - 1; i >= 0; i--) {
    const node = root.children[i];
    if (node.type !== "html") continue;
    const includePath = parseIncludeDirective((node as Html).value);
    if (!includePath) continue;
    const absPath = resolve(dir, includePath);
    const content = readFileSync(absPath, "utf-8");
    const includeRoot = parseInclude(content, absPath);
    resolveIncludesIn(includeRoot, dirname(absPath), depth + 1);
    root.children.splice(i, 1, ...includeRoot.children);
  }
}

export function remarkDeckIncludes() {
  return (tree: Root, file: { path?: string }) => {
    if (!file.path?.endsWith(".deck.mdx")) return;
    resolveIncludesIn(tree, dirname(file.path), 0);
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-includes
```

Expected: all 3 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/projects/astromotion
git add plugins/remark-deck-includes.ts test/remark-deck-includes.test.ts test/fixtures/includes/
git commit -m "add remark-deck-includes plugin"
```

---

### Task 2: remark-deck-sections plugin

Splits the document at `thematicBreak` (`---`) nodes and wraps each group in an `mdxJsxFlowElement` `<section>`. Must run **after** `remark-deck-includes` (so included `---` are recognised) and **before** `remark-deck-classes`/`remark-deck-bg`/`remark-deck-notes` (which operate on per-section content).

**Files:**

- Create: `astromotion/plugins/remark-deck-sections.ts`
- Create: `astromotion/test/remark-deck-sections.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// astromotion/test/remark-deck-sections.test.ts
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkDeckSections } from "../plugins/remark-deck-sections.ts";

describe("remarkDeckSections", () => {
  it("wraps groups separated by --- in <section> JSX elements", async () => {
    const input = "# Slide 1\n\n---\n\n# Slide 2\n\n---\n\n# Slide 3\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified().use(remarkDeckSections).run(tree, { path: "test.deck.mdx" });
    expect(tree.children.length).toBe(3);
    for (const node of tree.children) {
      expect((node as any).type).toBe("mdxJsxFlowElement");
      expect((node as any).name).toBe("section");
    }
  });

  it("keeps single-slide documents as one <section>", async () => {
    const input = "# Only slide\n\nbody\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified().use(remarkDeckSections).run(tree, { path: "test.deck.mdx" });
    expect(tree.children.length).toBe(1);
    expect((tree.children[0] as any).children.length).toBe(2);
  });

  it("skips empty groups (consecutive ---)", async () => {
    const input = "# A\n\n---\n\n---\n\n# B\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified().use(remarkDeckSections).run(tree, { path: "test.deck.mdx" });
    expect(tree.children.length).toBe(2);
  });

  it("does nothing for non-.deck.mdx files", async () => {
    const input = "# A\n\n---\n\n# B\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified().use(remarkDeckSections).run(tree, { path: "ordinary.md" });
    const types = tree.children.map((n) => n.type);
    expect(types).toContain("thematicBreak");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-sections
```

Expected: FAIL with module not found

- [ ] **Step 3: Implement the plugin**

```ts
// astromotion/plugins/remark-deck-sections.ts
import type { Root, RootContent } from "mdast";

interface MdxJsxFlowElement {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: Array<{ type: "mdxJsxAttribute"; name: string; value: string | null }>;
  children: RootContent[];
}

function makeSection(children: RootContent[]): MdxJsxFlowElement {
  return {
    type: "mdxJsxFlowElement",
    name: "section",
    attributes: [],
    children,
  };
}

export function remarkDeckSections() {
  return (tree: Root, file: { path?: string }) => {
    if (!file.path?.endsWith(".deck.mdx")) return;
    const sections: MdxJsxFlowElement[] = [];
    let current: RootContent[] = [];
    for (const node of tree.children) {
      if (node.type === "thematicBreak") {
        if (current.length > 0) sections.push(makeSection(current));
        current = [];
      } else {
        current.push(node);
      }
    }
    if (current.length > 0) sections.push(makeSection(current));
    tree.children = sections as unknown as RootContent[];
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-sections
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/projects/astromotion
git add plugins/remark-deck-sections.ts test/remark-deck-sections.test.ts
git commit -m "add remark-deck-sections plugin"
```

---

### Task 3: remark-deck-classes plugin

Finds `<!-- _class: NAME -->` HTML comments inside each section, removes them, and applies the class to the parent section. Runs **after** `remark-deck-sections`.

**Files:**

- Create: `astromotion/plugins/remark-deck-classes.ts`
- Create: `astromotion/test/remark-deck-classes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// astromotion/test/remark-deck-classes.test.ts
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkDeckSections } from "../plugins/remark-deck-sections.ts";
import { remarkDeckClasses } from "../plugins/remark-deck-classes.ts";

describe("remarkDeckClasses", () => {
  it("applies class from <!-- _class: --> directive to parent section", async () => {
    const input = "<!-- _class: impact -->\n\n# Loud\n\n---\n\n# Quiet\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckSections)
      .use(remarkDeckClasses)
      .run(tree, { path: "test.deck.mdx" });
    const first = tree.children[0] as any;
    const classAttr = first.attributes.find((a: any) => a.name === "class");
    expect(classAttr?.value).toBe("impact");
    const second = tree.children[1] as any;
    expect(second.attributes.find((a: any) => a.name === "class")).toBeUndefined();
  });

  it("removes the directive node from the section's children", async () => {
    const input = "<!-- _class: banner -->\n\n# Title\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckSections)
      .use(remarkDeckClasses)
      .run(tree, { path: "test.deck.mdx" });
    const section = tree.children[0] as any;
    const htmlNodes = section.children.filter((c: any) => c.type === "html");
    expect(htmlNodes.length).toBe(0);
  });

  it("does nothing for non-.deck.mdx files", async () => {
    const input = "<!-- _class: impact -->\n\n# X\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckSections)
      .use(remarkDeckClasses)
      .run(tree, { path: "ordinary.md" });
    expect(tree.children.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-classes
```

Expected: FAIL with module not found

- [ ] **Step 3: Implement the plugin**

```ts
// astromotion/plugins/remark-deck-classes.ts
import type { Root, RootContent, Html } from "mdast";
import { parseClassDirective } from "../src/parse-helpers.ts";

export function remarkDeckClasses() {
  return (tree: Root, file: { path?: string }) => {
    if (!file.path?.endsWith(".deck.mdx")) return;
    for (const section of tree.children) {
      if ((section as any).type !== "mdxJsxFlowElement" || (section as any).name !== "section")
        continue;
      const sec = section as any;
      const newChildren: RootContent[] = [];
      let className: string | null = null;
      for (const child of sec.children as RootContent[]) {
        if (child.type === "html") {
          const cls = parseClassDirective((child as Html).value);
          if (cls !== null) {
            className = cls;
            continue;
          }
        }
        newChildren.push(child);
      }
      sec.children = newChildren;
      if (className !== null) {
        sec.attributes.push({ type: "mdxJsxAttribute", name: "class", value: className });
      }
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-classes
```

Expected: all 3 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/projects/astromotion
git add plugins/remark-deck-classes.ts test/remark-deck-classes.test.ts
git commit -m "add remark-deck-classes plugin"
```

---

### Task 4: remark-deck-notes plugin

Finds `<!-- notes: ... -->` HTML comments inside each section, removes them from the section's flow content, and appends a `<div class="notes">...</div>` element at the end of the section. Runs **after** `remark-deck-sections`. Notes content is treated as raw HTML (no markdown re-parsing).

**Files:**

- Create: `astromotion/plugins/remark-deck-notes.ts`
- Create: `astromotion/test/remark-deck-notes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// astromotion/test/remark-deck-notes.test.ts
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkDeckSections } from "../plugins/remark-deck-sections.ts";
import { remarkDeckNotes } from "../plugins/remark-deck-notes.ts";

describe("remarkDeckNotes", () => {
  it("appends a notes <div> to the section and removes the directive", async () => {
    const input = "# Title\n\n<!-- notes:\nspeaker note text\n-->\n\nbody\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckSections)
      .use(remarkDeckNotes)
      .run(tree, { path: "test.deck.mdx" });
    const section = tree.children[0] as any;
    const notesEl = section.children.find(
      (c: any) => c.type === "mdxJsxFlowElement" && c.name === "div",
    );
    expect(notesEl).toBeDefined();
    expect(notesEl.attributes.some((a: any) => a.name === "class" && a.value === "notes")).toBe(
      true,
    );
    const htmlNodes = section.children.filter(
      (c: any) => c.type === "html" && c.value.includes("notes:"),
    );
    expect(htmlNodes.length).toBe(0);
  });

  it("does nothing when no notes directive is present", async () => {
    const input = "# Title\n\nbody\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckSections)
      .use(remarkDeckNotes)
      .run(tree, { path: "test.deck.mdx" });
    const section = tree.children[0] as any;
    const notesEl = section.children.find(
      (c: any) => c.type === "mdxJsxFlowElement" && c.name === "div",
    );
    expect(notesEl).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-notes
```

Expected: FAIL with module not found

- [ ] **Step 3: Implement the plugin**

```ts
// astromotion/plugins/remark-deck-notes.ts
import type { Root, RootContent, Html } from "mdast";
import { parseNotesDirective } from "../src/parse-helpers.ts";

export function remarkDeckNotes() {
  return (tree: Root, file: { path?: string }) => {
    if (!file.path?.endsWith(".deck.mdx")) return;
    for (const section of tree.children) {
      if ((section as any).type !== "mdxJsxFlowElement" || (section as any).name !== "section")
        continue;
      const sec = section as any;
      const newChildren: RootContent[] = [];
      let notesContent: string | null = null;
      for (const child of sec.children as RootContent[]) {
        if (child.type === "html") {
          const notes = parseNotesDirective((child as Html).value);
          if (notes !== null) {
            notesContent = notes;
            continue;
          }
        }
        newChildren.push(child);
      }
      if (notesContent !== null) {
        newChildren.push({
          type: "mdxJsxFlowElement",
          name: "div",
          attributes: [{ type: "mdxJsxAttribute", name: "class", value: "notes" }],
          children: [{ type: "html", value: notesContent } as Html],
        } as any);
      }
      sec.children = newChildren;
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-notes
```

Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/projects/astromotion
git add plugins/remark-deck-notes.ts test/remark-deck-notes.test.ts
git commit -m "add remark-deck-notes plugin"
```

---

### Task 5: remark-deck-qr plugin

Finds `![qr](url)` images inside each section and replaces them with the QR-code SVG generated by `generateQrCode(url)` from `src/svg/qr-code.ts`. Output is a single `html` node containing the SVG markup wrapped in `<div class="qr-code">`. Runs **after** `remark-deck-sections`.

**Files:**

- Create: `astromotion/plugins/remark-deck-qr.ts`
- Create: `astromotion/test/remark-deck-qr.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// astromotion/test/remark-deck-qr.test.ts
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkDeckSections } from "../plugins/remark-deck-sections.ts";
import { remarkDeckQr } from "../plugins/remark-deck-qr.ts";

describe("remarkDeckQr", () => {
  it("replaces ![qr](url) with an SVG html node", async () => {
    const input = "# Slide\n\n![qr](https://example.com)\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckSections)
      .use(remarkDeckQr)
      .run(tree, { path: "test.deck.mdx" });
    const section = tree.children[0] as any;
    const html = section.children.find((c: any) => c.type === "html");
    expect(html).toBeDefined();
    expect(html.value).toContain("<svg");
    expect(html.value).toContain('class="qr-code"');
  });

  it("leaves non-qr images alone", async () => {
    const input = "# Slide\n\n![alt text](photo.jpg)\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckSections)
      .use(remarkDeckQr)
      .run(tree, { path: "test.deck.mdx" });
    const section = tree.children[0] as any;
    const html = section.children.find((c: any) => c.type === "html");
    expect(html).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-qr
```

Expected: FAIL with module not found

- [ ] **Step 3: Implement the plugin**

```ts
// astromotion/plugins/remark-deck-qr.ts
import type { Root, RootContent, Paragraph, Image, Html } from "mdast";
import { generateQrCode } from "../src/svg/qr-code.ts";

function isQrImageParagraph(node: RootContent): node is Paragraph {
  if (node.type !== "paragraph") return false;
  if ((node as Paragraph).children.length !== 1) return false;
  const child = (node as Paragraph).children[0];
  return child.type === "image" && (child as Image).alt === "qr";
}

export function remarkDeckQr() {
  return (tree: Root, file: { path?: string }) => {
    if (!file.path?.endsWith(".deck.mdx")) return;
    for (const section of tree.children) {
      if ((section as any).type !== "mdxJsxFlowElement" || (section as any).name !== "section")
        continue;
      const sec = section as any;
      sec.children = (sec.children as RootContent[]).map((child) => {
        if (!isQrImageParagraph(child)) return child;
        const url = ((child as Paragraph).children[0] as Image).url;
        return { type: "html", value: `<div class="qr-code">${generateQrCode(url)}</div>` } as Html;
      });
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-qr
```

Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/projects/astromotion
git add plugins/remark-deck-qr.ts test/remark-deck-qr.test.ts
git commit -m "add remark-deck-qr plugin"
```

---

### Task 6: remark-deck-bg plugin

Finds `![bg ...](url)` images inside each section. For full-bleed (no position modifier), prepends a `<div class="slide-bg">` element to the section. For split layouts (`right:NN%` or `left:NN%`), wraps remaining section content in a `<div class="split-content">` paired with a `<div class="split-image">`, all inside a `<div class="split-layout">`. Filter modifiers (`brightness`, `blur`, `saturate`) become CSS `filter` properties. Runs **after** `remark-deck-sections` and **after** `remark-deck-qr` (so QR images aren't ambiguous).

Path resolution for relative URLs is deliberately deferred to MDX/Vite --- the plugin emits the URL as-is in an `html` node; Vite's asset pipeline resolves relative paths at build time during MDX compilation. (If this turns out not to work, fall back to using `mdxJsxFlowElement` with an `<img>` so MDX/Astro's image pipeline can handle it. Verify in Task 11.)

**Files:**

- Create: `astromotion/plugins/remark-deck-bg.ts`
- Create: `astromotion/test/remark-deck-bg.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// astromotion/test/remark-deck-bg.test.ts
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkDeckSections } from "../plugins/remark-deck-sections.ts";
import { remarkDeckBg } from "../plugins/remark-deck-bg.ts";

describe("remarkDeckBg", () => {
  it("prepends a .slide-bg div for full-bleed bg images", async () => {
    const input = "# Title\n\n![bg](./photo.jpg)\n\nbody\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckSections)
      .use(remarkDeckBg)
      .run(tree, { path: "test.deck.mdx" });
    const section = tree.children[0] as any;
    const first = section.children[0];
    expect(first.type).toBe("html");
    expect(first.value).toContain('class="slide-bg"');
    expect(first.value).toContain("./photo.jpg");
    const imageParas = section.children.filter(
      (c: any) =>
        c.type === "paragraph" && c.children?.[0]?.type === "image",
    );
    expect(imageParas.length).toBe(0);
  });

  it("wraps content in a split-layout for right:40% bg images", async () => {
    const input = "# Title\n\n![bg right:40%](./side.jpg)\n\nbody\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckSections)
      .use(remarkDeckBg)
      .run(tree, { path: "test.deck.mdx" });
    const section = tree.children[0] as any;
    const wrapper = section.children[0];
    expect(wrapper.type).toBe("html");
    expect(wrapper.value).toContain('class="split-layout"');
    expect(wrapper.value).toContain('class="split-content"');
    expect(wrapper.value).toContain('class="split-image"');
    expect(wrapper.value).toContain("width: 40%");
  });

  it("applies filter modifiers", async () => {
    const input = "# Title\n\n![bg brightness:0.5 blur:2px](./photo.jpg)\n";
    const tree = unified().use(remarkParse).parse(input);
    await unified()
      .use(remarkDeckSections)
      .use(remarkDeckBg)
      .run(tree, { path: "test.deck.mdx" });
    const section = tree.children[0] as any;
    const first = section.children[0];
    expect(first.value).toContain("filter: brightness(0.5) blur(2px)");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-bg
```

Expected: FAIL with module not found

- [ ] **Step 3: Implement the plugin**

```ts
// astromotion/plugins/remark-deck-bg.ts
import type { Root, RootContent, Paragraph, Image, Html } from "mdast";
import { parseBgModifiers } from "../src/parse-helpers.ts";

interface BgImage {
  url: string;
  position?: "left" | "right";
  size?: string;
  splitPercent?: string;
  filters?: string;
}

function asBgImageParagraph(node: RootContent): BgImage | null {
  if (node.type !== "paragraph") return null;
  const para = node as Paragraph;
  if (para.children.length !== 1) return null;
  const child = para.children[0];
  if (child.type !== "image") return null;
  const img = child as Image;
  if (!img.alt?.startsWith("bg")) return null;
  const modifiers = img.alt.slice(2);
  return { url: img.url, ...parseBgModifiers(modifiers) };
}

function buildSlideBg(img: BgImage): string {
  const size = img.size || "cover";
  const styleParts = [
    `background-image: url('${img.url}')`,
    `background-size: ${size}`,
    "background-position: center",
  ];
  if (img.filters) styleParts.push(`filter: ${img.filters}`);
  return `<div class="slide-bg" style="${styleParts.join("; ")}"></div>`;
}

function buildSplitImage(img: BgImage): string {
  const percent = img.splitPercent || "50%";
  const filterPart = img.filters ? `; filter: ${img.filters}` : "";
  return `<div class="split-image" style="background-image: url('${img.url}'); width: ${percent}${filterPart}"></div>`;
}

export function remarkDeckBg() {
  return (tree: Root, file: { path?: string }) => {
    if (!file.path?.endsWith(".deck.mdx")) return;
    for (const section of tree.children) {
      if ((section as any).type !== "mdxJsxFlowElement" || (section as any).name !== "section")
        continue;
      const sec = section as any;
      const bgImages: BgImage[] = [];
      const remaining: RootContent[] = [];
      for (const child of sec.children as RootContent[]) {
        const img = asBgImageParagraph(child);
        if (img) bgImages.push(img);
        else remaining.push(child);
      }
      const fullBleed = bgImages.find((i) => !i.position);
      const splitImg = bgImages.find((i) => i.position);
      let innerHtml = "";
      if (splitImg) {
        const percent = splitImg.splitPercent || "50%";
        const contentPercent = `calc(100% - ${percent})`;
        const imgDiv = buildSplitImage(splitImg);
        const placeholder = "__DECK_SPLIT_CONTENT__";
        const wrapperHtml =
          splitImg.position === "left"
            ? `<div class="split-layout">${imgDiv}<div class="split-content" style="width: ${contentPercent}">${placeholder}</div></div>`
            : `<div class="split-layout"><div class="split-content" style="width: ${contentPercent}">${placeholder}</div>${imgDiv}</div>`;
        const [openHtml, closeHtml] = wrapperHtml.split(placeholder);
        const newChildren: RootContent[] = [];
        if (fullBleed) newChildren.push({ type: "html", value: buildSlideBg(fullBleed) } as Html);
        newChildren.push({ type: "html", value: openHtml } as Html);
        newChildren.push(...remaining);
        newChildren.push({ type: "html", value: closeHtml } as Html);
        sec.children = newChildren;
      } else {
        const newChildren: RootContent[] = [];
        if (fullBleed) newChildren.push({ type: "html", value: buildSlideBg(fullBleed) } as Html);
        newChildren.push(...remaining);
        sec.children = newChildren;
      }
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ~/projects/astromotion
pnpm test remark-deck-bg
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
cd ~/projects/astromotion
git add plugins/remark-deck-bg.ts test/remark-deck-bg.test.ts
git commit -m "add remark-deck-bg plugin"
```

---

### Task 7: Plugin orchestration export

Export all plugins as a single ordered array from a barrel module so the Astro integration can register them in one go. This locks the plugin order.

**Files:**

- Create: `astromotion/plugins/index.ts`
- Create: `astromotion/test/plugins-pipeline.test.ts`

- [ ] **Step 1: Write the failing test (end-to-end pipeline)**

The test asserts on the AST after running all plugins (mdxJsxFlowElement nodes don't natively serialise to HTML outside MDX --- in production, Astro's MDX integration handles them). We use `remarkMdx` so the parser produces MDX nodes and `remarkParse` doesn't choke on JSX.

```ts
// astromotion/test/plugins-pipeline.test.ts
import { describe, it, expect } from "vitest";
import type { Root } from "mdast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { deckRemarkPlugins } from "../plugins/index.ts";

async function runPipeline(input: string, filePath: string): Promise<Root> {
  const processor = unified().use(remarkParse).use(remarkMdx);
  for (const plugin of deckRemarkPlugins) processor.use(plugin);
  const tree = processor.parse(input);
  await processor.run(tree, { path: filePath });
  return tree as Root;
}

function classOf(section: any): string | undefined {
  return section.attributes?.find((a: any) => a.name === "class")?.value;
}

function htmlChildren(section: any): string[] {
  return (section.children as any[]).filter((c) => c.type === "html").map((c) => c.value);
}

describe("deck plugin pipeline", () => {
  it("turns a multi-slide deck with all directives into expected AST", async () => {
    const input = `<!-- _class: banner -->

# Title

![bg](./bg.jpg)

---

<!-- _class: impact -->

**activity**

---

## Heading

![bg right:40%](./side.jpg)

body
`;
    const tree = await runPipeline(input, "/decks/foo.deck.mdx");
    expect(tree.children.length).toBe(3);
    const [s1, s2, s3] = tree.children as any[];

    expect(s1.type).toBe("mdxJsxFlowElement");
    expect(s1.name).toBe("section");
    expect(classOf(s1)).toBe("banner");
    expect(htmlChildren(s1).some((h) => h.includes('class="slide-bg"'))).toBe(true);

    expect(classOf(s2)).toBe("impact");

    expect(htmlChildren(s3).some((h) => h.includes('class="split-layout"'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd ~/projects/astromotion
pnpm test plugins-pipeline
```

Expected: FAIL with module not found

- [ ] **Step 3: Implement the barrel**

```ts
// astromotion/plugins/index.ts
import { remarkDeckIncludes } from "./remark-deck-includes.ts";
import { remarkDeckSections } from "./remark-deck-sections.ts";
import { remarkDeckClasses } from "./remark-deck-classes.ts";
import { remarkDeckNotes } from "./remark-deck-notes.ts";
import { remarkDeckQr } from "./remark-deck-qr.ts";
import { remarkDeckBg } from "./remark-deck-bg.ts";

export const deckRemarkPlugins = [
  remarkDeckIncludes,
  remarkDeckSections,
  remarkDeckClasses,
  remarkDeckNotes,
  remarkDeckQr,
  remarkDeckBg,
];

export {
  remarkDeckIncludes,
  remarkDeckSections,
  remarkDeckClasses,
  remarkDeckNotes,
  remarkDeckQr,
  remarkDeckBg,
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd ~/projects/astromotion
pnpm test plugins-pipeline
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd ~/projects/astromotion
git add plugins/index.ts test/plugins-pipeline.test.ts
git commit -m "add deck plugins barrel and end-to-end pipeline test"
```

---

## Phase 2: Astromotion integration rewrite

### Task 8: Add @astrojs/mdx and remark-mdx dependencies

**Files:**

- Modify: `astromotion/package.json`

- [ ] **Step 1: Add the peer + runtime deps**

In `astromotion/package.json`, add to `peerDependencies`:

```json
  "peerDependencies": {
    "@astrojs/mdx": "^5.0.0",
    "@astrojs/svelte": "^8.0.0",
    "astro": "^6.0.0",
    "svelte": "^5.0.0"
  },
```

Mark `@astrojs/svelte` and `svelte` as still optional (they remain useful for component decks); mark `@astrojs/mdx` as **required** by removing it from `peerDependenciesMeta`. Add `remark-mdx` to `dependencies` (used by `remark-deck-includes` for parsing `.mdx` partials). Also bump version to `0.2.0` to flag the breaking change:

```json
  "version": "0.2.0",
  "dependencies": {
    "remark-mdx": "^3.0.0",
    ...existing deps...
  },
```

- [ ] **Step 2: Install the deps locally for tests**

```bash
cd ~/projects/astromotion
pnpm add remark-mdx@^3.0.0
pnpm add -D @astrojs/mdx@^5.0.0 astro@^6.0.0
```

(Astro is added as devDependency so we can import its types in `index.ts`. If `remark-mdx` was already installed in Task 1, this re-add is a no-op.)

- [ ] **Step 3: Commit**

```bash
cd ~/projects/astromotion
git add package.json pnpm-lock.yaml
git commit -m "add @astrojs/mdx peer dep and remark-mdx, bump to 0.2.0"
```

---

### Task 9: Rewrite the Astro integration entrypoint

The integration now: registers `@astrojs/mdx` with our plugins (if MDX integration not already present), injects the deck route, keeps the asset-copy build hook. The old `preprocess`/`preprocessModule` options are removed (MDX has its own preprocessing extension points). The `theme` option stays.

**Files:**

- Modify: `astromotion/index.ts` (full rewrite)

- [ ] **Step 1: Replace the file with the new integration**

```ts
// astromotion/index.ts
import type { AstroIntegration } from "astro";
import mdx from "@astrojs/mdx";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectDeckAssets } from "./src/asset-collector.ts";
import { deckRemarkPlugins } from "./plugins/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface AstromotionOptions {
  theme?: string;
  injectRoutes?: boolean;
  codeTheme?: string | Record<string, unknown>;
}

export function astromotion(options: AstromotionOptions = {}): AstroIntegration {
  const { injectRoutes = true } = options;
  const themePath = options.theme
    ? resolve(options.theme)
    : resolve(__dirname, "theme/default.css");

  let projectRoot = "";

  return {
    name: "astromotion",
    hooks: {
      "astro:config:setup"({ updateConfig, injectRoute, config, addIntegration }) {
        projectRoot = fileURLToPath(config.root);
        const codeThemeValue = options.codeTheme ?? "vitesse-dark";

        // Register the MDX integration if the user hasn't already added it.
        const hasMdx = config.integrations.some((i: any) => i.name === "@astrojs/mdx");
        if (!hasMdx) {
          addIntegration(
            mdx({
              remarkPlugins: deckRemarkPlugins,
              shikiConfig: { theme: typeof codeThemeValue === "string" ? codeThemeValue : "vitesse-dark" },
            }),
          );
        }

        updateConfig({
          vite: {
            resolve: {
              alias: {
                "virtual:astromotion/theme": themePath,
              },
            },
          },
        });

        if (injectRoutes) {
          injectRoute({
            pattern: "/decks/[...slug]",
            entrypoint: "astromotion/pages/[...slug].astro",
          });
        }
      },
      "astro:build:done"({ dir, logger }) {
        const decksDir = resolve(projectRoot, "src/decks");
        try {
          const assets = collectDeckAssets(decksDir);
          for (const asset of assets) {
            const relPath = relative(projectRoot, asset);
            const dest = resolve(fileURLToPath(dir), relPath);
            mkdirSync(dirname(dest), { recursive: true });
            copyFileSync(asset, dest);
          }
          if (assets.length > 0) {
            logger.info(`Copied ${assets.length} deck asset(s) to build output.`);
          }
        } catch {
          // No src/decks directory — nothing to copy
        }
      },
    },
  };
}

export { deckRemarkPlugins } from "./plugins/index.ts";
export { parseDeckFrontmatter } from "./src/meta.ts";
```

- [ ] **Step 2: Move collectDeckAssets to its own file**

The old `src/vite-plugin.ts` is being deleted, but `collectDeckAssets` is still useful. Extract it:

```ts
// astromotion/src/asset-collector.ts
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

export function collectDeckAssets(decksDir: string): string[] {
  const assets: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (!/\.deck\.(mdx|md|svx|svelte)$/.test(entry.name) && !entry.name.endsWith(".css")) {
        assets.push(full);
      }
    }
  }
  walk(decksDir);
  return assets;
}
```

- [ ] **Step 3: Build to check for type errors**

```bash
cd ~/projects/astromotion
pnpm exec tsc --noEmit
```

Expected: no errors. Fix any reported.

- [ ] **Step 4: Commit**

```bash
cd ~/projects/astromotion
git add index.ts src/asset-collector.ts
git commit -m "rewrite integration to register @astrojs/mdx with deck plugins"
```

---

### Task 10: Rewrite the catch-all deck route

The route uses `import.meta.glob` with `eager: true` to import all `.deck.mdx` files at build time, then renders the matched deck's `Content` component inside the Reveal wrapper.

**Files:**

- Modify: `astromotion/pages/[...slug].astro` (full rewrite)

- [ ] **Step 1: Replace the route file**

```astro
---
// astromotion/pages/[...slug].astro
import DeckLayout from "../components/DeckLayout.astro";

interface DeckModule {
  default: any;
  frontmatter: { title?: string; description?: string; image?: string; [key: string]: any };
}

export async function getStaticPaths() {
  const modules = import.meta.glob<DeckModule>("/src/decks/**/*.deck.mdx", { eager: true });
  return Object.entries(modules).map(([filePath, mod]) => {
    const match = filePath.match(/\/src\/decks\/(.+)\.deck\.mdx$/);
    if (!match) throw new Error(`Unexpected deck path: ${filePath}`);
    const name = match[1];
    const slug = name.endsWith("/slides") ? name.slice(0, -"/slides".length) : name;
    return {
      params: { slug },
      props: { Content: mod.default, frontmatter: mod.frontmatter ?? {} },
    };
  });
}

const { Content, frontmatter } = Astro.props;
---

<DeckLayout
  title={frontmatter.title ?? "Deck"}
  description={frontmatter.description}
  image={frontmatter.image}
>
  <div class="reveal" role="main">
    <div class="slides">
      <Content />
    </div>
  </div>
</DeckLayout>

<script>
  import Reveal from "reveal.js";
  const deck = new Reveal({
    width: 1280,
    height: 720,
    margin: 0,
    hash: true,
    hashOneBasedIndex: true,
    controls: false,
    navigationMode: "linear",
    transition: "none",
    display: "grid",
    center: true,
    viewDistance: 10,
    maxScale: 4,
  });
  deck.initialize();
</script>
```

- [ ] **Step 2: Verify DeckLayout still imports cleanly**

Read `astromotion/components/DeckLayout.astro` --- ensure imports are intact (`reveal.js/dist/reveal.css`, `../theme/base.css`, `virtual:astromotion/theme`). No changes needed unless errors surface.

- [ ] **Step 3: Commit**

```bash
cd ~/projects/astromotion
git add pages/[...slug].astro
git commit -m "rewrite catch-all route to import .deck.mdx via import.meta.glob"
```

---

## Phase 3: Cleanup old astromotion code

### Task 11: Delete the old preprocessor and vite-plugin

These files are now dead code. Delete them, plus their tests, and the DeckLoader.svelte.

**Files:**

- Delete: `astromotion/src/preprocessor.ts`
- Delete: `astromotion/src/vite-plugin.ts`
- Delete: `astromotion/components/DeckLoader.svelte`
- Delete: `astromotion/test/preprocessor-helpers.test.ts` (tests deleted module functions)
- Delete: `astromotion/test/vite-plugin.test.ts`
- Delete: `astromotion/test/html-output.test.ts` (covered tests of the deleted vite-plugin path)
- Modify: `astromotion/package.json` (remove now-unused exports + peer deps)

- [ ] **Step 1: Delete the files**

```bash
cd ~/projects/astromotion
git rm src/preprocessor.ts src/vite-plugin.ts components/DeckLoader.svelte
git rm test/preprocessor-helpers.test.ts test/vite-plugin.test.ts test/html-output.test.ts
```

- [ ] **Step 2: Update package.json exports**

In `astromotion/package.json`, the `exports` field still references `./components/*` and `./src/*` which is fine (other files remain). Also remove `@astrojs/svelte` and `svelte` from peer deps if no longer used:

Verify by grep:

```bash
cd ~/projects/astromotion
grep -rn "from \"svelte\"\|from \"@astrojs/svelte\"\|deckPreprocessor" --include="*.ts" --include="*.astro" .
```

Expected: only matches in the deleted files (which are gone) or in tests that still reference them. If `index.ts` no longer exports `deckPreprocessor`, remove the dep.

Update peerDependencies to:

```json
  "peerDependencies": {
    "@astrojs/mdx": "^5.0.0",
    "astro": "^6.0.0"
  },
```

And remove the `peerDependenciesMeta` block entirely (no more optional peers).

- [ ] **Step 3: Run all tests**

```bash
cd ~/projects/astromotion
pnpm test
```

Expected: all remaining tests pass (parse-helpers, meta, qr-code, plus the 7 new plugin tests).

- [ ] **Step 4: Run typecheck**

```bash
cd ~/projects/astromotion
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/astromotion
git add -A
git commit -m "remove .deck.md/.deck.svelte loader; MDX is now the only path"
```

---

### Task 12: Update astromotion docs

**Files:**

- Modify: `astromotion/CLAUDE.md`
- Modify: `astromotion/README.md`
- Modify: `astromotion/CHANGELOG.md`

- [ ] **Step 1: Update CLAUDE.md**

Replace the "Architecture" section with the new architecture description. Key points to include:

- Single format: `.deck.mdx`
- Pipeline: Astro MDX integration + custom remark plugins (in `plugins/`)
- Plugin order matters: includes → sections → classes/notes/qr/bg
- Each plugin scopes itself by checking `file.path?.endsWith('.deck.mdx')`
- Components are first-class (any framework Astro supports), with per-component `client:*` hydration directives
- Catch-all route uses `import.meta.glob({ eager: true })` to enumerate decks at build time
- Reveal.js init lives inline in the route's `<script>` tag

Remove the now-obsolete `.deck.md` (no framework runtime) and `.deck.svelte` (Svelte opt-in) sections.

- [ ] **Step 2: Update README.md**

Update the user-facing docs: how to author a deck, how to embed components, how to use bg images, etc. Provide a minimal example:

````mdx
---
title: My Deck
---

import MyWidget from "../components/MyWidget.svelte";

# Hello

![bg](./photo.jpg)

---

## Slide with widget

<MyWidget client:visible prop="value" />
````

- [ ] **Step 3: Add CHANGELOG entry**

Prepend to `CHANGELOG.md`:

```md
## 2026-05-05

### Breaking: unified `.deck.mdx` format

`.deck.md` and `.deck.svelte` paths are removed. Decks are now authored as
`.deck.mdx` files processed by Astro's MDX integration with a set of custom
remark plugins (lifted from the previous bespoke pipeline).

**Why:** the previous split forced authors to choose between server-rendered
markdown (`.deck.md`, no components) and client-only Svelte (`.deck.svelte`,
full Svelte runtime, no SSR). The new format gives islands-style hydration:
SSR by default, per-component opt-in to client-side hydration via Astro's
`client:*` directives.

**Migration:** Rename `*.deck.md` and `*.deck.svelte` → `*.deck.mdx`. For
files that had a `<script lang="ts">` block, lift its contents to top-level
MDX `import` and `export const` statements (drop the `<script>` wrapper).
The bg-image syntax (`![bg ...](url)`), include directive (`<!-- @include -->`),
slide-class directive (`<!-- _class: -->`), notes directive (`<!-- notes: -->`)
and QR images (`![qr](url)`) are unchanged. Slide separators (`---`) are
unchanged.

`@astrojs/svelte` is no longer a peer dependency. `@astrojs/mdx` is now
required.
```

- [ ] **Step 4: Commit**

```bash
cd ~/projects/astromotion
git add CLAUDE.md README.md CHANGELOG.md
git commit -m "docs: rewrite for MDX-only architecture"
```

---

## Phase 4: Migrate llms-unplugged

Switch back to the llms-unplugged worktree for these tasks. Verify the file: override on astromotion is still in place (from Pre-flight).

### Task 13: Add @astrojs/mdx and update astro.config.mjs

**Files:**

- Modify: `website/package.json`
- Modify: `website/astro.config.mjs`

- [ ] **Step 1: Install @astrojs/mdx**

```bash
cd ~/projects/llms-unplugged/website
pnpm add @astrojs/mdx@^5.0.0
```

- [ ] **Step 2: Simplify astro.config.mjs**

Remove the `deckPreprocessor` import/usage (it's already gone). Astromotion now auto-registers MDX. The svelte() integration stays for component compilation.

```js
// website/astro.config.mjs
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import anuTheme from "astro-theme-anu";
import { astromotion } from "astromotion";

export default defineConfig({
  site: "https://www.llmsunplugged.org",
  integrations: [
    svelte(),
    anuTheme({
      name: "LLMs Unplugged",
      llmsTxt: true,
      checkA11y: false,
      extraSlideClasses: ["socy-logo"],
    }),
    sitemap(),
    astromotion({ theme: "./src/decks/theme.css" }),
  ],
});
```

- [ ] **Step 3: Commit**

```bash
cd ~/projects/llms-unplugged
git add website/package.json website/pnpm-lock.yaml website/astro.config.mjs
git commit -m "add @astrojs/mdx; astromotion now registers MDX itself"
```

---

### Task 14: Migrate ace-26.deck.md → ace-26.deck.mdx

This deck has no components or script block --- a pure-content rename + format check.

**Files:**

- Rename: `website/src/decks/ace-26.deck.md` → `website/src/decks/ace-26.deck.mdx`

- [ ] **Step 1: Rename the file**

```bash
cd ~/projects/llms-unplugged/website
git mv src/decks/ace-26.deck.md src/decks/ace-26.deck.mdx
```

- [ ] **Step 2: Verify any literal `{` or `}` braces in markdown content are escaped**

MDX treats `{...}` as JSX expressions. Pure text `{` or `}` need to be escaped (`\{`, `\}`) or wrapped in backticks.

```bash
cd ~/projects/llms-unplugged/website
grep -n "[{}]" src/decks/ace-26.deck.mdx
```

If any non-code-block matches appear, escape them (e.g., text like `{example}` → `\{example\}` or wrap in backticks).

- [ ] **Step 3: Build to verify**

```bash
cd ~/projects/llms-unplugged/website
pnpm run dev
```

Open http://localhost:4321/decks/ace-26/ --- click through all slides. Verify rendering matches the previous behaviour. Check network tab for any 404s on assets.

- [ ] **Step 4: Commit**

```bash
cd ~/projects/llms-unplugged
git add website/src/decks/ace-26.deck.mdx
git commit -m "migrate ace-26 deck to .mdx format"
```

---

### Task 15: Migrate fundamentals deck and partials to MDX

Heavier migration: the deck has a `<script>` block (lifted to top-level MDX), uses Svelte components (StaticGrid etc.), and has a `<style>` block.

**Files:**

- Rename: `website/src/decks/fundamentals.deck.md` → `website/src/decks/fundamentals.deck.mdx`
- Rename all included `.md` partials to `.mdx` (so the `@include` plugin can read them; though the plugin reads files regardless, MDX content embedded via `<Content>` may not need the rename if `<!-- @include -->` is handled at the AST level — verify in step 2)
- Modify: `website/src/decks/fundamentals.deck.mdx` (lift script block)

- [ ] **Step 1: Rename the deck file**

```bash
cd ~/projects/llms-unplugged/website
git mv src/decks/fundamentals.deck.md src/decks/fundamentals.deck.mdx
```

- [ ] **Step 2: Lift the script block**

Open `src/decks/fundamentals.deck.mdx`. Find the `<script lang="ts">...</script>` block. Replace it with top-level MDX:

```mdx
import StaticGrid from "../components/StaticGrid.svelte";
import StaticGeneration from "../components/StaticGeneration.svelte";
import StaticPretrainedGeneration from "../components/StaticPretrainedGeneration.svelte";
import TrainingWidget from "../components/widgets/TrainingWidget.svelte";
import GenerationWidget from "../components/widgets/GenerationWidget.svelte";
import "../styles/widgets.css";

export const EXAMPLE_TOKENS = "see spot run . run , spot , run .";
export const EXAMPLE_VOCAB = "see spot run . ,";
export const EXAMPLE_GENERATION = "see spot , run . run";
export const EXAMPLE_TEXT = "See Spot run. Run, Spot, run.";
export const EXAMPLE_PRETRAINED_SEQ = "see spot , run . run";
export const EXAMPLE_PRETRAINED_ROLLS = "- 7 8 3 - -";
```

(Imports go at the top after frontmatter; constants get `export const` so they're available in JSX expressions throughout the document.)

- [ ] **Step 3: Convert the `<style>` block**

The original `<style>` had `:global(...)` Svelte syntax. In MDX, replace with a plain `<style is:global>` (Astro syntax) or extract to a CSS file. For minimum diff, keep it inline:

```mdx
<style is:global>
  .reveal .slides .extensions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5em;
  }
  /* ... rest of the rules, with :global(...) wrappers stripped ... */
</style>
```

(Search-and-replace `:global\(([^)]+)\)` → `$1`.)

- [ ] **Step 4: Rename component-using partials to .mdx**

Partials that reference exported constants or import-scoped components (`<StaticGrid tokens={EXAMPLE_TOKENS} />`) need `.mdx` extension so `remark-deck-includes` parses them with MDX support (Task 1 already implements this). Pure-markdown partials (text-only, no `{` expressions) can stay `.md`.

Identify component-using partials:

```bash
cd ~/projects/llms-unplugged/website
grep -l "{[A-Z]\|<[A-Z]" src/decks/partials/*.md src/decks/training.md src/decks/generation.md src/decks/pretrained-generation.md src/decks/sampling.md
```

Rename matched files (training, generation, pretrained-generation, sampling all use `<StaticGrid>` etc.):

```bash
cd ~/projects/llms-unplugged/website
git mv src/decks/training.md src/decks/training.mdx
git mv src/decks/generation.md src/decks/generation.mdx
git mv src/decks/pretrained-generation.md src/decks/pretrained-generation.mdx
git mv src/decks/sampling.md src/decks/sampling.mdx
```

Update `<!-- @include -->` paths in `fundamentals.deck.mdx` to use the new `.mdx` extensions:

```mdx
<!-- @include ./training.mdx -->
<!-- @include ./generation.mdx -->
<!-- @include ./pretrained-generation.mdx -->
<!-- @include ./sampling.mdx -->
```

Pure-markdown partials in `partials/` (e.g. `ack-country.md`, `presenters.md`, `icebreaker.md`, `qualtrics.md`, `socy-logo.md`) keep their `.md` extension and existing `@include` paths.

**Why this works:** `remark-deck-includes` (Task 1) parses `.mdx` files with `remark-mdx`, producing proper `mdxJsxFlowElement` nodes for component tags. When spliced into the parent `.deck.mdx`, they resolve against the parent's import scope --- so `<StaticGrid>` finds the import in `fundamentals.deck.mdx`'s top-level imports, and `EXAMPLE_TOKENS` finds the parent's `export const`. Slide separators (`---`) inside partials still produce flat `thematicBreak` nodes that splice into the parent's flow.

**Constraint:** `import` and `export` statements inside `.mdx` partials are NOT supported (they'd be spliced into the middle of the parent module, which is invalid MDX). All imports and exported constants must live in the parent `.deck.mdx`. The Static* components and example constants are already in `fundamentals.deck.mdx` post-Step 2, so this constraint is satisfied.

- [ ] **Step 5: Verify build**

```bash
cd ~/projects/llms-unplugged/website
pnpm run dev
```

Open http://localhost:4321/decks/fundamentals/ --- click through all slides. Verify the StaticGrid slides render correctly. Verify bg-image slides have full-bleed backgrounds.

- [ ] **Step 6: Commit**

```bash
cd ~/projects/llms-unplugged
git add website/src/decks/
git commit -m "migrate fundamentals deck and partials to MDX, inline component-using partials"
```

---

## Phase 5: Verification

### Task 16: Visual regression check on key slides

Use agent-browser to compare local-vs-live for the slides we know about (impact, bg right:40%, grid widget). The text-sizing changes from earlier are still in `src/decks/theme.css` --- they should ride along.

- [ ] **Step 1: Take screenshots of local at standard viewport**

```bash
agent-browser set viewport 1920 1080
agent-browser open "http://localhost:4321/decks/fundamentals/" && sleep 1 && agent-browser screenshot /tmp/check-title.png
agent-browser open "http://localhost:4321/decks/fundamentals/#/4" && sleep 1 && agent-browser screenshot /tmp/check-impact.png
agent-browser open "http://localhost:4321/decks/fundamentals/#/15" && sleep 1 && agent-browser screenshot /tmp/check-grid.png
agent-browser open "http://localhost:4321/decks/fundamentals/" && sleep 1 && for i in 1 2 3 4 5 6 7 8 9 10 11 12; do agent-browser press ArrowRight; done && sleep 0.5 && agent-browser screenshot /tmp/check-split.png
```

- [ ] **Step 2: Inspect each screenshot**

Read each screenshot. Verify:

- `check-title.png`: deck title with full-bleed bg image
- `check-impact.png`: impact slide with **smaller** text (per the earlier theme.css edits)
- `check-grid.png`: training grid widget renders (was empty before)
- `check-split.png`: bg right:40% image is full-bleed to top/right/bottom edge (no surrounding padding)

- [ ] **Step 3: If split-layout images are still padded**

Add `&:has(.split-layout) { padding: 0; align-content: stretch; }` to `src/decks/theme.css` inside the `.reveal .slides section` block. Astromotion's base.css has this rule in `@layer astromotion` which loses to the unlayered project rule.

- [ ] **Step 4: Verify ace-26 deck**

```bash
agent-browser open "http://localhost:4321/decks/ace-26/" && sleep 1 && agent-browser screenshot /tmp/check-ace.png
```

Read the screenshot. Verify all slides render the same as the live site.

---

### Task 17: Run the full build

- [ ] **Step 1: Production build**

```bash
cd ~/projects/llms-unplugged/website
pnpm run build
```

Expected: build completes without errors. Note any warnings.

- [ ] **Step 2: Run vitest**

```bash
cd ~/projects/llms-unplugged/website
pnpm run test
```

Expected: all tests pass.

- [ ] **Step 3: Preview built output**

```bash
cd ~/projects/llms-unplugged/website
pnpm run preview
```

Spot-check the built decks at the preview URL. Verify Svelte components hydrate (StaticGrid renders).

- [ ] **Step 4: Commit any final fixes**

```bash
cd ~/projects/llms-unplugged
git add website/
git commit -m "post-migration verification fixes"
```

---

### Task 18: Remove the file: override

Before the work can ship, the `pnpm.overrides` block in `website/package.json` (added in Pre-flight) must be removed. Replace with the published astromotion version once it's released, or with a git ref to the astromotion branch.

- [ ] **Step 1: Decide on dependency form**

Either:

- **Publish astromotion 0.2.0 to npm or git tag**, then in `website/package.json`:

  ```json
  "astromotion": "github:benswift/astromotion#v0.2.0"
  ```

- **Use a git ref (no publish required)**:

  ```json
  "astromotion": "github:benswift/astromotion#mdx-rewrite"
  ```

- [ ] **Step 2: Remove the override**

Edit `website/package.json`, delete the `pnpm.overrides` block (or just the `astromotion` entry inside it).

- [ ] **Step 3: Reinstall**

```bash
cd ~/projects/llms-unplugged/website
pnpm install
```

- [ ] **Step 4: Final build verification**

```bash
cd ~/projects/llms-unplugged/website
pnpm run build
```

- [ ] **Step 5: Commit and merge**

```bash
cd ~/projects/llms-unplugged
git add website/package.json website/pnpm-lock.yaml
git commit -m "switch astromotion dep to v0.2.0"
```

Then merge the feature branches in both repos via PR or fast-forward, depending on workflow preference.

---

## Follow-up (not in this plan)

After this plan ships, other astromotion consumers need similar migration. Use the `ben:anu-theme-sync` skill to coordinate. Affected repos (per the skill's discovery scan):

- `~/projects/comp4020-agentic-coding-studio/`
- `~/projects/teaching-archive/sites/*/` (each site separately, via the pnpm workspace)
- `~/projects/astro-theme-anu/docs/`

For each: bump astromotion dependency, rename `.deck.md`/`.deck.svelte` → `.deck.mdx`, lift any script blocks, verify build. Same recipe as Tasks 13-15.

Also: the duplicated `deck.css` in `astro-theme-anu/packages/astro-theme-anu/styles/deck.css` vs `llms-unplugged/website/src/decks/theme.css` should be reconciled. The earlier text-sizing changes need to be applied to the astro-theme-anu copy and the local copy can then be deleted (per the user's stated preference for astro-theme-anu to own deck styles).
