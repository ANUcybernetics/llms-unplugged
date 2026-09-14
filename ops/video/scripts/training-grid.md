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
    ChatGPT stores (which words follow which), at a vastly smaller scale
11. CTA: start counting

## Script

**USHINI (TC):** Time to train a language model. By the end of this you'll have
built one, and it'll fit on a single sheet of paper.

**BEN:** There's a book in front of you---a picture book, a chapter from a
novel, whatever it is. That book is your training data. Everything your model
will ever know comes from those pages.

_Visual: a book lying open, then the text highlighted word by word._

**USHINI (VO):** First step: break the text into individual words, and lowercase
everything. One quirk worth knowing: treat punctuation like full stops and
commas as words too. They get their own row and column, just like the real
words.

**BEN (VO):** Now look at pairs of consecutive words. These are called bigrams.
If the text says "the cat sat," you've got two bigrams: "the" followed by "cat,"
and "cat" followed by "sat."

_Visual: StaticGrid, empty at first. Words appearing along the row and column
headers._

**BEN (VO):** Your grid has words along the top and down the side. Start at the
very first word in the text: that's your first row. The word that follows it is
your first column. Tally the cell where they meet. Each word gets one row and
one column, so if "the" already has a row you keep tallying into it.

_Visual: StaticGrid animating---tally marks appearing as bigrams are processed,
the grid gradually filling up._

**USHINI (VO):** Now slide forward by one word. The word that was your "next"
becomes your current word. Find its row, find the next word's column, tally.
Keep going through the text. Turning the page makes no difference---the last
word on one page pairs with the first word on the next. Some cells stack up with
tallies, others stay empty, and that's the model learning which words tend to
follow which.

**BEN:** When you're done, look at what you've got. That grid of tally marks
_is_ the model---counts of which words follow which. That's the whole thing.
It's the same kind of information ChatGPT stores, just with billions of
word-pairs instead of dozens.

**USHINI (TC):** It works best in pairs: one reads, one tallies, swap halfway.
Your book's in front of you. Start counting.
