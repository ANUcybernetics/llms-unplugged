import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MODULES_DIR = join(process.cwd(), "src/content/modules");

// Modules are sorted by `order` within their topic group. A duplicate order in
// the same topic would silently fall back to filesystem ordering, so guard the
// (topic, order) pair here rather than relying on authors noticing.
describe("Module ordering", () => {
  it("has a unique order within each topic", () => {
    const seen = new Map<string, string>();

    for (const file of readdirSync(MODULES_DIR).filter((f) => f.endsWith(".mdx"))) {
      const raw = readFileSync(join(MODULES_DIR, file), "utf-8");
      const topic = raw.match(/^topic:\s*(\S+)/m)?.[1];
      const order = raw.match(/^order:\s*(\S+)/m)?.[1];
      expect(topic, `${file} is missing topic frontmatter`).toBeDefined();
      expect(order, `${file} is missing order frontmatter`).toBeDefined();

      const key = `${topic}/${order}`;
      const clash = seen.get(key);
      expect(clash, `${file} and ${clash} share topic ${topic} and order ${order}`).toBeUndefined();
      seen.set(key, file);
    }
  });
});
