#import "template/anu-template.typ": anu-template

#show: doc => anu-template(
  title: "My First LM Instructions",
  author: "Cybernetic Studio",
  doc,
)

Ever wanted to train your own Language Model by hand? Now you can.

== Training Phase
<training>

You'll need:

- a nice fine-tipped pen
- a grid printout
- a couple of paragraphs of text (a paragraph from the newspaper, a
  page from a kids book, etc.)

The training procedure is:

+ write the _first_ word of the text in the first
  blank *row* on the grid (for the first word, this will be the space directly
  below the logo in the top-left-hand corner)

+ look at the _next_ (i.e.~the second) word in your text: write it in the
  first blank *column* on the grid

+ make a tally score mark in the *first grid cell* (i.e.~the first word's row
  and the second word's column), so that the grid cell contains a count of
  the number of times you've seen the second word _following_ the second one

+ go back to step 1, but this time writing the _second_ word on the next blank
  row and the _third_ word on the next blank column... and make a tally score
  mark in the corresponding cell

+ continue through your text, each time writing the next word in the next
  blank (unless you've seen that word before and it already has a row/column)
  and add a new tally mark in the corresponding grid cell

Once you're done, your grid (and the total tally scores in each grid cell) is
what's called a _co-occurance table_, which keeps track of how often each word
in your text follows each other word. *This #emph[is] your language model.*

#pagebreak()

== Inference Phase
<inference>

Now comes the fun part: you can use your model to generate new text
(this is called _inference_ in Machine Learning jargon).

+ choose one of the words in your model as your starting word (this is
  your "prompt") and write it down---this is the
  start of your "generated text"

+ look along the row corresponding to that word:

  - if there's only one grid cell in the row that has any tally marks
    in it, that's your next word
  - if there are multiple grid cells with tally marks, choose one at
    random (weighted by the number of tally scores, so that e.g.~if one
    grid cell has 2 marks and one has 3, then choose the first grid cell
    40% of the time and the second grid cell 60% of the time)

+ write down the chosen word in your generated text, and repeat step 2
  until you've generated as much text as you like (feel free to add
  punctuation as necessary to make the generated text make sense)

If you want to write a new sentence, go back to step 1 and choose a new
starting word (prompt).

== Extension activities

+ train a new model with a different training text, and compare the output generated
  text from the two models

+ swap your model with another group's model, and continue the training procedure
  with your text but with their model as a starting point

+ re-train your model, but with include special "tokens" for punctuation
  (e.g.~a "full stop" token, a "comma" token, etc.) and include these in your
  model

+ try training a model with a different "n-gram" size (e.g.~a bigram model
  where you look at two successive words to determine the next word), although
  note that the grid gets pretty big pretty fast---if there are $n$ distinct words
  in your text then you'll need $n^2$ rows in your grid

== Further reading

The specific type of model you've built is called a unigram model (a
type of #link("https://en.wikipedia.org/wiki/N-gram")["n-gram" model];,
where "n" is 1). Each "next word" choice is determined by the "current
word" only. These models are different (and less sophisticated) than the
Transformer-based models like GPT which now dominate the LLM landscape,
but there's evidence that a sufficiently large N-gram model can get you
#link("https://arxiv.org/abs/2407.12034")[almost 80% of the way there to a fancier GPT-based model].

Having said that, GPT-4 has around 1.75T parameters, which when printed out (assuming one
1cm#super[2] grid cell per parameter) would cover almost ten thousand (9932)
#link("https://en.wikipedia.org/wiki/Melbourne_Cricket_Ground")[MCGs].

== Appendix: weighted randomness with dice
<weighted-randomness>

You'll need a source of "weighted" random numbers for the "select the next word based on the tally scores" part of the
Inference procedure described above.

If you've got a D20 (a 20-sided die) there are a couple of different ways to do this:

- if the total number of tally scores in the row is less than or equal to 20,
  then just roll the dice and count along the row until you reach the
  (cumulative) count of tallies you rolled---if you go "off the end" of the row, re-roll
  the dice

- you can tally up the count for each grid cell, and then "split" the range
  of the D20 (which will always be a number between 1 and 20) into segments, e.g.
  - if there's 1 tally score in one cell and one in another, then the first
    cell gets the range 1-10 and the second cell gets the range 11-20
  - if there's 3 tally scores in one cell and 2 in another, then the first
    cell gets the range 1-12 and the second cell gets the range 13-20
  - if there's 1 tally score in one cell and 2 in another, then the first
    cell gets the range 1-8 and the second cell gets the range 9-20 (note this
    one is a bit off because 20 doesn't divide evenly by 3, but it's close enough)

There are pros and cons to both approaches: the first is simpler but if you roll a number higher
than the total number of tallies in the row then you have to do a lot of re-rolling. The second
doesn't require re-rolls, but involves a bit of head-maths to figure out the ranges.

// TODO make a nice diagram of the above "partition the D20 range" approach
// #import "@preview/cetz:0.3.2"
// #cetz.canvas({
//   import cetz.draw: *

//   let anu-gold = rgb("#be830e")
//   let anu-copper = rgb("#be4e0e")
//   let anu-teal = rgb("#0085ad")

//   rect((0, 0), (rel: (1, 1)), radius: .1, stroke: anu-copper)
// })
