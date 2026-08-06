// Worked-example data shared across the grid decks (grid-60min, grid-90min,
// grid-2h). Keeping it here rather than re-declaring `export const`s in each
// deck lets the three grid decks stay a thin shell that differs only by title
// and which extra partials it includes.
//
// (Component imports still have to live in each deck: astromotion's `@include`
// splices a partial into a slide body, so it can't hoist module-level imports.)
// Cutout decks use their own example data and are intentionally kept separate.

// Bigram model --- "Run, Spot, run. See Spot run." --- drives grid-training and
// grid-generation. The clause order is deliberate: it puts `see` last in the
// vocabulary so the generation walk can start from a row that isn't the first
// one (showing you can begin anywhere), while still hitting the no-choice →
// equal → unequal progression.
export const EXAMPLE_TOKENS = "run , spot , run . see spot run .";
export const EXAMPLE_VOCAB = "run , spot . see";
// The walk starts at `see` (the last grid row), hits no-choice → equal → equal
// → unequal, rolls on past the full stop, and loops back to `see`.
export const EXAMPLE_GENERATION = "see spot , run . see";
// One d10 roll (0-9) per generation step; "-" marks a step with a single option
// (no roll needed). Dice bands follow grid column order (see DiceStrip):
// spot row is run=0-4/`,`=5-9, `,` row is run=0-4/spot=5-9, run row is
// `,`=0-2/`.`=3-9. The choices: spot→`,` (rolled 7), `,`→run (2), run→`.` (3).
export const EXAMPLE_GENERATION_ROLLS = "- 7 2 3 - -";

// Cat-in-the-Hat excerpt --- drives the single "the same model, drawn as a
// grid" slide in the unplugged-age-of-ai talk, where the room is holding search
// sheets dealt from that book. Using a line they can place ("Look at me! Look at
// me! Look at me now!") rather than the abstract Run-Spot text means the grid on
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
// only `sat`, so the grid rates "the dog ran" impossible. Pre-tokenised (unlike
// EXAMPLE_TEXT) so it can go straight into ParameterGrid, and small enough that
// the ringed cell is findable from the back of the room.
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

// Pre-trained model --- a larger corpus --- drives grid-pretrained-generation
// (the 90min and 2h decks only).
export const EXAMPLE_TEXT =
  "The cat sat. The cat ran. The dog sat. The cat sat. The dog ran. The cat ran. The hat sat. The dog sat. The cat sat. The hat ran.";
export const EXAMPLE_PRETRAINED_SEQ = "the cat sat . the dog";
export const EXAMPLE_PRETRAINED_ROLLS = "27 4 - - 63 -";
