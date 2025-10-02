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
  title: [My First Language Model],
  author: start-time.display("[month repr:long] [day], [year]"),
  config: (
    theme: sys.inputs.at("anu_theme", default: "light"),
    logos: ("socy", "studio"),
  ),
)

== *#t(0)* intro
- icebreaker: why is a language model called a "language model"? what does it
  mean to "model language"?

== *#t(15)* Basic training
// - LoLM: training, model, token, vocabulary

== *#t(30)* Basic inference
// - LoLM: prompt, completion/response/prediction

== *#t(45)* Pre-trained bigram model

== *#t(60)* Pre-trained trigram model

== *#t(75)* close
- are language models gonna take all our jobs?
- are language models gonna kill us all?
- what does it all mean?
