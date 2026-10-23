# Pre-trained generation: grid

**Key idea:** you can generate from a model someone else trained on a much
bigger text; a booklet is a grid stored another way, with only the boxes that
aren't empty.

**Plays:** My First Language Model, start of the Pre-trained generation section.

**Builds on:** `partials/grid-pretrained-generation.mdx` from "Pre-trained
generation" through "Pre-trained: from `;`"; the ending hands off to "Your
turn". The fold uses _The magpie_'s booklet as the CLI builds it (the entry for
_dog_ is full stop 7, and 9 on one die; for _the_, magpie 32, dog 55, fence 77,
postie 99 on two). The booklet the room holds is the Paterson one
(`data/the-man-from-snowy-river.txt`: 3,967 words, so about 16 million boxes as
a grid, 16,231 of them not empty), and the walk is the deck's: _sleep again I'd
float ;_, rolls 7, 80, 6.

## Beat sheet

1. hook: you can use a model someone else trained; this booklet is our counting
   model's version of that
2. **beyond:** the magpie grid folds into a magpie booklet: each row peels off
   into an entry, the empty boxes fall away
3. **beyond:** the entry for _dog_ is the die bands from generation, written as
   the last face of each band. Roll, take the first number your roll doesn't go
   past: the same rule
4. more than ten faces' worth: the entry for _the_ runs to 99, so roll twice and
   read the results as one number
5. now someone else's booklet: Paterson, a much bigger book. The deck's walk:
   _sleep_, _again_ (two dice, 80), _I'd_, _float_ (one option), _;_
6. **beyond:** why a booklet and not a grid. As a grid this book would be
   sixteen million boxes, and only sixteen thousand have anything in them
7. listen: a larger vocabulary, still one word of context; guess the book before
   you check the cover
8. open weights: available learned parameters; using them requires the software
   and hardware to run the model
9. ending: grab it and roll; make your own at llmsunplugged.org/tools

## Script

**USHINI (TC):** Most people who use Claude or ChatGPT have never trained it
themselves. This booklet represents a model someone else trained and it can be
used to generate new text.

_Visual: a booklet on the desk, top-down, its cover title hidden under a flat
card. It opens to a page rendered from the CLI: bold headwords, the words that
can follow each, a number beside each._

_Reads:_ 1. someone else did the counting for this model; 2. the booklet is full
of words and numbers.

**BEN (VO):** Here's the grid from _The magpie_. Fold it into a booklet, and
every row becomes an entry. The empty boxes just fall away.

_Visual: the finished magpie grid (tallies, as at the end of `training-grid`).
Each row peels off in turn and slides into a column of entries, its headword
bold; its empty boxes drop out as it goes, so only the tallied boxes arrive. The
column closes up into two pages of a small magpie booklet._

_Beyond:_ the slides introduce the booklet as a new object with new rules; the
fold shows it's the model the viewer already knows, stored another way, so the
threshold rule is the die-face rule in disguise.

_Reads:_ 1. each row becomes an entry; 2. the empty boxes are gone; 3. nothing
else is lost.

**USHINI (VO):** Take the entry for "dog". When using the grid, we would
associate the next possible word with a band of faces on our dice: nought to
seven for a full stop, eight and nine for "and". [beat] The booklet just
represents these associations with the last number in each band. [beat] Seven.
Nine.

_Visual: push in on the row for "dog" before it folds: its two tallied boxes,
and under them the die strip from `generation-grid`, full stop 0--7, and 8--9.
The strip slides into the entry and shrinks to its band ends: full stop 7,
and 9._

_Reads:_ 1. the die bands are the same as before; 2. the booklet keeps only the
last face of each band.

**BEN (VO):** So roll, and take the first word your roll doesn't go past. Roll a
three: that's not past seven, so it's a full stop.

_Visual: a face lands on 3 beside the entry; the numbers light from the top, 7
lights and stops, and the full stop tile writes onto a strip of paper._

