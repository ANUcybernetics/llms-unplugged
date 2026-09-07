// End-to-end check of the /tools/ page's ledger workflow: the wasm bundle
// builds a ledger.json, and the three ledger templates compile against it in
// the same typst.ts the browser runs. Nothing else covers the seam --- the
// templates live in cli/, the copy step only checks the files it was told to
// copy exist, and a template that reads a field the wasm never writes fails
// as a runtime error on the deployed page rather than a red build.
//
// Fonts are deliberately not loaded (`assets: false` keeps this offline, as
// in typstWasmInit.test.ts): Typst falls back rather than failing, and what
// is under test is that every template resolves its imports, its assets and
// every field of the JSON.
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createTypstCompiler, loadFonts } from "@myriaddreamin/typst.ts";
import init, { process_text_for_ledger } from "../src/wasm-pkg/llms_unplugged";
import { LEDGER_COLUMNS } from "../src/lib/ledger";

const require = createRequire(import.meta.url);
const cliDir = resolve(process.cwd(), "..", "cli");
const readCli = (name: string) => readFileSync(join(cliDir, name), "utf-8");

// Long enough that a prefix runs past one row of four, so the sheets exercise
// the continuation rows and the palette cycling.
const TEXT = [
  "the cat sat on the mat and the cat ate the rat then the cat sat again",
  "while the dog watched the cat and the rat ran past the mat .",
].join(" ");

let compiler: Awaited<ReturnType<typeof createTypstCompiler>>;

beforeAll(async () => {
  await init({
    module_or_path: await readFile(join(process.cwd(), "src/wasm-pkg/llms_unplugged_bg.wasm")),
  });

  const wasmPath =
    require.resolve("@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm");
  compiler = createTypstCompiler();
  await compiler.init({
    beforeBuild: [loadFonts([], { assets: false })],
    getModule: () => readFile(wasmPath),
  });

  // The same VFS the browser builds in src/lib/typstCompiler.ts.
  for (const name of [
    "ledger.typ",
    "ledger-counters.typ",
    "ledger-text.typ",
    "ledger-common.typ",
    "booklet-common.typ",
    "cutout-common.typ",
  ]) {
    compiler.addSource(`/${name}`, readCli(name));
  }
  compiler.mapShadow("/lockup-light.svg", new TextEncoder().encode(readCli("lockup-light.svg")));
}, 60_000);

async function compile(mainFilePath: string, inputs: Record<string, string>) {
  const artifact = await compiler.compile({ mainFilePath, inputs, diagnostics: "unix" });
  expect(artifact.diagnostics ?? [], `${mainFilePath} reported diagnostics`).toEqual([]);
  expect(artifact.result).toBeInstanceOf(Uint8Array);
  expect(artifact.result!.length).toBeGreaterThan(0);
}

describe("the browser's ledger set compiles", () => {
  for (const colours of [4, 8, 12]) {
    it(`compiles all three documents with ${colours} counter colours`, async () => {
      const json = process_text_for_ledger(TEXT, "A Ledger", "A Tester", 2, colours, 3);
      const set = JSON.parse(json);
      expect(set.palette).toHaveLength(colours);
      expect(set.columns).toBe(LEDGER_COLUMNS);
      compiler.addSource("/model.json", json);

      await compile("/ledger.typ", { json_path: "/model.json", prefill: "prefixes" });
      await compile("/ledger-counters.typ", { json_path: "/model.json" });
      await compile("/ledger-text.typ", { json_path: "/model.json" });
    }, 120_000);
  }

  for (const prefill of ["prefixes", "followers", "tallies"]) {
    it(`compiles sheets printed with ${prefill}`, async () => {
      compiler.addSource(
        "/model.json",
        process_text_for_ledger(TEXT, "A Ledger", "A Tester", 2, 8, undefined),
      );
      await compile("/ledger.typ", { json_path: "/model.json", prefill });
    }, 120_000);
  }

  it("compiles a trigram set", async () => {
    compiler.addSource(
      "/model.json",
      process_text_for_ledger(TEXT, "A Ledger", "A Tester", 3, 8, 2),
    );
    await compile("/ledger.typ", { json_path: "/model.json", prefill: "followers" });
  }, 120_000);
});
