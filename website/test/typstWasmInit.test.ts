// Smoke test for typst.ts wasm initialisation. The /tools/ page inits the
// web-compiler and renderer wasm modules in the browser; a broken published
// wasm/glue pair (or a bad version bump) hangs or throws before the widget
// ever reaches "Compiler ready" (task-136). This exercises the same pinned
// packages the browser bundle ships, feeding the wasm bytes directly. The
// document is shape-only because no fonts are loaded.
//
// `assets: false` is what actually keeps this offline. An empty `beforeBuild`
// does NOT mean "no fonts": TypstCompilerDriver.init appends
// `loadFonts([], { assets: ['text'] })` whenever no loader states an opinion,
// which pulls 17 faces off cdn.jsdelivr.net and once failed a deploy on
// ECONNRESET. Disabling the asset pack is enough here because a bare rect needs
// no glyphs.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTypstCompiler, createTypstRenderer, loadFonts } from "@myriaddreamin/typst.ts";

const require = createRequire(import.meta.url);

describe("typst.ts wasm init", () => {
  // Fail loudly rather than flakily if a typst.ts upgrade reintroduces a fetch:
  // without this the only symptom is an intermittent red deploy on a CI runner.
  const realFetch = globalThis.fetch;
  beforeAll(() => {
    globalThis.fetch = (...args: Parameters<typeof realFetch>) => {
      const [input] = args;
      const url = typeof input === "string" ? input : (input as Request).url;
      throw new Error(`typst.ts attempted a network fetch: ${url}`);
    };
  });
  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  it("initialises the web compiler wasm and compiles a document", async () => {
    const wasmPath =
      require.resolve("@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm");
    const compiler = createTypstCompiler();
    await compiler.init({
      beforeBuild: [loadFonts([], { assets: false })],
      getModule: () => readFile(wasmPath),
    });

    compiler.addSource("/main.typ", "#rect(width: 10pt, height: 10pt)");
    const artifact = await compiler.compile({
      mainFilePath: "/main.typ",
      diagnostics: "unix",
    });

    expect(artifact.diagnostics ?? []).toEqual([]);
    expect(artifact.result).toBeInstanceOf(Uint8Array);
    expect(artifact.result!.length).toBeGreaterThan(0);
  }, 30_000);

  it("initialises the renderer wasm", async () => {
    const wasmPath =
      require.resolve("@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm");
    const renderer = createTypstRenderer();
    await renderer.init({
      beforeBuild: [loadFonts([], { assets: false })],
      getModule: () => readFile(wasmPath),
    });
  }, 30_000);
});
