# Training: ledger

**Key idea:** a language model learns by counting which word follows
which, and the counts are all it keeps.

**Plays:** How AI writes stories (ledger), start of the "Where did the marks
come from?" section. The lesson usually generates from finished sheets first, so
the hook leans on sheets the room has already used, but nothing depends on it:
it also plays where a room trains first.

**Builds on:** `partials/ledger-training.mdx` from "Where did the marks come
from?" through "Things that catch people out"; the ending hands off to "Your
turn". The book is _The magpie_, the ledger lesson's own walkthrough book, and
the sheet is its real ledger (rows in the order the book first uses each word,
boxes red, blue, green, yellow in the order each row meets its followers).

## Beat sheet

1. hook: every mark on a ledger sheet was made by somebody reading. Find out
   what they kept, with a book short enough to read in thirty seconds
2. the text: lowercase everything; punctuation marks are words too
3. two words at a time: find the first word's row, the second word goes in its
   box, add a mark; slide along one
4. a new word after the same word takes the next empty box; the same pair comes
   round again and collects marks (_the fence_ six, _the magpie_ five)
5. **beyond:** the rest of the book at machine speed; all five sheets fill in
   about two seconds. Same action, just faster
6. what didn't get kept: no sentences, no story, no magpie. Just what came next
7. the marks are numbers, and numbers like these are what "model weights" means
8. **beyond:** a bigger book at the same speed: _Frankenstein_, seven thousand
   rows. A real model reads trillions of words, but it's the same job
9. ending: the three things that catch people out, then go

## Script

**USHINI (TC):** Every mark on these sheets was made by somebody reading. So
what did they keep? Let's find out, with a book short enough to read in thirty
seconds.

_Visual: the desk, top-down: a fan of finished ledger sheets, and beside them a
picture book whose cover reads The magpie. The sheets slide aside; the book
opens and its first line lifts off the page as a row of word tiles: "The magpie
is back. It sits on the fence."_

_Reads:_ 1. the sheets' marks came from a book; 2. this book is what
we'll count; 3. its text is now a row of words.

**BEN (VO):** First, lowercase everything. And the full stops and exclamation
marks count as words too.

_Visual: the capitals drop to lowercase one tile at a time; the full stops split
off into tiles of their own, drawn as the kit's filled symbol tiles._

_Reads:_ 1. everything is lowercase; 2. full stops are words, with their
own tiles.

_Reads note:_ the printed magpie ledger keeps "Here", "Down" and "Swoop"
capitalised (the book only ever writes them that way); either the tiles keep
those three capitals so the sheet on screen matches the printed one, or the line
needs a qualifier.

**USHINI (VO):** Now read it two words at a time. Find the row for the first
word. The second word goes in a box on that row, with a mark beside it. Then
slide along by one, and do it again.

_Visual: a gold bracket over "the magpie". Beside the tiles a blank ledger
sheet: "the" writes into the first empty row, "magpie" into its red box, and a
mark draws beside it. The bracket slides one tile to "magpie is": "magpie"
starts the next row, "is" into its red box, a mark. Then "is back"._

_Reads:_ 1. the first word of the pair finds its row; 2. the second word
goes in a box on that row; 3. a mark beside it; 4. slide along one, and each
word starts the next pair.

**BEN (VO):** A new word after the same word takes the next empty box. And when
a pair comes round again, it gets another mark. By the end, "the fence" has six
marks, and "the magpie" five.

_Visual: the bracket skips to the second "the": the row for "the" lights, and
"fence" writes into the blue box beside the red "magpie". Then the bracket skips
ahead, and each time it lands on "the magpie" or "the fence" a mark draws on in
that box. The row ends: magpie 5, fence 6, postie 4, dog 4, red to yellow._

_Reads:_ 1. a new follower takes the next empty box; 2. a repeated pair
marks the same box again; 3. common pairs collect marks.

**USHINI (VO):** That's all training is. Here's the rest of the book, done at
the speed a computer does it.

_Visual: the bracket accelerates until it's a blur along the tiles; pairs fly
into the sheets faster than the eye can follow, new rows starting as new words
turn up and spilling onto a second sheet and a third, until the whole book is
counted: 24 rows across five sheets, some rows with one box, some with all four,
thick with marks. About two seconds of motion, then hold._

_Beyond:_ the slides count four pairs and then show the finished sheets, so the
jump from "one pair" to "the whole model" happens off screen. Running every pair
of a real book shows there's no other step in between.

_Reads:_ 1. the whole book is counted the same way; 2. a computer does
nothing different, only faster.

**BEN:** Now look at what it kept. Not the sentences. Not the story. It doesn't
know what a magpie is. Just counts of what came next.

_Visual: the book closes and slides off the desk. The finished sheets alone,
fanned, full frame._

_Reads:_ 1. the book is gone; 2. only the counts are left.

**USHINI (VO):** And a row of marks is just a row of numbers. The row for "the"
says five, six, four, four.

_Visual: push in on the row for "the"; each box's marks count themselves off and
collapse into a numeral in the box's colour, 5, 6, 4, 4. Pull back as the change
ripples down every row of every sheet._

_Reads:_ 1. each box's marks are a count; 2. every sheet is a table of
numbers.

**BEN (VO):** When people talk about a model's "weights", this is the kind of
thing they mean: numbers that came from the text it read.

_Visual: hold on the sheets of numbers._

_Reads:_ 1. that's what model weights are.

**USHINI (VO):** Give it a bigger book and nothing changes. This is
_Frankenstein_. Eighty-five thousand words, and seven thousand rows.

_Visual: the five sheets shrink to a corner of a stack of ledger rows that keeps
growing at the same machine speed from the real Frankenstein counts, sheet after
sheet, in a logarithmic pull-back until the sheets are a fine texture of
colour._

_Beyond:_ the TASK-154 ledger video never leaves the table; this one fills rows
from a real book's real pairs, so the scale is a fact the viewer sees rather
than a gesture.

_Reads:_ 1. a bigger book makes more rows the same way; 2. real books
make far more rows than anyone could read.

**BEN:** A real model reads trillions of words, and stores its numbers more
cleverly than a ledger. But the job it's doing is the one you're about to do.

**USHINI (VO):** Three things catch people out. A full stop is a word, and its
row says how sentences start. A new word goes in the next empty box, never skip
one. And say a new word out loud when you start its row, so nobody starts it
twice.

_Visual: a blank sheet. The row for full stop lights. A follower writes into the
next empty box, and a gap between boxes flashes and closes. A word writes into a
new row, and a second, identical row that starts to write below it wipes away._

_Reads:_ 1. full stop has a row; 2. boxes fill in order; 3. one row per
word.

**BEN (TC):** Reader, grab the text. Two words at a time.
