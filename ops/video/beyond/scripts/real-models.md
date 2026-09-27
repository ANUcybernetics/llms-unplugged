# Real models

**Key idea (draft):** a real model runs the same loop as your grid; what's
different is how much it looks at, how it stores what it learned, and the extra
training that makes it answer rather than continue.

**Plays:** standalone, and in class as the close of a workshop, or before a
discussion of what real models can and can't do.

**Builds on:** the "language of language models" slides at the end of each grid
partial and `partials/scaling-up.mdx`. Numbers are from `data/`: the magpie (24
words, 576 boxes), Paterson (4,119 words, 17 million boxes, 16,460 not empty),
_Frankenstein_ (6,978 words, 49 million boxes, 0.08% not empty).

_Script to follow once Ben has noted `training` and `generation`._

## Beat sheet

1. hook: is your grid a tiny Claude or ChatGPT? Yes and no. Here's exactly which
   parts
2. the same: the loop. Text in, one next word (token) out, drawn by probability,
   written down, repeat
3. **beyond:** powers of ten on real counts. The magpie grid (576 boxes), then
   _Frankenstein_ (49 million boxes, drawn as a heatmap: 0.08% lit), then a real
   model's vocabulary of about a hundred thousand tokens: ten billion boxes for
   one word of context, and far more for two. _Beyond:_ "too big for a table" is
   only believable when you see the table empty out as it grows; the heatmap
   shows that almost every pair has never been seen, which is the problem real
   models are built to solve
4. different 1, storage: instead of a box per pair, learned numbers shared
   across words, so a model can handle a pair it never saw (it knows _dog_ and
   _postie_ behave alike). The booklet was a first step (only the non-empty
   boxes); this is the next
5. **beyond:** more context. _Frankenstein_ generated with one word of context,
   then two, then five: nonsense, then nearly prose, then whole sentences copied
   from the book. _Beyond:_ shows both why context helps and why it isn't free,
   since a big enough context with too little text memorises instead of
   generalising
6. different 2, context: a real model looks at the whole conversation, not the
   last word
7. different 3, tokens: pieces of words, not words
8. different 4, post-training: a round of extra training so it answers you
   rather than continuing your text
9. close: none of that changes the loop. Everything else it does, it does one
   token at a time
