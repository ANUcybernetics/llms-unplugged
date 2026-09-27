# Generation

**Key idea (draft):** text is written one word at a time, each word picked at
random in proportion to the counts: the dice make every text different, and the
counts make them all sound like the book.

**Plays:** start of any Generation section. Never assumes the viewer did the
counting, so it also plays where the ledger lesson generates from finished
sheets before training. Grid ending: My First Language Model. Ledger ending: How
AI writes stories (ledger). Cutouts ending: the cutouts decks.

**Builds on:** `partials/grid-generation.mdx` from "Generation" through
"Generated text"; `partials/ledger-read.mdx` plus
`partials/ledger-generation.mdx` up to its "Your turn";
`partials/cutouts-generation.mdx` from "Your goal" through its "Find the next
cutout" run. The model is _The magpie_'s counts, lowercased (the row for full
stop is it 7, here 4, down 3, swoop 3; for _it_, sits 3, watches 3, goes 3, is
1; for _the_, fence 6, magpie 5, postie 4, dog 4). The walk is ". it sits on the
dog .", a sentence the book never says.

## Beat sheet

1. hook: a table of counts is about to write a sentence nobody has ever written
2. the model: a row per word, and what came next, counted. You might have done
   the counting, or it arrived finished; it works the same either way
3. start after a full stop: the row for full stop. Pick the next word at random,
   but in proportion to the counts: it has seven chances in seventeen
4. the draw: whatever you draw with (a cup, a die, a pile of slips) it's the
   same draw. More counts, more chances. One step in each form
5. single-option rows: no draw needed
6. the sentence: "It sits on the dog." The book never says it. Nobody wrote it;
   the counting did
7. **beyond:** the tree of every text this model can write from a full stop,
   branch thickness by probability. Your sentence is one path through it
8. **beyond:** run it ten thousand times and count what comes out: the counts
   come back. Every text is different, and every text sounds like the book
9. that's the loop Claude or ChatGPT runs, with vastly more counts
10. ending (per format): how to draw on your grid, sheets or slips, then go

## Script

**BEN (TC):** This is a table of counts. In about a minute it's going to write a
sentence that nobody has ever written.

_Visual: the finished magpie sheet on the desk, top-down, full frame. Nothing
moves but the pencil marks' boil._

_Reads (draft):_ 1. this sheet is a finished model.

**USHINI (VO):** Each row is a word from a book, and every word that came next,
counted. Maybe you did the counting yourselves; maybe the sheet arrived
finished. It works the same either way.

_Visual: the row for "the" lights: fence, magpie, postie, dog, each with its
marks._

_Reads (draft):_ 1. a row is a word; 2. beside it, what came next and how often.

**BEN (VO):** A story starts after a full stop, so start at the row for full
stop. "It" came next seven times, "here" four, "down" three, "swoop" three. Now
pick the next word at random, but fairly: "it" gets seven chances in seventeen.

_Visual: the row for full stop slides out of the sheet. Its seventeen marks lift
off and become seventeen counters in the four colours, which drop into a cup
seen from above._

_Reads (draft):_ 1. start from the full stop's row; 2. each mark becomes one
chance; 3. "it" has the most chances.

**USHINI (VO):** Draw one. It's "it". Write it down, and go to the row for "it".

_Visual: a red counter slides out of the cup and becomes the word "it" on a
strip of paper at the bottom of the desk. The cup empties. The row for "it"
lights on the sheet._

_Reads (draft):_ 1. the counter drawn names the next word; 2. that word is
written down; 3. its row is next.

**BEN (VO):** You don't need a cup. The row for "it" has ten marks, so give each
mark a face of a ten-sided die. Roll a one: "sits".

_Visual: the row for "it" (sits 3, watches 3, goes 3, is 1): its ten marks
become ten die faces in a strip, banded in grid column order as the slides' dice
bands do: is 0, sits 1--3, watches 4--6, goes 7--9. A d10 face lands on 1; the
"sits" band lights and "sits" writes onto the strip._

_Reads (draft):_ 1. each mark becomes a face of the die; 2. the roll lands in a
block; 3. that block's word is next.

**USHINI (VO):** Or a pile of slips, one for every pair in the book. "Sits" is
always followed by "on", and "on" by "the", so no draw at all. Then the row for
"the": nineteen slips. Pull one out. "Dog".

_Visual: "sits" and "on" write straight on with no draw, each row lighting
briefly with its single follower. Then the row for "the" becomes nineteen paper
slips in four piles, fence six, magpie five, postie four, dog four; the piles
shuffle together, one slip slides out and turns over: "the dog"._

