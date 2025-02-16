# My First LM

Ever wanted to train your own Language Model---by hand? Now you can.

## Instructions

Using [typst](https://typst.app/), generate the `grid.pdf` file with

    typst compile grid.typ

Rrint it out on A3 paper (or bigger, if you have access to a large format
printer).

### Model Training

You'll need:

- a nice fine-tipped pen
- some text (paragraph from the newspaper, a kids book, a couple of paragraphs
  is about the right amount)
- a printout of the `grid.pdf` file (where you'll create your model)

The training procedure is:

1. write the _first_ word of the text in _both of_ the first blank row and
   column on the grid---they'll be the spaces directly below and to the left of
   the logo in the top-left-hand corner

2. continuing on with the _next_ (i.e. the second) word in your text, if it's a
   new word that doesn't already have a row/column on your grid, write that word
   in the next availble blank column & row on the grid (if you have already seen
   that word and it's already on the grid, you don't need to do anything)

3. make a tally/count mark in the first word's row and the second word's column,
   so that the grid cell contains a count of the number of times you've seen the
   two (row and col) words _following_ each other

4. go back to step 2, and continue through your text until you've finished (or
   until you've filled up the grid)

Once you're done, your grid (with the tally scores in each grid cell) _is_ your
language model.

### Model Inference

Now comes the fun part---you can use your model to generate new text.

1. choose one of the words in your model as your starting word (this is your
   "prompt", in ChatGPT terms), and write it down---this is the start of your
   "generated text"

2. find the row for that word, and look along it:

   - if there's only one grid cell that has any tally marks in it, that's your
     next word
   - if there are multiple grid cells with tally marks, choose one at random
     (weighted by the number of tally scores, so that e.g. if one grid cell has
     2 marks and one has 3, then choose the first grid cell 40% of the time and
     the second grid cell 60% of the time)

3. Write down the chosen word in your generated text, and repeat step 2 until
   you've generated as much text as you like

If you want to write a new sentence, go back to step 1 and choose a new starting
word (prompt).

A note on random choice: you can use a dice roll, an online random number
generator (e.g. [this one](https://randomnumbergen.com)), or some other
approach. If you only have a uniform random number generator (e.g. a dice), you
can simulate weighted random choice (which is what you need---because your
generated text needs to follow the same probability distribution as specified by
the tallies in the model grid).

## Further reading

The specific type of model you've built is called a unigram model (a type of
["n-gram" model](https://en.wikipedia.org/wiki/N-gram), where "n" is 1). Each
"next word" choice is determined by the "current word" only. These models are
different (and less sophisticated) than the Transformer based models like GPT
which now dominate the LLM landscape, but there's evidence that a sufficiently
large N-gram model can get you
[almost 80% of the way there to a fancier GPT-based model](https://arxiv.org/abs/2407.12034).

Having said that, GPT-4 has around 1.75T parameters, which (assuming one 1cm^2
grid cell per parameter) would, if printed out, cover almost ten thousand (9932)
[MCGs](https://en.wikipedia.org/wiki/Melbourne_Cricket_Ground).

## Author

Ben Swift

This work is a project of the _Cybernetic Studio_ at the
[ANU School of Cybernetics](https://cybernetics.anu.edu.au).

## Licence

MIT

Fun With Dick and Jane reader: public domain (pdf downloaded from
[archive.org](https://ia800907.us.archive.org/31/items/funwithdickjane0000gray/funwithdickjane0000gray.pdf))
