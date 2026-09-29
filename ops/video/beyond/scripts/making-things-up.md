# Making things up

**Key idea:** a model that only knows what comes next will say fluent things
that aren't true, and the likeliest ones aren't the true ones; it's built to be
likely, not right.

**Plays:** standalone, and in class after generation (any format): the question
every class asks about AI, answered from the model they just used.

**Builds on:** the generation run of any deck (the viewer has drawn a sentence
from counts), and the magpie model from the generation videos. Numbers are from
the magpie counts, taking every sentence from a full stop to a full stop or
exclamation mark, up to ten words and marks long: 79 sentences, 7 of them in the
book. From a full stop, "Swoop!" is the likeliest sentence (18%), then "It
watches." (12%), then "Here comes the fence." (7.4%), which the book never says;
"Here comes the dog.", which it does, is 2.5%. About four draws in ten land on
one of the book's own seven sentences.

## Beat sheet

1. hook: AI models sometimes state things that are flat wrong, confidently.
   People call it hallucinating. Watch a model do it, on paper
2. the book's world: in _The magpie_, the magpie swoops and the dog runs. The
   fence stays where it is
3. ask the model for sentences: "Down comes the dog. Swoop!" The dog swoops. The
   book never said that, and in the book's world it isn't true
4. why: the model never stored "the magpie swoops". It stored that _the_ is
   followed by _dog_ sometimes and _magpie_ sometimes, and that _swoop_ can
   follow a full stop. Every pair in that sentence is in the book; the sentence
   isn't
5. **beyond:** the likeliest sentences, ranked. "Here comes the fence." is the
   third likeliest thing this model says, well ahead of "Here comes the dog.",
   which the book actually says. The fence wins because _fence_ is what follows
   _the_ most often
6. **beyond:** the tree recoloured: paths the book actually says in one colour,
   the rest in another. Of the 79 short sentences it can write, 7 are in the
   book
7. real models: far more context and far more text make true continuations far
   likelier, which is why they're usually right. But nothing in the loop checks.
   Likely is all it's built for
8. classroom close: which of your own generated sentences are true? How would
   you know?

## Script

**BEN (TC):** AI models sometimes say things that are flat wrong, and say them
with total confidence. People call it hallucinating. Let's watch a model do it,
on paper.

_Visual: the finished magpie grid on the desk, top-down, beside the closed
picture book._

_Reads:_ 1. this is a model we can check by hand.

**USHINI (VO):** First, the book's world. In _The magpie_, the magpie swoops,
the postie and the dog run, and the fence stays exactly where it is.

_Visual: the book opens; its lines float up in the book's type, and the three
facts light in them one at a time: "Down comes the magpie. Swoop!", "The dog
runs", "It sits on the fence."_

_Reads:_ 1. the book has its own facts; 2. the magpie is the one that swoops.

**BEN (VO):** Now ask the model for a couple of sentences. "Down comes the dog.
Swoop!"

_Visual: the book closes. A strip of paper writes itself one word at a time,
each word lighting its row on the grid as it lands: "down comes the dog . swoop
!"_

_Reads:_ 1. the model writes two sentences, one word at a time.

**USHINI:** So the dog swoops. The book never said that. And in the book's
world, it isn't true.

_Visual: the strip's words rearrange into a small scene in flat vector: the dog
mid-air over the fence, a stamp-like red cross beside it; beside that, the
book's own line "Down comes the magpie. Swoop!" in its type._

_Reads:_ 1. the sentence is fluent; 2. it isn't true in the book.

**BEN (VO):** Look at how it got there. "Down comes the" is in the book. "The
dog" is in the book. A full stop after "dog", then "swoop", both in the book.
Every pair is true. The sentence isn't.

_Visual: a gold bracket walks along the strip one pair at a time; for each pair,
the matching box on the grid lights and, above, a line of the book where that
pair occurs. The bracket reaches the end; every pair has a source, and the whole
sentence has none._

_Reads:_ 1. every pair in the sentence came from the book; 2. the sentence as a
whole didn't; 3. the model only ever checked pairs.

**USHINI (VO):** And it's not bad luck. Rank every sentence this model can write
by how likely it is. "Swoop!" first. "It watches." Then "Here comes the fence."

_Visual: the strip clears. A ranked list builds downward, each sentence with a
bar as long as its chance: "swoop !", "it watches .", "here comes the fence .",
"down comes the fence .", "it sits on the fence .", and on down. "here comes the
fence ." lights._

_Beyond:_ one bad sentence looks like bad luck; ranking all of them shows the
model preferring the common over the true, which is the mechanism, not an
accident.

_Reads:_ 1. every sentence has a likelihood; 2. "Here comes the fence." is near
the top.

**BEN (VO):** The fence never comes anywhere. But it's the third likeliest thing
this model says, three times as likely as "Here comes the dog", which the book
actually says. Why? Because in the book, "fence" is what follows "the" most
often, and a full stop always follows "fence".

_Visual: "here comes the dog ." lights further down the list, its bar a third
the length. On the grid, the box for "the fence", six tallies, glows._

_Reads:_ 1. a false sentence outranks a true one; 2. because its pairs are more
common.

**USHINI (VO):** Here's everything it could say in a short sentence.
Seventy-nine of them. Seven are in the book.

_Visual: the tree from the generation videos, cut at ten words: every path from
the full stop to a full stop or an exclamation mark, each branch as thick as it
is likely. The seven paths the book says turn one colour, the other seventy-two
another. The book's seven are thick, but so are plenty of the others._

_Beyond:_ makes "fluent" and "true" visibly two different things, measured, on a
model small enough to check by hand. The generation videos show the tree as
possibility; recoloured, it shows how much of that possibility is invention.

_Reads:_ 1. the model can say many sentences; 2. only a few are the book's; 3.
the rest sound just as right.

**BEN:** Nothing in the loop checks whether a sentence is true. The model is
built to be likely, not right.

**USHINI (VO):** Real models look at far more than one word, and learn from far
more than one book, so the likely thing is usually the true thing. That's why
they're right so often. But usually isn't always, and nothing in the loop
checks.

_Visual: the tree dims to a texture; from its edges it multiplies outward in a
logarithmic pull-back until its branches are a fine mesh. Most paths in the mesh
turn the "true" colour; a scatter of others stay the other colour._

_Reads:_ 1. more context and more text make true continuations likelier; 2.
nothing checks.

_Reads note:_ the pull-back's colour split is illustrative, not measured; if
that's a problem, the visual stays on the magpie tree and the line carries the
real-model claim alone.

**BEN (TC):** So look back at the sentences you wrote. Which ones are true? And
how would you know?
