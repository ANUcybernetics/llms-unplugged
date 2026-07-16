import { describe, expect, it } from "vitest";
import { globSync, readFileSync } from "node:fs";
import { parse } from "yaml";
import { loadGlossary } from "../src/lib/glossary";
import { topicOrder } from "../src/lib/topics";

/**
 * Regression tests for the module navigation contract.
 *
 * - The /modules index and the sidebar both derive grouping from each module's
 *   `topic`/`order` frontmatter (via src/lib/modules.ts), so the only invariant
 *   to police here is that the frontmatter is well-formed and that no module
 *   becomes an unreachable dead-end.
 * - ISSUE-002 (2026-04-13 dogfood audit): the glossary linked to
 *   `/modules/weighted-randomness` but it wasn't reachable from the nav. It is
 *   now intentionally `listed: false`, so the contract is "an unlisted module
 *   must still be linked from a listed module" rather than "must be in the
 *   sidebar".
 */
interface ModuleFrontmatter {
  title: string;
  description: string;
  order?: number;
  topic?: string;
  listed?: boolean;
}

interface Module {
  data: ModuleFrontmatter;
  body: string;
}

function parseModule(source: string): Module {
  const match = /^---\n(.*?)\n---\n(.*)$/s.exec(source);
  if (!match) throw new Error("module is missing YAML frontmatter");
  return { data: parse(match[1]) as ModuleFrontmatter, body: match[2] };
}

function loadModules(): Map<string, Module> {
  const files = globSync("src/content/modules/*.mdx");
  const map = new Map<string, Module>();
  for (const file of files) {
    const slug = file
      .split("/")
      .pop()!
      .replace(/\.mdx$/, "");
    map.set(slug, parseModule(readFileSync(file, "utf-8")));
  }
  return map;
}

describe("module consistency", () => {
  it("every glossary see-link into /modules/ points at an existing module", () => {
    const modules = loadModules();
    const missing: string[] = [];

    for (const entry of loadGlossary()) {
      if (!entry.see) continue;
      for (const link of entry.see) {
        if (!link.href.startsWith("/modules/")) continue;
        const slug = link.href.replace(/^\/modules\//, "").replace(/\/$/, "");
        if (!slug || slug.includes("#")) continue;
        if (!modules.has(slug)) {
          missing.push(`glossary entry '${entry.id}' → ${link.href} (label: "${link.label}")`);
        }
      }
    }

    expect(missing, `Glossary links to modules that don't exist:\n${missing.join("\n")}`).toEqual(
      [],
    );
  });

  it("every module topic resolves to a known topic in topics.ts", () => {
    const modules = loadModules();
    const known = new Set<string>(topicOrder);
    const bad: string[] = [];
    for (const [slug, module] of modules) {
      if (module.data.topic && !known.has(module.data.topic)) {
        bad.push(`${slug}: topic '${module.data.topic}'`);
      }
    }
    expect(
      bad,
      `Modules reference topics absent from topics.ts topicOrder:\n${bad.join("\n")}`,
    ).toEqual([]);
  });

  it("every unlisted module is linked from at least one listed module", () => {
    const modules = loadModules();
    const listed = [...modules.values()].filter((l) => l.data.listed !== false);
    const orphans: string[] = [];

    for (const [slug, module] of modules) {
      if (module.data.listed !== false) continue;
      const linked = listed.some((l) => l.body.includes(`/modules/${slug}`));
      if (!linked) orphans.push(slug);
    }

    expect(
      orphans,
      `Unlisted modules with no inbound link from a listed module (dead-ends):\n${orphans.join("\n")}`,
    ).toEqual([]);
  });
});
