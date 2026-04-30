# Port llms-unplugged to astro-theme-anu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the llms-unplugged website to use the astro-theme-anu integration as its layout/styling foundation, while preserving all interactive widgets, lessons content, news collection, deck subdirectory, and Typst-based PDF tooling.

**Architecture:** Two worktrees on two repos. Theme-side knobs (logo override, colour scheme, footer acknowledgement, head slot, favicon prop) land first on a branch in `astro-theme-anu`. The consumer worktree uses a `pnpm overrides` block to point at the local theme during development; the override is removed before the consumer branch is merged. Layouts are swapped to delegate to theme components via thin wrappers that preserve site-specific concerns (variant attribute, OG tags, Plausible script, print wordmark).

**Tech Stack:** Astro 6, Svelte 5, MDX, pnpm workspaces, vitest, oxlint, stylelint.

**Worktree paths:**
- Theme: `/home/ben/projects/astro-theme-anu/.worktrees/customisation-knobs` (branch `feat/customisation-knobs`)
- Consumer: `/home/ben/projects/llms-unplugged/.worktrees/port-to-theme` (branch `port-to-astro-theme-anu`)

---

## Phase A --- Theme-side knobs (in customisation-knobs worktree)

These five additions to `astro-theme-anu` are needed for any non-ANU-institutional consumer. They are backward-compatible (defaults preserve current behaviour). Each task has its own test and its own commit.

### Task A1: Favicon prop on BaseLayout

**Why:** llms-unplugged has its own favicon at `/favicon.svg`; the theme currently hardcodes the ANU gold favicon.

**Files:**
- Modify: `packages/astro-theme-anu/layouts/BaseLayout.astro`
- Test: `packages/astro-theme-anu/layouts/BaseLayout.test.ts` (new)

- [ ] **Step 1: Write the failing test**

```ts
// packages/astro-theme-anu/layouts/BaseLayout.test.ts
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import BaseLayout from "./BaseLayout.astro";

describe("BaseLayout", () => {
  test("uses default ANU favicon when no favicon prop is passed", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { title: "Test" },
    });
    expect(html).toMatch(/<link rel="icon"[^>]*href="[^"]*anu-favicon-gold[^"]*"/);
  });

  test("uses custom favicon when favicon prop is passed", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: {
        title: "Test",
        favicon: { src: "/custom-favicon.svg", width: 32, height: 32, format: "svg" } as ImageMetadata,
      },
    });
    expect(html).toContain('href="/custom-favicon.svg"');
    expect(html).not.toContain("anu-favicon-gold");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd /home/ben/projects/astro-theme-anu/.worktrees/customisation-knobs && pnpm --filter astro-theme-anu test layouts/BaseLayout.test.ts`
Expected: FAIL on the second test (custom favicon).

- [ ] **Step 3: Add favicon prop to BaseLayout**

Modify `packages/astro-theme-anu/layouts/BaseLayout.astro`:

In the `BaseLayoutProps` interface, add:
```ts
  /** Custom favicon. Defaults to the ANU gold favicon. */
  favicon?: ImageMetadata;
```

In the destructured props, change the existing `favicon` import line. Rename the imported default to `defaultFavicon` to avoid name clash:

Replace:
```astro
import favicon from "../assets/logos/anu-favicon-gold.svg";
```
with:
```astro
import defaultFavicon from "../assets/logos/anu-favicon-gold.svg";
```

In the destructured props, add `favicon = defaultFavicon`:
```astro
const {
  title,
  description,
  name = "ANU",
  links = [],
  search,
  clientRouter = true,
  favicon = defaultFavicon,
  // ...rest unchanged
} = Astro.props;
```

The existing `<link rel="icon" type="image/svg+xml" href={favicon.src} />` line works unchanged.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter astro-theme-anu test layouts/BaseLayout.test.ts`
Expected: PASS, both tests.

- [ ] **Step 5: Run full theme test suite to verify no regressions**

Run: `pnpm --filter astro-theme-anu test`
Expected: 134 tests pass (132 prior + 2 new).

- [ ] **Step 6: Commit**

```bash
cd /home/ben/projects/astro-theme-anu/.worktrees/customisation-knobs
git add packages/astro-theme-anu/layouts/BaseLayout.astro packages/astro-theme-anu/layouts/BaseLayout.test.ts
git commit -m "support custom favicon via BaseLayout prop"
```

### Task A2: Logo override on Nav (and BaseLayout pass-through)

**Why:** The ANU lockup is hardcoded as a compile-time import in `Nav.astro`. Non-ANU consumers need to swap it.

**Files:**
- Modify: `packages/astro-theme-anu/components/Nav.astro`
- Modify: `packages/astro-theme-anu/layouts/BaseLayout.astro`
- Test: `packages/astro-theme-anu/components/Nav.test.ts` (new)

- [ ] **Step 1: Write the failing test**

```ts
// packages/astro-theme-anu/components/Nav.test.ts
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";
import Nav from "./Nav.astro";

describe("Nav", () => {
  test("uses default ANU lockup when no logo prop is passed", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Nav, {
      props: { name: "Test" },
    });
    expect(html).toMatch(/anu-lockup-gold-black/);
    expect(html).toMatch(/anu-lockup-gold-white/);
  });

  test("uses custom logo / logoDark when provided", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Nav, {
      props: {
        name: "Test",
        logo: { src: "/light.svg", width: 100, height: 30, format: "svg" } as ImageMetadata,
        logoDark: { src: "/dark.svg", width: 100, height: 30, format: "svg" } as ImageMetadata,
      },
    });
    expect(html).toContain('src="/light.svg"');
    expect(html).toContain('src="/dark.svg"');
    expect(html).not.toMatch(/anu-lockup-gold/);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter astro-theme-anu test components/Nav.test.ts`
Expected: FAIL on second test.

- [ ] **Step 3: Add logo / logoDark props to Nav**

Modify `packages/astro-theme-anu/components/Nav.astro`:

Replace lines 1-7:
```astro
---
import SearchDialog from "./SearchDialog.svelte";
import logo from "../assets/logos/anu-lockup-gold-black.svg";
import logoDark from "../assets/logos/anu-lockup-gold-white.svg";
import type { NavLink } from "../types.js";
import { withBase } from "../url.js";
```

with:
```astro
---
import SearchDialog from "./SearchDialog.svelte";
import defaultLogo from "../assets/logos/anu-lockup-gold-black.svg";
import defaultLogoDark from "../assets/logos/anu-lockup-gold-white.svg";
import type { NavLink } from "../types.js";
import { withBase } from "../url.js";
```

Update the props interface (lines 8-15):
```astro
export interface NavProps {
  /** Site name, used as alt text for the logo. */
  name: string;
  /** Navigation links displayed in the top bar. */
  links?: NavLink[];
  /** Whether to show the search button and dialog. */
  search?: boolean;
  /** Logo image (light mode). Defaults to the ANU lockup. */
  logo?: ImageMetadata;
  /** Logo image (dark mode). Defaults to the ANU lockup. */
  logoDark?: ImageMetadata;
}
```

Update the destructure (line 19):
```astro
const { name, links = [], search = true, logo = defaultLogo, logoDark = defaultLogoDark } = Astro.props;
```

The image references at lines 27-39 already use `logo.src`, `logoDark.src` etc., so they keep working.

- [ ] **Step 4: Pass logo props through BaseLayout**

Modify `packages/astro-theme-anu/layouts/BaseLayout.astro`:

In `BaseLayoutProps`, add:
```ts
  /** Logo image (light mode), passed through to Nav. */
  logo?: ImageMetadata;
  /** Logo image (dark mode), passed through to Nav. */
  logoDark?: ImageMetadata;