_Reads:_ 1. read down the numbers; 2. the first one your roll doesn't go past
names the word.

**USHINI (VO):** The entry for "the" runs all the way to ninety-nine. [beat]
That means we need two dice-rolls, read as one number. [beat] Roll four, then
five. Forty-five: [beat] that's greater than thirty-two, but less than
fifty-five. "Dog".

_Visual: the entry for "the": magpie 32, dog 55, fence 77, postie 99. The faces
land one at a time, 4 then 5, slide together and read 45; the numbers light down
to 55 and "dog" writes on._

_Reads:_ 1. numbers past nine mean two rolls; 2. the two results read as one
number; 3. the rule is the same.

_Reads note:_ this is where eighteen tallies stop needing rounding: a hundred
faces share them almost exactly, which quietly answers the rounding in
`generation-grid`; say so in a line only if the grid video keeps its rounding.

**BEN (VO):** Now the booklet on your table. It came from a much bigger book.
Start from "sleep": one die. [beat] Roll a seven: "again".

_Visual: the magpie booklet slides off; the covered Paterson booklet opens on
"sleep" (comma 2, full stop 6, again 7, as 8, with 9). A face lands on 7; the
numbers light down to 7 and "again" writes onto the strip._

_Reads:_ 1. this is the booklet the viewer holds; 2. same rule, one die.

**USHINI (VO):** "Again" runs to ninety-nine, so we need two dice-rolls. [beat]
Eight, then zero: eighty. [beat] That's greater than seventy-six, and less than
eighty-four: "I'd". [beat] Roll a six: "float". [beat] And "float" has only one
word after it, so we don't need to roll.

_Visual: the entry for "again" (full stop 45, comma 61, and 68, as 76, I'd 84,
made 91, over 99): two faces land, 8 and 0, read 80; the numbers light down to
84 and "I'd" writes on. The entry for "I'd" (like 4, float 7, take 9): a face
lands on 6, "float". The entry for "float" has a single word, a semicolon, which
writes straight on._

_Reads:_ 1. two rolls, read as one number; 2. a single option needs no roll.

**BEN:** Why a booklet, and not a grid? This book uses about four thousand
different words. As a grid, that's sixteen million boxes. Only sixteen thousand
of them have anything in them.

_Visual: the magpie grid, small, in the corner. A grid for the Paterson book
pulls back from it logarithmically, rows and columns multiplying until it's a
fine texture, and the few non-empty boxes glow as specks (one box in a
thousand). Then the empty boxes fall away, as in the fold, and the specks gather
into a booklet you could hold._

_Beyond:_ "it would be too big" is an assertion on a slide; watching this book's
grid pull back to sixteen million boxes, almost all blank, and collapse into a
booklet makes the storage choice obvious. It also pays off in `real-models`.

_Reads:_ 1. as a grid, this model is enormous; 2. almost every box is empty; 3.
the booklet keeps only the ones that aren't.

**USHINI:** As you go, listen to what comes out. This model has a lot more words
to choose from, but each choice still depends only on the last word. Try to
guess the book before you check the cover.

_Visual: the strip: the booklet's line so far. A few of its words light in turn,
the tells; the card over the cover lifts a crack and settles back._

_Reads:_ 1. the booklet has a larger vocabulary; 2. it still uses one word of
context; 3. its vocabulary gives clues to the source book.

**BEN:** You can read every number in this model and run it at the kitchen
table. "Open weights" means the same thing for a real model: its numbers are
published, so with the right computer you can download your own copy and run it.
Nobody can quietly change your copy.

_Visual: the booklet open on a kitchen table, flat top-down, a mug beside it;
the numbers on the page light one after another down the column._

_Reads:_ 1. this booklet exposes its numbers and runs by hand; 2. open weights
make learned parameters available; 3. running a downloaded model also needs
software and suitable hardware.

**USHINI (TC):** Grab your booklet and start rolling. And if you'd like to make
your own booklet from any text you like, you can find the tool's to do that at
llmsunplugged.org/tools.
