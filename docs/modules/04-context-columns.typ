#import "@local/anu-typst-template:0.1.0": *
#import "llm-utils.typ": *

#show: anu-template.with(
  title: [Context Columns],
  socy_logo: true,
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

+ *identify patterns* in your text:
  - which words follow _verbs_?
  - which words follow _pronouns_ (e.g. I, you, they)?
  - which words follow _prepositions_ (e.g. in, on, at)?
+ *add context columns* to your existing word co-occurence model:
  - after_verb: count if this word appears after doing/action words
  - after_pronoun: count if this word follows `i`/`you`/`they`/etc.
  - after_preposition: count if this word comes after
    `in`/`on`/`at`/`with`/`to`/etc.
+ *generate with context weighting*:
  - start with a word and check its row
  - sum the base transition counts with relevant context columns
  - weight your d20 rolls by these combined scores
  - context makes common patterns more likely

If you like, you can add your own context columns (based on patterns which _you_
think are important).

== Example

Original text: _"I run, fast. You run to me."_

Tokenised: `i` `run` `,` `fast` `.` `you` `run` `to` `me` `.`

Enhanced model with context columns:

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
When generating after `run` (a verb):

- check `run` row: next words are `,` (1) or `to` (1)
- check all context columns: for `to` the *after verb* column has value 1
  (appears after verbs)
- combine both signals: roll a dice to choose either `,` (1) or `to` (1+1=2)
- proceed as per _Basic Inference_ (but with the additional weighting for the
  context columns)
