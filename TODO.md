# TODO

## Rust lib

- add top-k (and even temperature) params
- (maybe) add a diamond per dice required (for > 120 cases)
- refactor the "scale to dice" stuff into a new module, which supports
  arbitrary-sided die (d120 by default) and also multiple different sampling
  strategies based on <https://rentry.co/samplers>
- add the ability to generate new text from a model
- in stats, print % of non-120 words, and maybe a breakdown of 3/4/5 dice words
- add the stats to the json output (and display in the book?)

- (probably not) add end of sentence token (perhaps ⏺)

## Typst template

- bugfix for labels for n > 2; handle case where there's no label for a bigram
- instructions
- page header with the current prefix (maybe)

## Dice

- <https://www.mathartfun.com/DiceLabDice.html> ␃
