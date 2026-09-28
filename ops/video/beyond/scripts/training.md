# Training

**Key idea (draft):** a language model learns by counting which word follows
which, and the counts are all it keeps.

**Plays:** start of any Training section. Grid ending: My First Language Model.
Ledger ending: How AI writes stories (ledger), after generation.

**Builds on:** `partials/grid-training.mdx` from "Training" through "Complete
model" (the ending carries "A few more tips"), and
`partials/ledger-training.mdx` from "Where did the marks come from?" through
"Things that catch people out". The book is _The magpie_; the slides' _hop joey
hop_ grid isn't used, so in a grid deck the video replaces the whole walkthrough
rather than sitting beside it.

## Beat sheet

1. hook: Claude or ChatGPT learned from reading. What did it actually keep? Find
   out with a book short enough to read in thirty seconds
2. the text: lowercase everything; punctuation marks are words too
3. two words at a time: the first word names the row, the second gets a mark
4. the same pair comes round again: _the magpie_ five times, _the fence_ six.
   Common pairs collect marks
5. **beyond:** the rest of the book at machine speed; the whole 24-word grid
   fills in about two seconds. Same action, just faster
6. what didn't get kept: no sentences, no story, no magpie. Just what came next
7. **beyond:** the row for _the_ morphs through every body it can take: tallies,
   ledger marks, counters, cutout slips, then four numbers. Same numbers every
   time; numbers like these are what "model weights" means
8. **beyond:** a bigger book at the same speed: _Frankenstein_, seven thousand
   rows. A real model reads trillions of words, but it's the same job
9. ending (per format): how to count on your grid or your sheets, then go

## Script

**USHINI (TC):** Claude or ChatGPT learned everything they know by reading. But
what did they actually keep? Let's find out, with a book short enough to read in
thirty seconds.

_Visual: the desk, top-down, empty except for a picture book. Its cover reads
The magpie. It opens and its first line lifts off the page as a row of word
tiles: "The magpie is back. It sits on the fence."_

_Reads (draft):_ 1. this book is what the model will learn from; 2. its text is
now a row of words.

**BEN (VO):** First, lowercase everything. And the full stops and exclamation
marks count as words too.

_Visual: the capitals drop to lowercase one tile at a time; the full stops split
off into tiles of their own._

_Reads (draft):_ 1. everything is lowercase; 2. full stops are words, with their
own tiles.

**USHINI (VO):** Now read it two words at a time. The first word names a row.
The second word gets a mark in that row. Then slide along by one, and do it
again.

_Visual: a gold bracket over "the magpie". Beside the tiles a blank sheet gains
a row headed "the" and, in it, "magpie" with one tally stroke. The bracket
slides one tile to "magpie is": a row for "magpie", a mark beside "is". Then "is
back"._

_Reads (draft):_ 1. the first word of the pair picks the row; 2. the second word
gets the mark; 3. slide along one, and each word starts the next pair.

**BEN (VO):** Keep going, and the same pairs come round again. By the end of the
book, "the magpie" has five marks. "The fence" has six.

_Visual: the bracket skips ahead; each time it lands on "the magpie" or "the
fence" the row for "the" lights and a stroke draws on. The row ends: fence 6,
magpie 5, postie 4, dog 4._

_Reads (draft):_ 1. a repeated pair marks the same place again; 2. common pairs
collect marks.

**USHINI (VO):** That's all training is. Here's the rest of the book, done at
the speed a computer does it.

_Visual: the bracket accelerates until it's a blur along the tiles; pairs fly
into the sheet faster than the eye can follow, rows appearing as new words turn
up, until the whole book is counted: 24 rows, most boxes empty, a few thick with
marks. About two seconds of motion, then hold._

_Beyond:_ the slides count five pairs and then show the finished grid, so the
jump from "one pair" to "the whole model" happens off screen. Running every pair
of a real book shows there's no other step in between.

_Reads (draft):_ 1. the whole book is counted the same way; 2. a computer does
nothing different, only faster; 3. most boxes stay empty.

**BEN:** Now look at what it kept. Not the sentences. Not the story. It doesn't
know what a magpie is. Just counts of what came next.

_Visual: the book closes and slides off the desk. The finished sheet alone, full
frame._

_Reads (draft):_ 1. the book is gone; 2. only the counts are left.

**USHINI (VO):** And those counts can take any shape you like. Tally marks.
Marks on a ledger. Counters in a cup. Slips of paper. Or just four numbers.

_Visual: the row for "the" lifts out of the sheet and morphs through each form
as it is named, the four followers holding their places left to right: tally
strokes; ledger boxes with marks; counters (six, five, four, four) in the four
ledger colours; cutout slips, one per pair, stacked in four piles; and last,
four numbers: 0.32, 0.26, 0.21, 0.21._

_Beyond:_ each deck shows one form, so a room using the grid never sees that the
ledger, the cup and the cutouts hold the same thing. One continuous morph makes
them visibly one object, which is what lets the other videos swap forms freely.

_Reads (draft):_ 1. every form holds the same four counts; 2. the form doesn't
matter; 3. in the end it's just numbers.

_Reads note:_ five forms in one line is a lot; if the morph can't hold a beat on
each, drop the slips here and pick them up in `generation`. The die isn't here
because the row for "the" totals 19, which the grid's rule shares over two dice;
`generation` shows the die on the row for "it", which totals exactly ten.

**BEN (VO):** When people talk about a model's "weights", this is the kind of
thing they mean: numbers that came from the text it read.

_Visual: the four numbers settle into one row of a grid of numbers the size of
the whole sheet, every cell a decimal, most of them 0._

_Reads (draft):_ 1. the whole sheet is a table of numbers; 2. that's what model
weights are.

**USHINI (VO):** Give it a bigger book and nothing changes. This is
_Frankenstein_. Eighty-five thousand words, and seven thousand rows.

_Visual: the table shrinks to a corner of a much bigger one, filling at the same
machine speed from the real Frankenstein counts; a logarithmic pull-back until
the grid is a fine texture with scattered bright points._

_Beyond:_ the TASK-154 training video pulls back from the sheet to a patterned
grid; this one is filled from a real book's real pairs, so the scale is a fact
the viewer sees rather than a gesture.

_Reads (draft):_ 1. a bigger book makes a bigger table the same way; 2. real
books make tables far too big to read.

**BEN:** A real model reads trillions of words, and stores its numbers more
cleverly than a grid. But the job it's doing is the one you're about to do.

### Ending: grid

**USHINI (VO):** On your grid, words go down the side and along the top. Tally
where the first word's row meets the second word's column. A new word gets a new
row and a new column. And turning the page doesn't break a pair.

_Visual: a blank grid sheet on the desk. "the" writes as a row header, "magpie"
as a column header, and a stroke draws on where they cross. A new word writes
onto both edges at once._

_Reads (draft):_ 1. row for the first word, column for the second; 2. a new word
gets a row and a column.

**BEN (TC):** It works best in pairs: one reads, one tallies, swap halfway.
Start counting.

### Ending: ledger

**USHINI (VO):** On blank sheets you write the words as well as the marks. Say a
new word out loud when you start its row, so nobody starts it twice. Fill the
boxes in order, never skip one.

_Visual: a blank ledger sheet. A word writes into the first empty row, its first
follower into the red box with a mark beside it; the next empty box lights._

_Reads (draft):_ 1. a new word starts the next empty row; 2. say it aloud; 3.
boxes fill in order.

**BEN (TC):** Reader, grab the text. Two words at a time.
