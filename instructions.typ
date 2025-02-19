#import "template/anu-template.typ": anu-template, anu-colors

#show: anu-template.with(
  title: "My First LM Instructions",
  subtitle: "A Cybernetic Studio Project"
)

Ever wanted to train your own Language Model by hand? Now you can.

== Training Phase
<training>

You'll need:

- a nice fine-tipped pen
- a grid printout
- a couple of paragraphs of text (a paragraph from the newspaper, a page from a
  kids book, etc.)

The training procedure is:

+ write the _first_ word of the text in the *first blank row* and *first blank
  column* on the grid (in both cases it'll be right up near the logo in the
  top-left-hand corner)

+ look at the _next_ word in your text: write it in theh *next blank row* and
  *next blank column* on the grid (which will be the second row and second column)

+ make a tally score mark in the *first row, second column* grid cell, so that
  the grid cell contains a count of the number of times you've seen the second
  word following the first one

+ return to step 2 and continue through your text, and each time check if the next
  word is one you've seen already in the text (and if not, write it in the *next
  blank row* and *next blank column* as before) and add a new tally mark in the
  corresponding grid cell

Once you're done, your grid (and the total tally scores in each grid cell) is
what's called a _co-occurance table_, which keeps track of how often each word in
your text follows each other word. *This #emph[is] your language model.*

#pagebreak()

== Inference Phase
<inference>

Now comes the fun part: you can use your model to generate new text (this is
called _inference_ in Machine Learning jargon).

+ choose one of the words in your model as your starting word (this is your
  "prompt") and write it down---this is the start of your "generated text"

+ look along the row corresponding to that word:

  - if there's only one grid cell in the row that has any tally marks in it,
    that's your next word
  - if there are multiple grid cells with tally marks, choose one at random
    (weighted by the number of tally scores, so that e.g.~if one grid cell has 2
    marks and one has 3, then choose the first grid cell 40% of the time and the
    second grid cell 60% of the time)

+ write down the chosen word in your generated text, and repeat step 2 until
  you've generated as much text as you like (feel free to add punctuation as
  necessary to make the generated text make sense)

If you want to write a new sentence, go back to step 1 and choose a new starting
word (prompt).

== Extension activities

+ train a new model with a different training text, and compare the output
  generated text from the two models

+ swap your model with another group's model, and continue the training procedure
  with your text but with their model as a starting point

+ re-train your model, but with include special "tokens" for punctuation (e.g.~a
  "full stop" token, a "comma" token, etc.) and include these in your model

+ try training a model with a different "n-gram" size (e.g.~a bigram model where
  you look at two successive words to determine the next word), although note that
  the grid gets pretty big pretty fast---if there are $n$ distinct words in your
  text then you'll need $n^2$ rows in your grid

== Further reading

The specific type of model you've built is called a unigram model (a type of
#link("https://en.wikipedia.org/wiki/N-gram")["n-gram" model];, where "n" is 1).
Each "next word" choice is determined by the "current word" only. These models are
different (and less sophisticated) than the Transformer-based models like GPT
which now dominate the LLM landscape, but there's evidence that a sufficiently
large n-gram model can get you #link("https://arxiv.org/abs/2407.12034")[almost
80% of the way there to a fancier GPT-based model].

Having said that, GPT-4 has around 1.75T parameters, which when printed out
(assuming one 1cm#super[2] grid cell per parameter) would cover 175km#super[2]---enough
to cover #link("https://en.wikipedia.org/wiki/Melbourne_Cricket_Ground")[the MCG]
_ten thousand times_.

== Appendix: weighted randomness with dice
<weighted-randomness>

You'll need a source of "weighted" random numbers for the "select the next word
based on the tally scores" part of the Inference procedure described above.

If you've got a d6 (a normal 6-sided die) it's not too tricky. Here's an example:

- if there's one column (i.e. one potential next word) with one tally mark and
  another with two tally marks, then roll the dice---if it's 1 or 2 choose the
  first column, otherwise choose the second column

Remember: it doesn't actually matter the _absoulte_ number of tallies in each
column, just the _relative_ number of tallies compared to all the other columns.
So if the two potential next words have e.g. 1 tally each or 4 tallies each it
doesn't matter, you just need to choose between them such that there's an equal
chance of each one (so dice 1-3 means the first one, 4-6 means the second one).

If you end up with a larger language model and need more than a D6, you could use
a d20 (a 20-sided die) and use a similar approach.
// TODO make a nice diagram of the above "partition the D20 range" approach
// #import "@preview/cetz:0.3.2"
// #cetz.canvas({
//   import cetz.draw: *

//   let anu-gold = rgb("#be830e")
//   let anu-copper = rgb("#be4e0e")
//   let anu-teal = rgb("#0085ad")

//   rect((0, 0), (rel: (1, 1)), radius: .1, stroke: anu-copper)
// })
