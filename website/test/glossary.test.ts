import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  getGlossaryByCategory,
  getGlossaryEntry,
  loadGlossary,
  resolveRelated,
} from "../src/lib/glossary";
describe("glossary data", () => {
  it("loads all entries", () => {
    const entries = loadGlossary();
    expect(entries.length).toBeGreaterThan(0);
  });

  it("has unique ids", () => {
    const entries = loadGlossary();
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry has required fields", () => {
    for (const entry of loadGlossary()) {
      expect(entry.id).toBeTruthy();
      expect(entry.term).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.description).toBeTruthy();
    }
  });

  it("every entry has a known category", () => {
    for (const entry of loadGlossary()) {
      expect(CATEGORIES).toHaveProperty(entry.category);
    }
  });

  it("see links have label and href", () => {
    for (const entry of loadGlossary()) {
      if (entry.see) {
        for (const link of entry.see) {
          expect(link.label).toBeTruthy();
          expect(link.href).toMatch(/^\//);
        }
      }
    }
  });
});

describe("getGlossaryEntry", () => {
  it("finds an entry by id", () => {
    const entry = getGlossaryEntry("token");
    expect(entry).toBeDefined();
    expect(entry!.term).toBe("Token");
  });

  it("returns undefined for unknown id", () => {
    expect(getGlossaryEntry("nonexistent")).toBeUndefined();
  });

  it("resolves every related id", () => {
    for (const entry of loadGlossary()) {
      expect(() => resolveRelated(entry.related)).not.toThrow();
    }
  });
});

describe("getGlossaryByCategory", () => {
  it("returns categories in topic order, materials last", () => {
    const slugs = getGlossaryByCategory().map((c) => c.slug);
    expect(slugs[0]).toBe("fundamentals");
    expect(slugs.at(-1)).toBe("materials");
  });

  it("each category has entries", () => {
    for (const cat of getGlossaryByCategory()) {
      expect(cat.entries.length).toBeGreaterThan(0);
      expect(cat.label).toBeTruthy();
    }
  });

  it("all entries are accounted for", () => {
    const allFromCategories = getGlossaryByCategory().flatMap((c) => c.entries);
    expect(allFromCategories.length).toBe(loadGlossary().length);
  });
});
