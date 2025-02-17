#import "template/anu-template.typ": anu-template

#show: doc => anu-template(
  title: "My First LM Instructions",
  author: "Cybernetic Studio",
  doc
)

Ever wanted to train your own Language Model by hand? Now you can.

== Training Phase

You'll need:

- a nice fine-tipped pen
- a grid printout
- a couple of paragraphs of text (a paragraph from the newspaper, a
  page from a kids book, etc.)

The training procedure is:

+ write the #emph[first] word of the text in both of the first
  blank row and column on the grid---they'll be the spaces directly
  below and to the left of the logo in the top-left-hand corner

+ look at the #emph[next] (i.e.~the second) word in your
  text: if it's a new word that doesn't already have a row/column on
  your grid write that word in the next availble blank column & row on
  the grid (but if you have already seen that word and it's already on the
  grid, you don't need to do anything)

+ make a tally score mark in the first word's row and the second word's
  column, so that the grid cell contains a count of the number of times
  you've seen the two (row and col) words #emph[following] each other

+ go back to step 2, and continue through your text until you've
  finished (or until you've filled up the grid)

Once you're done, your grid (with the tally scores in each grid cell)
#emph[is] your language model.

#pagebreak()

== Inference Phase

Now comes the fun part: you can use your model to generate new text.

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

A note on random choice: you can use a dice roll, an online random
number generator (e.g.~#link("https://randomnumbergen.com")[this one];),
or some other approach. If you only have a uniform random number
generator (e.g.~a dice), you can simulate weighted random choice (which
is what you need---because your generated text needs to follow the same
probability distribution as specified by the tallies in the model grid).

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
