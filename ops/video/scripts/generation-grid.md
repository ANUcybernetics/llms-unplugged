# Generation: grid

**Key idea:** text is written one word at a time, each word picked at random in
proportion to the counts: the dice make every text different, and the counts
make them all sound like the book.

**Plays:** My First Language Model, start of the Generation section.

**Builds on:** `partials/grid-generation.mdx` from "Generation" through
"Generated text"; the ending hands off to "Your turn". The model is _The
magpie_'s grid, lowercased, columns in the order the book first uses each word
(the row for full stop is it 7, here 4, down 3, swoop 3; for _it_, is 1, sits 3,
watches 3, goes 3; for _the_, magpie 5, fence 6, postie 4, dog 4; for _dog_,
full stop 2, runs 2). The walk is ". it sits on the dog .", a sentence the book
never says, with rolls 2, 1, 9, 3. Faces are shared across a row left to right,
as the slides' dice bands are.

## Beat sheet

1. hook: a table of counts is about to write a sentence nobody has ever written
2. the model: a row per word, and what came next, counted; the grid the viewer
   just filled works the same way
3. start after a full stop. Share the die's ten faces across the row by its
   tallies; seventeen tallies won't split exactly, so share as fairly as you
   can. Roll: "it"
4. the row for _it_ has exactly ten tallies, a face each. Roll a one: "sits"
5. single-option rows: no roll needed ("on", "the")
6. the row for _the_, then _dog_: two more rolls, and a full stop
7. the sentence: "It sits on the dog." The book never says it. Nobody wrote it;
   the counting did
8. **beyond:** the tree of everything this model could have written from a full
   stop, branch thickness by probability. Your sentence is one path through it
9. **beyond:** run it ten thousand times and count what comes out: the counts
   come back. Every text is different, and every text sounds like the book
10. that's the loop Claude or ChatGPT runs, with vastly more counts
11. ending: how to roll from your own grid, then go

## Script

**BEN (TC):** This is a table of counts. In about a minute it's going to write a
sentence that nobody has ever written.

_Visual: the finished magpie grid on the desk, top-down, full frame. Nothing
moves._

_Reads:_ 1. this grid is a finished model.

**USHINI (VO):** Each row is a word from a book, and the tallies say which words
came next, and how often. It's the same kind of grid you just filled in.

_Visual: the row for "the" lights: its four tallied boxes under magpie, fence,
postie and dog, the rest of the row empty._

_Reads:_ 1. a row is a word; 2. its tallies are what came next and how often.

**BEN (VO):** A story starts after a full stop, so start at the row for full
stop. After a full stop, the book has "it" seven times, "here" four, "down"
three, "swoop" three.

_Visual: the row for full stop slides out of the grid to the middle of the desk,
its four tallied boxes spread wide._

_Reads:_ 1. start from the full stop's row; 2. "it" has the most tallies.

**USHINI (VO):** Now pick the next word at random, with a ten-sided die. [beat]
Seventeen tallies don't split into ten faces exactly, so share them as fairly as
you can: "it" gets four faces, the others two each. [beat]

_Visual: under the row a strip of ten die faces, 0 to 9, bands drawing in left
to right as they're named: it 0--3, here 4--5, down 6--7, swoop 8--9._

_Reads:_ 1. the die's faces are shared across the row; 2. more tallies, more
faces; 3. "it" gets the most.

_Reads note:_ rounding seventeen tallies onto ten faces is a wrinkle the slides
never meet (the hop joey hop rows divide evenly); the alternative is to start
this walk on a row that divides and keep the rounding for the ending.

**BEN (VO):** Roll a two. [beat] That's in the band for "it". [beat] Write the
word down, and go to the row for "it".

_Visual: a d10 face lands on 2; the "it" band lights and "it" writes onto a
strip of paper at the bottom of the desk. The row for "it" lights on the grid._

_Reads:_ 1. the roll lands in a band; 2. that band's word is written down; 3.
its row is next.

