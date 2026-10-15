import { LEDGER_PALETTE, type LedgerEntry } from "../lib/ledger";

// Worked-example data shared by the ledger decks (how-ai-writes-stories-ledger
// and its 45-minute sibling), so each deck is a thin shell that differs only
// by title and which partials it includes. Component imports still live in
// each deck: `@include` splices a partial into a slide body, so it can't
// hoist module-level imports.

// Every group generates from a different book (see the lesson entry for the five
// sets), and the slides walk through one of them: every ROW_* below is a real
// row of The magpie set (data/originals/the-magpie.txt), the whole 133-token
// text dealt across 5 sheets, printed for a room with counters in four
// colours --- `llms_unplugged ledger -i data/originals/the-magpie.txt
// --max-tokens 140 --sheets 5 --palette @cli/ledger-palette-four.json
// --max-followers 4 --prefill tallies`, which is the recipe the Makefile runs
// for every book. Four colours at four columns is a single palette cycle, so
// every row on every sheet takes the same four and no widget here needs to
// know where its row sits on the page. Change the book or the budget and the
// counts below have to be re-read off the new sheets. SHEET_FIVE is that set's
// fifth sheet entire, in the order the deal printed it. The five ROW_THE_* are
// the outdoors texts' rows for "the" (data/originals/outdoors-*.txt), each set
// built with --max-followers 4 for training. The walkthrough follows the
// generation-ledger and one-story-all-together videos (ops/video/v1/scripts/), so
// a change here is a change there too.

export const PALETTE = LEDGER_PALETTE.slice(0, 4);

// Sheet 5 of the magpie set, "the" to "watches": the sheet the walkthrough opens
// on, and "the" --- the one row with all four colours in use and the most
// marks --- is row 0.

export const ROW_THE: LedgerEntry = {
  prefix: "the",
  followers: [
    { text: "magpie", count: 5 },
    { text: "fence", count: 6 },
    { text: "postie", count: 4 },
    { text: "dog", count: 4 },
  ],
};

export const ROW_TO: LedgerEntry = {
  prefix: "to",
  followers: [{ text: "the", count: 3 }],
};

export const ROW_UP: LedgerEntry = {
  prefix: "up",
  followers: [{ text: "it", count: 3 }],
};

export const ROW_WATCHES: LedgerEntry = {
  prefix: "watches",
  followers: [{ text: ".", count: 3 }],
};

export const SHEET_FIVE = [ROW_THE, ROW_TO, ROW_UP, ROW_WATCHES];

// The rest of the generation walkthrough, off the other sheets: "it sits on the
// fence . Here comes the magpie ." --- the book says "Here comes the postie ."
// and "Down comes the magpie .", and never this. ROW_STOP and ROW_THE are each
// drawn from twice, which is the point of the second visits.

export const ROW_STOP: LedgerEntry = {
  prefix: ".",
  followers: [
    { text: "it", count: 7 },
    { text: "Here", count: 4 },
    { text: "Down", count: 3 },
    { text: "Swoop", count: 3 },
  ],
};

export const ROW_IT: LedgerEntry = {
  prefix: "it",
  followers: [
    { text: "sits", count: 3 },
    { text: "watches", count: 3 },
    { text: "goes", count: 3 },
    { text: "is", count: 1 },
  ],
};

export const ROW_SITS: LedgerEntry = {
  prefix: "sits",
  followers: [{ text: "on", count: 3 }],
};

export const ROW_ON: LedgerEntry = {
  prefix: "on",
  followers: [{ text: "the", count: 3 }],
};

export const ROW_FENCE: LedgerEntry = {
  prefix: "fence",
  followers: [{ text: ".", count: 6 }],
};

export const ROW_HERE: LedgerEntry = {
  prefix: "Here",
  followers: [{ text: "comes", count: 4 }],
};

export const ROW_COMES: LedgerEntry = {
  prefix: "comes",
  followers: [{ text: "the", count: 7 }],
};

export const ROW_MAGPIE: LedgerEntry = {
  prefix: "magpie",
  followers: [
    { text: "is", count: 2 },
    { text: ".", count: 3 },
  ],
};

// The nine rows the walkthrough draws from, as one sheet in the deal's order
// (lowercase alphabetical, punctuation first) so every frame of the
// walkthrough shows the same ledger and only the lit row moves. Not a sheet
// any group holds --- the room's copies are spread over the five --- and the
// slide's label says so.

export const STORY_LEDGER = [
  ROW_STOP,
  ROW_COMES,
  ROW_FENCE,
  ROW_HERE,
  ROW_IT,
  ROW_MAGPIE,
  ROW_ON,
  ROW_SITS,
  ROW_THE,
];

export const SHEET_RANGES = [
  ["!", "back"],
  ["comes", "goes"],
  ["Here", "on"],
  ["postie", "Swoop"],
  ["the", "watches"],
];

// The first three sentences of the set's text as the tokeniser read it, for
// the training walkthrough: short enough that its ten rows fit a sheet at a
// readable size beside the text. The pair "the fence" at step 8 is a new
// word in a row that already has one; ". it" comes round again at step 10,
// the slide that shows a mark landing on a box that already has one.

export const MAGPIE_OPENING = "the magpie is back . it sits on the fence . it watches .";

// The five outdoors texts' rows for "the", for the finale: same word, five
// different models.

export const ROW_THE_BEACH: LedgerEntry = {
  prefix: "the",
  followers: [
    { text: "sand", count: 2 },
    { text: "water", count: 2 },
    { text: "dog", count: 3 },
    { text: "sun", count: 1 },
  ],
};

export const ROW_THE_STORM: LedgerEntry = {
  prefix: "the",
  followers: [
    { text: "sky", count: 2 },
    { text: "tin", count: 1 },
    { text: "dog", count: 2 },
    { text: "rain", count: 1 },
  ],
};

export const ROW_THE_KOOKABURRA: LedgerEntry = {
  prefix: "the",
  followers: [
    { text: "kookaburra", count: 3 },
    { text: "gum", count: 1 },
    { text: "cat", count: 2 },
    { text: "street", count: 1 },
  ],
};

export const ROW_THE_CREEK: LedgerEntry = {
  prefix: "the",
  followers: [
    { text: "creek", count: 2 },
    { text: "rocks", count: 2 },
    { text: "mud", count: 2 },
    { text: "yabby", count: 2 },
  ],
};

export const ROW_THE_BUSH: LedgerEntry = {
  prefix: "the",
  followers: [
    { text: "track", count: 3 },
    { text: "hill", count: 1 },
    { text: "sun", count: 1 },
    { text: "water", count: 1 },
  ],
};
