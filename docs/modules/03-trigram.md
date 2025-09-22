---
title: "Trigram Model"
socy_logo: true
prereqs: ["01-basic-training.md", "02-basic-inference.md"]
---

Extend the basic model to consider two words of context instead of one, leading
to better text generation.

## You will need

- same as basic training module
- additional paper for the three-column model

## Key idea

More context leads to better predictions. A trigram model considers two previous
words instead of one, demonstrating the trade-off between context length and
data requirements that shapes all language models.

## Algorithm

1. **create a three-column model** with headers: Word1 | Word2 | Word3
2. **extract all word triples** from your text
   - slide a 3-word window through the text
   - include punctuation tokens
3. **count occurrences** of each unique triple
4. **generate text** using your trigram model:
   - start with any two words (or `.` + first word)
   - find all rows where Word1 and Word2 match your current pair
   - roll d20 weighted by the counts
   - choose Word3, then shift: new pair = (old Word2, chosen Word3)
   - continue until desired length

```{=typst}
#import "llm-utils.typ": *
```

## Example

Original text: _"See Spot run. See Spot jump. Run, Spot, run. Jump, Spot,
jump."_

After tokenisation: `see` `spot` `run` `.` `see` `spot` `jump` `.` `run` `,`
`spot` `,` `run` `.` `jump` `,` `spot` `,` `jump` `.`

| Word1  | Word2  | Word3  | Count |
| ------ | ------ | ------ | ----- |
| `see`  | `spot` | `run`  | `#tally(1)`{=typst} |
| `spot` | `run`  | `.`    | `#tally(1)`{=typst} |
| `run`  | `.`    | `see`  | `#tally(1)`{=typst} |
| `.`    | `see`  | `spot` | `#tally(1)`{=typst} |
| `see`  | `spot` | `jump` | `#tally(1)`{=typst} |
| `spot` | `jump` | `.`    | `#tally(1)`{=typst} |
| `jump` | `.`    | `run`  | `#tally(1)`{=typst} |
| `.`    | `run`  | `,`    | `#tally(1)`{=typst} |
| `run`  | `,`    | `spot` | `#tally(1)`{=typst} |
| `,`    | `spot` | `,`    | `#tally(2)`{=typst} |
| `spot` | `,`    | `run`  | `#tally(1)`{=typst} |
| `,`    | `run`  | `.`    | `#tally(1)`{=typst} |
| `run`  | `.`    | `jump` | `#tally(1)`{=typst} |
| `.`    | `jump` | `,`    | `#tally(1)`{=typst} |
| `jump` | `,`    | `spot` | `#tally(1)`{=typst} |
| `spot` | `,`    | `jump` | `#tally(1)`{=typst} |
| `,`    | `jump` | `.`    | `#tally(1)`{=typst} |

To generate the next word after `see` + `spot`:

- `see` + `spot` → `run` (50% chance) or `jump` (50% chance)
  - if `run`: `spot` + `run` → `.` (only option)
  - if `jump`: `spot` + `jump` → `.` (only option)

After the above steps, the full output text is _"See Spot run."_ or _"See Spot
jump."_
