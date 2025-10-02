// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See docs/LICENSE for details.

#import "@local/anu-typst-template:0.2.0": *

#set page(numbering: "1 / 1")

#show: anu.with(
  title: [_My First LM_ Instructions],
  subtitle: "A Cybernetic Studio Project",
  socy_logo: true,
)

// AIDEV-NOTE: Helper functions for visual aids
#let orange-text(content) = text(
  weight: "semibold",
  fill: anu-colors.copper,
  content,
)
#let blue-text(content) = text(
  weight: "semibold",
  fill: anu-colors.unilink-blue,
  content,
)

#let notepad(content) = {
  rect(
    fill: anu-colors.gold-tint,
    stroke: 1pt + anu-colors.gold,
    radius: 3pt,
    inset: 10pt,
    width: 100%,
  )[
    #text(font: "Libertinus Serif", size: 12pt)[#content]
  ]
}

#let training-data(content) = {
  rect(
    fill: anu-colors.teal-tint,
    stroke: 1pt + anu-colors.teal,
    radius: 3pt,
    inset: 10pt,
    width: 100%,
  )[
    #text(font: "Libertinus Serif", size: 12pt)[#content]
  ]
}

#let highlight-row(row-name) = (x, y) => {
  if y == 0 and x > 0 { anu-colors.copper-tint } else { white }
}

#let create-grid(
  headers,
  tallies,
  highlight: none,
  header-keys: none,
  row-headers: none,
  col-headers: none,
) = {
  let n = headers.len()
  let keys = if header-keys != none { header-keys } else { headers }
  let row-hdrs = if row-headers != none { row-headers } else { headers }
  let col-hdrs = if col-headers != none { col-headers } else { headers }
  v(0.5em)
  table(
    columns: (1fr,) * (n + 1),
    align: center + horizon,
    fill: if highlight != none { highlight } else { (x, y) => white },

    // Empty top-left cell
    [],
    // Column headers
    ..col-hdrs.map(h => text(weight: "semibold", h)),

    // Rows
    ..{
      let cells = ()
      for (i, row-header) in row-hdrs.enumerate() {
        cells.push(text(weight: "semibold", row-header))
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
  v(0.5em)
}

Ever wanted to train your own Language Model by hand? Now you can.

== Materials

You'll need:

- a grid (to write on)
- a pen (to write with)
- some text (to train your model on---a paragraph from the newspaper, a page
  from a kids book, etc.)
- a die (to roll)

== Part 1: Training
<training>

The first part of creating and using your own language model is to _train_ it.
Training is the process of "feeding" the model a bunch of text so that it learns
the patterns & relationships between words in that text.

Here's a worked example. Say you want to train your model on the text:

#training-data[#orange-text[See] Spot run. Run, Spot, run.]

"See" is the first word (shown in orange, above), so put that in the first row
and column of the grid. Just do it lowercase---the model ignores capitalisation.

#create-grid(
  ("see",),
  (:),
  col-headers: (orange-text[see],),
  row-headers: (orange-text[see],),
)

// helpful to keep things grouped together
#pagebreak()

#blue-text[Spot] follows #orange-text[See], so add a tally to the spot row/see
column

#training-data[#orange-text[See] #blue-text[Spot] run. Run, Spot, run.]

#create-grid(
  ("see", "spot"),
  ("see,spot": "|"),
  col-headers: ([see], blue-text[spot]),
  row-headers: (orange-text[see], [spot]),
)

Now we shift along by one word and repeat the process:

#training-data[See #orange-text[Spot] #blue-text[run]. Run, Spot, run.]

#create-grid(
  ("see", "spot", "run"),
  ("see,spot": "|", "spot,run": "|"),
  col-headers: ([see], [spot], blue-text[run]),
  row-headers: ([see], orange-text[spot], [run]),
)

Now we've reached the end of the sentence, but this language model doesn't care
about that---just keep going word-by-word:

#training-data[See Spot #orange-text[run]. #blue-text[Run], Spot, run.]

#create-grid(
  ("see", "spot", "run"),
  ("see,spot": "|", "spot,run": "|", "run,run": "|"),
  col-headers: ([see], [spot], blue-text[run]),
  row-headers: ([see], [spot], orange-text[run]),
)

