import { describe, expect, it } from "vitest";
import { globSync, readFileSync } from "node:fs";
import { parse } from "yaml";
import { loadGlossary } from "../src/lib/glossary";
import { topicOrder } from "../src/lib/topics";

/**
 * Regression tests for the lesson navigation contract.
 *
 * - The /lessons index and the sidebar both derive grouping from each lesson's
 *   `topic`/`order` frontmatter (via src/lib/lessons.ts), so the only invariant
 *   to police here is that the frontmatter is well-formed and that no lesson
 *   becomes an unreachable dead-end.
 * - ISSUE-002 (2026-04-13 dogfood audit): the glossary linked to
 *   `/lessons/weighted-randomness` but it wasn't reachable from the nav. It is
 *   now intentionally `listed: false`, so the contract is "an unlisted lesson
 *   must still be linked from a listed lesson" rather than "must be in the
 *   sidebar".
 */
interface LessonFrontmatter {
  title: string;
  description: string;
  order?: number;
  topic?: string;
  listed?: boolean;
}

interface Lesson {
  data: LessonFrontmatter;
  body: string;
}

function parseLesson(source: string): Lesson {
  const match = /^---\n(.*?)\n---\n(.*)$/s.exec(source);
  if (!match) throw new Error("lesson is missing YAML frontmatter");
  return { data: parse(match[1]) as LessonFrontmatter, body: match[2] };
}

function loadLessons(): Map<string, Lesson> {
  const files = globSync("src/content/lessons/*.mdx");
  const map = new Map<string, Lesson>();
  for (const file of files) {
    const slug = file
      .split("/")
      .pop()!
      .replace(/\.mdx$/, "");
    map.set(slug, parseLesson(readFileSync(file, "utf-8")));
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

  it("every lesson topic resolves to a known topic in topics.ts", () => {
    const lessons = loadLessons();
    const known = new Set<string>(topicOrder);
    const bad: string[] = [];
    for (const [slug, lesson] of lessons) {
      if (lesson.data.topic && !known.has(lesson.data.topic)) {
        bad.push(`${slug}: topic '${lesson.data.topic}'`);
      }
    }
    expect(
      bad,
      `Lessons reference topics absent from topics.ts topicOrder:\n${bad.join("\n")}`,
    ).toEqual([]);
  });

  it("every unlisted lesson is linked from at least one listed lesson", () => {
    const lessons = loadLessons();
    const listed = [...lessons.values()].filter((l) => l.data.listed !== false);
    const orphans: string[] = [];

    for (const [slug, lesson] of lessons) {
      if (lesson.data.listed !== false) continue;
      const linked = listed.some((l) => l.body.includes(`/lessons/${slug}`));
      if (!linked) orphans.push(slug);
    }

    expect(
      orphans,
      `Unlisted lessons with no inbound link from a listed lesson (dead-ends):\n${orphans.join("\n")}`,
    ).toEqual([]);
  });
});
