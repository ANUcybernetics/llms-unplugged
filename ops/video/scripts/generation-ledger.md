# Generation: ledger

**Key idea:** generate text one word at a time using the book's pair counts.
Common pairs are more likely; a run can produce a new sentence or repeat one.

**Plays:** How AI writes stories (ledger), start of the Generation section.
Never assumes the room did the counting, so it plays whether the sheets arrived
finished (the lesson's usual order) or the room filled them in first; there is
no separate pre-trained ledger video.

**Builds on:** `partials/ledger-read.mdx` plus `partials/ledger-generation.mdx`
up to its "Your turn", which the ending hands off to. The model is _The
magpie_'s real ledger (the row for full stop is it 6 red, here 3 blue, down 3
green, back 3 yellow; for _it_, is 1 red, sits 4 blue, watches 2 green; for
_the_, fence 4 red, postie 4 blue, magpie 6 green, dog 4 yellow; for _dog_, full
stop 3 red, and 1 blue). The walk is ". it sits on the dog .", a sentence the
book never says; the deck's own walk draws differently from the same cups.

## Beat sheet

1. finished sheets can generate a sentence absent from the book
2. read a row and its colours; colours name boxes, not fixed words
3. fill the cup from the full stop's row; predict the likeliest colour, then
   draw
4. write the word, empty the cup, find its row and refill
5. continue through "sits on the dog" to a full stop
6. compare our sentence with the book's
7. inspect four possible next words after "the"; repeats can happen
8. connect next-word prediction to real models, distinguishing how they learn
9. return to the materials and begin the activity

## Script

**BEN (TC):** This is a pile of sheets full of counts. In about a minute it's
going to write a sentence that isn't in the book.

_Visual: the magpie's ledger sheets fanned on the desk, top-down, full frame.
Nothing moves._

_Reads:_ 1. these sheets are a finished model.

**USHINI (VO):** Each row is a word from a book, and the words that came next,
with a mark every time. Maybe you did the counting yourselves; maybe the sheets
arrived finished. It works the same either way.

_Visual: the sheets gather into one; the row for "the" lights: fence, postie,
magpie, dog in red, blue, green and yellow boxes, each with its marks._

_Reads:_ 1. a row is a word; 2. its boxes are what came next and how often.

**BEN (VO):** Every box has a colour, always in the same order: red, blue,
green, yellow. [beat] On this row, red means "fence". [beat] On another row, red
means something else.

_Visual: a red counter slides in beside the row for "the" and the red box
lights: fence. The counter slides down to the row for "it", and its red box
lights: is._

_Reads:_ 1. the boxes run red, blue, green, yellow; 2. a colour names a place in
the row, not a word.

**USHINI (VO):** A story starts after a full stop, so find the row for full
stop. Fill a cup with one counter for every mark: [beat] six red for "it", three
blue for "here", three green, three yellow.

_Visual: the row for full stop slides out of the sheet. Its marks lift off box
by box, red first, and become counters that drop into a cup seen from above: six
red, three blue, three green, three yellow._

_Reads:_ 1. start from the full stop's row; 2. each mark becomes one counter in
its box's colour; 3. "it" has the most counters.

**BEN (VO):** Fifteen counters. Which colour do you reckon we're most likely to
draw? [beat 2] Now draw one without looking. Red: "it". [beat] Write the word
down, empty the cup back into the tub, and go to the row for "it".

_Visual: a red counter slides out of the cup; the red box on the row lights and
"it" writes onto a strip of paper at the bottom of the desk. The cup empties.
The row for "it" lights._

_Reads:_ 1. the counter's colour names the next word; 2. that word is written
down; 3. the cup empties and its row is next.

**USHINI (VO):** The row for "it": one red, four blue, two green. [beat] Blue
this time: "sits".

_Visual: seven counters drop into the cup; a blue one comes out and "sits"
writes onto the strip._

_Reads:_ 1. a new row fills a new cup; 2. blue on this row means "sits".

**BEN (VO):** "Sits" is only ever followed by "on", and "on" by "the". One box,
no cup.

_Visual: the rows for "sits" and "on" light in turn, each with a single red box,
and "on" and "the" write straight onto the strip._

_Reads:_ 1. a row with one word needs no draw.

**USHINI (VO):** The row for "the" fills the cup with all four colours. [beat]
Yellow: "dog". [beat] And after "dog", three red for a full stop, one blue for
"and". [beat] Red: full stop.

_Visual: eighteen counters in four colours drop into the cup; a yellow one comes
out and "dog" writes on. Then four counters, three red, one blue; a red one
comes out and the full stop tile writes on._

_Reads:_ 1. every row works the same way; 2. a full stop ends the sentence.

**BEN:** The book says "It sits on the fence". We've ended up with "It sits on
the dog". [beat 1.5]

_Visual: the strip reads "it sits on the dog ." Above it, in the book's type,
"It sits on the fence." and "Here comes the dog."; the halves slide together
into the generated line._

_Reads:_ 1. this sentence isn't in the book; 2. it's made from pieces that are.

**USHINI (VO):** After "the", we could pick "fence", "postie", "magpie" or
"dog". [beat] These four branches show those choices; a thicker branch means
more counters.

_Visual: the completed sentence moves aside. A large "the" branches to four
words, revealed in order. Branch widths follow the actual counters: 4, 4, 6, 4._

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

**BEN (VO):** Four jobs in your group. [beat] A reader finds the row. [beat] A
filler puts one counter per mark in the cup. [beat] A drawer pulls one out.
[beat] And a writer writes the word down. Empty the cup back into the tub every
time.

_Visual: the ledger sheets fanned, the cup, the counter tub, the paper strip:
each lights in turn as its job is named. The cup tips back into the tub._

_Reads:_ 1. four jobs; 2. one counter per mark; 3. empty the cup between draws.

**USHINI (TC):** Reader, find the full stop. Let's see what your book says.