_Reads (draft):_ 1. a row with one word needs no draw; 2. slips work the same
way as counters and faces; 3. the slip drawn names the next word.

_Reads note:_ switching form three times in one walk is the point (it's the same
draw whatever you hold), but a viewer who only has a grid may wonder which one
they're meant to use; the ending answers that, and the walk may need one line
that says so up front.

**BEN (VO):** Cup, die or slips, it's the same draw. More counts, more chances.

_Visual: the three forms side by side for a beat: the cup, the die strip, the
slip piles, each with its most likely word lit._

_Reads (draft):_ 1. all three are the same draw; 2. more counts means more
likely.

**USHINI:** And a full stop to finish. "It sits on the dog." The book never says
that. It says the magpie sits on the fence. Nobody wrote this sentence; the
counting did.

_Visual: the strip reads "it sits on the dog ." Above it, in the book's type,
"It sits on the fence." and "Here comes the dog."; the halves slide together
into the generated line._

_Reads (draft):_ 1. this sentence isn't in the book; 2. it's made from pieces
that are; 3. nobody wrote it.

**BEN (VO):** And here's every sentence this model could have written instead.

_Visual: the strip's words slide into a column at the left edge. From the full
stop, every path the counts allow grows rightwards, eight words deep: thousands
of branches, each as thick as it is likely, the likely ones bold, the rare ones
hairlines. The path "it sits on the dog ." lights gold through the middle of it;
the rest dims._

_Beyond:_ the slides show one walk, so the viewer sees one sentence and has to
imagine the others. The tree shows them all at once, weighted, and makes the key
idea literal: the counts already hold every text, and the dice only pick a path.

_Reads (draft):_ 1. each branch is a word the counts allow; 2. thicker means
more likely; 3. your sentence is one path through it.

**USHINI (VO):** Every roll picks a different path. So run it ten thousand times
and count what comes out.

_Visual: the tree fades to a blank sheet. Generated words stream past along the
bottom at machine speed while their pairs are counted into the blank sheet. The
row for "the" is held up beside the original's: after twenty words it looks
nothing like it; after ten thousand, the proportions match to the mark._

_Beyond:_ one walk can't show that sampling is faithful, and "it sounds like the
book" stays a feeling. Counting the model's own output back into a sheet shows
the proportions return, so "sounds like the book" becomes a number the viewer
can check.

_Reads (draft):_ 1. the model's output is counted the same way as the book
was; 2. a short run looks nothing like the book's counts; 3. a long run matches
them.

_Reads note:_ this is the beat to cut if the video runs long; the tree carries
the key idea's first half on its own, and this beat carries only the second.

**BEN:** Every text different. Every text sounding like the book. That's what
Claude or ChatGPT is doing every time it writes a word, with vastly more counts
than this.

### Ending: grid

**USHINI (VO):** On your grid: pick any starting word with a row and write it
down. Share the die's ten faces across its row by the tallies, roll, and write
down the word you land on. Then find its row. No row? Pick a new word and carry
on.

_Visual: a hand-filled grid; a word writes on the strip, its row lights, the
row's tallies become a strip of die faces, a face lands, the next word writes._

_Reads (draft):_ 1. start from any word with a row; 2. faces by tallies, roll,
write; 3. no row, pick again.

**BEN (TC):** Pick a starting word and roll.

### Ending: ledger

**USHINI (VO):** Four jobs in your group. A reader finds the row, a filler puts
one counter per mark in the cup, a drawer pulls one out, and a writer writes the
word down. Start after a full stop.

_Visual: the ledger sheets fanned, the cup, the counter tub, the paper strip:
each lights in turn as its job is named._

_Reads (draft):_ 1. four jobs; 2. one counter per mark; 3. start from the full
stop.

**BEN (TC):** Reader, find the full stop. Let's see what your book says.

### Ending: cutouts

**USHINI (VO):** Your slips are spread out on the table. Write down a starting
word, find a slip that starts with it, and write down its second word. Then find
a slip that starts with that.

_Visual: a spread of cutouts; a word writes, a matching slip lifts, its second
word writes, the next match lifts._

_Reads (draft):_ 1. each slip is one pair; 2. match the first word, write the
second; 3. chain them like dominoes.

_Reads note:_ check with Ben how groups choose between several matching slips;
the draw only stays fair if the pick is blind.

**BEN (TC):** Start chaining.
