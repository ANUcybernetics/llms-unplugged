import { describe, it, expect } from "vitest";
import {
  loadGlossary,
  getGlossaryEntry,
  getGlossaryByCategory,
  CATEGORIES,
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

  it("has a chatgpt entry", () => {
    const entry = getGlossaryEntry("chatgpt");
    expect(entry).toBeDefined();
    expect(entry!.description).toContain("Claude");
    expect(entry!.description).toContain("Gemini");
  });
});

describe("getGlossaryByCategory", () => {
  it("returns categories in data order", () => {
    const categories = getGlossaryByCategory();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0].slug).toBe("core");
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
