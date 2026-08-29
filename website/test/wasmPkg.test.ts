// Drift check for the committed wasm bundle (src/wasm-pkg). The bundle is
// wasm-bindgen output built from cli/src by `mise run wasm-build` and checked
// in so CI can bundle it without a Rust toolchain --- which also means nothing
// stops a Rust-side change landing while the committed wasm quietly serves the
// old behaviour. This test runs the committed bundle against the same fixture
// the Rust tokeniser generates (and cargo test asserts), plus a dice-threshold
// case pinned against real CLI output, so a stale bundle fails the website
// suite. If it fails after a deliberate Rust change: run `mise run wasm-build`
// and commit the refreshed bundle.
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import init, { process_text_for_booklet, tokenize } from "../src/wasm-pkg/llms_unplugged";

interface FixtureCase {
  input: string;
  tokens: string[];
}

const fixturePath = join(
  __dirname,
  "..",
  "..",
  "cli",
  "tests",
  "fixtures",
  "tokenization_cases.json",
);
const cases: FixtureCase[] = JSON.parse(readFileSync(fixturePath, "utf-8"));

beforeAll(async () => {
  const wasmBytes = await readFile(
    join(__dirname, "..", "src", "wasm-pkg", "llms_unplugged_bg.wasm"),
  );
  await init({ module_or_path: wasmBytes });
});

describe("committed wasm bundle matches the Rust tokeniser", () => {
  // word_mode=false is per-character CJK, matching how the fixture is
  // generated (CjkMode::Chars in cli/tests/tokenization_test.rs).
  it.each(cases)("tokenises $input identically", ({ input, tokens }) => {
    expect(tokenize(input, false)).toEqual(tokens);
  });
});

describe("committed wasm bundle matches the booklet dice scaling", () => {
  it("produces the CLI's thresholds for three equal counts", () => {
    // Pinned against the CLI: ["a",9,["b",3],["c",6],["d",9]].
    const output = JSON.parse(process_text_for_booklet("a b. a c. a d.", "T", "A", 2));
    const row = output.data.find((r: unknown[]) => r[0] === "a");
    expect(row).toEqual(["a", 9, ["b", 3], ["c", 6], ["d", 9]]);
  });
});
