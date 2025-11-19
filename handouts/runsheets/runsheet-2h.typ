// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
#import "@local/anu-typst-template:0.2.0": *

#let start-time = datetime(
  year: 2025,
  month: 11,
  day: 19,
  hour: 13,
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

- *icebreaker* (as folks are coming in) why is a language model called a
  "language model"? what does it mean to "model language"?
- *activity* sit down if you have never used ChatGPT... now in the last
  month/week/day/hour/5mins?
- *what is this about?* how Language Models work (exploiting patterns in text to
  generate new text)
- *why should I care?* because having better mental models of how our tools work
  help us understand their strengths and limitations and ultimately to use them
  more effectively
// - *why should I care?* because even if you're not interested in using ChatGPT,
//   ChatGPT is interested in using you
// - *why is this important to know?* (alternately) because many people either have no idea how
//   Language Models work, or they have an incorrect idea of how they work

== *#t(20)* Basic training

- demo (5mins)
- group activity (10mins)
- LoLM: training, model, token, vocabulary (5mins)

== *#t(40)* Basic generation

- demo (5mins)
- group activity (10mins)
- LoLM: prompt, completion/response/prediction (5mins)

== *#t(60)* Pre-trained bigram model

- demo (5mins)
- group activity (10mins)
- LoLM: pre-training, foundation model (5mins)

== *#t(80)* Sampling strategies

- demo (5mins)
- group activity (10mins)
- LoLM: sampling, truncation, temperature (5mins)

== *#t(100)* Q&A

== *#t(110)* close
- how has this workshop changed how you *think* about language models?
- how has this workshop changed how you will *use* language models?

= Materials

- module cards
- ring-bound bigram booklets
- sampling strategy printouts
- grids
- d10s
- notepads
- pens
