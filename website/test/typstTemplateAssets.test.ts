// The /tools/ page compiles the CLI's Typst templates in the browser, which
// means every file those templates reference by relative path has to be present
// in the typst.ts virtual filesystem. Nothing else catches a gap: the templates
// live in cli/, the copy step only errors on files it was told to copy and
// can't find, and a missing dependency shows up as a runtime compile failure on
// the deployed tools page rather than a red build.
//
// Adding cutout-common.typ (the palette and token renderers, shared by the
// cutouts and sheets templates) made that a live risk --- a future `#import` in
// a template is trivially easy to add and just as easy to forget to register.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const cliDir = resolve(process.cwd(), "../cli");
const websiteSrc = resolve(process.cwd(), "src");

// The templates typstCompiler.ts registers as compilation entry points. Note
// that tokenized-cutouts.typ is registered under a different VFS name
// (/cutouts.typ), so its relative imports resolve against the VFS root.
const ENTRY_TEMPLATES = ["book.typ", "tokenized-cutouts.typ"];

const readCli = (name: string) => readFileSync(resolve(cliDir, name), "utf-8");

/** Relative paths a Typst source pulls in via `#import` or `image()`. */
function referencesIn(source: string): string[] {
  const refs = new Set<string>();
  for (const [, path] of source.matchAll(/#import\s+"([^"]+)"/g)) refs.add(path);
  for (const [, path] of source.matchAll(/image\(\s*"([^"]+)"/g)) refs.add(path);
  return [...refs];
}

/** Every file the entry templates reach, transitively, excluding the entries. */
function transitiveDependencies(): string[] {
  const seen = new Set<string>(ENTRY_TEMPLATES);
  const deps = new Set<string>();
  const queue = [...ENTRY_TEMPLATES];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const ref of referencesIn(readCli(current))) {
      if (!deps.has(ref)) deps.add(ref);
      // Only .typ files can pull in further dependencies of their own.
      if (ref.endsWith(".typ") && !seen.has(ref)) {
        seen.add(ref);
        queue.push(ref);
      }
    }
  }
  return [...deps];
}

describe("typst template assets", () => {
  const dependencies = transitiveDependencies();

  it("finds the dependencies it is meant to be guarding", () => {
    // A regex that silently stopped matching would make every assertion below
    // vacuously true, so pin the ones we know about.
    expect(dependencies).toContain("cutout-common.typ");
    expect(dependencies).toContain("favicon.svg");
  });

  it("registers every referenced file in the typst.ts filesystem", () => {
    const compiler = readFileSync(resolve(websiteSrc, "lib/typstCompiler.ts"), "utf-8");
    for (const dep of dependencies) {
      expect(
        compiler.includes(dep),
        `${dep} is referenced by a browser-compiled template but never mapped into the ` +
          `typst.ts filesystem in src/lib/typstCompiler.ts`,
      ).toBe(true);
    }
  });

  it("copies every referenced .typ file across from cli/", () => {
    // SVGs may be inlined in typstCompiler.ts instead (socy-logo-bw.svg is),
    // but Typst sources are always copied so the browser compiles the same
    // bytes the CLI does.
    const copyScript = readFileSync(
      resolve(process.cwd(), "scripts/copy-cli-templates.ts"),
      "utf-8",
    );
    for (const dep of dependencies.filter((d) => d.endsWith(".typ"))) {
      expect(
        copyScript.includes(`"${dep}"`),
        `${dep} is imported by a browser-compiled template but missing from the templates ` +
          `list in scripts/copy-cli-templates.ts`,
      ).toBe(true);
    }
  });
});
