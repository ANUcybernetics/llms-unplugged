import fs from "node:fs";
import path from "node:path";
import { load } from "js-yaml";

export interface GlossaryEntry {
  id: string;
  term: string;
  category: string;
  description: string;
  synonyms?: string[];
  note?: string;
  see?: { label: string; href: string }[];
  related?: string[];
}

const CATEGORIES: Record<string, string> = {
  core: "Core concepts",
  "model-types": "Model types",
  sampling: "Sampling and generation",
  understanding: "Understanding and meaning",
  advanced: "Advanced concepts",
  "post-training": "Post-training and reasoning",
};

let cached: GlossaryEntry[] | null = null;

export function loadGlossary(): GlossaryEntry[] {
  if (cached) return cached;
  const raw = fs.readFileSync(path.join(process.cwd(), "src/data/glossary.yaml"), "utf-8");
  cached = load(raw) as GlossaryEntry[];
  return cached;
}

export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return loadGlossary().find((e) => e.id === id);
}

export function resolveRelated(ids: string[] | undefined): GlossaryEntry[] {
  if (!ids) return [];
  const all = loadGlossary();
  return ids.map((id) => {
    const entry = all.find((e) => e.id === id);
    if (!entry) throw new Error(`Glossary: related id "${id}" not found`);
    return entry;
  });
}

export function getGlossaryByCategory(): {
  label: string;
  slug: string;
  entries: GlossaryEntry[];
}[] {
  const all = loadGlossary();
  const seen = new Set<string>();
  const order: string[] = [];
  for (const entry of all) {
    if (!seen.has(entry.category)) {
      seen.add(entry.category);
      order.push(entry.category);
    }
  }
  return order.map((cat) => ({
    label: CATEGORIES[cat] ?? cat,
    slug: cat,
    entries: all.filter((e) => e.category === cat),
  }));
}

export { CATEGORIES };
