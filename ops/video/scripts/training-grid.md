# Training (grid)

**Key idea:** language models learn by counting patterns in text and tracking
which words follow other words.

**Plays:** My First Language Model, start of the Training section.

## Beat sheet

1. promise: by the end you'll have a model that fits on a single sheet of paper
2. pairs: works best in pairs---one reads, one tallies, swap halfway
3. the book in front of you IS the training data
4. tokenising: lowercase everything; full stops and commas are words too (they
   get their own row and column)
5. bigrams: pairs of consecutive words ("the cat sat" → "the→cat", "cat→sat")
6. start at the first word---walk pair by pair to the end
7. grid mechanics: each unique word gets one row and one column; tally where the
   first word's row meets the second word's column
8. FAQ, new word: add a row and column the first time you see it
9. FAQ, turning the page: keep going---last word of one page pairs with the
   first word of the next
10. reveal: the completed grid IS the model---the same kind of information
    a large language model stores (which words follow which), at a vastly smaller scale
11. CTA: start counting

## Script

**USHINI (TC):** Time to train a language model. By the end of this you'll have
built one, and it'll fit on a single sheet of paper.

**BEN:** There's a book in front of you---a picture book, a chapter from a
novel, whatever it is. That book is your training data. Everything your model
will ever know comes from those pages.

_Visual: the desk, top-down: an open picture book beside a blank grid sheet and
a pencil. The book's line, "Run, Spot, run. See Spot run.", lifts off the page
and settles above the grid as a row of word tiles; the rest of the desk dims._

**USHINI (VO):** First step: break the text into individual words, and lowercase
everything. One quirk worth knowing: treat punctuation like full stops and
commas as words too. They get their own row and column, just like the real
words.

_Visual: the tiles drop to lowercase one at a time; the full stops and commas
split away from their neighbours into tiles of their own, so the line reads: run
, spot , run . see spot run ._

**BEN (VO):** Now look at pairs of consecutive words. These are called bigrams.
If the text says "the cat sat," you've got two bigrams: "the" followed by "cat,"
and "cat" followed by "sat."

_Visual: a small inset above the tiles: "the cat sat" as three tiles, a bracket
sliding over "the cat" and then "cat sat", each pair lifting out as it is named.
The inset fades and the bracket lands on the book's first pair, "run ,"._

**BEN (VO):** Your grid has words along the top and down the side. Start at the
very first word in the text: that's your first row. The word that follows it is
your first column. Tally the cell where they meet. Each word gets one row and
one column, so if "the" already has a row you keep tallying into it.

_Visual: the empty grid. "run" slides to the left edge as the first row header,
"," to the top as the first column header. The row band and the column band
light gold, the camera pushes in on the cell where they cross, and one tally
stroke draws on there._

**USHINI (VO):** Now slide forward by one word. The word that was your "next"
becomes your current word. Find its row, find the next word's column, tally.
Keep going through the text. Turning the page makes no difference---the last
word on one page pairs with the first word on the next. Some cells stack up with
tallies, others stay empty, and that's the model learning which words tend to
follow which.

_Visual: the bracket slides one tile along; the pair flies to its row and column
and a stroke draws on. Then faster, pair after pair, the camera pulling back as
headers appear and the grid fills. At the page edge the bracket spans "." and
"see" without a pause. By the end a few cells hold two strokes and most are
empty._

**BEN:** When you're done, look at what you've got. That grid of tally marks
_is_ the model---counts of which words follow which. That's the whole thing.
It's the same kind of information a large language model stores, just with billions of
word-pairs instead of dozens.

_Visual: the finished grid full frame, then a logarithmic pull-back: the sheet
shrinks to one cell of a grid a hundred times wider, then to a dot in a grid too
fine to read. Hold a beat. Cut back to the sheet on the desk._

**USHINI (TC):** It works best in pairs: one reads, one tallies, swap halfway.
Your book's in front of you. Start counting.
