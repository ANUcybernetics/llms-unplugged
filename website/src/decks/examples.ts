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
// four entries are shown --- `;`'s real entry has 91 followers, far too many
// for a slide, and is the deck's "and so on" step.
//
// The walk is picked for fit as much as for content: every entry has to render
// on ONE line of StaticPretrainedGeneration, including the "rolled N" badge the
// active row grows. That caps a two-dice entry at roughly seven short
// followers. `again` is the widest here and still leaves room for the badge.
export const EXAMPLE_PRETRAINED_SEQ = "sleep again I'd float ;";
// One roll per step (a single d10, or two read as tens-then-units for a
// 00-99 spread); "-" marks a step with a single option (no roll needed).
// sleep --rolled 7, past `.`'s 6--> again; again --rolled 80 (an eight and a
// zero), past `as`'s 76--> I'd; I'd --rolled 6, past `like`'s 4--> float;
// float's only follower is `;`, so no roll; `;` is the "and so on" end of the
// walk.
export const EXAMPLE_PRETRAINED_ROLLS = "7 80 6 - -";
export const EXAMPLE_PRETRAINED_ENTRIES: ModelEntry[] = [
  {
    previousWord: "sleep",
    totalCount: 10,
    numDice: 1,
    nextWords: [
      { word: ",", count: 0, threshold: 2 },
      { word: ".", count: 0, threshold: 6 },
      { word: "again", count: 0, threshold: 7 },
      { word: "as", count: 0, threshold: 8 },
      { word: "with", count: 0, threshold: 9 },
    ],
  },
  {
    previousWord: "again",
    totalCount: 100,
    numDice: 2,
    nextWords: [
      { word: ".", count: 0, threshold: 45 },
      { word: ",", count: 0, threshold: 61 },
      { word: "and", count: 0, threshold: 68 },
      { word: "as", count: 0, threshold: 76 },
      { word: "I'd", count: 0, threshold: 84 },
      { word: "made", count: 0, threshold: 91 },
      { word: "over", count: 0, threshold: 99 },
    ],
  },
  {
    previousWord: "I'd",
    totalCount: 10,
    numDice: 1,
    nextWords: [
      { word: "like", count: 0, threshold: 4 },
      { word: "float", count: 0, threshold: 7 },
      { word: "take", count: 0, threshold: 9 },
    ],
  },
  {
    previousWord: "float",
    totalCount: 10,
    numDice: 1,
    nextWords: [{ word: ";", count: 0, threshold: 9 }],
  },
];
