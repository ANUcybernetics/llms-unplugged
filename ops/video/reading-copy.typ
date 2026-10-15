// The reading copy for the recording booth, built by `ops/video/voice.py
// reading` from the scripts' spoken lines. With `speaker` set, that voice's
// lines are the copy and the other's are greyed cues.

#let videos = json(sys.inputs.data)
#let speaker = sys.inputs.at("speaker", default: "")
#let names = (BEN: "Ben", USHINI: "Ushini")
#let ink = rgb("#1a1a1a")
#let cue = rgb("#9a9a9a")
#let accent = (BEN: rgb("#be830e"), USHINI: rgb("#2f6b8f"))

#set document(title: "LLMs Unplugged videos: reading copy")
#set page(
  paper: "a4",
  margin: (x: 22mm, top: 20mm, bottom: 22mm),
  footer: context [
    #set text(8pt, fill: cue)
    #if speaker != "" [#names.at(speaker)'s copy] else [Both voices]
    #h(1fr)
    #counter(page).display("1/1", both: true)
  ],
)
#set text(font: "Public Sans", size: 11pt, lang: "en", region: "au", fill: ink)
#set par(leading: 0.75em)

#let mine(s) = speaker == "" or speaker == s

#let pause(seconds) = if seconds != none {
  (
    h(0.5em)
      + box(text(9pt, fill: accent.BEN, weight: "bold")[\/ #str(seconds) s])
  )
}

#let line-block(n, line) = {
  let own = mine(line.speaker)
  let colour = if own { ink } else { cue }
  block(breakable: false, above: 1.1em, below: 0pt, grid(
    columns: (9mm, 16mm, 1fr),
    column-gutter: 2mm,
    text(10pt, fill: colour, weight: "bold")[#n],
    text(
      8pt,
      fill: if own { accent.at(line.speaker) } else { cue },
      weight: "bold",
      tracking: 0.04em,
    )[#upper(names.at(line.speaker))],
    {
      set text(size: if own { 12pt } else { 9.5pt }, fill: colour)
      for part in line.parts {
        block(above: 0.45em, below: 0pt)[#part.text#pause(part.pause)]
      }
    },
  ))
}

#align(center)[
  #text(18pt, weight: "bold")[LLMs Unplugged videos]
  #v(-0.4em)
  #text(12pt)[Reading copy#if speaker != "" [: #names.at(speaker)]]
]

#v(0.6em)
#text(9.5pt)[
  Twelve videos, read straight through in this order. Each numbered block is one
  line; a slash marks a held pause, in seconds (one at the end of a line holds
  before the next line). Fluff a line? Re-read the whole line straight away: the
  edit keeps the last reading.
  #if speaker != "" [Your lines are in black; the other voice's are in grey, as
    cues.]
]

#outline(
  title: none,
  target: heading.where(level: 1),
  indent: 0pt,
)

#for (v, video) in videos.enumerate() {
  pagebreak(weak: true)
  heading(level: 1)[#(v + 1). #video.title]
  text(8pt, fill: cue, font: "DejaVu Sans Mono")[#video.slug]
  for (n, line) in video.lines.enumerate() {
    line-block(n + 1, line)
  }
}
