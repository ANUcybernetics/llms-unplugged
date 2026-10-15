# Real models

**Key idea:** large language models generate text a token at a time, using
learned predictions and a limited context. Our grid makes that generation loop
visible, but its training and predictions work differently.

**Plays:** standalone, and in class as the close of a workshop, or before a
discussion of what real models can and can't do.

**Builds on:** the "language of language models" slides at the end of each grid
partial and `partials/scaling-up.mdx`. Numbers are from `data/` via the CLI: the
magpie (24 words, 576 boxes), _Frankenstein_ (7,023 words, 49 million boxes,
41,018 of them not empty: 0.08%). A real model's vocabulary is on the order of a
hundred thousand tokens, so ten billion boxes for one word of context. In the
magpie, the rows for _dog_ and _postie_ are identical (full stop 2, runs 2).

## Beat sheet

1. compare the paper model with a large language model
2. the shared text-generation loop: predict, draw, append, repeat
3. the magpie and Frankenstein grids, then a hypothetical 100,000-token grid
4. available context is larger but limited
5. three real samples show longer copied runs with more context
6. learned weights can share patterns across contexts; identical dog and postie
   rows illustrate a pattern our grid cannot share
7. a verified token split, including its uneven word boundaries
8. post-training uses example answers and feedback
9. return to text generation, with distinct prediction mechanisms

## Script

**USHINI (TC):** Your grid gives us a way to examine how Claude or ChatGPT
generates text. Let's compare the predictions they make.

**BEN (VO):** The shared part is the loop. Text goes in. The model assigns every
next token a chance. One is drawn, written down, and round it goes again. Your
grid uses words as tokens. So do our paper examples.

_Visual: the magpie grid on the desk, a paper strip beside it. The loop draws on
around them in one stroke, gold arrowheads: last word, row, chances, draw,
write. A word writes on and the loop goes round once more._

_Reads:_ 1. the loop: look up, chances, draw, write; 2. real models run it too.

**USHINI (VO):** We can see a limit of counting in the size of the table. Your
magpie grid has five hundred and seventy-six boxes.

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

**USHINI (VO):** Imagine a vocabulary of a hundred thousand tokens: words and
bits of words. A grid for every pair would need ten billion boxes, before we
even add more context.

_Visual: the pull-back continues until the Frankenstein heatmap is itself a
speck, and the frame is a grid too fine to draw, rendered as an even dark field
with the rare glint._

_Beyond:_ "too big for a table" is only believable when you see the table empty
out as it grows; the actual book counts establish sparsity; the larger grid
illustrates size only, without inventing counts for a neural model.

_Reads:_ 1. a hypothetical 100,000-token vocabulary needs ten billion pair
boxes; 2. storing every longer context would grow the table further.

**BEN:** Your grid only looks at the last word. A large language model uses the
text available in its context window. That can include earlier messages, but
there's a limit to how much fits.

_Visual: back on the desk: the strip, with the last word lit and the rest dim.
Then the words inside a bounded context window light. A faded older strip
outside the window stays dim._

_Reads:_ 1. the grid looks back one word; 2. a large model uses the text
available within its context window.

**USHINI (VO):** Here's _Frankenstein_, looking back one word. [beat 2] Then
two. [beat 2] Then five. [beat 3] In this last sample, every word comes straight
from the book. More context can also mean more copying.

_Visual: three strips of generated text, one per context length, each writing
itself on at reading pace from a model built with the CLI on the real book: the
first wanders, the second nearly reads as prose, the third runs whole sentences
straight out of the book, which light as matches against a page of the novel
beside it._

_Beyond:_ shows both why context helps and why it isn't free: this chosen sample
with five words of context copies a long passage. Longer context can increase
copying; it does not guarantee it for every sample.

_Reads:_ 1. these samples share longer runs with the book as context grows; 2.
the final sample copies the passage shown.

_Reads note:_ the three samples are picked at build time from real CLI runs; the
lines don't quote them, so any seed that shows the three stages works.

**BEN (VO):** Large language models learn by adjusting weights to improve their
predictions. Those weights can capture patterns across different contexts. Look
at the magpie: the rows for "dog" and "postie" are exactly the same. Our grid
stores them separately. A neural model can learn similarities like these and use
them in combinations it never saw during training.

_Visual: the magpie grid; the rows for "dog" and "postie" light and slide
together, their tallies lining up box for box: full stop 2, runs 2. A faint
thread joins the two headers._

_Reads:_ 1. two words can behave the same way; 2. our grid stores separate
counts; 3. shared learned patterns can support predictions in new combinations.

**USHINI:** It uses tokens, which can be whole words or pieces. Here, "magpie"
splits into "mag" and "pie". [beat] "Unexpectedly" stays whole. The splits
depend on the tokeniser.

_Visual: a strip reads "the magpie swooped unexpectedly"; "magpie" splits into
"mag" and "pie", "swooped" into "swo" and "oped"; "the" and "unexpectedly" stay
whole. These are the verified o200k_base pieces; spaces are retained in the
generated data before display._

_Reads:_ 1. tokens are words or pieces of words.

_Reads note:_ build-real-models.py verifies the displayed split with tiktoken
o200k_base; this example does not claim all models use that tokeniser.

**BEN (VO):** After learning from reading, a model can get further training.
People write example answers, and provide feedback by rating candidate replies.
Training on examples and feedback helps it answer questions and follow
instructions.

_Visual: a strip reads "what do magpies eat?"; a raw continuation writes after
it ("what do possums eat? what do") and wipes away. An example answer appears
below the question first. Then a second candidate joins it and thumbs-up/down
marks show feedback on the candidates; the preferred one writes on: "mostly
insects and worms"._

_Reads:_ 1. an example demonstrates answering a question; 2. feedback compares
candidate replies; 3. both can guide further training.

**USHINI:** Our paper model looks up counts. A large language model computes its
predictions using learned weights and the available context. Both can use those
predictions to generate text.

**BEN (TC):** For text generation, we return to the loop: predict the next
token, choose one, add it to the text, and repeat.
