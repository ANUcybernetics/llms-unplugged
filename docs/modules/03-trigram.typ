#import "@local/anu-typst-template:0.1.0": *
#import "llm-utils.typ": *

#show: anu-template.with(
  title: [Trigram Model],
  socy_logo: true,
)


Extend the basic model to consider two words of context instead of one, leading
to better text generation.

== You will need

- same as basic training module
- additional paper for the three-column model

== Key idea

More context leads to better predictions. A trigram model considers two previous
words instead of one, demonstrating the trade-off between context length and
data requirements that shapes all language models.

== Algorithm

+ *create a three-column model* with headers: Word1 | Word2 | Word3
+ *extract all word triples* from your text
   - slide a 3-word window through the text
   - include punctuation tokens
+ *count occurrences* of each unique triple
+ *generate text* using your trigram model:
   - start with any two words (or `.` + first word)
   - find all rows where Word1 and Word2 match your current pair
   - roll d20 weighted by the counts
   - choose Word3, then shift: new pair = (old Word2, chosen Word3)
   - continue until desired length

== Example

Original text: _"See Spot run. See Spot jump. Run, Spot, run. Jump, Spot,
jump."_

After tokenisation: `see` `spot` `run` `.` `see` `spot` `jump` `.` `run` `,`
`spot` `,` `run` `.` `jump` `,` `spot` `,` `jump` `.`

#lm-table(
  ([Word1],[Word2],[Word3],[Count]),
  (
    ([`see`], [`spot`], [`run`], 1),
    ([`spot`], [`run`], [`.`], 1),
    ([`run`], [`.`], [`see`], 1),
    ([`.`], [`see`], [`spot`], 1),
    ([`see`], [`spot`], [`jump`], 1),
    ([`spot`], [`jump`], [`.`], 1),
    ([`jump`], [`.`], [`run`], 1),
    ([`.`], [`run`], [`,`], 1),
    ([`run`], [`,`], [`spot`], 1),
    ([`,`], [`spot`], [`,`], 2),
    ([`spot`], [`,`], [`run`], 1),
    ([`,`], [`run`], [`.`], 1),
    ([`run`], [`.`], [`jump`], 1),
    ([`.`], [`jump`], [`,`], 1),
    ([`jump`], [`,`], [`spot`], 1),
    ([`spot`], [`,`], [`jump`], 1),
    ([`,`], [`jump`], [`.`], 1),
  )
)

To generate the next word after `see` + `spot`:

- `see` + `spot` → `run` (50% chance) or `jump` (50% chance)
  - if `run`: `spot` + `run` → `.` (only option)
  - if `jump`: `spot` + `jump` → `.` (only option)

After the above steps, the full output text is _"See Spot run."_ or _"See Spot
jump."_