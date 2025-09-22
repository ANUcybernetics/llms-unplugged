#import "@local/anu-typst-template:0.1.0": *
#import "llm-utils.typ": *

#show: anu-template.with(
  title: [Basic Inference],
  socy_logo: true,
)

Use a pre-trained model to generate new text through weighted random sampling.

== You will need

- your completed word co-occurence model from basic-training
- 20-sided dice (d20) for weighted sampling
- paper for writing generated text

== Key idea

Language models generate text by predicting one word at a time based on learnt
patterns. Your trained model provides the probabilities; dice rolls provide the
randomness that creates variety in output.

== Glossary

- *inference*: the process of using your trained model to generate new text
- *weighted random sampling*: choosing the next token with probability
  proportional to its frequency

== Algorithm

+ *choose a starting word*---pick any word from your vocabulary
+ *look at that word's row* to see possible next words and their counts
+ *roll dice weighted by the counts* (see the _Weighted Random Sampling_
   activity card for details)
+ *write down the chosen word* and use that as your next starting word
+ *repeat* from step 2 until you reach the desired length or a natural
   stopping point (e.g. a full stop `.`)

You can *try different starting words* to see how it affects the output.

== Example

Here's a pre-trained language model grid:

#table(
  columns: 7,
  align: (col, row) => if row == 0 { center } else { left },
  table.header([],[`see`],[`spot`],[`run`],[`jump`],[`.`],[`,`]),
  [`see`], [], [#tally(2)], [], [], [], [],
  [`spot`], [], [], [#tally(2)], [#tally(2)], [], [],
  [`run`], [], [], [], [], [#tally(2)], [],
  [`jump`], [], [], [], [], [#tally(2)], [],
  [`.`], [#tally(2)], [], [#tally(1)], [#tally(1)], [], [],
  [`,`], [], [#tally(2)], [], [], [], [],
)

To generate the next word after `see`:

- `see` (row) → `spot` (column); it's the only option, so write down `spot` as
  next word
- `spot` → `run` or `jump`; both have 2 occurrences, so each has a 50%
  chance---roll dice to choose
- let's say dice picks `jump`; write it down
- `jump` → `.`; it's the only option, so write down `.`
- `.` → `see` (50%), `run` (25%), or `jump` (25%); three possible choices for
  next word
- let's say dice picks `see`; write it down
- `see` → `spot`; it's the only option, so write down `spot`

After the above steps, the full output text is _"see spot jump. see spot"_