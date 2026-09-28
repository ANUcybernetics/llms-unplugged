# Pre-trained generation: grid

**Key idea (draft):** you can generate from a model someone else trained on a
much bigger text; a booklet is a grid stored another way, with only the boxes
that aren't empty.

**Plays:** My First Language Model, start of the Pre-trained generation section.

**Builds on:** `partials/grid-pretrained-generation.mdx` from "Pre-trained
generation" through "Pre-trained: from `;`"; the ending hands off to "Your
turn". The fold uses _The magpie_'s booklet as the CLI builds it (the entry for
_dog_ is full stop 4, runs 9 on one die; for _the_, fence 31, magpie 57, dog 78,
postie 99 on two). The booklet the room holds is the Paterson one
(`data/the-man-from-snowy-river.txt`: 3,967 words, so about 16 million boxes as
a grid, 16,231 of them not empty), and the walk is the deck's: _sleep again I'd
float ;_, rolls 7, 80, 6.

## Beat sheet

1. hook: most people who use Claude or ChatGPT never trained it. Somebody else
   did the counting. So does this booklet
2. **beyond:** the magpie grid folds into a magpie booklet: each row peels off
   into an entry, the empty boxes fall away
3. **beyond:** the entry for _dog_ is the die bands from generation, written as
   the last face of each band. Roll, take the first number your roll doesn't go
   past: the same rule
4. more than ten faces' worth: the entry for _the_ runs to 99, so roll two dice
   and read them as one number. Same rule
5. now someone else's booklet: Paterson, a much bigger book. The deck's walk:
   _sleep_, _again_ (two dice, 80), _I'd_, _float_ (one option), _;_
6. **beyond:** why a booklet and not a grid. As a grid this book would be
   sixteen million boxes, and only sixteen thousand have anything in them
7. listen: more like real prose than your grid, and still not about anything;
   guess the book before you check the cover
8. open weights: every number is readable, and it runs at the kitchen table
9. ending: grab it and roll; make your own at llmsunplugged.org/tools

## Script

**USHINI (TC):** Most people who use Claude or ChatGPT never trained it.
Somebody else did the counting, and they just type and it writes. That's what
this booklet is: a model somebody else already trained.

_Visual: a booklet on the desk, top-down, its cover title hidden under a flat
card. It opens to a page rendered from the CLI: bold headwords, the words that
can follow each, a number beside each._

_Reads (draft):_ 1. someone else did the counting for this model; 2. the booklet
is full of words and numbers.

**BEN (VO):** It looks new, but it isn't. Here's the grid from _The magpie_.
Fold it into a booklet, and every row becomes an entry. The empty boxes just
fall away.

_Visual: the finished magpie grid (tallies, as at the end of `training-grid`).
Each row peels off in turn and slides into a column of entries, its headword
bold; its empty boxes drop out as it goes, so only the tallied boxes arrive. The
column closes up into two pages of a small magpie booklet._

_Beyond:_ the slides introduce the booklet as a new object with new rules; the
fold shows it's the model the viewer already knows, stored another way, so the
threshold rule is the die-face rule in disguise.

_Reads (draft):_ 1. each row becomes an entry; 2. the empty boxes are gone; 3.
nothing else is lost.

**USHINI (VO):** Take the entry for "dog". On the grid you'd share the die's
faces: nought to four for a full stop, five to nine for "runs". The booklet just
writes where each band ends. Four. Nine.

_Visual: push in on the row for "dog" before it folds: its two tallied boxes,
and under them the die strip from `generation-grid`, full stop 0--4, runs 5--9.
The strip slides into the entry and shrinks to its band ends: full stop 4,
runs 9._

_Reads (draft):_ 1. the die bands are the same as before; 2. the booklet keeps
only the last face of each band.

**BEN (VO):** So roll, and take the first word your roll doesn't go past. Roll a
three: that's not past four, so it's a full stop.

_Visual: a face lands on 3 beside the entry; the numbers light from the top, 4
lights and stops, and the full stop tile writes onto a strip of paper._

_Reads (draft):_ 1. read down the numbers; 2. the first one your roll doesn't go
past names the word.

**USHINI (VO):** The entry for "the" runs all the way to ninety-nine. That means
two dice, read as one number. A seven and a two is seventy-two: past
fifty-seven, not past seventy-eight. "Dog".

_Visual: the entry for "the": fence 31, magpie 57, dog 78, postie 99. Two faces
land, a 7 and a 2, slide together and read 72; the numbers light down to 78 and
"dog" writes on._

_Reads (draft):_ 1. numbers past nine mean two dice; 2. the two dice read as one
number; 3. the rule is the same.

_Reads note:_ this is where nineteen tallies stop needing rounding: a hundred
faces share them almost exactly, which quietly answers the rounding in
`generation-grid`; say so in a line only if the grid video keeps its rounding.

**BEN (VO):** Now the booklet on your table. It came from a much bigger book.
Start from "sleep": one die. Roll a seven: "again".

_Visual: the magpie booklet slides off; the covered Paterson booklet opens on
"sleep" (comma 2, full stop 6, again 7, as 8, with 9). A face lands on 7; the
numbers light down to 7 and "again" writes onto the strip._

_Reads (draft):_ 1. this is the booklet the viewer holds; 2. same rule, one die.

**USHINI (VO):** "Again" runs to ninety-nine, so two dice. An eight and a
nought: eighty. That's past seventy-six, not past eighty-four: "I'd". Roll a
six: "float". And "float" has only one word after it, so no roll at all.

_Visual: the entry for "again" (full stop 45, comma 61, and 68, as 76, I'd 84,
made 91, over 99): two faces land, 8 and 0, read 80; the numbers light down to
84 and "I'd" writes on. The entry for "I'd" (like 4, float 7, take 9): a face
lands on 6, "float". The entry for "float" has a single word, a semicolon, which
writes straight on._

_Reads (draft):_ 1. two dice, read as one number; 2. a single option needs no
roll.

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

_Reads (draft):_ 1. as a grid, this model is enormous; 2. almost every box is
empty; 3. the booklet keeps only the ones that aren't.

**USHINI:** As you go, listen to what comes out. It'll sound more like real
prose than your grid did. And it still won't be about anything. Try to guess the
book before you check the cover.

_Visual: the strip: the booklet's line so far. A few of its words light in turn,
the tells; the card over the cover lifts a crack and settles back._

_Reads (draft):_ 1. the booklet's text sounds more like real prose; 2. but it
still isn't about anything; 3. the words give the book away.

**BEN:** And one thing the booklet gets exactly right: you can read every number
in this model, and run it at the kitchen table. Nobody can switch it off or
quietly change it under you. That's what "open weights" means.

_Visual: the booklet open on a kitchen table, flat top-down, a mug beside it;
the numbers on the page light one after another down the column._

_Reads (draft):_ 1. every number in this model can be read; 2. you can run it
yourself, and nobody can change it; 3. that's what open weights means.

**USHINI (TC):** Grab your booklet and start rolling. And if you'd like to make
your own from any text, the tool's at llmsunplugged.org/tools.