Note that this is the first time the next word ("run") is a word you've already
seen, so you don't need to add a new row & column to the grid (just add a tally
to the grid cell that's already there).

Keep following this procedure until you reach the end of the text. When it's all
done, your grid should look like this: *this grid #emph[is] your language
  model.*

#create-grid(
  ("see", "spot", "run"),
  (
    "see,spot": "|",
    "spot,run": "||",
    "run,run": "|",
    "run,spot": "|",
  ),
)

The grid (and the total tally scores in each grid cell) is what's called a
_co-occurance table_, which keeps track of how often each word in your text
follows each other word.

#pagebreak()

== Part 2: Prediction
<prediction>

After you've trained your model, now comes the fun part: you can use your model
to generate new text (this is called _prediction_ in Machine Learning jargon).

Again, here's an example. Choose one of the words in your model as your starting
word (this is your "prompt") and write it down. Let's choose "Spot"---Write it
down on your notepad.

#notepad[Spot]

Find the "Spot" row on your grid.

#create-grid(
  ("see", "spot", "run"),
  (
    "see,spot": "|",
    "spot,run": "||",
    "run,run": "|",
    "run,spot": "|",
  ),
  highlight: (x, y) => {
    if y == 2 { anu-colors.copper-tint } else { white }
  },
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
    "run,spot": "|",
  ),
  highlight: (x, y) => {
    if y == 3 { anu-colors.copper-tint } else { white }
  },
)

Looking along the "run" row, there are two grid cells with tally marks: "run"
and "Spot". We need to choose one of them at random, and the fact that they each
have the same number of tally marks (1) means we want each option to be equally
likely.

So, assuming you've got a 20-sided dice, you can roll it and if it's 1-10,
choose "run", and if it's 11-20, choose "Spot".

For example, if you rolled a 15, you would choose "Spot", and your model's
output sentence (so far) would be

#notepad[Spot run Spot]

Now "Spot" is your current word again, and so (just like above) you only have
one option for the next word:

#notepad[Spot run Spot run]

Keep going with this procedure until you decide that sentence is complete (it's
your call). As a final step, you can punctuate it however you like, e.g.

#notepad[Spot - run Spot. Run!]

You can probably see that in this _very simple_ example, the generated text will
only bounce back and forth between "run" and "Spot". That's because this is a
very simple language model and it's trained on a _very_ small dataset. If you
train it on more data you'll get more interesting sentences.

If you want to write a new sentence, go back to step 1 and choose a new starting
word (prompt).

A note on randomness: say you've got a different model (grid) which looks like
this:

#create-grid(
  ("see", "spot", "run", "away"),
  (
    "see,spot": "|",
    "spot,run": "||",
    "run,run": "|",
    "run,spot": "||",
    "run,away": "|||",
    "away,spot": "|",
    "away,away": "||",
  ),
  highlight: (x, y) => {
    if y == 3 { anu-colors.copper-tint } else { white }
  },
)

Assuming your current word is still "run", the next word should be "spot" (2/6 =
1/3 of the time), run (1/6 of the time) and away (3/6 = 1/2 of the time). If
you've got a 6-sided die, it's easy: roll the die and if it's a 1 or 2, choose
"spot"; if it's a 3, choose "run"; if it's a 4, 5 or 6, choose "away". If the
total number of tally marks in your row doesn't divide evenly into number of
sides your die has, just do your best. For example, if you're using a 20-sided
die and you're currently on the "away" row in the grid above above, if the roll
is 1-7 choose "spot" and otherwise choose "away" (7/20 isn't exactly the same as
1/3, but it's close enough).

=== Further reading

The specific type of model you've built is called an #link(
  "https://en.wikipedia.org/wiki/N-gram",
)["n-gram" model]. Each next word choice is determined by the current word only.
These models are different (and less sophisticated) than the Transformer-based
models like GPT which now dominate the LLM landscape, but there's evidence that
a sufficiently large n-gram model can get you #link(
  "https://arxiv.org/abs/2407.12034",
)[almost 80% of the way there to a fancier GPT-based model].

Having said that, GPT-4 has around 1.75T parameters, which when printed out
(assuming one 1cm#super[2] grid cell per parameter) would cover
175km#super[2]---enough to cover #link(
  "https://en.wikipedia.org/wiki/Melbourne_Cricket_Ground",
)[the MCG] _ten thousand times_.


