#import "@local/anu-typst-template:0.1.0": *
#import "llm-utils.typ": *

#show: anu-template.with(
  title: [Context Columns],
  socy_logo: true,
  dark: sys.inputs.at("anu_theme", default: "dark") == "dark",
)

Enhance your word bigram model with context columns that capture grammatical and
semantic patterns.

== You will need

- same as basic-training module
- your completed word co-occurence model from _Basic Training_

== Key idea

This activity introduces the concept of attention---selectively focusing on
relevant context---which is the key innovation behind transformer models like
GPT. By adding grammatical context columns to your model, you manually implement
what transformers learn automatically---which previous words matter most for
prediction.

== Algorithm

=== Training

+ *add context columns* to your existing bigram model: _after verb_, _after
    pronoun_ and _after preposition_
+ *training*: proceed as per _Basic Training_, but each time after updating the
  cell count according to the usual "_column_ word follows _row_ word"
  procedure:
  - if the _row_ word is a verb, increment the value in the _column_ word's
    _after verb_ column
  - if the _row_ word is a pronoun (I/you/they etc.), increment the value in the
    _column_ word's _after pronoun_ column
  - if the _row_ word is a preposition (in/on/at/with/to etc.), increment the
    value in the _column_ word's _after preposition_ column

=== Inference

+ *choose a starting word* as per _Basic Inference_
+ check its row to identify the "normal" transition counts, but _also_ check if
  the starting word is a verb/pronoun/preposition and if so add the values from
  the relevant "context" column before using a d20 to choose the next word
+ *repeat* from step 2 until you reach the desired length _or_ a natural
  stopping point (e.g. a full stop `.`)

If you like, you can add your own context columns (based on patterns which _you_
think are important).

== Example

=== Training

Original text: _"I run, fast. You run to me."_

Prepared text: `i` `run` `,` `fast` `.` `you` `run` `to` `me` `.`

Model with context columns:

#lm-grid(
  (
    [],
    [`i`],
    [`you`],
    [`run`],
    [`,`],
    [`fast`],
    [`to`],
    [`me`],
    [`.`],
    [#v(-3em)#rotate(-90deg)[after verb]],
    [#v(-3em)#rotate(-90deg)[after pronoun]],
    [#v(-3em)#rotate(-90deg)[after preposition]],
  ),
  (
    ([`i`], [], [], 1, [], [], [], [], [], [], [], []),
    ([`you`], [], [], 1, [], [], [], [], [], [], [], []),
    ([`run`], [], [], [], 1, [], 1, [], [], [], 2, []),
    ([`,`], [], [], [], [], 1, [], [], [], [], [], []),
    ([`fast`], [], [], [], [], [], [], [], 1, [], [], []),
    ([`to`], [], [], [], [], [], [], 1, [], 1, [], []),
    ([`me`], [], [], [], [], [], [], [], 1, [], [], 1),
    ([`.`], [], 1, [], [], [], [], [], [], [], [], []),
  ),
)

=== Inference

Starting word: `run` (a verb):

+ check `run` row: potential next words are `,` (1) or `to` (1)
+ check all context columns: for `to` the *after verb* column has a count of 1
  (appears after verbs)
+ combine both counts: roll a dice to choose either `,` (1) or `to` ($1+1=2$)
+ repeat from step 1 until you reach the desired length _or_ a natural stopping
  point (e.g. a full stop `.`)
