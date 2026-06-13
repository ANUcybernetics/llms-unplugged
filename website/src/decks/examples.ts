// Worked-example data shared across the grid decks (grid-60min, grid-90min,
// grid-2h). Keeping it here rather than re-declaring `export const`s in each
// deck lets the three grid decks stay a thin shell that differs only by title
// and which extra partials it includes.
//
// (Component imports still have to live in each deck: astromotion's `@include`
// splices a partial into a slide body, so it can't hoist module-level imports.)
// Cutout decks use their own example data and are intentionally kept separate.

// Bigram model --- "See Spot run. Run, Spot, run." --- drives grid-training and
// grid-generation.
export const EXAMPLE_TOKENS = "see spot run . run , spot , run .";
export const EXAMPLE_VOCAB = "see spot run . ,";
export const EXAMPLE_GENERATION = "see spot , run . run";

// Pre-trained model --- a larger corpus --- drives grid-pretrained-generation
// (the 90min and 2h decks only).
export const EXAMPLE_TEXT =
  "The cat sat. The cat ran. The dog sat. The cat sat. The dog ran. The cat ran. The hat sat. The dog sat. The cat sat. The hat ran.";
export const EXAMPLE_PRETRAINED_SEQ = "the cat sat . the dog";
export const EXAMPLE_PRETRAINED_ROLLS = "27 4 - - 63 -";
