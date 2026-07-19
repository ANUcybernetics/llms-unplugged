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

// Pre-trained model --- a larger corpus --- drives grid-pretrained-generation
// (the 90min and 2h decks only).
export const EXAMPLE_TEXT =
  "The cat sat. The cat ran. The dog sat. The cat sat. The dog ran. The cat ran. The hat sat. The dog sat. The cat sat. The hat ran.";
export const EXAMPLE_PRETRAINED_SEQ = "the cat sat . the dog";
export const EXAMPLE_PRETRAINED_ROLLS = "27 4 - - 63 -";
