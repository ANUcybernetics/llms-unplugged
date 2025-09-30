#import "@local/anu-typst-template:0.2.0": *

#let start-time = datetime(
  year: 2025,
  month: 10,
  day: 14,
  hour: 14,
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
    logos: ("socy", "studio"),
  ),
)

== *#t(0)* intro
- what does it mean to say that there are _patterns_ in text (language)?
- is it possible to write down and share just the patterns (and not the full
  text)? how would _you_ do it? where else have you seen it done? how might this
  be useful?
- Andrei Markov, Claude Shannon and others have been thinking about this
  question for a long time...

== *#t(10)* Basic Training
- LoLM: training, model, token, vocabulary
- discussion/shareback question: "how could you use this grid to make _new_
  sentences that exhibit the same patterns as the training data?"

== *#t(25)* Basic Inference
- LoLM: prompt, completion/response/prediction
- discussion/shareback question: "how predictable is it (for a given prompt) and
  what factors affect this predictability?"

== *#t(40)* Context columns
- LoLM: attention
- discussion/shareback question: "what did you notice about the change in the
  model's output once the context columns were added?"

== *#t(60)* Sampling strategies
- LoLM: sampling, temperature/truncation
- discussion/shareback question: "what influence do different sampling
  procedures have on the generated text?"

== *#t(80)* close
- what was the most interesting/challenging/thought-provoking part of this
  language modelling process?
- how do these language models relate to ChatGPT? similarities? differences?
- what does it all mean?
