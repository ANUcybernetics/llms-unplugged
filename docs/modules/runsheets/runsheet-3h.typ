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
  text)? how would _you_ do it? where else have you seen it done? how might this
  be useful?
- Claude Shannon, Andrei Markov, and others have been thinking about this
  question for a long time...

== *#t(15)* Basic Training
- LoLM: training, model, token, vocabulary
- discussion/shareback question: "how could you use this grid to make _new_
  sentences that exhibit the same patterns as the training data?"

== *#t(30)* Basic Inference
- LoLM: prompt, completion/response/prediction
- discussion/shareback question: "how predictable is it (for a given prompt) and
  what factors affect this predictability?"

== *#t(45)* Context columns
- LoLM: attention
- discussion/shareback question: "what did you notice about the change in the
  model's output once the context columns were added?"

== *#t(60)* Sampling strategies
- LoLM: sampling, temperature/truncation
- discussion/shareback question: "what influence do different sampling
  procedures have on the generated text?"

#line(length: 100%, stroke: (paint: anu-colors.gold, thickness: 1pt))
*#t(75)* _break_
#line(length: 100%, stroke: (paint: anu-colors.gold, thickness: 1pt))

== *#t(90)* Design your own poetry slam language model
- discuss in your group: what poetic ideas do you want your language model to
  explore?
- write up your model on a module card to give to another group (plus any model
  grids, etc. they'll need)
- can combine/modify any of the techniques you've encountered already (or invent
  your own) and you're encouraged to futher train your model, too
- discussion/shareback question: "what does _your_ model do, and why?"

== *#t(110)* Pre-slam prep
- your group will receive an "module card" from a different group; you have 10
  mins to implement it and plan your performance

== *#t(120)* Poetry Slam
- do a _performance_ of the poetry language model you were given
- this is your completion task
- good faith effort required

== *#t(150)* close
- what was the hardest part of designing your model?
- what was the hardest part of preparing your performance?
- how do these language models relate to ChatGPT? similarities? differences?
- what does it all mean?

// TODO
// - create "model sheet" template (goal, you will need, algo + examples)
// - sythetic data card (just add new tallies to the grid)
