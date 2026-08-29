import { containsCJK, parseTokens } from "./tokens";

/**
 * Word-level (jieba) tokenisation for Chinese, backed by the shared Rust
 * tokeniser compiled to wasm --- the exact same segmenter the CLI and the
 * printed booklets use, so a widget can never disagree with its booklet about
 * where the word boundaries fall.
 *
 * The jieba dictionary is ~5 MB, so the wasm is loaded on demand and only ever
 * for text that actually contains Chinese. Pure-Latin text (and char-level
 * mode) stays on the synchronous {@link parseTokens} path and never triggers a
 * download. That also keeps server-side rendering synchronous: this module is
 * only ever reached from a client-side effect.
 */

type TokenizeFn = (content: string, wordMode: boolean) => string[];

let wasmReady: Promise<TokenizeFn> | null = null;

function loadWasm(): Promise<TokenizeFn> {
  if (!wasmReady) {
    wasmReady = (async () => {
      const wasm = await import("../wasm-pkg/llms_unplugged.js");
      await wasm.default();
      return wasm.tokenize;
    })();
  }
  return wasmReady;
}

/**
 * Tokenise `text` at word level. Chinese runs are cut by jieba (via wasm);
 * everything else matches {@link parseTokens}. Returns a promise because the
 * wasm may need loading; resolves synchronously-fast on subsequent calls.
 */
export async function tokenizeWords(text: string): Promise<string[]> {
  if (!containsCJK(text)) return parseTokens(text);
  const tokenize = await loadWasm();
  return tokenize(text, true);
}
