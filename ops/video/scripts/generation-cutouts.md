# Generation: cutouts

**Key idea:** generate text one word at a time using the book's pair counts.
Common pairs are more likely; a run can produce a new sentence or repeat one.

**Plays:** start of the Generation section of the cutouts decks.

**Builds on:** `partials/cutouts-generation.mdx` from "Your goal" through its
"Find the next cutout" run; the ending hands off to "Activity". The slides chain
_Green Eggs and Ham_ cutouts; this video uses _The magpie_'s 99 cutouts (one per
pair), so the walk is the other how-it-works videos' ". it sits on the dog .",
starting from a ". it" cutout. The row counts become slip counts: 7 cutouts
start with _it_ (sits 4, watches 2, is 1), 18 with _the_ (fence 4, postie 4,
magpie 6, dog 4), 4 with _dog_ (full stop 3, and 1).

## Beat sheet

1. a pile of slips can generate a sentence absent from the book
2. each slip records a pair; common pairs have more slips
3. start after a full stop; record the next word and return the slip
4. gather every match, shuffle, pick without looking, write and return
5. continue through "sits on the dog" to a full stop
6. compare our sentence with the book's
7. inspect four possible next words after "the"; repeats can happen
8. connect next-word prediction to real models, distinguishing how they learn
9. return to the materials and begin the activity

## Script

**BEN (TC):** This is a pile of paper slips. In about a minute it's going to
write a sentence that isn't in the book.

_Visual: the desk, top-down, the magpie's cutouts spread across it, previous-
word boxes up. Nothing moves._

_Reads:_ 1. this pile is a finished model.

**USHINI (VO):** Every slip is a pair of words from a book: the word in the box,
and the word that came next. A pair the book says four times gets four slips.

_Visual: one slip lifts and turns to face the camera: "the" in its box, "fence"
beside it. Three more "the fence" slips lift out of the spread and stack on it._

_Reads:_ 1. a slip is one pair; 2. the box is the previous word; 3. a common
pair has many slips.

**BEN (VO):** Choose a slip to start from. A story starts after a full stop, so
take one with a full stop in the box. [beat] This one says "it". Write that word
down, then put the slip back.

_Visual: the full stop slips light across the spread; one slides out, turns
over, full stop in its box, "it" beside it. "it" writes onto a strip of paper at
the bottom of the desk; the selected slip returns to the spread._

_Reads:_ 1. the first slip gives you somewhere to start; 2. its next word is
written down.

**USHINI (VO):** Now find every slip with "it" in the box. There are seven.
[beat] Four say "sits", two "watches", and one says "is". [beat] Shuffle the
matching slips. Pick one without looking: "sits". Write it down, then put the
slip back. You might need it again.

_Visual: the spread dims except the seven "it" slips, which slide together into
one loose pile, their next words showing: sits, sits, sits, sits, watches,
watches, is. The pile shuffles, one slip slides out: "it sits". "sits" writes
onto the strip. The slip returns to the spread._

_Reads:_ 1. every slip that matches the last word is a candidate; 2. more slips,
more chances; 3. the one you pick names the next word.

**BEN (VO):** Every "sits" slip says "on". [beat] And every "on" slip says
"the", so there's only one way to go.

_Visual: the "sits" slips light, all four reading "on"; then the "on" slips, all
reading "the". "on" and "the" write straight onto the strip._

_Reads:_ 1. when every match says the same word, there's no choice.

**USHINI (VO):** "The" has eighteen slips. [beat] Pick one: "dog". [beat] And
"dog" has four: three full stops, one "and". [beat] Pick one: full stop.

_Visual: the eighteen "the" slips gather into four piles, fence four, postie
four, magpie six, dog four; they shuffle together and a "the dog" slip slides
out. "dog" writes on. Then the four "dog" slips, in two piles, and a full stop
comes out; the full stop tile writes on._

_Reads:_ 1. every word works the same way; 2. a full stop ends the sentence.

**BEN:** The book says "It sits on the fence". We've ended up with "It sits on
the dog". [beat 1.5]

_Visual: the six slips are temporarily brought back from the spread to lie end
to end, each one's next word matching the next one's box, and the strip above
reads "it sits on the dog ." Above that, in the book's type, "It sits on the
fence." and "Here comes the dog."; the halves slide together into the generated
line._

_Reads:_ 1. the slips chain like dominoes; 2. this sentence isn't in the
book; 3. it's made from pieces that are.

**USHINI (VO):** After "the", we could pick "magpie", "fence", "postie" or
"dog". [beat] These four branches show those choices; a thicker branch means
more slips.

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

**BEN (VO):** Spread your cutouts out. Write down a starting word, then find
every slip with that word in the box. Shuffle them, pick one without looking,
and write down the word beside it. [beat] Put the slip back. Then find all the
matches for that new word. [beat] The colours help you find the matches fast.

_Visual: a spread of cutouts; a word writes, the slips whose box colour matches
light, one lifts, its next word writes, the next match lights._

_Reads:_ 1. gather every matching box; 2. shuffle and pick without looking; 3.
write the next word and return the slip; 4. colour helps find matches.

_Reads note:_ the printed cutouts colour the previous-word box, and the slides
use colour as a quick filter before checking the word; the visual depends on the
magpie cutouts having the same colouring, which needs checking against a printed
set.

**USHINI (TC):** Start chaining.
