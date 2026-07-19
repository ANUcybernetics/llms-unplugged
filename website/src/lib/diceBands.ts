export interface DiceBand {
  word: string;
  count: number;
  from: number;
  to: number;
}

/**
 * Apportion d10 faces (0..ceiling) across next-word options, preserving the
 * caller's option order. Used by the deck dice-strip slides, where options
 * must arrive in grid (vocab) column order so the leftmost band matches the
 * row's leftmost non-empty cell. Faces are spread proportionally to the
 * counts, with the last option absorbing any rounding --- the same
 * apportionment as buildModelEntries, minus its count-descending sort.
 */
export function computeDiceBands(options: { word: string; count: number }[]): DiceBand[] {
  if (options.length === 0) return [];
  const total = options.reduce((sum, o) => sum + o.count, 0);
  if (total === 0) return [];
  const ceiling = Math.pow(10, String(total).length) - 1;
  let lower = 0;
  return options.map((o, i) => {
    const scaled = Math.round((o.count / total) * (ceiling + 1));
    const to = i === options.length - 1 ? ceiling : Math.min(lower + scaled - 1, ceiling);
    const band = { word: o.word, count: o.count, from: lower, to };
    lower = to + 1;
    return band;
  });
}

/** Next-word options for `word`'s grid row, in vocab (column) order. */
export function getRowOptionsInVocabOrder(
  vocab: string[],
  getCount: (from: string, to: string) => number,
  word: string,
): { word: string; count: number }[] {
  return vocab.map((to) => ({ word: to, count: getCount(word, to) })).filter((o) => o.count > 0);
}
