// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See teaching/LICENSE for details.
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
  title: [My First LLM],
  subtitle: [Build Your Own Language Model with Dick and Jane],
  author: start-time.display("[month repr:long] [day], [year]"),
  config: (
    theme: sys.inputs.at("anu_theme", default: "light"),
    logos: ("socy", "studio"),
  ),
)

== *#t(0)* intro
- icebreaker: why is a language model called a "language model"? what does it
  mean to "model language"?
- activity: sit down if you've ever used ChatGPT... how about last
  month/week/day/hour/5mins?

== *#t(20)* Basic training
// - LoLM: training, model, token, vocabulary

== *#t(40)* Basic inference
// - LoLM: prompt, completion/response/prediction

== *#t(60)* Pre-trained bigram model
// - LoLM: training data

== *#t(80)* close
- how has this workshop changed how you think about language models?
- how has this workshop changed how you will use language models?
