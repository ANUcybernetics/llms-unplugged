import { describe, expect, it } from "vitest";
import { globSync, readFileSync } from "node:fs";
import matter from "gray-matter";
import { loadGlossary } from "../src/lib/glossary";
import { SIDEBAR_SLUGS } from "../src/lib/sidebar";

/**
 * Regression tests for the 2026-04-13 dogfood audit.
 *
 * - ISSUE-002: the glossary linked to `/lessons/weighted-randomness` but the
 *   lesson wasn't in the sidebar or /lessons/ index, leaving users at a
 *   dead-end. These tests lock in the contract between glossary links,
 *   sidebar entries, and lesson files.
 * - ISSUE-004: the lesson title in the content collection ("Pre-trained Model
 *   Generation") disagreed with the sidebar label ("Pre-trained Generation").
 *   The sidebar now derives labels from the lesson titles, so this enforces
 *   that the slugs listed in `src/lib/sidebar.ts` all resolve.
 */

interface LessonFrontmatter {
  title: string;
  description: string;
  order?: number;
  topic?: string;
}

function loadLessons(): Map<string, LessonFrontmatter> {
  const files = globSync("src/content/lessons/*.mdx");
  const map = new Map<string, LessonFrontmatter>();
  for (const file of files) {
    const slug = file
      .split("/")
      .pop()!
      .replace(/\.mdx$/, "");
    const { data } = matter(readFileSync(file, "utf-8"));
    map.set(slug, data as LessonFrontmatter);
  }
  return map;
}

describe("lesson consistency", () => {
  it("every glossary see-link into /lessons/ points at an existing lesson", () => {
    const lessons = loadLessons();
    const missing: string[] = [];

    for (const entry of loadGlossary()) {
      if (!entry.see) continue;
      for (const link of entry.see) {
        if (!link.href.startsWith("/lessons/")) continue;
        const slug = link.href.replace(/^\/lessons\//, "").replace(/\/$/, "");
        // Skip anchor links to the lessons index
        if (!slug || slug.includes("#")) continue;
        if (!lessons.has(slug)) {
          missing.push(`glossary entry '${entry.id}' → ${link.href} (label: "${link.label}")`);
        }
      }
    }

    expect(missing, `Glossary links to lessons that don't exist:\n${missing.join("\n")}`).toEqual(
      [],
    );
  });

  it("every slug in SIDEBAR_SLUGS corresponds to a real lesson file", () => {
    const lessons = loadLessons();
    const missing = SIDEBAR_SLUGS.filter((slug) => !lessons.has(slug));
    expect(
      missing,
      `src/lib/sidebar.ts references lesson slugs that don't exist: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("every lesson that the glossary links to is reachable from the sidebar", () => {
    const lessons = loadLessons();
    const sidebarSet = new Set<string>(SIDEBAR_SLUGS);
    const orphans: string[] = [];

    for (const entry of loadGlossary()) {
      if (!entry.see) continue;
      for (const link of entry.see) {
        if (!link.href.startsWith("/lessons/")) continue;
        const slug = link.href.replace(/^\/lessons\//, "").replace(/\/$/, "");
        if (!slug) continue;
        if (!lessons.has(slug)) continue; // other test catches this
        if (!sidebarSet.has(slug)) {
          orphans.push(`glossary '${entry.id}' → ${link.href} (not in sidebar)`);
        }
      }
    }

    expect(
      orphans,
      `Glossary links lead to lessons not in the sidebar (users hit a nav dead-end):\n${orphans.join("\n")}`,
    ).toEqual([]);
  });
});
