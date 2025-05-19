# TODO

## Rust lib

- add top-k param
- filter out roman numerals as well (or, refactor out a proper "sanitisation"
  module to do the is it real/is it junk filtering in a more principled way)
- support multiple different sampling strategies based on
  <https://rentry.co/samplers>
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

## initial book run

- single origin: frankenstein, crime and punishment, aotd, cloudstreet

- collections: hemingway, harry potter, simple wiki, banjo patterson

- multiple n-grams: colected seuss n = 2..4 at least
