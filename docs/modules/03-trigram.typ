#import "@local/anu-typst-template:0.1.0": *
#import "llm-utils.typ": *

#set page(paper: "a4", flipped: true, columns: 2)

#show: anu-template.with(
  title: [Trigram Model],
  socy_logo: true,
  dark: sys.inputs.at("anu_theme", default: "dark") == "dark",
)

Extend the basic model to consider _two_ words of context instead of one,
leading to better text generation.

== You will need

- same as _Basic Training_ module
- additional paper for the three-column model

== Key idea

More context leads to better predictions. A trigram model considers two previous
words instead of one, demonstrating the trade-off between context length and
data requirements that shapes all language models.

== Algorithm

=== Training

+ *create a four-column table* with headers _word 1_ | _word 2_ | _word 3_ |
  _count_ (note this isn't quite the same as the grid from _Basic Inference_)
+ *extract all word triples*: for each (overlapping) 3-word "triple" in your
  text increment the _count_ column for that triple (include `,` and `.` as
  words as before), or create a new row if it's a triple you've never seen
  before and set the count to 1

Note: the order of the rows doesn't matter, so you can try and keep the rows
sorted (grouped by _word 1_) but don't stress too much if they get split up.

=== Inference

+ pick any row from your table; write down _word 1_ and _word 2_ from that row
  as your starting words
+ find all rows where _word 1_ and _word 2_ are exact matches for your two
  starting words, and make note of their _count_ columns
+ as per _Basic Inference_ roll a d20 weighted by the counts and select the
  _word 3_ associated with the chosen row
+ move along by _one_ word (so _word 2_ becomes your new _word 1_ and _word 3_
  becomes your new _word 2_) and repeat from step 2

== Example

=== Training

Original text: _"See Spot run. See Spot jump. See Spot run."_

Prepared text: `see` `spot` `run` `.` `see` `spot` `jump` `.` `see` `spot` `run`
`.`

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
    ([`see`], [`spot`], [`run`], 2),
    ([`spot`], [`run`], [`.`], 2),
    ([`run`], [`.`], [`see`], 2),
    ([`.`], [`see`], [`spot`], 2),
    ([`see`], [`spot`], [`jump`], 1),
    ([`spot`], [`jump`], [`.`], 1),
    ([`jump`], [`.`], [`see`], 1),
  ),
)

=== Inference

+ choose `see` + `spot` as your starting _word 1_ and _word 2_:
+ find all rows with _word 1_ = `see` and _word 2_ = `spot`; in this case the
  first row (_count_ == 2) and the fourth row (_count_ == 1)
+ roll a d20 and write down the _word 3_ from the row chosen by the dice roll
+ move along by _one_ word (so _word 1_ is `spot` and _word 2_ is `run`) and
  repeat from step 2
