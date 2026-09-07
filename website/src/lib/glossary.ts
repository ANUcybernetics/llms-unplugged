import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { TOPIC_KEYS, topicLabels } from "./topics";

export interface GlossaryEntry {
  id: string;
  term: string;
  category: string;
  description: string;
  synonyms?: string[];
  note?: string;
  see?: { label: string; href: string }[];
  related?: string[];
  /** The hands-on equivalent; builds the activities table on the glossary page. */
  activity?: string;
}

// Glossary groups are the module topics, in their display order, plus the
// apparatus. Entries render in this order regardless of data order.
const CATEGORIES: Record<string, string> = {
  ...topicLabels,
  materials: "Materials",
};

const CATEGORY_ORDER = [...TOPIC_KEYS, "materials"];

let cached: GlossaryEntry[] | null = null;

export function loadGlossary(): GlossaryEntry[] {
  if (cached) return cached;
  const raw = fs.readFileSync(path.join(process.cwd(), "src/data/glossary.yaml"), "utf-8");
  cached = parse(raw) as GlossaryEntry[];
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
  return CATEGORY_ORDER.map((cat) => ({
    label: CATEGORIES[cat],
    slug: cat,
    entries: all.filter((e) => e.category === cat),
  })).filter((c) => c.entries.length > 0);
}

export { CATEGORIES, CATEGORY_ORDER };