#pagebreak()

== Part 3: Predictions with a pre-trained model
<prediction-booklet>

Most of the time you won't want to train your own model from scratch. This _My
  First LM_ toolkit has you covered there as well---in the form of pre-trained
model "booklets".

They're not quite the same as the "grid" model you trained in Step @training.
Filling out the tally marks on the grid becomes pretty tricky when the
vocabulary size is large. You need _lots_ of rows and columns, but most of the
grid cells end up empty. So for larger language models (like in the booklets)
it's more convenient to represent the model in a format that's more like a
dictionary. Here's an example for the word "see":

#block[
  #set text(font: "Libertinus Serif", size: 10pt)

  #line(length: 100%, stroke: 0.5pt + luma(50%))
  #v(0.1em)
  #text("see", size: 16pt, weight: "bold")
  #h(0.6em)
  #box([#text(weight: "semibold")[40]|#text[her]])
  #h(0.5em)
  #box([#text(weight: "semibold")[60]|#text[him]])
  #h(0.5em)
  #box([#text(weight: "semibold")[80]|#text[you]])
  #h(0.5em)
  #box([#text(weight: "semibold")[90]|#text[them]])
  #h(0.5em)
  #box([#text(weight: "semibold")[100]|#text[the]])
  #h(0.5em)
  #box([#text(weight: "semibold")[110]|#text[spot]])
  #h(0.5em)
  #box([#text(weight: "semibold")[115]|#text[more]])
  #v(0.1em)
  #line(length: 100%, stroke: 0.5pt + luma(50%))
]

The cool maths kids call this a _sparse_ representation of the model (the grid
view is a _dense_ representation of the same information).

Here's how to interpret the booklet model for prediction---to generate new text.
Start with a single word (your initial prompt) as before, and "look it up" in
your larger booklet (just like looking up a word in the dictionary---it's in
alphabetical order).

In the example above the smaller words following "see" are the potential
candidates for the next word, and each one has a number corresponding to how
likely it is to be chosen (just like you did by hand with the tally marks in the
grid earlier).

In these booklets the "weight" numbers have been pre-calcuated based on a
120-sided die (a d120), so to sample the next word you can roll a d120 die and
count along until you find the first option with a number that's greater than or
equal to the number you rolled. In the above example, if you rolled a 65, your
next word would be "you".

There's one extra scenario to consider: some of the words in the booklet have
more than 120 possible next words, so we can't roll a d120 to select the next
one. Instead, some words have a small ♢ indicator like so:

#block[
  #set text(font: "Libertinus Serif", size: 10pt)
  #line(length: 100%, stroke: 0.5pt + luma(50%))
  #v(0.1em)
  #text("run", size: 16pt, weight: "bold")
  #h(0.3em)
  (#box[#text(weight: "bold")[3]♢])
  #h(0.6em)
  #box([#text(weight: "semibold")[350]|#text[slower]])
  #h(0.5em)
  #box([#text(weight: "semibold")[580]|#text[hard]])
  #h(0.5em)
  #box([#text(weight: "semibold")[750]|#text[now]])
  #h(0.5em)
  #box([#text(weight: "semibold")[867]|#text[free]])
  #h(0.5em)
  #box([#text(weight: "semibold")[899]|#text[wild]])
  #h(0.5em)
  #box([#text(weight: "semibold")[923]|#text[back]])
  #h(0.5em)
  #box([#text(weight: "semibold")[956]|#text[around]])
  #h(0.5em)
  #box([#text(weight: "semibold")[979]|#text[together]])
  #h(0.5em)
  #box([#text(weight: "semibold")[985]|#text[quickly]])
  #h(0.5em)
  #box([#text(weight: "semibold")[989]|#text[home]])
  #h(0.5em)
  #box([#text(weight: "semibold")[994]|#text[away]])
  #h(0.5em)
  #box([#text(weight: "semibold")[997]|#text[fast]])
  #h(0.5em)
  #box([#text(weight: "semibold")[998]|#text[uphill]])
  #h(0.5em)
  #box([#text(weight: "semibold")[999]|#text[downhill]])
  #v(0.1em)
  #line(length: 100%, stroke: 0.5pt + luma(50%))
]

