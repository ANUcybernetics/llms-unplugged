// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
#import "@local/anu-typst-template:0.2.0": *

// Shared scaffolding for session runsheets. Each runsheet is a thin file:
// a start datetime (edit per session), a title/subtitle, and the session
// content using the clock helper for timed headings.

#let runsheet(start, title: [], subtitle: [], body) = {
  show: anu.with(
    title: title,
    subtitle: subtitle,
    author: start.display("[month repr:long] [day], [year]"),
    config: (
      theme: sys.inputs.at("anu_theme", default: "light"),
      logos: ("socy", "studio"),
    ),
  )
  body
}

// Returns a function rendering start + offset minutes as a 24h clock time,
// for session headings: `#let t = clock(start-time)` then `*#t(20)*`.
#let clock(start) = minutes => (
  start + duration(minutes: minutes)
).display("[hour repr:24 padding:zero]:[minute padding:zero]")