```

Add `logo`, `logoDark` to the destructured props, then pass them to `<Nav>`:
```astro
<Nav
  name={name}
  links={links}
  search={search}
  logo={logo}
  logoDark={logoDark}
/>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter astro-theme-anu test components/Nav.test.ts`
Expected: PASS, both tests.

- [ ] **Step 6: Run full theme test suite**

Run: `pnpm --filter astro-theme-anu test`
Expected: 136 tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/astro-theme-anu/components/Nav.astro packages/astro-theme-anu/components/Nav.test.ts packages/astro-theme-anu/layouts/BaseLayout.astro
git commit -m "support custom logo via Nav props (passed through BaseLayout)"
```

### Task A3: colorScheme prop for forced dark/light mode

**Why:** Theme defaults to user-toggleable dark/light. llms-unplugged is dark-only and shouldn't render a toggle button.

**Files:**
- Modify: `packages/astro-theme-anu/layouts/BaseLayout.astro`
- Modify: `packages/astro-theme-anu/components/Footer.astro`
- Modify: `packages/astro-theme-anu/types.ts`
- Test: `packages/astro-theme-anu/layouts/BaseLayout.test.ts` (extend)
- Test: `packages/astro-theme-anu/components/Footer.test.ts` (extend)

- [ ] **Step 1: Add colorScheme to SiteConfig type**

Modify `packages/astro-theme-anu/types.ts`. In the `SiteConfig` interface, add:
```ts
  /** Force a specific colour scheme. 'auto' (default) lets users toggle. */
  colorScheme?: "auto" | "light" | "dark";
```

- [ ] **Step 2: Write the failing tests**

Append to `packages/astro-theme-anu/layouts/BaseLayout.test.ts` inside the `describe`:
```ts
  test("renders the auto-detect script when colorScheme is 'auto'", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { title: "Test", colorScheme: "auto" },
    });
    expect(html).toContain('localStorage.getItem("at-theme")');
  });

  test("forces data-theme=dark and skips toggle script when colorScheme is 'dark'", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { title: "Test", colorScheme: "dark" },
    });
    expect(html).toMatch(/<html[^>]*data-theme="dark"/);
    expect(html).not.toContain('localStorage.getItem("at-theme")');
  });

  test("forces data-theme=light and skips toggle script when colorScheme is 'light'", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { title: "Test", colorScheme: "light" },
    });
    expect(html).toMatch(/<html[^>]*data-theme="light"/);
    expect(html).not.toContain('localStorage.getItem("at-theme")');
  });
```

Append to `packages/astro-theme-anu/components/Footer.test.ts`:
```ts
  test("renders the theme toggle button when colorScheme is 'auto' (default)", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {
      props: { name: "Test" },
    });
    expect(html).toContain("at-footer-theme-toggle");
  });

  test("omits the theme toggle button when colorScheme is forced", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {
      props: { name: "Test", colorScheme: "dark" },
    });
    expect(html).not.toContain("at-footer-theme-toggle");
  });
```

- [ ] **Step 3: Run tests to verify failure**

Run: `pnpm --filter astro-theme-anu test layouts/BaseLayout.test.ts components/Footer.test.ts`
Expected: 3 BaseLayout failures + 1 Footer failure (the toggle-button-omission test).

- [ ] **Step 4: Implement colorScheme on BaseLayout**

Modify `packages/astro-theme-anu/layouts/BaseLayout.astro`.

Add to `BaseLayoutProps` interface:
```ts
  /** Force a specific colour scheme. 'auto' (default) lets users toggle. */
  colorScheme?: "auto" | "light" | "dark";
```

Add `colorScheme = "auto"` to the destructured props.

Replace the `<html lang="en">` opening tag with:
```astro
<html lang="en" data-theme={colorScheme === "auto" ? undefined : colorScheme}>
```

Replace the existing inline theme-detection script (lines 97-111) with conditional rendering:
```astro
{colorScheme === "auto" && (
  <script is:inline data-astro-rerun>
    (function () {
      var t =
        localStorage.getItem("at-theme") ||
        (matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light");
      document.documentElement.dataset.theme = t;
      var label = t === "dark" ? "Switch to light theme" : "Switch to dark theme";
      document.querySelectorAll(".at-footer-theme-toggle").forEach(function (btn) {
        btn.setAttribute("aria-label", label);
        btn.setAttribute("title", label);
      });
    })();
  </script>
)}
```

Pass `colorScheme` through to `<Footer>`:
```astro
<Footer name={name} contact={contact} socials={socials} licence={licence} colorScheme={colorScheme}>
```

- [ ] **Step 5: Implement colorScheme on Footer**

Modify `packages/astro-theme-anu/components/Footer.astro`.

In `FooterProps`, add:
```ts
  /** Forwarded from BaseLayout. When not 'auto', the theme toggle button is hidden. */
  colorScheme?: "auto" | "light" | "dark";
```

In the destructure, add: `colorScheme = "auto"`.

Wrap the `<button class="at-footer-theme-toggle" ...>` block (lines 222-264) plus the preceding `<span aria-hidden="true">|</span>` (line 222) with a conditional:
```astro
{colorScheme === "auto" && (
  <>
    <span aria-hidden="true">|</span>
    <button class="at-footer-theme-toggle" ...>
      <!-- existing button contents -->
    </button>
  </>
)}
```

