#import "utils.typ": *

// Apply base styling
#show: module-setup

#module-hero(
  "Synthetic Data",
  "images/CYBERNETICS_A_005.jpg",
  "08",
)[
  Use your language model to generate new training data, then train a new model
  on that synthetic data to see how patterns degrade or change.

  == You will need

  - a completed model from an earlier module
  - pen, paper & dice for text generation
  - grid paper for a new model

  == Your goal

  To generate synthetic text using your model, then train a new "generation 2"
  model on that synthetic output. Compare the two models to observe what
  patterns are preserved or lost. *Stretch goal*: train a generation 3 model on
    generation 2 output.

  == Key idea

  Models trained on synthetic data (output from other models) can drift from
  the original patterns. This demonstrates model collapse and the importance of
  real training data.
]

// Main content in two columns
#columns(2, gutter: 1em)[
  == Algorithm

  + *generate synthetic text*:

    - use your existing model to generate text (as in Basic Inference)
    - generate enough text for meaningful training (at least 50-100 words)
    - this is your _synthetic training corpus_

  + *train generation 2 model*:

    - create a new grid following the Basic Training algorithm
    - use your synthetic text as the input corpus
    - this new model learns from AI-generated text, not human-written text

  + *compare the models*:

    - look for words that appear in the original but not in generation 2
    - compare the relative frequencies (counts) in cells that appear in both
    - generate text from both models and compare the outputs

  #colbreak()

  == Example

  Original training text: _"See Spot run. See Spot jump."_

  Generation 1 model's synthetic output: _"See run. Run spot. Spot run run."_

  Notice how the synthetic text:
  - uses all the same words as the original
  - has different patterns (more `run run`, no `spot jump`)
  - might lose some variety from the original

  Generation 2 model trained on the synthetic output will amplify these
  changes:
  - `run run` becomes more common
  - `spot jump` disappears entirely
  - new unlikely patterns may emerge

  == Discussion questions

  - what patterns were preserved across generations?
  - what patterns were lost or distorted?
  - how might this relate to AI training on AI-generated content?
]