The #box[#text(font: "Libertinus Serif", weight: "bold")[3]♢] means that you
need to find 3 × d10 (10-sided dice) and roll them. Choose them in any order to
create a 3-digit number (e.g. if you rolled a 3, a 4 and an 8 your number would
be 348) and then repeat the procedure as before (scanning along the candidates
until you find the first number greater than or equal to 348).

#pagebreak()

== Sampling procedures

Even after the training phase when model is constructed, you can choose
different sampling procedures to generate text with different characteristics.
There's no "best" sampling procedure---which one you choose depends on your
purpose in using the language model.

=== Weighted random sampling

(This is the procedure you just followed in the <prediction> section; refer back
to that section for a detailed walkthrough.)

You might choose this sampling procedure if your purpose in using the language
model is to generate text with the same co-occurance (which words follow which
other words) frequencies as the original training data.

1. choose any word from the vocabulary as your initial prompt (write it down)
2. find the row in your grid/entry in the model booklet that corresponds to your
  current word
3. roll the dice to choose (or "sample") the next word and write it down
4. use this new word as your next prompt and repeat the process (i.e. return to
  step 2)

Continue until you have generated your desired amount of text (e.g., a complete
sentence or paragraph).

=== Haiku sampling

Haiku (俳句) is a type of short form poetry that originated in Japan (#link(
  "https://en.wikipedia.org/wiki/Haiku",
)[Wikipedia]).

You might choose this sampling procedure if your purpose in using the language
model is to make new haikus.

1. choose any word from the vocabulary as your initial prompt (write it down)
2. count the number of syllables on your current notepad line
3. roll the dice and select the next word (as per the weighted random sampling
  procedure), *but* if that word takes you _over_ the syllable limit (5 for the
  first and third lines, 7 for the second line) roll again until you get a word
  that fits
4. use this new word as your next prompt and repeat the process (i.e. return to
  step 2)

Repeat as many times as you like (either by choosing a new prompt for the new
haiku, or by continuing on from the last word of your previous one).

=== No-repeat workday sampling

You might choose this sampling procedure if your purpose in using the language
model is to never repeat a word in a sentence (for whatever reason).

1. choose any word from the vocabulary as your initial prompt (write it down)
2. roll the dice and select the next word (as per the weighted random sampling
  procedure), *but* if the dice roll selects a word that has already been used
  in the current sentence, roll again until you get a new word that that you
  haven't used yet---if the _only_ next word candidate is used, start a new
  sentence (i.e. return to step 1)
3. use this new word as your next prompt and repeat the process (i.e. return to
  step 2)

=== Non-sequitur sampling

1. choose any word from the vocabulary as your initial prompt (write it down)
2. of all the potential next words, find the one that is _least_ likely to
  follow the current word (if you're using the booklet, this will be at the end
  of the list)
3. if there are several equally unlikely next words, choose one at random with a
  dice roll
4. use this new word as your next prompt and repeat the process (i.e. return to
  step 2)

You might choose this sampling procedure if your purpose in using the language
model is to generate text that is surprising and makes unexpected twists and
turns.

=== Two-year-old sampling

You might choose this sampling procedure if your purpose in using the language
model is to generate text that could plausibly have been said by a two-year-old.

1. choose any one-syllable word from the vocabulary as your initial prompt
  (write it down)
2.
  - *if* any of the potential next words are one-syllable words, select from
    those words _only_ as per the weighted random sampling procedure
  - *otherwise* select the word(s) with the next fewest syllablyes as per the
    weighted random sampling procedure
3. use this new word as your next prompt and repeat the process (i.e. return to
  step 2)

=== Poetry slam sampling (slampling?)

You might choose this sampling procedure if your purpose in using the language
model is to generate text, microdose LSD and become one with the universe.

1. choose any word from the vocabulary as your initial prompt (write it down)
2.
  - *if* any of the potential next words rhyme with the current word, select
    from those _rhyming words only_ as per the weighted random sampling
    procedure
  - *otherwise* select the next word as per the weighted random sampling
    procedure
3. use this new word as your next prompt and repeat the process (i.e. return to
  step 2)
