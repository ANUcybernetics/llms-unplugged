# Pre-trained generation

**Key idea (draft):** you can generate from a model someone else trained on a
much bigger text; a booklet is a grid stored another way, with only the boxes
that aren't empty.

**Plays:** My First Language Model, start of the Pre-trained generation section.

**Builds on:** `partials/grid-pretrained-generation.mdx` from "Pre-trained
generation" through "Pre-trained: from `;`". The booklet is the Paterson one
(`data/the-man-from-snowy-river.txt`) and the walk is the deck's (_sleep again
I'd float ;_, rolls 7, 80, 6).

_Script to follow once Ben has noted `training` and `generation`._

## Beat sheet

1. hook: most people who use Claude or ChatGPT never trained it. Somebody else
   did the counting. So does this booklet
2. **beyond:** the magpie grid folds into a magpie booklet: each row peels off
   into an entry, the empty boxes fall away, the tallies become running totals
   (thresholds). _Beyond:_ the slides introduce the booklet as a new object with
   new rules; the fold shows it's the model the viewer already knows, stored
   another way, so the threshold rule is the die-face rule in disguise
3. the rule: roll, take the first threshold at or above the roll, go to that
   word's entry
4. more than ten options: the diamonds say how many dice; two dice read as one
   number (an eight and a zero is 80). Same rule
5. **beyond:** why a booklet and not a grid. Paterson's book has 4,119 words: a
   grid would have seventeen million boxes, and all but 16,460 would be empty.
   The booklet prints only those. _Beyond:_ "it would be too big" is an
   assertion on a slide; watching the grid for this book pull back to seventeen
   million boxes, almost all blank, and collapse into a booklet you can hold
   makes the storage choice obvious. It also pays off in `real-models`
6. listen: more like real prose than your grid, and still not about anything;
   guess the book before you check the cover
7. open weights: every number is readable, and it runs at the kitchen table
8. ending (booklet): grab it and roll; make your own at llmsunplugged.org/tools
