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

== *#t(0)* intro
- what does it mean to say that there are _patterns_ in text (language)?
- is it possible to write down and share just the patterns (and not the full
  text)? how would _you_ do it? where else have you seen it done?
- Shannon & Markov... folks have been thinking about this question for a long
  time...

== *#t(15)* Basic Training
- _Basic Training_ module activity (in groups of 2)
- LoLM: training, model, token
- discussion/shareback question: "how could you use this grid to make _new_
  sentences that aren't in the training data, but with a similar flavour?"

== *#t(30)* Basic Inference
- _Basic Inference_ module: sample from model trained in previous part to
  generate 3 sentences
- LoLM: prompt, completion/response/prediction
- discussion/shareback question: "how predictable is it (for a given prompt) and
  what factors affect this predictability?"

== *#t(45)* Context columns
- take your model and add context columns, generate 3 more sentences (can train
  further as well if needed)
- LoLM: attention
- discussion/shareback question: "what did you notice about the change in the
  model's output once the context columns were added?"

== *#t(60)* Sampling strategies
- from either the plain bigram or the context-added model, generate sentences
  with _at least_ two different temperature values and two different truncation
  strategies
- LoLM: sampling, temperature/top-k
- discussion/shareback question: "what influence do different sampling
  procedures have on the generated text?"

#line(length: 100%, stroke: (paint: rgb("#D4AF37"), thickness: 1pt))
*#t(75)* _break_
#line(length: 100%, stroke: (paint: rgb("#D4AF37"), thickness: 1pt))

== *#t(90)* Design your own algo
- can combine model + sampling procedure (or hybrid - as long as you can write
  it down)... you need to do the training (again, can do more)
- in particular, you get to choose the _purpose_ of the language model

== *#t(105)* Performance prep
- your group will receive a "procedure card" from a different group; you have 15
  mins to implement it and plan your performance

== *#t(120)* Performances
- this is your completion task
- good faith effort required

== *#t(150)* fin

// TODO
// - create "model sheet" template (goal, you will need, algo + examples)
// - sythetic data card (just add new tallies to the grid)
