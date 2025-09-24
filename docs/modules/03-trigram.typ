#import "utils.typ": *

#show: module-card.with(
  title: [Trigram Model],
  subtitle: "My First LM Module #3",
)

Extend the basic model to consider _two_ words of context instead of one,
leading to better text generation.

== You will need

- same as _Basic Training_ module
- additional paper for the three-column model

== Your goal

To create a trigram language model (a table this time, not a grid like your
bigram model from _Basic Training_) that captures the patterns in your input
text data.

== Key idea

More context leads to better predictions. A trigram model considers two previous
words instead of one, demonstrating the trade-off between context length and
data requirements that shapes all language models.

#pagebreak()

== Algorithm (training)

+ *create a four-column table* (see example on right)
+ *extract all word triples*: for each (overlapping) _word 1_/_word 2_/_word 3_
  "triple" in your text increment the _count_ column for that triple, or create
  a new row if it's a triple you've never seen before and set the count to 1
  (note: row order doesn't matter)

== Example (training)

Original text: _"See Spot run. See Spot jump."_

After the first four words (`see` `spot` `run` `.`) the model is:

#lm-table(
  ([Word1], [Word2], [Word3], [Count]),
  (
    ([`see`], [`spot`], [`run`], 1),
    ([`spot`], [`run`], [`.`], 1),
  ),
)

After the full text the model is:

#lm-table(
  ([Word1], [Word2], [Word3], [Count]),
  (
    ([`see`], [`spot`], [`run`], 1),
    ([`spot`], [`run`], [`.`], 1),
    ([`run`], [`.`], [`see`], 1),
    ([`.`], [`see`], [`spot`], 1),
    ([`see`], [`spot`], [`jump`], 1),
    ([`spot`], [`jump`], [`.`], 1),
  ),
)

== Algorithm (inference)

+ pick any row from your table; write down _word 1_ and _word 2_ from that row
  as your starting words
+ find all rows where _word 1_ and _word 2_ are exact matches for your two
  starting words, and make note of their _count_ columns
+ as per _Basic Inference_ roll a d20 weighted by the counts and select the
  _word 3_ associated with the chosen row
+ move along by _one_ word (so _word 2_ becomes your new _word 1_ and _word 3_
  becomes your new _word 2_) and repeat from step 2

== Example (inference)

+ from the table on the right, choose `see` + `spot` as your starting _word 1_
  and _word 2_:
+ find all rows with _word 1_ = `see` and _word 2_ = `spot`; in this case rows 1
  and 5 (both have _count_ == 1)
+ roll a d20 and write down the _word 3_ from the row chosen by the dice roll
+ move along by _one_ word (so _word 1_ is `spot` and _word 2_ is either `run`
  or `jump` depending on your dice roll) and repeat from step 2
