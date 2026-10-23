# Training: grid

**Key idea:** our bigram model learns by counting pairs of words; large language
models learn their prediction weights differently.

**Plays:** My First Language Model, start of the Training section.

**Builds on:** `partials/grid-training.mdx` from "Training" through "Complete
model"; the ending carries "A few more tips" and hands off to "Your turn". The
book is _The magpie_ rather than the slides' _hop joey hop_, so in the deck the
video replaces the whole walkthrough rather than sitting beside it. The grid
adds words to both edges in the order the book first uses them, as a
participant's grid does.

## Beat sheet

1. hook: train a small language model with a pencil and a short book
2. the text: capitals and lowercase count as the same word; punctuation counts
   too
3. two words at a time: the first word's row, the second word's column, a tally
   where they cross; slide along one
4. the same pair comes round again: _the magpie_ six times, _the fence_ four.
   Common pairs collect tallies
5. **beyond:** the rest of the book at machine speed; the whole 23-word grid
   fills in about two seconds. Same action, just faster
6. put the book away; the counts are enough to generate with this model
7. the tallies are numbers; neural model weights are learned differently
8. **beyond:** a bigger book at the same speed: _Frankenstein_, seven thousand
   rows. Contrast counting pairs with learning to predict from examples
9. ending: the tips, then go

## Script

**USHINI (TC):** We can train a language model with a pencil and a book. Our
book is short enough to read in thirty seconds.

_Visual: the desk, top-down, empty except for a picture book. Its cover reads
The magpie. It opens and its first line lifts off the page as a row of word
tiles: "It is spring. It sits on the fence."_

_Reads:_ 1. this book is what the model will learn from; 2. its text is now a
row of words.

**BEN (VO):** Treat capitals and lowercase as the same word, even on printed
sheets. "It" and "it" go in the same row. [beat] Full stops and exclamation
marks count as words too.

_Visual: the capitalised and lowercase forms of "it" meet above one row labelled
"it"; keep the printed page unchanged. Then the full stops split off into tiles
of their own, drawn as the kit's filled symbol tiles._

_Reads:_ 1. capitals and lowercase use the same row, including printed words; 2.
full stops have their own tiles.

**USHINI (VO):** Now read the book two words at a time. Add each new word you
encounter to the column and row headers of the grid. [beat] Locate the first
word within the rows. [beat] Then locate the second word within the columns.
[beat] Put a tally where they cross. [beat] Then slide along by one word, [beat]
and do it again.

_Visual: a gold bracket over "it is". Beside the tiles a blank grid sheet: "it"
writes onto the first row header and the first column header at once, then "is"
onto both edges; a tally stroke draws where the row for "it" meets the column
for "is". The bracket slides one tile to "is spring": "spring" joins both edges,
a tally at is--spring. Then "spring ."_

_Reads:_ 1. the first word of the pair picks the row; 2. the second word picks
the column; 3. the tally goes where they cross; 4. slide along one, and each
word starts the next pair.

**BEN (VO):** Keep going, and the same pairs come round again. By the end of the
book, "the magpie" has six tallies. "The fence" has four.

_Visual: the bracket skips ahead; each time it lands on "the magpie" or "the
fence" the row for "the" lights and a stroke draws on. The row ends: fence 4,
postie 4, magpie 6, dog 4._

_Reads:_ 1. a repeated pair marks the same box again; 2. common pairs collect
tallies.

**USHINI (VO):** The process of training our language model involves counting
how frequently one word follows another in the book. Here's the rest of the
book, counted by a computer.

_Visual: the bracket accelerates until it's a blur along the tiles; pairs fly
into the grid faster than the eye can follow, rows and columns appearing as new
words turn up, until the whole book is counted: 23 rows by 23 columns, most
boxes empty, a few thick with tallies. About two seconds of motion, then hold._

_Beyond:_ the slides count five pairs and then show the finished grid, so the
jump from "one pair" to "the whole model" happens off screen. Running every pair
of a real book shows there's no other step in between.

_Reads:_ 1. the whole book is counted the same way; 2. a computer can run this
counting algorithm faster; 3. most boxes stay empty.

**BEN:** We can put the book away now. [beat] The grid has counts for each pair
of words, and that's what we'll use to write.

_Visual: the book closes and slides off the desk. The finished grid alone, full
frame._

_Reads:_ 1. the book is gone; 2. only the counts are left.

**USHINI (VO):** The tallies in our grid are just numbers. The row for "the" has
boxes containing four, four, six, and four. Most of the boxes in our grid are
zero.

_Visual: push in on the row for "the"; its tallies count themselves off and
collapse into numerals, 4, 4, 6, 4. Pull back as the change ripples across the
grid, every box becoming its count, the empty ones a faint 0._

_Reads:_ 1. each box's tallies are a count; 2. the whole grid is a table of
numbers; 3. most of them are zero.

**BEN (VO):** When people talk about a model's "weights", they mean numbers like
these, set by the text it read. An LLM's weights aren't tallies of pairs, but
they do the same job: predicting what comes next.

_Visual: hold on the table of numbers. The nonzero numbers lift very slightly
brighter than the zeros._

_Reads:_ 1. these numbers are counts; 2. neural model weights are learned by
adjusting predictions, as the narration explains.

**USHINI (VO):** We can count a bigger book the same way. This is
_Frankenstein_. Eighty-five thousand words, and seven thousand rows.

_Visual: the table shrinks to a corner of a much bigger one, filling at the same
machine speed from the real Frankenstein counts; a logarithmic pull-back until
the grid is a fine texture with scattered bright points._

_Beyond:_ the TASK-154 training video pulls back from the sheet to a patterned
grid; this one is filled from a real book's real pairs, so the scale is a fact
the viewer sees rather than a gesture.

_Reads:_ 1. a bigger book makes a bigger table the same way; 2. real books make
tables far too big to read.

**BEN:** A large language model reads trillions of words, and it doesn't keep a
box for every pair. But it's training for the same job: guessing what comes
next. Yours fits on a desk.

**USHINI (VO):** A few tips. Start on any page you like. A full stop is followed
by whatever comes next, even if it's over the page. Skip the speech marks. And a
new word always gets a new row and a new column.

_Visual: a blank grid sheet on the desk beside a page of text. A pair that
straddles the page turn is bracketed across the fold, and its tally goes in.
Quote marks on the page fade out. A new word writes onto both edges at once._

_Reads:_ 1. start anywhere; 2. pairs run across sentences and pages; 3. speech
marks don't count; 4. a new word gets a row and a column.

**BEN (TC):** It works best in pairs: one reads, one tallies, swap halfway.
Start counting.
