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
    logos: ("socy", "studio"),
  ),
)

== *#t(0)* Intro
- icebreaker: why is a language model called a "language model"? what does it
  mean to "model language"?
- what ways have you seen this done, or can imagine doing it?
- Andrei Markov, Claude Shannon and others have been thinking about this
  question for a long time...

== *#t(15)* Basic training
// - LoLM: training, model, token, vocabulary

== *#t(30)* Basic inference
// - LoLM: prompt, completion/response/prediction

== *#t(45)* Go large
// - LoLM: model size

== *#t(60)* Context columns
// - LoLM: attention, transformer

#line(length: 100%, stroke: (paint: anu-colors.gold, thickness: 1pt))
*#t(80)* _break_
#line(length: 100%, stroke: (paint: anu-colors.gold, thickness: 1pt))

== *#t(90)* Design your own poetry slam language model
- what *isn't* poetry?
- think about the purpose: "what does _your_ model do, and why?"
- write up your model on a blank module card to give to another group

== *#t(110)* Pre-slam prep
- your group will receive a new module card from a different group; you have 10
  mins to generate as much text as you can and plan your one-minute performance

== *#t(120)* Poetry Slam
- do a _performance_ of the poetry language model you were given
- your model card plus the performance itself is your completion task (good
  faith effort required)

== *#t(150)* close
- what was the hardest part of designing your model?
- what was the hardest part of preparing your performance?
- how do these language models relate to ChatGPT? similarities? differences?
- what does it all mean?
