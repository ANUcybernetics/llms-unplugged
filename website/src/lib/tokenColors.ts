// Stable hash-based colour assignment for token visualisations.
//
// This MUST stay equivalent to the `entry-for` hash in
// cli/tokenized-cutouts.typ — the printed cutout is the ground truth — so a
// given word lands on the same palette index (and therefore the same colour)
// on a slide and on the printed cutout. Matching constants: initial salt
// 247509, multiplier 569, mod 1000003, then mod TOKEN_COLOR_COUNT, iterating
// Unicode codepoints. (An earlier version used the naïve `h * 31` Java
// String.hashCode constant with salt 0, which the typst comment explicitly
// warns against — it collapsed the mod-30 hash and collided common words.)
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
// typst palette) if any is regenerated. `--token-fg` is a lightness-bumped
// variant of `--token-bg` so free-standing next-words stay readable on the
// dark slide background even when the underlying palette entry is dark.

// Length must match the palette in src/decks/theme.css and the palette in
// cli/tokenized-cutouts.typ (28 chromatic + black + mid-grey).
export const TOKEN_COLOR_COUNT = 30;

export function tokenColorIndex(token: string): number {
  let h = 247509;
  for (const ch of token) {
    h = (h * 569 + ch.codePointAt(0)!) % 1000003;
  }
  return h % TOKEN_COLOR_COUNT;
}

export function tokenColorClass(token: string): string {
  return `tc-${tokenColorIndex(token)}`;
}
