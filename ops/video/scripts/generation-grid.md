# Generation (grid)

**Key idea:** language models generate text one word at a time by sampling the
next word according to learned counts.

**Plays:** My First Language Model, start of the Generation section.

## Beat sheet

1. hook: the grid is just counts now---in sixty seconds it'll write a sentence
   that never existed
2. pick any starting word that has a row---write it down
3. find its row, add up the tallies, map to d10 faces (e.g. "cat" 6 tallies,
   "dog" 4 → faces 1--6 cat, 7--10 dog)
4. that mapping IS weighted random sampling---more tallies, more faces, more
   likely. The die does the random part; the counts do the weighting
5. roll, look up the word, write it down
6. iterate: new word becomes current, find its row, roll again
7. dead-end handling: no row? pick a new starting word
8. loop handling: small models bounce between two words a lot---break out by
   picking a different valid next word; LLMs do this too at scale
9. reveal: the text is new but follows the same patterns---the same next-word
   sampling loop Claude or ChatGPT run, vastly smaller scale
10. CTA: pick a starting word and try it

## Script

**USHINI (TC):** You've got a grid full of tally marks. Right now, they're just
counts. In about sixty seconds, they're going to write a sentence that has never
existed before.

**BEN:** Pick any starting word that has a row in your grid, and write it down.
That's the beginning of your generated text.

_Visual: the finished grid on the desk with a blank strip of paper below it.
"see" writes onto the paper in pencil; its row lights gold and the camera pushes
in on the row._

**USHINI (VO):** Find that word's row and look at the tally marks. Add them up,
then assign dice numbers: if "cat" has six tallies and "dog" has four, that's
faces one to six for cat, seven to ten for dog.

_Visual: the row's cells slide out of the grid into a line, each column word
above its strokes. The strokes recount into a total under each word. A strip of
ten die faces appears beneath, and the faces shade into blocks sized by the
totals, each block in its word's colour._

**BEN (VO):** That mapping is the whole trick. More tallies, more faces, more
likely to come up. The die does the random part; the counts do the weighting.

_Visual: the strip alone: the block widths are the odds. One stroke added to a
word widens its block by a face._

**BEN (VO):** Roll your ten-sided die. Whatever number you land on, look up the
matching word and write it down. That's your second word.

_Visual: a flat d10 face lands beside the strip showing its number; the matching
face on the strip lights; the word above that block writes onto the paper as the
second word._

**USHINI (VO):** Now that new word becomes your current word. Find _its_ row,
set up the ranges, roll again, and write down the result. Keep going.

_Visual: the new word lifts from the paper to the grid, its row lights, the
strip rebuilds for that row, a face lands, a word writes. The loop runs twice
more at double speed, the paper reading "see spot , run . see"._

**BEN:** Two things you might hit. If your current word doesn't have a row---it
was never the first word of a pair---that's a dead end. Pick a new starting word
and carry on.

_Visual: the current word's row lights and holds, empty. The paper's line ends,
and a new starting word writes on the line below._

**USHINI:** Or you might bounce between the same two words: comma, spot, comma,
spot. Small models loop a lot, so break out by picking a different valid next
word. Real LLMs do it less because they're bigger, but if you've ever seen
Claude or ChatGPT repeat itself, that's the same thing at scale.

_Visual: "comma spot comma spot" writing itself along the paper. The strip for
"," shows "spot" lit on most faces; the pencil takes the other block's word
instead._

**BEN:** Now read back what you generated. It wasn't in the training text---it's
new---but it sounds like it could have been, because it follows the same
patterns. And that's no trick. It's how every large language model works, Claude
and ChatGPT included: one word at a time, from learned counts.

_Visual: the generated line full frame. Behind it, dimmed, the book's text: the
line is not in it. Then each pair in the generated line lights its grid cell in
turn, every one present. Cut to the line alone._

**USHINI (TC):** Pick a starting word and give it a go. See what your model
comes up with.
