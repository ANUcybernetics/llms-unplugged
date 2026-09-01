// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// The counter palettes for the ledger family, shared by ledger.typ (the
// sheets, whose tally strips take these colours) and ledger-counters.typ
// (the printable counters themselves), so the strip a participant matches
// against and the counter in their hand come from one definition.

// ===== The counter palettes =====
//
// Two palettes of `columns` colours: the first for odd rows, the second for
// even ones. A prefix spilling onto a second row therefore has 2 × `columns`
// distinct strips, and the bag can tell them apart.
//
// Eight colours with everyday names, so a counter can be matched to a strip
// by name as well as by eye. Red, blue, green and yellow are the four every
// set of maths counters has and the second four are the next most common, so
// a bought set works too --- but the expected counters are the ones
// ledger-counters.typ prints in exactly these values. On the sheets the dot
// beside each strip is set in the full colour and the strip behind the
// tallies in a tint light enough to write on.
#let palettes = (
  (
    (color: rgb("#d62828"), name: "red"),
    (color: rgb("#1d4ed8"), name: "blue"),
    (color: rgb("#15803d"), name: "green"),
    (color: rgb("#eab308"), name: "yellow"),
  ),
  (
    (color: rgb("#ea580c"), name: "orange"),
    (color: rgb("#7e22ce"), name: "purple"),
    (color: rgb("#000000"), name: "black"),
    (color: rgb("#ffffff"), name: "white"),
  ),
)
// Eight colours is what counters come in and what a bag can tell apart, so
// the palettes cap the column count rather than stretching to meet it.
#let palette-size = palettes.at(0).len()

#let check-columns(columns) = assert(
  columns <= palette-size,
  message: "ledger: no palette for more than "
    + str(palettes.at(0).len())
    + " columns",
)

#let palette-for(row, columns) = palettes.at(calc.rem(row, 2)).slice(
  0,
  columns,
)

// Black and white counters need special casing on paper: a black tint is grey,
// and a white strip is the page.
#let strip-fill(entry) = if entry.name == "white" { white } else if (
  entry.name == "black"
) { luma(228) } else { color.mix((entry.color, 24%), (white, 76%)) }

#let strip-stroke(entry) = if entry.name == "white" {
  (paint: luma(0), thickness: 0.6pt, dash: "dashed")
} else { 0.8pt + entry.color }

// The counter itself, drawn: a dot in the full colour with a hairline so the
// white one is visible. This is what a participant matches a counter against.
#let counter-dot(entry, size: 3.2mm) = circle(
  radius: size / 2,
  fill: entry.color,
  stroke: 0.4pt + luma(0),
)


// ===== The printed counters =====
//
// ledger-counters.typ lays the counters out as square cells; the brief in
// ledger.typ tells the facilitator how many of each colour a sheet yields, so
// the numbers live here where both can see them.
#let counter-cell = 23mm
#let counter-margin = 10mm

// Rows of counters on a page of `height`: as many as fit, rounded down to
// even, because the two palettes alternate rows and an odd count would print
// one palette more than the other.
#let counter-rows(height) = {
  let rows = calc.floor((height - 2 * counter-margin) / counter-cell)
  rows - calc.rem(rows, 2)
}

// Each colour appears twice in its row and its palette takes half the rows,
// so a sheet yields one counter of each colour per row.
#let counters-per-colour(height) = counter-rows(height)
