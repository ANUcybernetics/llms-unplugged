# Making things up

**Key idea (draft):** a model that only knows what comes next will say fluent
things that aren't true, and the likeliest ones aren't the true ones; it's built
to be likely, not right.

**Plays:** standalone, and in class after generation (any format): the question
every class asks about AI, answered from the model they just used.

**Builds on:** the generation run of any deck (the viewer has drawn a sentence
from counts), and the magpie model from `generation`. All numbers below are from
the magpie counts (every sentence from a full stop to a full stop or exclamation
mark, up to ten tokens).

_Script to follow once Ben has noted `training` and `generation`._

## Beat sheet

1. hook: AI models sometimes state things that are flat wrong, confidently.
   People call it hallucinating. Watch a model do it, on paper
2. the book's world: in _The magpie_, the magpie swoops and the dog runs. The
   fence stays where it is
3. ask the model for sentences. "Down comes the dog. Swoop!" The dog swoops. The
   book never said that, and in the book's world it isn't true
4. why: the model never stored "the magpie swoops". It stored that _the_ is
   followed by _dog_ sometimes and _magpie_ sometimes, and that _swoop_ can
   follow a full stop. Every pair in that sentence is true; the sentence isn't
5. **beyond:** the likeliest sentences, ranked. "Here comes the fence." is the
   third likeliest thing this model says (7%), ahead of "Here comes the dog."
   (2.5%), which the book actually says. The fence wins because _the fence_ is
   the commonest pair in the book. _Beyond:_ one bad sentence looks like bad
   luck; ranking all of them shows the model preferring the common over the
   true, which is the mechanism, not an accident
6. **beyond:** the tree from `generation` recoloured: paths the book actually
   says in one colour, the rest in another. Of the 79 short sentences it can
   write, 7 are in the book, and they get about half the draws. _Beyond:_ makes
   "fluent" and "true" visibly two different things, measured, on a model small
   enough to check by hand
7. real models: far more context and far more text make true continuations far
   likelier, which is why they're usually right. But nothing in the loop checks.
   Likely is all it's built for
8. classroom close: which of your own generated sentences are true? How would
   you know?
