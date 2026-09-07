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
import init, {
  process_text_for_booklet,
  process_text_for_ledger,
  tokenize,
} from "../src/wasm-pkg/llms_unplugged";

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
    // Pinned against the CLI: ["a",9,["b",2],["c",6],["d",9]].
    const output = JSON.parse(process_text_for_booklet("a b. a c. a d.", "T", "A", 2));
    const row = output.data.find((r: unknown[]) => r[0] === "a");
    expect(row).toEqual(["a", 9, ["b", 2], ["c", 6], ["d", 9]]);
  });
});

describe("committed wasm bundle builds ledger sets like the CLI", () => {
  const text = "a b. a c. a d.";

  it("deals the prefixes and takes the first so many default colours", () => {
    const set = JSON.parse(process_text_for_ledger(text, "T", "A", 2, 8, undefined));
    expect(set.columns).toBe(4);
    expect(set.rows_per_page).toBe(12);
    expect(set.palette.map((c: { name: string }) => c.name)).toEqual([
      "red",
      "blue",
      "green",
      "yellow",
      "pink",
      "purple",
      "black",
      "white",
    ]);
    // Four prefixes (".", "a", "b", "c" ... "d" only ends the text) in one
    // sheet, since the count follows the text.
    expect(set.sheets).toHaveLength(1);
    const a = set.sheets[0].pages.flat().find((e: { prefix: string[] }) => e.prefix[0] === "a");
    expect(a.followers).toEqual([
      { text: "b", count: 1 },
      { text: "c", count: 1 },
      { text: "d", count: 1 },
    ]);
    expect(set.text).toHaveLength(1);
  });

  it("pins the sheet count and trims the palette to whole rows", () => {
    const set = JSON.parse(process_text_for_ledger(text, "T", "A", 2, 6, 3));
    expect(set.sheets).toHaveLength(3);
    expect(set.palette).toHaveLength(4);
  });

  it("rejects fewer colours than columns", () => {
    expect(() => process_text_for_ledger(text, "T", "A", 2, 3, undefined)).toThrow(/colour/);
  });
});
