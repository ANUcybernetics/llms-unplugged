export interface DiceBand {
  word: string;
  count: number;
  from: number;
  to: number;
}

/**
 * Apportion d10 faces (0..10^k - 1) across next-word options, preserving the
 * caller's option order. This is a port of the scaling in `format_entries`
 * (cli/src/lib.rs), the code that writes the printed booklets' dice ranges:
 * cumulative counts are rescaled by `ceiling / total` and *then* rounded, so
 * the bands here always match the booklet exactly. (Rounding each option's
 * share separately --- the obvious alternative --- disagrees with the booklet
 * at rounding boundaries: three equal counts give 0-3/4-6/7-9 under this
 * rule, 0-2/3-5/6-9 under per-option rounding.)
 *
 * The one place the website apportions dice faces; buildModelEntries
 * (modelEntries.ts) and the deck dice-strip slides both call it.
 */
export function computeDiceBands(options: { word: string; count: number }[]): DiceBand[] {
  if (options.length === 0) return [];
  const total = options.reduce((sum, o) => sum + o.count, 0);
  if (total === 0) return [];
  const ceiling = Math.pow(10, String(total).length) - 1;
  const factor = ceiling / total;

  let cumulativeCount = 0;
  let from = 0;
  return options.map((o) => {
    cumulativeCount += o.count;
    const to = Math.round(cumulativeCount * factor);
    const band = { word: o.word, count: o.count, from, to };
    from = to + 1;
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
