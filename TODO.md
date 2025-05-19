# TODO

## Rust lib

- add top-k param
- support multiple different sampling strategies based on
  <https://rentry.co/samplers>
- add the ability to generate new text from a model
- in stats, print % of non-120 words, and maybe a breakdown of 3/4/5 dice words
- add the stats to the json output (and display in the book?)

- (probably not) add end of sentence token (perhaps ⏺)

## Typst template

- bugfix for labels for n > 2; handle case where there's no label for a bigram,
  also add "orphaned n-gram %" to stats
- instructions
- page header with the current prefix (maybe)

## initial book run

- single origin: frankenstein, crime and punishment, aotd, cloudstreet

- collections: hemingway, harry potter, simple wiki, banjo patterson

- multiple n-grams: colected seuss n = 2..4 at least