The existing `<script>` setting up the toggle handler (lines 273-287) can stay --- it's a no-op when no toggle button exists.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter astro-theme-anu test layouts/BaseLayout.test.ts components/Footer.test.ts`
Expected: All pass.

- [ ] **Step 7: Run full theme test suite**

Run: `pnpm --filter astro-theme-anu test`
Expected: 140 tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/astro-theme-anu/layouts/BaseLayout.astro packages/astro-theme-anu/components/Footer.astro packages/astro-theme-anu/types.ts packages/astro-theme-anu/layouts/BaseLayout.test.ts packages/astro-theme-anu/components/Footer.test.ts
git commit -m "support forced colorScheme to suppress dark/light toggle"
```

### Task A4: showAcknowledgement prop on Footer

**Why:** llms-unplugged isn't an ANU institutional site --- the Acknowledgement of Country and partnership logos shouldn't render.

**Files:**
- Modify: `packages/astro-theme-anu/components/Footer.astro`
- Test: `packages/astro-theme-anu/components/Footer.test.ts` (extend)

- [ ] **Step 1: Write the failing tests**

Append to `packages/astro-theme-anu/components/Footer.test.ts`:
```ts
  test("renders the Acknowledgement of Country by default", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {
      props: { name: "Test" },
    });
    expect(html).toContain("Acknowledgement of Country");
  });

  test("omits Acknowledgement and partnership band when showAcknowledgement=false", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Footer, {
      props: { name: "Test", showAcknowledgement: false },
    });
    expect(html).not.toContain("Acknowledgement of Country");
    expect(html).not.toContain("at-footer-band");
  });
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter astro-theme-anu test components/Footer.test.ts`
Expected: One new failure (the omission test).

- [ ] **Step 3: Implement the prop**

Modify `packages/astro-theme-anu/components/Footer.astro`.

In `FooterProps`, add:
```ts
  /** When false, suppress the ANU Acknowledgement section and partnership band. */
  showAcknowledgement?: boolean;
```

In the destructure, add: `showAcknowledgement = true`.

Wrap the `<div class="at-footer-band">` block (lines 166-183) with a conditional:
```astro
{showAcknowledgement && (
  <div class="at-footer-band">
    <!-- existing inner content -->
  </div>
)}
```

Wrap the `<div class="at-footer-acknowledgement">` block (lines 186-195) with a conditional:
```astro
{showAcknowledgement && (
  <div class="at-footer-acknowledgement">
    <!-- existing content -->
  </div>
)}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter astro-theme-anu test components/Footer.test.ts`
Expected: All Footer tests pass (existing + new).

- [ ] **Step 5: Run full theme test suite**

Run: `pnpm --filter astro-theme-anu test`
Expected: 142 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/astro-theme-anu/components/Footer.astro packages/astro-theme-anu/components/Footer.test.ts
git commit -m "support showAcknowledgement=false to omit ANU footer band"
```

### Task A5: Head slot on BaseLayout for OG/twitter/analytics injection

**Why:** llms-unplugged's existing BaseLayout injects og: meta tags, twitter:card meta tags, RSS link, canonical link, theme-color meta, and a Plausible analytics script. These need a place to land in the wrapped theme layout.

**Files:**
- Modify: `packages/astro-theme-anu/layouts/BaseLayout.astro`
- Test: `packages/astro-theme-anu/layouts/BaseLayout.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

Append to `packages/astro-theme-anu/layouts/BaseLayout.test.ts`:
```ts
  test("renders content passed to the head slot inside <head>", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { title: "Test" },
      slots: { head: '<meta name="custom-head-marker" content="x" />' },
    });
    expect(html).toMatch(/<head>[\s\S]*custom-head-marker[\s\S]*<\/head>/);
  });
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter astro-theme-anu test layouts/BaseLayout.test.ts`
Expected: Failure (the slot doesn't exist).

- [ ] **Step 3: Add the head slot**

Modify `packages/astro-theme-anu/layouts/BaseLayout.astro`. Add `<slot name="head" />` inside `<head>`, immediately before `</head>`. Place it after the existing inline scripts so the consumer's tags can override anything earlier:

```astro
    {colorScheme === "auto" && (
      <script is:inline data-astro-rerun>
        ...
      </script>
    )}
    <slot name="head" />
  </head>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter astro-theme-anu test layouts/BaseLayout.test.ts`
Expected: All pass.

- [ ] **Step 5: Run full theme test suite**

Run: `pnpm --filter astro-theme-anu test`
Expected: 143 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/astro-theme-anu/layouts/BaseLayout.astro packages/astro-theme-anu/layouts/BaseLayout.test.ts
git commit -m "expose head slot on BaseLayout for consumer meta tags"
```

### Task A6: Export SidebarSection and SidebarItem types

**Why:** `SidebarSection` and `SidebarItem` are defined inside `components/Sidebar.astro` but not re-exported from the package root. The consumer's lesson-sidebar adapter needs to import the type to satisfy the SidebarLayout `sidebar` prop.

**Files:**
- Modify: `packages/astro-theme-anu/types.ts`
- Modify: `packages/astro-theme-anu/components/Sidebar.astro` (move types out)
- Modify: `packages/astro-theme-anu/index.ts`

- [ ] **Step 1: Move type definitions to types.ts**

In `packages/astro-theme-anu/types.ts`, append:
```ts
export interface SidebarItem {
  /** Display text for the link. */
  label: string;
  /** URL the link points to. Set `currentPath` on the Sidebar to auto-highlight. */
  href: string;
}

export interface SidebarSection {
  /** Section heading displayed above the item list. */
  title: string;
  /** Items belonging to this section. */
  items: SidebarItem[];
}
```

- [ ] **Step 2: Update Sidebar.astro to import these types**

In `packages/astro-theme-anu/components/Sidebar.astro`, replace the inline interface definitions of `SidebarItem` and `SidebarSection` (lines 4-16) with an import:
```astro
import type { SidebarItem, SidebarSection } from "../types.js";
```