**USHINI (VO):** The row for "it" has exactly ten tallies, so every tally gets
one face. [beat] Roll a one: "sits".

_Visual: the row for "it" (is 1, sits 3, watches 3, goes 3): its ten tallies
drop one to a face, is 0, sits 1--3, watches 4--6, goes 7--9. A face lands on 1;
the "sits" band lights and "sits" writes onto the strip._

_Reads:_ 1. ten tallies, one face each; 2. the roll picks "sits".

**BEN (VO):** "Sits" is only ever followed by "on", and "on" by "the". One
option, no roll.

_Visual: the rows for "sits" and "on" light in turn, each with its single
tallied box, and "on" and "the" write straight onto the strip._

_Reads:_ 1. a row with one word needs no roll.

**USHINI (VO):** The row for "the" shares its faces four ways. [beat] Roll a
nine: "dog". [beat] And after "dog", a full stop or "runs", five faces each.
[beat] Roll a three: full stop.

_Visual: the row for "the" gets its bands (magpie 0--2, fence 3--5, postie 6--7,
dog 8--9), a face lands on 9 and "dog" writes on. The row for "dog" splits the
die in two (full stop 0--4, runs 5--9), a face lands on 3, and the full stop
tile writes on._

_Reads:_ 1. every row works the same way; 2. a full stop ends the sentence.

**BEN:** "It sits on the dog." The book never says that; the magpie sits on the
fence. Nobody wrote this sentence; the counting did.

_Visual: the strip reads "it sits on the dog ." Above it, in the book's type,
"It sits on the fence." and "Here comes the dog."; the halves slide together
into the generated line._

_Reads:_ 1. this sentence isn't in the book; 2. it's made from pieces that
are; 3. nobody wrote it.

**USHINI (VO):** And here's everything this model could have written instead.

_Visual: the strip's words slide into a column at the left edge. The full stop,
a symbol tile, moves to the root, and every path the counts allow grows
rightwards, twelve words deep: about five thousand texts on ten thousand
branches, each as thick as it is likely, the likely ones bold, the rare ones
hairlines. The first three words deep are labelled. The path "it sits on the dog
." lights gold through the middle of it, each word flying from the column onto
its node; the rest dims. (The prototype at `prototype-tree/`.)_

_Beyond:_ the slides show one walk, so the viewer sees one sentence and has to
imagine the others. The tree shows them all at once, weighted, and makes the key
idea literal: the counts already hold every text, and the dice only pick a path.

_Reads:_ 1. each branch is a word the counts allow; 2. thicker means more
likely; 3. your sentence is one path through it.

**BEN (VO):** Every roll picks a different path. So run it ten thousand times
and count what comes out.

_Visual: the tree fades to a blank grid. Generated words stream past along the
bottom at machine speed while their pairs are tallied into the blank grid. The
row for "the" is held up beside the original's: after twenty words it looks
nothing like it; after ten thousand, the proportions match._

_Beyond:_ one walk can't show that sampling is faithful, and "it sounds like the
book" stays a feeling. Counting the model's own output back into a grid shows
the proportions return, so "sounds like the book" becomes something the viewer
can check.

_Reads:_ 1. the model's output is counted the same way as the book was; 2. a
short run looks nothing like the book's counts; 3. a long run matches them.

**USHINI:** Every text different. Every text sounding like the book. That's what
Claude or ChatGPT is doing every time it writes a word, with vastly more counts
than this.

**BEN (VO):** On your grid: pick any starting word with a row and write it down.
[beat] Share the die's faces across its row by the tallies, roll, and write down
the word you land on. [beat] Then find its row. No row? Pick a new word and
carry on.

_Visual: a hand-filled grid; a word writes on the strip, its row lights, the
row's tallies become a strip of die faces, a face lands, the next word writes.
Then a word whose row is empty: a new starting word writes on after it._

_Reads:_ 1. start from any word with a row; 2. faces by tallies, roll, write; 3.
no row, pick again.

**USHINI (TC):** Pick a starting word and roll.
