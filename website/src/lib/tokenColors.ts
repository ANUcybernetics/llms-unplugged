// Stable hash-based colour assignment for token visualisations.
//
// This MUST stay equivalent to the `entry-for` hash in cli/cutout-common.typ —
// the printed cutout is the ground truth — so a given word lands on the same
// palette index (and therefore the same colour) on a slide and on the printed
// cutout. Matching constants: initial salt 14564, multiplier 7, mod 1000003,
// then mod TOKEN_COLOR_COUNT, iterating Unicode codepoints.
//
// Like the typst, we do NOT case-fold. The CLI canonicalises casing per
// corpus before emitting JSON, so the printout hashes the canonical surface
// form, which may be capitalised (e.g. "I" or a proper noun). Deck content
// should be authored in that surface form to match. The one case the two
// sides can still diverge is a deck word whose casing differs from the
// corpus-canonical form — we deliberately don't replicate the CLI's
// per-corpus casing logic here.
//
// The deck palette itself is defined in CSS (see src/decks/theme.css) as
// `.tc-0` … `.tc-{N-1}` classes, in the same index order as the typst
// palette. Keep all three in sync (these constants, the CSS palette, the
// typst palette) if any is regenerated.

// Length must match the palette in src/decks/theme.css and the palette in
// cli/cutout-common.typ (black, grey + 6 chromatic, each named).
export const TOKEN_COLOR_COUNT = 8;

export function tokenColorIndex(token: string): number {
  let h = 14564;
  for (const ch of token) {
    h = (h * 7 + ch.codePointAt(0)!) % 1000003;
  }
  return h % TOKEN_COLOR_COUNT;
}

export function tokenColorClass(token: string): string {
  return `tc-${tokenColorIndex(token)}`;
}
