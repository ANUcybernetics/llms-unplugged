#import "@local/anu-typst-template:0.2.0": *

#let start-time = datetime(
  year: 2025,
  month: 10,
  day: 1,
  hour: 13,
  minute: 0,
  second: 0,
)
#let t(minutes) = {
  let time = start-time + duration(minutes: minutes)
  time.display("[hour repr:24 padding:zero]:[minute padding:zero]")
}

#show: anu.with(
  title: [DIY ChatGPT],
  subtitle: [LLMs as Information Processing Machines],
  author: start-time.display("[month repr:long] [day], [year]"),
  config: (
    theme: sys.inputs.at("anu_theme", default: "light"),
    logos: ("socy",),
  ),
)

- *#t(0)* intro
  - what does it mean to say that there are _patterns_ in text (language)?
  - is it possible to write down and share just the patterns (and not the full
    text)? how would _you_ do it? where else have you seen it done?
  - Shannon & Markov... folks have been thinking about this question for a long
    time...
- *#t(15)* Part 1: DIY Language Model (training)
  - _My First LM_ activity (in groups of 2)
  - LoLM: training, model, token
  - discussion/shareback question: "how could you use this grid to make _new_
    sentences that aren't in the training data, but with a similar flavour?"
- *#t(30)* Part 2a: DIY Language Model (inference)
  - activity: sample from model trained in part 1 to generate 3 sentences
  - LoLM: prompt, completion/response/prediction
  - discussion/shareback question: "how predictable is it (for a given prompt)
    and what factors affect this predictability?"
- *#t(45)* Part 2b: (Slightly Larger) Language Model
  - the generate text activity from 2a, but with a pre-calculated bigram model
    booklet
  - LoLM: vocabulary, model size
  - discussion/shareback question: "how could you go beyond just _one_ booklet?"
    (alternatively, if they're anonymised, could ask "guess what the training
    data was")
- *#t(55)* Part 2c: (Slightly Even Larger) Language Model
  - same as 2b, but with trigram booklet
  - discussion/shareback question: "what's the endgame here?"
  - LoLM: context window
- *#t(65)* _break_
- *#t(75)* Part 3a: Sampling from a Language Model (inference redux)
  - hand out "sampling procedure" cards, group activity (in 4s this time) is to
    choose 1 and write a page of text (using any/all of your booklets from the
    previous sections)
  - LoLM: sampling, temperature/top-k
  - discussion/shareback question: "what influence do different sampling
    procedures have on the generated text?", or "is the sampling procedure also
    a source of bias?"
- *#t(90)* Part 3b: design your own sampling procedure
  - activity: write it down (so that another group could use it... which they
    will soon!)
- *#t(105)* Grand finale: poetry slam - your group will receive a
  "procedure/recipe" from a different group; you have 15 mins to implement it
  and plan your performance
- *#t(120)* performances
  - clap-o-meter (maybe even prizes?)
  - this is your completion task
- *#t(150)* fin
  - the LLM timeline (from the DEWR deck, but with ref. to the specific
    activities they just did)
  - next steps
  - tfc
