// Smoke test for typst.ts wasm initialisation. The /tools/ page inits the
// web-compiler and renderer wasm modules in the browser; a broken published
// wasm/glue pair (or a bad version bump) hangs or throws before the widget
// ever reaches "Compiler ready" (task-136). This exercises the same pinned
// packages the browser bundle ships, feeding the wasm bytes directly so no
// network is involved. The document is shape-only because no fonts are loaded.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { createTypstCompiler, createTypstRenderer } from "@myriaddreamin/typst.ts";

const require = createRequire(import.meta.url);

describe("typst.ts wasm init", () => {
  it("initialises the web compiler wasm and compiles a document", async () => {
    const wasmPath =
      require.resolve("@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm");
    const compiler = createTypstCompiler();
    await compiler.init({
      beforeBuild: [],
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
      beforeBuild: [],
      getModule: () => readFile(wasmPath),
    });
  }, 30_000);
});