Keep the `SidebarProps` interface in place (it's component-local).

- [ ] **Step 3: Re-export from index.ts**

In `packages/astro-theme-anu/index.ts`, update the type re-export line to include the new types:
```ts
export type { NavLink, SocialLink, ContactInfo, SiteConfig, SidebarItem, SidebarSection } from "./types.js";
```

- [ ] **Step 4: Verify build**

Run: `cd /home/ben/projects/astro-theme-anu/.worktrees/customisation-knobs && pnpm --filter astro-theme-anu test`
Expected: All passing.

- [ ] **Step 5: Verify the docs site still builds (it's the main consumer of Sidebar)**

Run: `pnpm --filter @docs build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add packages/astro-theme-anu/types.ts packages/astro-theme-anu/components/Sidebar.astro packages/astro-theme-anu/index.ts
git commit -m "export SidebarSection and SidebarItem from package root"
```

### Task A7: Run a full build of the docs dogfood site

**Why:** Component-level tests don't catch integration regressions. Run the theme's own docs site to confirm the changes don't break the dogfood build.

- [ ] **Step 1: Build docs**

Run: `cd /home/ben/projects/astro-theme-anu/.worktrees/customisation-knobs && pnpm --filter @docs build`
Expected: Build completes; no errors related to the new props or slot.

- [ ] **Step 2: Run all tests across the monorepo**

Run: `pnpm test`
Expected: All passing (87 + 143 = 230 tests).

- [ ] **Step 3: If any failure, fix or report**

If the docs site fails to build because something the new props broke, fix it. If something else is wrong (e.g. an unrelated test was already failing), report and ask how to proceed.

---

## Phase B --- Wire up the theme in llms-unplugged (in port-to-theme worktree)

### Task B1: Add pnpm override pointing at local theme worktree

**Why:** We're iterating on theme + consumer in parallel. The override lets the consumer worktree pick up theme changes immediately without publishing.

**Files:**
- Modify: `website/package.json`

- [ ] **Step 1: Add astro-theme-anu as a dependency**

Modify `/home/ben/projects/llms-unplugged/.worktrees/port-to-theme/website/package.json`. Add to `dependencies`:
```json
    "astro-theme-anu": "*",
```

(The version `*` is fine because `pnpm.overrides` resolves it to the file path.)

Add a `pnpm` overrides block at the bottom (or extend the existing `pnpm` block):
```json
  "pnpm": {
    "onlyBuiltDependencies": [
      "esbuild",
      "sharp"
    ],
    "overrides": {
      "astro-theme-anu": "file:/home/ben/projects/astro-theme-anu/.worktrees/customisation-knobs/packages/astro-theme-anu"
    }
  }
```

- [ ] **Step 2: Install**

Run: `cd /home/ben/projects/llms-unplugged/.worktrees/port-to-theme/website && pnpm install`
Expected: Success; lockfile updates.

- [ ] **Step 3: Verify resolution**

Run: `pnpm ls astro-theme-anu`
Expected: Shows the local file path.

- [ ] **Step 4: Commit (don't push --- we'll undo this before merge)**

```bash
cd /home/ben/projects/llms-unplugged/.worktrees/port-to-theme
git add website/package.json website/pnpm-lock.yaml
git commit -m "wip: add astro-theme-anu via local override"
```

Add a TODO note for later cleanup:
```bash
git notes add -m "Override must be removed before merge to main" HEAD
```

### Task B2: Build a SiteConfig for llms-unplugged

**Why:** The theme expects per-site config (name, links, contact, etc.) to be passed to BaseLayout. Defining it once and reusing it keeps the layout wrapper DRY.

The actual nav (per `website/src/components/Nav.astro`) has five links: Lessons, News, Glossary, FAQ, About. There's also a GitHub icon link --- it's dropped in the port (the edit-on-GitHub link inside lessons covers the same need). The Tools page isn't in the nav currently.

The wordmark logo lives at `website/public/title-logo.svg`. The theme's Nav expects `ImageMetadata` (so it can use `.src/.width/.height`), which means the asset has to be in `src/assets/` (Astro processes that directory) rather than `public/`. We move it.

**Files:**
- Create: `website/src/site-config.ts`
- Create: `website/src/assets/` (new directory)
- Move: `website/public/title-logo.svg` → `website/src/assets/title-logo.svg`
- Move: `website/public/favicon.svg` → `website/src/assets/favicon.svg`

- [ ] **Step 1: Move logo and favicon assets into src/assets/**

```bash
mkdir -p website/src/assets
git mv website/public/title-logo.svg website/src/assets/title-logo.svg
git mv website/public/favicon.svg website/src/assets/favicon.svg
```

(If `git mv` complains about untracked files, fall back to `mv` --- they're already tracked.)

- [ ] **Step 2: Create site-config.ts**

Create `website/src/site-config.ts`:
```ts
import { defineSiteConfig } from "astro-theme-anu";
import logo from "./assets/title-logo.svg";

export const siteConfig = defineSiteConfig({
  name: "LLMs Unplugged",
  colorScheme: "dark",
  links: [
    { text: "Lessons", href: "/lessons/" },
    { text: "News", href: "/news/" },
    { text: "Glossary", href: "/glossary/" },
    { text: "FAQ", href: "/faq/" },
    { text: "About", href: "/about/" },
  ],
  licence: "CC-BY-NC-SA-4.0",
});

export const themeLogo = logo;
```

- [ ] **Step 3: Search for any references to the moved assets**

Run: `grep -r "/title-logo.svg\|/favicon.svg" website/src/ website/scripts/ 2>&1 | grep -v node_modules`

Update any references that pointed at the public/ path. Most uses go through Astro's BaseLayout which now imports the asset directly, but watch for:
- `<img src="/favicon.svg">` in components
- Hardcoded URLs in markdown

If found, replace with the imported asset reference (or leave as `<img>` paths if used in markdown content --- but in that case the asset has to stay in public/, so duplicate by copying back).

For safety, if there are markdown references, restore the public/ copies:
```bash
cp website/src/assets/favicon.svg website/public/favicon.svg
cp website/src/assets/title-logo.svg website/public/title-logo.svg
```

(Keeping both is fine --- Astro handles them differently.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "add site-config and move logo/favicon to src/assets"
```

### Task B3: Update astro.config.mjs to use anuTheme integration

**Why:** Switch the build to be theme-aware. Disable theme-provided integrations that the project already has, to avoid double registration.

**Files:**
- Modify: `website/astro.config.mjs`

- [ ] **Step 1: Replace the integrations section**

Modify `website/astro.config.mjs`. Replace existing content:

```js
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import anuTheme from "astro-theme-anu";
import { astromotion, deckPreprocessor } from "astromotion";

export default defineConfig({
  site: "https://www.llmsunplugged.org",
  integrations: [
    anuTheme({
      name: "LLMs Unplugged",
      llmsTxt: true,
    }),
    sitemap(),
    astromotion({ theme: "./src/decks/theme.css" }),
  ],
});
```

Notes:
- We removed manual `mdx()`, `svelte()`, font config, and remark/rehype plugin config. The theme registers them with the same defaults (`@astrojs/mdx`, `@astrojs/svelte`, Public Sans + Roboto Mono, smartypants old-school dashes, slug+autolink-headings).
- The deck preprocessor was previously passed to `svelte()`. Verify after build if decks still work; if not, restore the explicit `svelte({ preprocess: [deckPreprocessor()] })` registration before `anuTheme()` (the theme detects it and skips its own).

- [ ] **Step 2: Build to verify**

Run: `cd website && pnpm exec tsx scripts/copy-cli-templates.ts && pnpm build 2>&1 | tail -40`
Expected: Build succeeds. There may be warnings about pages or layouts that don't use BaseLayout yet --- ignore for now.

- [ ] **Step 3: If decks fail to build, restore explicit svelte preprocessor**

If the build complains about `.deck.svelte` files, restore the explicit svelte registration with the deck preprocessor:
```js
import svelte from "@astrojs/svelte";
// ...
integrations: [
  svelte({ preprocess: [deckPreprocessor()] }),
  anuTheme({ name: "LLMs Unplugged", llmsTxt: true }),
  sitemap(),
  astromotion({ theme: "./src/decks/theme.css" }),
],
```

The theme's `astro:config:setup` skips re-registering `@astrojs/svelte` when it's already present.

- [ ] **Step 4: Commit**

```bash
git add website/astro.config.mjs
git commit -m "switch astro config to anuTheme integration"
```

---

## Phase C --- BaseLayout swap

### Task C1: Refactor BaseLayout into a thin wrapper around theme's BaseLayout

**Why:** Keep llms-unplugged-specific concerns (variant attribute, OG/twitter meta, Plausible script, RSS link, print wordmark) while delegating navbar/footer/styles to the theme.

**Files:**
- Modify: `website/src/layouts/BaseLayout.astro`

- [ ] **Step 1: Replace BaseLayout with a wrapper**

Replace the entire content of `website/src/layouts/BaseLayout.astro`:

```astro
---
import ThemeBaseLayout from "astro-theme-anu/layouts/BaseLayout.astro";
import { siteConfig, themeLogo } from "../site-config";
import "../styles/global.css";
import "../styles/widgets.css";
import faviconAsset from "../assets/favicon.svg";

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}

const {
  title,
  description = "Hands-on teaching resources that demonstrate how large language models work. No computers or coding required.",
  ogImage = "/og-image.jpg",
} = Astro.props;

const canonicalUrl = new URL(Astro.url.pathname, Astro.site);
const ogImageUrl = new URL(ogImage, Astro.site).href;
const fullTitle = title === "LLMs Unplugged" ? title : `${title} | LLMs Unplugged`;
---

<ThemeBaseLayout
  title={fullTitle}
  description={description}
  favicon={faviconAsset}
  logo={themeLogo}
  logoDark={themeLogo}
  {...siteConfig}
>
  <Fragment slot="head">
    <meta name="theme-color" content="#be830e" />
    <link
      rel="alternate"
      type="application/rss+xml"
      title="LLMs Unplugged RSS Feed"
      href="/feed.xml"
    />
    <link rel="canonical" href={canonicalUrl} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="LLMs Unplugged" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImageUrl} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={ogImageUrl} />
    <script
      is:inline
      defer
      data-domain="www.llmsunplugged.org"
      src="https://plausible.io/js/script.file-downloads.js"></script>
    <script is:inline>
      try {
        let v = localStorage.getItem("llms-unplugged-variant");
        if (v === "bucket") {
          v = "cutouts";
          try { localStorage.setItem("llms-unplugged-variant", "cutouts"); } catch {}
        }
        if (v === "grid" || v === "cutouts") {
          document.documentElement.setAttribute("data-variant", v);
        }
      } catch {}
    </script>
  </Fragment>

  <div class="print-wordmark">
    LLMs Unplugged (c) Ben Swift, Cybernetic Studio - CC BY-NC-SA 4.0
  </div>
  <slot />
</ThemeBaseLayout>

<script is:inline>
  // Set initial variant attribute before paint --- runs once at first load.
  if (!document.documentElement.hasAttribute("data-variant")) {
    document.documentElement.setAttribute("data-variant", "grid");
  }
</script>
```

Notes:
- The variant `data-variant` on `<html>` was previously set declaratively. Now we set it via the inline script in the `head` slot (runs early, before paint).
- The theme's BaseLayout sets `data-theme="dark"` on `<html>` when `colorScheme: "dark"`. The `data-variant` attribute is independent and coexists.
- The `Font` preload tags are dropped --- the theme registers fonts via the integration; they're loaded automatically.

- [ ] **Step 2: Build to verify**

Run: `cd website && pnpm exec tsx scripts/copy-cli-templates.ts && pnpm build 2>&1 | tail -30`
Expected: Build succeeds. Pages render with theme's nav and footer.

- [ ] **Step 3: Verify rendered HTML for one page**

Run: `cat dist/index.html | head -80`
Expected to see:
- `<html lang="en" data-theme="dark">` (from theme)
- `<title>LLMs Unplugged</title>` (or with site name suffix)
- Theme's `<nav class="at-nav">` containing the custom logo
- The `data-variant` attribute is set (may take a moment via the inline script)

- [ ] **Step 4: Commit**

```bash
git add website/src/layouts/BaseLayout.astro
git commit -m "refactor BaseLayout into a theme wrapper"
```

### Task C2: Verify all 41 pages still render

- [ ] **Step 1: Build full site**

Run: `cd website && pnpm build 2>&1 | tail -10`
Expected: 41 pages built, no errors.

- [ ] **Step 2: Spot-check three pages**

Read: `dist/index.html`, `dist/lessons/intro/index.html`, `dist/tools/index.html` --- confirm each has the theme's nav structure (`<nav class="at-nav">`) and theme's footer structure (`<footer class="at-footer">`).

- [ ] **Step 3: If any page fails to build, investigate and fix**

Common issues: a page using the old PageLayout/LessonLayout/NewsLayout that hasn't been updated yet (those come in subsequent tasks); a custom component that imports an old token name. Fix as you find them.

- [ ] **Step 4: Commit any fixes**

If fixes were made:
```bash
git add -A && git commit -m "fix: <description>"
```

---

## Phase D --- Lesson layout (sidebar)

### Task D1: Build the sidebar adapter

**Why:** The theme's `SidebarLayout` expects `sections: SidebarSection[]`. We need a helper that loads the lessons collection and builds this array.

**Files:**
- Create: `website/src/lib/lesson-sidebar.ts`

- [ ] **Step 1: Create the helper**

Create `website/src/lib/lesson-sidebar.ts`:
```ts
import { getCollection } from "astro:content";
import type { SidebarSection } from "astro-theme-anu";

export async function getLessonSidebar(): Promise<SidebarSection[]> {
  const lessons = await getCollection("lessons");
  const byTopic = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const topic = lesson.data.topic ?? "Other";
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic)!.push(lesson);
  }
  for (const list of byTopic.values()) {
    list.sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));
  }
  const topicOrder = ["fundamentals", "advanced", "Other"];
  const sections: SidebarSection[] = [];
  for (const topic of [...topicOrder, ...byTopic.keys()].filter((t, i, arr) => arr.indexOf(t) === i)) {
    const list = byTopic.get(topic);
    if (!list || list.length === 0) continue;
    sections.push({
      title: capitalise(topic),
      items: list.map((lesson) => ({
        label: lesson.data.title,
        href: `/lessons/${lesson.id}/`,
      })),
    });
  }
  return sections;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

- [ ] **Step 2: Verify type imports resolve**

Run: `cd website && pnpm exec astro check 2>&1 | tail -10`
Expected: No errors related to `SidebarSection` import.

- [ ] **Step 3: Commit**

```bash
git add website/src/lib/lesson-sidebar.ts
git commit -m "add lesson-sidebar adapter for theme SidebarLayout"
```

### Task D2: Replace LessonLayout to delegate to SidebarLayout

**Files:**
- Modify: `website/src/layouts/LessonLayout.astro`

- [ ] **Step 1: Replace the layout**

Replace `website/src/layouts/LessonLayout.astro`:
```astro
---
import SidebarLayout from "astro-theme-anu/layouts/SidebarLayout.astro";
import { siteConfig, themeLogo } from "../site-config";
import { getLessonSidebar } from "../lib/lesson-sidebar";
import "../styles/global.css";
import "../styles/widgets.css";
import faviconAsset from "../assets/favicon.svg";

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}

const { title, description, ogImage = "/og-image.jpg" } = Astro.props;
const currentPath = Astro.url.pathname.replace(/\/$/, "") + "/";
const sidebar = await getLessonSidebar();
const ogImageUrl = new URL(ogImage, Astro.site).href;
const canonicalUrl = new URL(Astro.url.pathname, Astro.site);
const fullTitle = `${title} | LLMs Unplugged`;
const slug = currentPath.split("/").filter(Boolean).pop();
---

<SidebarLayout
  title={fullTitle}
  description={description}
  sidebar={sidebar}
  currentPath={currentPath}
  sidebarLabel="Lessons"
  favicon={faviconAsset}
  logo={themeLogo}
  logoDark={themeLogo}
  {...siteConfig}
>
  <Fragment slot="head">
    <link rel="canonical" href={canonicalUrl} />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="LLMs Unplugged" />
    <meta property="og:title" content={title} />
    {description && <meta property="og:description" content={description} />}
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImageUrl} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={ogImageUrl} />
  </Fragment>

  <article class="prose">
    <slot />
  </article>
  <div class="edit-link">
    <a href={`https://github.com/ANUcybernetics/llms-unplugged/edit/main/website/src/content/lessons/${slug}.mdx`}>
      Edit this page on GitHub
    </a>
  </div>
</SidebarLayout>

<style>
  .edit-link {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid var(--at-divider);
    font-size: 0.875rem;
  }
</style>
```

Note: The previous `--color-divider` is now `--at-divider` (theme token).

- [ ] **Step 2: Build and verify**

Run: `cd website && pnpm build 2>&1 | tail -10`
Expected: 41 pages built; lessons render.

- [ ] **Step 3: Inspect a lesson page**

Read: `dist/lessons/intro/index.html` --- confirm:
- Theme's nav present
- Sidebar present (`<aside class="at-sidebar">`)
- Article content rendered
- Edit-on-GitHub link at the bottom

- [ ] **Step 4: Commit**

```bash
git add website/src/layouts/LessonLayout.astro
git commit -m "switch LessonLayout to theme SidebarLayout"
```

---

## Phase E --- Other layouts

### Task E1: Replace PageLayout with ContentLayout wrapper

**Files:**
- Modify: `website/src/layouts/PageLayout.astro`

- [ ] **Step 1: Read the current PageLayout**

Read: `website/src/layouts/PageLayout.astro`. Note any project-specific concerns.

- [ ] **Step 2: Replace with a thin wrapper**

Replace `website/src/layouts/PageLayout.astro`. Keep the same prop interface, delegate to `ContentLayout`:
```astro
---
import ContentLayout from "astro-theme-anu/layouts/ContentLayout.astro";
import { siteConfig, themeLogo } from "../site-config";
import "../styles/global.css";
import "../styles/widgets.css";
import faviconAsset from "../assets/favicon.svg";

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}

const { title, description, ogImage = "/og-image.jpg" } = Astro.props;
const ogImageUrl = new URL(ogImage, Astro.site).href;
const canonicalUrl = new URL(Astro.url.pathname, Astro.site);
const fullTitle = title === "LLMs Unplugged" ? title : `${title} | LLMs Unplugged`;
---

<ContentLayout
  title={fullTitle}
  description={description}
  favicon={faviconAsset}
  logo={themeLogo}
  logoDark={themeLogo}
  {...siteConfig}
>
  <Fragment slot="head">
    <link rel="canonical" href={canonicalUrl} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="LLMs Unplugged" />
    <meta property="og:title" content={title} />
    {description && <meta property="og:description" content={description} />}
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImageUrl} />
  </Fragment>
  <slot />
</ContentLayout>
```

- [ ] **Step 3: Build and verify**

Run: `cd website && pnpm build 2>&1 | tail -10`
Expected: Pages build.

- [ ] **Step 4: Commit**

```bash
git add website/src/layouts/PageLayout.astro
git commit -m "switch PageLayout to theme ContentLayout"
```

### Task E2: Replace NewsLayout with ContentLayout wrapper

**Files:**
- Modify: `website/src/layouts/NewsLayout.astro`

- [ ] **Step 1: Read the current NewsLayout**

Read: `website/src/layouts/NewsLayout.astro`. Note any news-specific concerns (date display, author byline).

- [ ] **Step 2: Replace with a wrapper that preserves news-specific UI**

Replace `website/src/layouts/NewsLayout.astro`:
```astro
---
import ContentLayout from "astro-theme-anu/layouts/ContentLayout.astro";
import { siteConfig, themeLogo } from "../site-config";
import "../styles/global.css";
import "../styles/widgets.css";
import faviconAsset from "../assets/favicon.svg";

interface Props {
  title: string;
  description?: string;
  date: Date;
  author: string;
  ogImage?: string;
}

const { title, description, date, author, ogImage = "/og-image.jpg" } = Astro.props;
const ogImageUrl = new URL(ogImage, Astro.site).href;
const canonicalUrl = new URL(Astro.url.pathname, Astro.site);
const fullTitle = `${title} | LLMs Unplugged`;
const formattedDate = date.toLocaleDateString("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
---

<ContentLayout
  title={fullTitle}
  description={description}
  favicon={faviconAsset}
  logo={themeLogo}
  logoDark={themeLogo}
  {...siteConfig}
>
  <Fragment slot="head">
    <link rel="canonical" href={canonicalUrl} />
    <meta property="og:type" content="article" />
    <meta property="og:title" content={title} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImageUrl} />
    <meta property="article:author" content={author} />
    <meta property="article:published_time" content={date.toISOString()} />
  </Fragment>
  <p class="news-meta">{formattedDate} --- {author}</p>
  <slot />
</ContentLayout>

<style>
  .news-meta {
    color: var(--at-text-muted);
    font-size: 0.875rem;
    margin-bottom: 2rem;
  }
</style>
```

- [ ] **Step 3: Build and verify**

Run: `pnpm build 2>&1 | tail -10`
Expected: 41 pages.

- [ ] **Step 4: Commit**

```bash
git add website/src/layouts/NewsLayout.astro
git commit -m "switch NewsLayout to theme ContentLayout"
```

---

## Phase F --- CSS reconciliation

### Task F1: Audit current tokens vs. theme tokens

**Why:** The website's `common.css` defines `--color-bg`, `--color-text`, etc. These need to either map to theme tokens or remain as local aliases. The deck `theme.css` also imports `common.css`, so we can't just delete it.

**Files (read):**
- `website/src/styles/common.css`
- `website/src/styles/global.css`
- `website/src/decks/theme.css`

- [ ] **Step 1: Read all three files**

Read: `website/src/styles/common.css`, `website/src/styles/global.css`, `website/src/decks/theme.css`. Build a mapping table of which tokens are used where.

- [ ] **Step 2: Decide split**

Three categories of tokens:
1. **Theme-provided** (now): `--anu-gold` (already there); `--at-bg`, `--at-text`, `--at-link` etc. (theme provides for the website automatically via BaseLayout's CSS imports).
2. **Project-specific, used by both website and decks**: `--lm-highlight-soft/medium/strong`, `--font-roboto-mono`, etc. → keep in `common.css`.
3. **Aliases for backward compatibility**: any `--color-*` tokens still referenced in widget CSS → either rename in widget CSS to `--at-*` (preferred) or alias in `widgets.css`.

- [ ] **Step 3: Document the decision**

Add a brief comment at the top of `common.css` noting that `--at-*` tokens come from the theme (for the website) and are intentionally NOT redefined here, so decks keep using their own `--color-*` palette without conflict.

### Task F2: Update widget CSS to use theme tokens

**Files:**
- Modify: `website/src/styles/widgets.css` (potentially)
- Modify: `website/src/styles/global.css`

- [ ] **Step 1: grep for old token usage in CSS**

Run: `cd website && grep -rE 'var\(--color-[a-z-]+\)' src/styles/ src/components/ 2>&1 | head -40`
List the matches.

- [ ] **Step 2: Replace project tokens with theme equivalents**

Mapping:
- `--color-bg` → `--at-bg`
- `--color-bg-elevated` → `--at-bg-elevated`
- `--color-bg-soft` → `--at-bg-alt`
- `--color-text` → `--at-text`
- `--color-divider` → `--at-divider`
- `--color-link` → `--at-link`
- `--color-border` → `--at-border`

For each match, replace with the theme equivalent. For `--lm-highlight-*` and other project-specific tokens, leave them alone (they stay in `common.css`).

- [ ] **Step 3: Build to verify**

Run: `pnpm build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 4: Run stylelint**

Run: `pnpm lint:css 2>&1 | tail -20`
Expected: Pass; if there are errors, fix.

- [ ] **Step 5: Commit**

```bash
git add website/src/
git commit -m "migrate widget CSS to theme tokens"
```

### Task F3: Verify decks still build

**Why:** The decks subdirectory uses its own `theme.css` which imports `common.css`. The deck rendering pipeline (astromotion → reveal.js) is independent of astro-theme-anu's BaseLayout, so deck styling is unchanged. This is a regression check.

- [ ] **Step 1: Build**

Run: `cd website && pnpm build 2>&1 | grep -E "(deck|astromotion)" | head -20`
Expected: astromotion log lines present (deck assets copied, etc.).

- [ ] **Step 2: Inspect a deck output**

Run: `ls dist/decks/`
Expected: Deck HTML files present.

- [ ] **Step 3: Spot-check one deck**

Open `dist/decks/<some-deck>/index.html` (or use `head -100` to inspect). Confirm reveal.js markup looks intact.

- [ ] **Step 4: If decks are broken, restore deck preprocessor in astro.config**

If decks fail to build or the rendered HTML is missing key reveal.js classes, restore the explicit svelte preprocessor registration (see Task B3 step 3).

---

## Phase G --- Verification

### Task G1: Full type check

- [ ] **Step 1: Run typecheck**

Run: `cd website && pnpm typecheck 2>&1 | tail -30`
Expected: No errors. Common issues: missing imports, prop type mismatches in old components.

- [ ] **Step 2: Fix any errors and re-run**

Iterate until clean.

- [ ] **Step 3: Commit fixes**

```bash
git add -A && git commit -m "fix typecheck errors after theme port"
```

### Task G2: Lint and format

- [ ] **Step 1: Run lint**

Run: `pnpm lint 2>&1 | tail -30`
Expected: No errors.

- [ ] **Step 2: Run format check**

Run: `pnpm format:check 2>&1 | tail -20`
Expected: No formatting issues.

- [ ] **Step 3: Fix as needed**

Run `pnpm lint:fix` and `pnpm format` if there are issues.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "lint + format pass"
```

### Task G3: Run the full test suite

- [ ] **Step 1: Run vitest**

Run: `pnpm test 2>&1 | tail -10`
Expected: All passing (including the 138 baseline + any new).

- [ ] **Step 2: Investigate any failures**

Failures fall into three buckets:
- Tests that depend on old DOM structure (e.g. `<nav>` selectors): update to match new structure.
- Tests that depend on old token names: update to new tokens.
- Genuine regressions: fix them.

- [ ] **Step 3: Commit fixes**

```bash
git add -A && git commit -m "update tests for theme integration"
```

### Task G4: Visual smoke test in a browser

**Why:** Type checking and tests verify code correctness, not visual fidelity.

- [ ] **Step 1: Start dev server**

Run: `cd website && pnpm dev 2>&1 &` and note the URL.

- [ ] **Step 2: Use agent-browser to visit each major page type**

Visit and screenshot:
- `/` (index)
- `/lessons/intro/` (lesson with sidebar)
- `/news/` (news listing)
- `/tools/` (TypstCompiler widget)
- `/glossary/`
- `/educators/`
- `/decks/<some-deck>/` (deck rendering)

Verify each:
- Theme nav at top
- LLMs Unplugged logo in nav (not ANU lockup)
- Footer with CC license, no Acknowledgement of Country, no theme toggle
- Dark mode active
- Widgets render and are interactive
- Variant toggle (grid/cutouts) works on lesson pages where applicable

- [ ] **Step 3: Note and fix any issues**

Common issues at this point:
- Widget colours blown out by new tokens → adjust `widgets.css`
- Sidebar not styled correctly → check the theme's sidebar CSS is loaded
- Print wordmark mispositioned → adjust `print-wordmark` styles in `global.css`

### Task G5: Verify Typst compiler works in the browser

**Why:** This is the most complex widget --- it loads typst.ts from CDN and compiles PDFs. Theme integration shouldn't affect it but worth confirming.

- [ ] **Step 1: Open /tools/ in browser**

Use agent-browser to navigate to `/tools/`. Verify:
- File input renders
- N-gram selector renders
- After uploading a small text file, a PDF generates and downloads (or appears inline)

- [ ] **Step 2: Check console for errors**

Verify no JS errors in the console related to typst.ts loading or font registration.

### Task G6: Verify build:pdfs script

- [ ] **Step 1: Run lesson PDF build**

Run: `cd website && pnpm build:pdfs 2>&1 | tail -10`
Expected: PDFs generated in `public/assets/pdfs/`.

This script is independent of the layout/theme changes but worth confirming it still runs.

---

## Phase H --- Cleanup

### Task H1: Remove old layout components

**Why:** After the layout swap, the original `Nav.astro` and `Footer.astro` in `website/src/components/` may be unused.

- [ ] **Step 1: grep for usages**

Run: `cd website && grep -rE 'from ["\.\./components]+(Nav|Footer)' src/ 2>&1`
Expected: Only references should be inside the components themselves (or within `BaseLayout.astro`, which we've updated).

- [ ] **Step 2: Remove if unused**

If `Nav.astro` and `Footer.astro` have no remaining importers, delete them:
```bash
rm src/components/Nav.astro src/components/Footer.astro
```

If `Sidebar.astro` is unused (replaced by theme's), delete it too.

- [ ] **Step 3: Build to confirm**

Run: `pnpm build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "remove now-unused layout components"
```

### Task H2: Remove duplicated tokens from common.css

**Why:** Anything that's now defined in the theme's tokens.css and was duplicated in common.css can be removed (for the website; decks still need its tokens).

**Files:**
- Modify: `website/src/styles/common.css`

- [ ] **Step 1: Identify duplicates**

Read `common.css`. Compare against theme tokens.

- [ ] **Step 2: For tokens used only by the website, remove from common.css**

`--anu-gold` (and gold variants) → already in theme. Remove from common.css ONLY if decks don't use them via common.css.
`--font-public-sans`, `--font-roboto-mono` → injected by theme integration. Remove from common.css.

For tokens that decks rely on, leave them.

- [ ] **Step 3: Verify decks still build**

Run: `pnpm build`
Expected: Decks render.

- [ ] **Step 4: Commit**

```bash
git add website/src/styles/common.css
git commit -m "remove duplicated tokens now provided by theme"
```

### Task H3: Final integration check

- [ ] **Step 1: Run all checks**

Run: `cd website && pnpm check 2>&1 | tail -20`
(This runs typecheck + lint + format:check + test in sequence per `package.json`.)
Expected: Pristine output, zero errors.

- [ ] **Step 2: Final visual smoke check**

Re-run the agent-browser pass from G4 if any changes were made in cleanup.

- [ ] **Step 3: Commit any lingering changes**

```bash
git add -A && git commit -m "final cleanup pass"
```

### Task H4: Note about removing the pnpm override before merge

The `pnpm.overrides` block in `website/package.json` points at the local theme worktree. **Before merging this branch to `main`, the override must be removed and replaced with a real version dependency** (e.g. `"astro-theme-anu": "github:benswift/astro-theme-anu#main"` once the theme branch is merged and tagged, or a published npm version).

This task is intentionally NOT done in this plan --- it's a checkpoint at PR time, after the theme branch is merged.

---

## Self-review notes

**Spec coverage:**
- Theme-side knobs: A1 (favicon), A2 (logo), A3 (colorScheme), A4 (showAcknowledgement), A5 (head slot) --- all covered.
- Pnpm override: B1.
- Site config: B2.
- Astro integration: B3.
- BaseLayout swap: C1, C2.
- LessonLayout swap: D1, D2.
- PageLayout swap: E1.
- NewsLayout swap: E2.
- CSS reconciliation: F1, F2.
- Decks regression check: F3.
- Verification: G1-G6.
- Cleanup: H1-H4.

**Known assumptions to verify during execution:**
1. The current Nav.astro link list. Step B2 has placeholder links --- inspect actual Nav.astro and reconcile.
2. Whether `website/src/assets/favicon.svg` exists. If not, copy from `website/public/favicon.svg` or restructure.
3. Whether a logo asset exists. If not, this is a placeholder problem --- the SiteConfig logo is needed.
4. Whether the existing oxlint configuration tolerates the `<Fragment slot="head">` pattern.
5. The Plausible script needs to be in `<head>` (it is, in the slot).

**Likely friction points:**
- Print styles --- the theme may inject its own that interfere with the project's. Monitor during G4.
- The variant `data-variant` attribute restoration. The theme replaces the `<html>` tag, so the inline restoration script must run after the body loads. Adjusted to run inside the `head` slot in C1.
- Test files that grep DOM for `<nav>` content --- they may have been targeting the old Nav.

---

## Execution handoff

Plan complete. Two execution options:

**1. Subagent-driven (recommended)** --- I dispatch a fresh subagent per task, review between tasks, fast iteration with two-stage review.

**2. Inline execution** --- Execute tasks in this session using executing-plans, batch execution with checkpoints for review.

Which approach?
