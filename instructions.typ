#import "@local/anu-typst-template:0.1.0": *

#show: anu-template.with(
  title: [_My First LM_ Instructions],
  subtitle: "A Cybernetic Studio Project",
  socy_logo: true
)

// AIDEV-NOTE: Helper functions for visual aids
#let orange-text(content) = text(weight: "bold", fill: rgb("#ff6600"), content)
#let blue-text(content) = text(weight: "bold", fill: rgb("#0066cc"), content)

#let notepad(content) = {
  rect(
    fill: rgb("fffacd"),
    stroke: 1pt + rgb("daa520"),
    radius: 3pt,
    inset: 10pt,
    width: 100%,
  )[
    #text(font: "Libertinus Serif", size: 12pt)[#content]
  ]
}

#let training-data(content) = {
  rect(
    fill: rgb("#f0f8ff"),
    stroke: 1pt + rgb("#4682b4"),
    radius: 3pt,
    inset: 10pt,
    width: 100%,
  )[
    #text(font: "Libertinus Serif", size: 16pt)[#content]
  ]
}

#let highlight-row(row-name) = (x, y) => {
  if y == 0 and x > 0 { rgb("ffcccc") }
  else { white }
}

#let create-grid(headers, tallies, highlight: none, header-keys: none, row-headers: none, col-headers: none) = {
  let n = headers.len()
  let keys = if header-keys != none { header-keys } else { headers }
  let row-hdrs = if row-headers != none { row-headers } else { headers }
  let col-hdrs = if col-headers != none { col-headers } else { headers }
  table(
    columns: (1fr,) * (n + 1),
    align: center + horizon,
    fill: if highlight != none { highlight } else { (x, y) => white },

    // Empty top-left cell
    [],
    // Column headers
    ..col-hdrs.map(h => strong(h)),

    // Rows
    ..{
      let cells = ()
      for (i, row-header) in row-hdrs.enumerate() {
        cells.push(strong(row-header))
        for (j, col-header) in col-hdrs.enumerate() {
          let row-key = keys.at(i)
          let col-key = keys.at(j)
          let key = row-key + "," + col-key
          if key in tallies {
            cells.push(tallies.at(key))
          } else {
            cells.push([])
          }
        }
      }
      cells
    }
  )
}

Ever wanted to train your own Language Model by hand? Now you can.

== Materials

You'll need:

- a grid (to write on)
- a pen (to write with)
- some text (to train your model on---a paragraph from the newspaper, a page from a
  kids book, etc.)
- a die (to roll)

== Training Phase
<training>

The first part of creating and using your own language model is to _train_ it.
Training is the process of "feeding" the model a bunch of text
so that it learns the patterns & relationships between words in that text.

Here's a worked example. Say you want to train your model on the text:

#training-data[#orange-text[See] Spot run. Run, Spot, run.]

"See" is the first word (shown in orange, above), so put that in the first row and column of the grid.
Just do it lowercase---the model ignores capitalisation.

#create-grid(("see",), (:), col-headers: (orange-text[see],), row-headers: (orange-text[see],))

#blue-text[Spot] follows #orange-text[See], so add a tally to the spot row/see column

#training-data[#orange-text[See] #blue-text[Spot] run. Run, Spot, run.]

#create-grid(("see", "spot"), ("see,spot": "|"), col-headers: ([see], blue-text[spot]), row-headers: (orange-text[see], [spot]))

Now we shift along by one word and repeat the process:

#training-data[See #orange-text[Spot] #blue-text[run]. Run, Spot, run.]

#create-grid(("see", "spot", "run"), ("see,spot": "|", "spot,run": "|"), col-headers: ([see], [spot], blue-text[run]), row-headers: ([see], orange-text[spot], [run]))

Now we've reached the end of the sentence, but this language model doesn't care about that---just keep going word-by-word:

#training-data[See Spot #orange-text[run]. #blue-text[Run], Spot, run.]

#create-grid(("see", "spot", "run"), ("see,spot": "|", "spot,run": "|", "run,run": "|"), col-headers: ([see], [spot], blue-text[run]), row-headers: ([see], [spot], orange-text[run]))

Note that this is the first time the next word ("run") is a word you've already seen, so you don't need to add a new row & column to the grid (just add a tally to the grid cell that's already there).

Keep following this procedure until you reach the end of the text. When it's all done, your grid should look like this: *this grid #emph[is] your language model.*

#create-grid(
  ("see", "spot", "run"),
  (
    "see,spot": "|",
    "spot,run": "||",
    "run,run": "|",
    "run,spot": "|"
  )
)

The grid (and the total tally scores in each grid cell) is
what's called a _co-occurance table_, which keeps track of how often each word in
your text follows each other word.

#pagebreak()

== Prediction Phase
<prediction>

After you've trained your model, now comes the fun part: you can use your model to generate new text (this is
called _prediction_ in Machine Learning jargon).

Again, here's an example. Choose one of the words in your model as your starting word
(this is your "prompt") and write it down. Let's choose "Spot"---Write it down on your notepad.

#notepad[Spot]

Find the "Spot" row on your grid.

#create-grid(
  ("see", "spot", "run"),
  (
    "see,spot": "|",
    "spot,run": "||",
    "run,run": "|",
    "run,spot": "|"
  ),
  highlight: (x, y) => {
    if y == 2 { rgb("ffeeee") }
    else { white }
  }
)

There's only one grid cell with a tally mark: "run". That's your next word.

#notepad[Spot run]

Now find the "run" row on your grid.

#create-grid(
  ("see", "spot", "run"),
  (
    "see,spot": "|",
    "spot,run": "||",
    "run,run": "|",
    "run,spot": "|"
  ),
  highlight: (x, y) => {
    if y == 3 { rgb("ffeeee") }
    else { white }
  }
)

Looking along the "run" row, there are two grid cells with tally marks: "run" and "Spot". We need
to choose one of them at random, and the fact that they each have the same number of
tally marks (1) means we want each option to be equally likely.

So, assuming you've got a 20-sided dice, you can roll it and if it's 1-10, choose "run", and if it's 11-20, choose "Spot".

For example, if you rolled a 15, you would choose "Spot", and your model's output sentence (so far) would be

#notepad[Spot run Spot]

Now "Spot" is your current word again, and so (just like above) you only have one option for the next word:

#notepad[Spot run Spot run]

Keep going with this procedure until you decide that sentence is complete (it's your call). As a final step, you can punctuate it however you like, e.g.

#notepad[Spot - run Spot. Run!]

You can probably see that in this _very simple_ example, the generated text will only bounce back and forth between "run" and "Spot". That's because this is a very simple language model and it's trained on a _very_ small dataset.
If you train it on more data (in the training phase above) you'll get more interesting sentences.

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
based on the tally scores" part of the Prediction procedure described above.

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
