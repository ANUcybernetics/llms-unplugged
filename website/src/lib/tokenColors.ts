// Stable hash-based colour assignment for token visualisations.
//
// The deck cutouts use the same hash-to-palette idea as the printed PDF
// cutouts (see cli/tokenized-cutouts.typ), so a given word always wears the
// same colour on a slide whether it appears as a previous-word box or as a
// free-standing next word. Both sides use the same `h * 31 + codepoint`
// rolling hash mod 1000003, then mod TOKEN_COLOR_COUNT, with palette entries
// in the same order — so identical words land on identical palette indices
// in the typst output and on the deck.
//
// The deck palette itself is defined in CSS (see src/decks/theme.css) as
// `.tc-0` … `.tc-{N-1}` classes that set `--token-bg`, `--token-fg`, and
// `--token-pill-text` custom properties. The pill-text colour follows the
// typst palette's `light` flag (black text on light entries, white on dark);
// `--token-fg` is a lightness-bumped variant of `--token-bg` so free-standing
// next-words stay readable on the dark slide background even when the
// underlying palette entry is dark.

// Length must match the palette in src/decks/theme.css and the palette in
// cli/tokenized-cutouts.typ (28 chromatic + black + mid-grey).
export const TOKEN_COLOR_COUNT = 30;

export function tokenColorIndex(token: string): number {
  let h = 0;
  for (const ch of token.toLowerCase()) {
    h = (h * 31 + ch.charCodeAt(0)) % 1000003;
  }
  return h % TOKEN_COLOR_COUNT;
}

export function tokenColorClass(token: string): string {
  return `tc-${tokenColorIndex(token)}`;
}
