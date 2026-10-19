# Generation: grid

**Key idea:** generate text one word at a time using the book's pair counts.
Common pairs are more likely; a run can produce a new sentence or repeat one.

**Plays:** My First Language Model, start of the Generation section.

**Builds on:** `partials/grid-generation.mdx` from "Generation" through
"Generated text"; the ending hands off to "Your turn". The model is _The
magpie_'s grid, lowercased, columns in the order the book first uses each word
(the row for full stop is it 6, here 3, down 3, back 3; for _it_, is 1, sits 4,
watches 2; for _the_, fence 4, postie 4, magpie 6, dog 4; for _dog_, full stop
3, and 1). The walk is ". it sits on the dog .", a sentence the book never says,
with rolls 2, 1, 9, 3. Faces are shared across a row left to right, as the
slides' dice bands are.

## Beat sheet

1. a grid can generate a sentence absent from the book
2. read the rows, then start after a full stop
3. approximate fifteen tallies with ten die faces; roll "it"
4. seven tallies need rounding too: "sits" gets six faces; roll "sits"
5. single options give "on" and "the"; two more rolls give "dog" and a full stop
6. compare our sentence with the book's
7. inspect four possible next words after "the"; repeats can happen
8. connect next-word prediction to real models, distinguishing how they learn
9. return to the materials and begin the activity

## Script

**BEN (TC):** This is a table of counts. In about a minute it's going to write a
sentence that isn't in the book.

_Visual: the finished magpie grid on the desk, top-down, full frame. Nothing
moves._

_Reads:_ 1. this grid is a finished model.

**USHINI (VO):** Each row is a word from a book, and the tallies say which words
came next, and how often. It's the same kind of grid you just filled in.

_Visual: the row for "the" lights: its four tallied boxes under magpie, fence,
postie and dog, the rest of the row empty._

_Reads:_ 1. a row is a word; 2. its tallies are what came next and how often.

**BEN (VO):** A story starts after a full stop, so start at the row for full
stop. After a full stop, the book has "it" six times, "here" three, "down"
three, "back" three.

_Visual: the row for full stop slides out of the grid to the middle of the desk,
its four tallied boxes spread wide._

_Reads:_ 1. start from the full stop's row; 2. "it" has the most tallies.

**USHINI (VO):** Now pick the next word at random, with a ten-sided die. [beat]
Fifteen tallies won't fit exactly onto ten faces. We'll approximate: "it" gets
four faces, the others two each. [beat]

_Visual: under the row a strip of ten die faces, 0 to 9, bands drawing in left
to right as they're named: it 0--3, here 4--5, down 6--7, back 8--9._

_Reads:_ 1. the die's faces are shared across the row; 2. more tallies, more
faces; 3. "it" gets the most.

**BEN (VO):** Roll a two. [beat] That's in the band for "it". [beat] Write the
word down, and go to the row for "it".

_Visual: a d10 face lands on 2; the "it" band lights and "it" writes onto a
strip of paper at the bottom of the desk. The row for "it" lights on the grid._

_Reads:_ 1. the roll lands in a band; 2. that band's word is written down; 3.
its row is next.

**USHINI (VO):** The row for "it" has seven tallies, so we round again: "sits"
gets six faces. [beat] Roll a one: "sits".

_Visual: the row for "it" (is 1, sits 4, watches 2): its seven tallies share the
ten faces, is 0, sits 1--6, watches 7--9. A face lands on 1; the "sits" band
lights and "sits" writes onto the strip._

_Reads:_ 1. seven tallies, rounded onto ten faces; 2. the roll picks "sits".

**BEN (VO):** "Sits" is only ever followed by "on", and "on" by "the". One
option, no roll.

_Visual: the rows for "sits" and "on" light in turn, each with its single
tallied box, and "on" and "the" write straight onto the strip._

_Reads:_ 1. a row with one word needs no roll.

**USHINI (VO):** The row for "the" shares its faces four ways. [beat] Roll a
nine: "dog". [beat] And after "dog", a full stop gets eight faces and "and" two.
[beat] Roll a three: full stop.

_Visual: the row for "the" gets its bands (fence 0--1, postie 2--3, magpie 4--7,
dog 8--9), a face lands on 9 and "dog" writes on. The row for "dog" splits the
die unevenly (full stop 0--7, and 8--9), a face lands on 3, and the full stop
tile writes on._

_Reads:_ 1. every row works the same way; 2. a full stop ends the sentence.

**BEN:** The book says "It sits on the fence". We've ended up with "It sits on
the dog". [beat 1.5]

_Visual: the strip reads "it sits on the dog ." Above it, in the book's type,
"It sits on the fence." and "Here comes the dog."; the halves slide together
into the generated line._

_Reads:_ 1. this sentence isn't in the book; 2. it's made from pieces that are.

**USHINI (VO):** After "the", we could pick "magpie", "fence", "postie" or
"dog". [beat] These four branches show those choices; a thicker branch means
more die faces.

_Visual: the completed sentence moves aside. A large "the" branches to four
words, revealed in order. Branch widths follow the actual sampling weights: 4,
2, 2, 2 die faces for the grid, or 6, 4, 4, 4 for counters and slips._

_Reads:_ 1. the current word has four possible next words; 2. the sampling
weights determine how likely each choice is.

**BEN (VO):** Run it again and you might get a different sentence, or the same
one. That's fine: likely words just come up more often. [beat]

_Visual: highlight the branch to "dog", then "fence", then "dog" again, one at a
time. Hold the final choice._

_Reads:_ 1. another draw can change the word; 2. the same word can recur.

**USHINI:** Claude and ChatGPT write this way too, one piece at a time. They
just look at far more than the last word, and they learn their numbers rather
than counting them.

_Visual: hold the four-way fork with "the" visible as the current word._

_Reads:_ 1. this model uses just the last word to choose the next.

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
