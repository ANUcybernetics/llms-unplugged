import type { ModelEntry } from "../lib/modelEntries";

// Worked-example data shared across the grid decks (grid-60min, grid-90min,
// grid-2h). Keeping it here rather than re-declaring `export const`s in each
// deck lets the three grid decks stay a thin shell that differs only by title
// and which extra partials it includes.
//
// (Component imports still have to live in each deck: astromotion's `@include`
// splices a partial into a slide body, so it can't hoist module-level imports.)
// Cutout decks use their own example data and are intentionally kept separate.

// Bigram model --- "Hop, Joey, hop. See Joey hop." --- drives grid-training and
// grid-generation. The clause order is deliberate: it puts `see` last in the
// vocabulary so the generation walk can start from a row that isn't the first
// one (showing you can begin anywhere), while still hitting the no-choice →
// equal → unequal progression.
export const EXAMPLE_TOKENS = "hop , joey , hop . see joey hop .";
export const EXAMPLE_VOCAB = "hop , joey . see";
// The walk starts at `see` (the last grid row), hits no-choice → equal → equal
// → unequal, rolls on past the full stop, and loops back to `see`.
export const EXAMPLE_GENERATION = "see joey , hop . see";
// One d10 roll (0-9) per generation step; "-" marks a step with a single option
// (no roll needed). Dice bands follow grid column order (see DiceStrip) and
// the printed booklets' rounding (computeDiceBands): joey row is
// hop=0-4/`,`=5-9, `,` row is hop=0-4/joey=5-9, hop row is `,`=0-2/`.`=3-9.
// The choices: joey→`,` (rolled 7), `,`→hop (2), hop→`.` (6).
export const EXAMPLE_GENERATION_ROLLS = "- 7 2 6 - -";

// Cat-in-the-Hat excerpt --- drives the single "the same model, drawn as a
// grid" slide in the unplugged-age-of-ai talk, where the room is holding search
// sheets dealt from that book. Using a line they can place ("Look at me! Look at
// me! Look at me now!") rather than the abstract Hop-Joey text means the grid on
// screen and the paper on their lap are visibly the same model, just at
// different scale. The line earns its keep mechanically too: five distinct
// tokens keeps the grid readable from the back of the room, and the `me` row
// comes out unequal (`!` twice, `now` once), which is the room's hands-up
// distribution in miniature.
export const CAT_TOKENS = "look at me ! look at me ! look at me now !";
export const CAT_VOCAB = "look at me ! now";

// Generalisation --- drives the "it can say what it never saw" beat in
// scaling-up. `cat` and `dog` do exactly the same job in this text, but a grid
// stores them as unrelated rows: `cat` has seen both `sat` and `ran`, `dog`
// only `sat`, so the grid rates "the dog ran" impossible. Pre-tokenised so it
// can go straight into ParameterGrid, and small enough that the ringed cell is
// findable from the back of the room.
export const EXAMPLE_GENERALISE = "the cat sat . the cat ran . the dog sat .";
export const EXAMPLE_GENERALISE_VOCAB = "the cat sat . ran dog";
// The same grid as a transformer would fill it: a number in every cell, rows
// and columns in EXAMPLE_GENERALISE_VOCAB order. Illustrative, not measured ---
// what has to be true of them is that no cell is empty, that the `cat` and
// `dog` rows come out near-identical (they do the same job in the text), and
// that `dog`→`ran` is healthy where the tallies left a hole.
export const EXAMPLE_GENERALISE_SCORES = [
  // the:  the   cat   sat    .    ran   dog
  [0.03, 0.46, 0.04, 0.02, 0.04, 0.41],
  // cat:
  [0.04, 0.01, 0.48, 0.03, 0.42, 0.02],
  // sat:
  [0.12, 0.02, 0.01, 0.78, 0.04, 0.03],
  // .:
  [0.82, 0.05, 0.03, 0.02, 0.04, 0.04],
  // ran:
  [0.11, 0.03, 0.03, 0.77, 0.02, 0.04],
  // dog:
  [0.05, 0.02, 0.46, 0.03, 0.4, 0.04],
];

// Pre-trained model --- the room's actual booklet --- drives
// grid-pretrained-generation (the 90min and 2h decks only). The four entries
// below are copied verbatim from the booklet JSON, built with:
//   cd cli && ./target/release/llms_unplugged pdf \
//     -i ../data/the-man-from-snowy-river.txt \
//     --target the-man-from-snowy-river-2-1 --out-dir out
// (data/the-man-from-snowy-river.txt, Banjo Paterson's "The Man from Snowy
// River and Other Verses"; JSON at cli/out/json/the-man-from-snowy-river.json,
// entries shaped `[word, maxRoll, [follower, threshold]...]`). Re-run that and
// re-read these four entries if the booklet is ever rebuilt. Only the walk's
// four entries are shown --- `;`'s real entry has far too many followers for a
// slide, and is the deck's "and so on" step.
export const EXAMPLE_PRETRAINED_SEQ = "golden grass grown hollow ;";
// One roll per step (a single d10, or two read as tens-then-units for a
// 00-99 spread); "-" marks a step with a single option (no roll needed).
// golden --rolled 4--> grass; grass --rolled 68 (a six and an eight), past
// `for`'s 66--> grown; grown --rolled 6--> hollow; hollow's only follower is
// `;`, so no roll; `;` is the "and so on" end of the walk.
export const EXAMPLE_PRETRAINED_ROLLS = "4 68 6 - -";
export const EXAMPLE_PRETRAINED_ENTRIES: ModelEntry[] = [
  {
    previousWord: "golden",
    totalCount: 10,
    numDice: 1,
    nextWords: [
      { word: "fleece", count: 0, threshold: 2 },
      { word: "grass", count: 0, threshold: 6 },
      { word: "spoil", count: 0, threshold: 9 },
    ],
  },
  {
    previousWord: "grass",
    totalCount: 100,
    numDice: 2,
    nextWords: [
      { word: "is", count: 0, threshold: 23 },
      { word: "and", count: 0, threshold: 42 },
      { word: ",", count: 0, threshold: 56 },
      { word: "burnt", count: 0, threshold: 61 },
      { word: "for", count: 0, threshold: 66 },
      { word: "grown", count: 0, threshold: 70 },
      { word: "in", count: 0, threshold: 75 },
      { word: "it", count: 0, threshold: 80 },
      { word: "on", count: 0, threshold: 85 },
      { word: "thro'", count: 0, threshold: 89 },
      { word: "till", count: 0, threshold: 94 },
      { word: "was", count: 0, threshold: 99 },
    ],
  },
  {
    previousWord: "grown",
    totalCount: 10,
    numDice: 1,
    nextWords: [
      { word: "and", count: 0, threshold: 2 },
      { word: "dull", count: 0, threshold: 4 },
      { word: "hollow", count: 0, threshold: 7 },
      { word: "streets", count: 0, threshold: 9 },
    ],
  },
  {
    previousWord: "hollow",
    totalCount: 10,
    numDice: 1,
    nextWords: [{ word: ";", count: 0, threshold: 9 }],
  },
];
