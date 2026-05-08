// Stable hash-based colour assignment for token visualisations.
//
// The deck cutouts use the same hash-to-palette idea as the printed PDF
// cutouts (see cli/tokenized-cutouts.typ), so a given word always wears the
// same colour on a slide whether it appears as a prefix box or as a
// free-standing following token. The deck palette itself is defined in CSS
// (see src/decks/theme.css) as `.tc-0` … `.tc-{N-1}` classes that set
// `--token-bg` and `--token-fg` custom properties.

export const TOKEN_COLOR_COUNT = 8;

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
