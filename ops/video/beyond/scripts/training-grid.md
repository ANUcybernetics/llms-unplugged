# Training: grid

**Key idea:** a language model learns by counting which word follows which, and
the counts are all it keeps.

**Plays:** My First Language Model, start of the Training section.

**Builds on:** `partials/grid-training.mdx` from "Training" through "Complete
model"; the ending carries "A few more tips" and hands off to "Your turn". The
book is _The magpie_ rather than the slides' _hop joey hop_, so in the deck the
video replaces the whole walkthrough rather than sitting beside it. The grid
adds words to both edges in the order the book first uses them, as a
participant's grid does.

## Beat sheet

1. hook: Claude or ChatGPT learned from reading. What did it actually keep? Find
   out with a book short enough to read in thirty seconds
2. the text: lowercase everything; punctuation marks are words too
3. two words at a time: the first word's row, the second word's column, a tally
   where they cross; slide along one
4. the same pair comes round again: _the magpie_ five times, _the fence_ six.
   Common pairs collect tallies
5. **beyond:** the rest of the book at machine speed; the whole 24-word grid
   fills in about two seconds. Same action, just faster
6. what didn't get kept: no sentences, no story, no magpie. Just what came next
7. the tallies are numbers, and numbers like these are what "model weights"
   means
8. **beyond:** a bigger book at the same speed: _Frankenstein_, seven thousand
   rows. A real model reads trillions of words, but it's the same job
9. ending: the tips, then go

## Script

**USHINI (TC):** Claude or ChatGPT learned everything they know by reading. But
what did they actually keep? Let's find out, with a book short enough to read in
thirty seconds.

_Visual: the desk, top-down, empty except for a picture book. Its cover reads
The magpie. It opens and its first line lifts off the page as a row of word
tiles: "The magpie is back. It sits on the fence."_

_Reads:_ 1. this book is what the model will learn from; 2. its text is now a
row of words.

**BEN (VO):** First, lowercase everything. And the full stops and exclamation
marks count as words too.

_Visual: the capitals drop to lowercase one tile at a time; the full stops split
off into tiles of their own, drawn as the kit's filled symbol tiles._

_Reads:_ 1. everything is lowercase; 2. full stops are words, with their own
tiles.

**USHINI (VO):** Now read it two words at a time. The first word gets a row. The
second gets a column. Put a tally where they cross. Then slide along by one, and
do it again.

_Visual: a gold bracket over "the magpie". Beside the tiles a blank grid sheet:
"the" writes onto the first row header and the first column header at once, then
"magpie" onto both edges; a tally stroke draws where the row for "the" meets the
column for "magpie". The bracket slides one tile to "magpie is": "is" joins both
edges, a tally at magpie--is. Then "is back"._

_Reads:_ 1. the first word of the pair picks the row; 2. the second word picks
the column; 3. the tally goes where they cross; 4. slide along one, and each
word starts the next pair.

_Reads note:_ a new word joining both edges at once is a fourth thing on top of
row, column and tally; the first pair carries it, and the ending says it again.

**BEN (VO):** Keep going, and the same pairs come round again. By the end of the
book, "the magpie" has five tallies. "The fence" has six.

_Visual: the bracket skips ahead; each time it lands on "the magpie" or "the
fence" the row for "the" lights and a stroke draws on. The row ends: magpie 5,
fence 6, postie 4, dog 4._

_Reads:_ 1. a repeated pair marks the same box again; 2. common pairs collect
tallies.

**USHINI (VO):** That's all training is. Here's the rest of the book, done at
the speed a computer does it.

_Visual: the bracket accelerates until it's a blur along the tiles; pairs fly
into the grid faster than the eye can follow, rows and columns appearing as new
words turn up, until the whole book is counted: 24 rows by 24 columns, most
boxes empty, a few thick with tallies. About two seconds of motion, then hold._

_Beyond:_ the slides count five pairs and then show the finished grid, so the
jump from "one pair" to "the whole model" happens off screen. Running every pair
of a real book shows there's no other step in between.

_Reads:_ 1. the whole book is counted the same way; 2. a computer does nothing
different, only faster; 3. most boxes stay empty.

**BEN:** Now look at what it kept. Not the sentences. Not the story. It doesn't
know what a magpie is. Just counts of what came next.

_Visual: the book closes and slides off the desk. The finished grid alone, full
frame._

_Reads:_ 1. the book is gone; 2. only the counts are left.

**USHINI (VO):** And a tally is just a number. The row for "the" says five, six,
four, four. Every box on the grid is a number, and most of them are zero.

_Visual: push in on the row for "the"; its tallies count themselves off and
collapse into numerals, 5, 6, 4, 4. Pull back as the change ripples across the
grid, every box becoming its count, the empty ones a faint 0._

_Reads:_ 1. each box's tallies are a count; 2. the whole grid is a table of
numbers; 3. most of them are zero.

**BEN (VO):** When people talk about a model's "weights", this is the kind of
thing they mean: numbers that came from the text it read.

_Visual: hold on the table of numbers. The nonzero numbers lift very slightly
brighter than the zeros._

_Reads:_ 1. that's what model weights are.

**USHINI (VO):** Give it a bigger book and nothing changes. This is
_Frankenstein_. Eighty-five thousand words, and seven thousand rows.

_Visual: the table shrinks to a corner of a much bigger one, filling at the same
machine speed from the real Frankenstein counts; a logarithmic pull-back until
the grid is a fine texture with scattered bright points._

_Beyond:_ the TASK-154 training video pulls back from the sheet to a patterned
grid; this one is filled from a real book's real pairs, so the scale is a fact
the viewer sees rather than a gesture.

_Reads:_ 1. a bigger book makes a bigger table the same way; 2. real books make
tables far too big to read.

**BEN:** A real model reads trillions of words, and stores its numbers more
cleverly than a grid. But the job it's doing is the one you're about to do.

**USHINI (VO):** A few tips. Start on any page you like. A full stop is followed
by whatever comes next, even over the page. Skip the speech marks. And a new
word always gets a new row and a new column.

_Visual: a blank grid sheet on the desk beside a page of text. A pair that
straddles the page turn is bracketed across the fold, and its tally goes in.
Quote marks on the page fade out. A new word writes onto both edges at once._

_Reads:_ 1. start anywhere; 2. pairs run across sentences and pages; 3. speech
marks don't count; 4. a new word gets a row and a column.

**BEN (TC):** It works best in pairs: one reads, one tallies, swap halfway.
Start counting.
