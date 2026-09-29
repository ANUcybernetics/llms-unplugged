# Real models

**Key idea:** a real model runs the same loop as your grid; what's different is
how much it looks at, how it stores what it learned, and the extra training that
makes it answer rather than continue.

**Plays:** standalone, and in class as the close of a workshop, or before a
discussion of what real models can and can't do.

**Builds on:** the "language of language models" slides at the end of each grid
partial and `partials/scaling-up.mdx`. Numbers are from `data/` via the CLI: the
magpie (24 words, 576 boxes), _Frankenstein_ (7,023 words, 49 million boxes,
41,018 of them not empty: 0.08%). A real model's vocabulary is on the order of a
hundred thousand tokens, so ten billion boxes for one word of context. In the
magpie, the rows for _dog_ and _postie_ are identical (full stop 2, runs 2).

## Beat sheet

1. hook: is your grid a tiny Claude or ChatGPT? Yes and no. Here's exactly which
   parts
2. the same: the loop. Text in, one next word (token) out, drawn by chance,
   written down, repeat
3. **beyond:** powers of ten on real counts. The magpie grid (576 boxes), then
   _Frankenstein_ (49 million boxes, drawn as a heatmap: 0.08% lit), then a real
   model's vocabulary: ten billion boxes for one word of context
4. different 1, context: a real model looks at the whole conversation, not the
   last word
5. **beyond:** more context on _Frankenstein_: one word, then two, then five.
   Nonsense, then nearly prose, then whole sentences copied from the book
6. different 2, storage: the grid can't grow that far, so a real model shares
   what it learned across words. The magpie's _dog_ and _postie_ rows are the
   same; a model that notices can handle a pair it never saw
7. different 3, tokens: pieces of words, not words
8. different 4, post-training: a round of extra training so it answers you
   rather than continuing your text
9. close: none of that changes the loop. Everything else it does, it does one
   token at a time

## Script

**USHINI (TC):** So is your grid a tiny Claude or ChatGPT? Yes and no. Here's
exactly which parts are the same, and which aren't.

**BEN (VO):** The same part is the loop. Text goes in. The model gives every
possible next word a chance, one gets drawn, it's written down, and round it
goes again. Your grid does that. So does Claude.

_Visual: the magpie grid on the desk, a paper strip beside it. The loop draws on
around them in one stroke, gold arrowheads: last word, row, chances, draw,
write. A word writes on and the loop goes round once more._

_Reads:_ 1. the loop: look up, chances, draw, write; 2. real models run it too.

**USHINI (VO):** What's different is size. Your magpie grid has five hundred and
seventy-six boxes.

_Visual: the magpie grid alone, 24 by 24, its tallied boxes lit._

_Reads:_ 1. a small book makes a small grid.

**BEN (VO):** _Frankenstein_ has seven thousand different words. That's
forty-nine million boxes. And look how few have anything in them.

_Visual: a logarithmic pull-back from the magpie grid, which shrinks to a speck
in the corner of the Frankenstein grid, drawn as a heatmap from the real counts:
each box a point, lit by its count, the empty ones the desk colour. Almost all
of it is dark; a few bright bands (after "the", after full stops) and a faint
scatter._

_Reads:_ 1. a real book makes a vast grid; 2. almost every box is empty.

**USHINI (VO):** A real model knows about a hundred thousand words and bits of
words. One word of context: ten billion boxes. And nearly every one of them
empty, because nobody has ever written most pairs.

_Visual: the pull-back continues until the Frankenstein heatmap is itself a
speck, and the frame is a grid too fine to draw, rendered as an even dark field
with the rare glint._

_Beyond:_ "too big for a table" is only believable when you see the table empty
out as it grows; the heatmap shows that almost every pair has never been seen,
which is the problem real models are built to solve.

_Reads:_ 1. a real vocabulary makes an impossible grid; 2. the empty boxes are
the problem.

**BEN:** And that's just one word of context. Your grid only ever looks at the
last word. A real model looks at the whole conversation.

_Visual: back on the desk: the strip, with the last word lit and the rest dim.
Then every word on it lights._

_Reads:_ 1. the grid looks back one word; 2. a real model looks back at
everything.

**USHINI (VO):** Here's why that matters. _Frankenstein_, looking back one word.
Then two. Then five.

_Visual: three strips of generated text, one per context length, each writing
itself on at reading pace from a model built with the CLI on the real book: the
first wanders, the second nearly reads as prose, the third runs whole sentences
straight out of the book, which light as matches against a page of the novel
beside it._

_Beyond:_ shows both why context helps and why it isn't free: with one book, a
five-word context can only find the book's own sentences, so it memorises
instead of generalising.

_Reads:_ 1. more context, better text; 2. too much context for too little text
just copies the book.

_Reads note:_ the three samples are picked at build time from real CLI runs; the
lines don't quote them, so any seed that shows the three stages works.

**BEN (VO):** So a real model can't keep a box for every pair. Instead it shares
what it learns across words. Look at the magpie: the rows for "dog" and "postie"
are exactly the same. A model that notices that can guess about the postie from
what it saw the dog do.

_Visual: the magpie grid; the rows for "dog" and "postie" light and slide
together, their tallies lining up box for box: full stop 2, runs 2. A faint
thread joins the two headers._

_Reads:_ 1. two words can behave the same way; 2. a real model stores that
likeness instead of every pair.

**USHINI:** It doesn't use whole words, either. It uses tokens: common words
whole, rarer ones in pieces.

_Visual: a strip reads "the magpie swooped unexpectedly"; "swooped" and
"unexpectedly" split into pieces at their seams, "swoop" "ed", "un" "expect"
"edly"._

_Reads:_ 1. tokens are words or pieces of words.

_Reads note:_ the split shown should be a real tokeniser's split of those words,
checked at build time, not an invented one.

**BEN (VO):** And after all that reading, it gets a second round of training,
with people rating its replies. That's what makes it answer your question
instead of just carrying on your text.

_Visual: a strip reads "what do magpies eat?"; a raw continuation writes after
it ("what do possums eat? what do") and wipes away. A thumbs-up and a thumbs-
down mark flick beside two candidate replies; the preferred one writes on:
"mostly insects and worms"._

_Reads:_ 1. a model fresh from reading just continues text; 2. extra training
with people's ratings makes it answer.

**USHINI:** More context, a smarter way to store it, pieces of words, and a
second round of training. None of it changes the loop.

**BEN (TC):** Everything Claude or ChatGPT does, it does one token at a time.
Just like you did.
