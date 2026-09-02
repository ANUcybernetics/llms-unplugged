// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// The counter palettes for the ledger family, shared by ledger.typ (the
// sheets, whose tally strips take these colours) and ledger-counters.typ
// (the printable counters themselves), so the strip a participant matches
// against and the counter in their hand come from one definition.

// ===== The counter palettes =====
//
// Three palettes of `columns` colours, cycling down the rows. A prefix
// spilling onto a second or third row therefore has up to 3 × `columns`
// distinct strips, and the bag can tell them apart.
//
// Twelve colours with everyday names, so a counter can be matched to a strip
// by name as well as by eye. Red, blue, green and yellow are the four every
// set of maths counters has, so a bought set works too --- but the expected
// counters are the ones ledger-counters.typ prints in exactly these values.
// On the sheets the dot beside each strip is set in the full colour and the
// strip behind the tallies in a tint light enough to write on.
//
// Red, blue, green, purple, brown, grey and black take their values from the
// cutouts palette in cutout-common.typ, whose swatches were chosen on printed
// (CMYK) distance and sit at the xkcd-survey centroid of their names; see the
// notes there. The rest are set by hand: pink is lighter than that palette's
// magenta, which printed too close to purple; orange is a light one, because
// a dark orange printed too close to red (the reason the cutouts palette has
// none); yellow, white and teal are not in that palette at all.
#let palettes = (
  (
    (color: oklch(57.9%, 0.238, 29deg), name: "red"),
    (color: oklch(47.2%, 0.241, 263deg), name: "blue"),
    (color: oklch(61.0%, 0.205, 142deg), name: "green"),
    (color: rgb("#eab308"), name: "yellow"),
  ),
  (
    (color: oklch(68%, 0.21, 355deg), name: "pink"),
    (color: oklch(45.2%, 0.195, 316deg), name: "purple"),
    (color: luma(0), name: "black"),
    (color: rgb("#ffffff"), name: "white"),
  ),
  (
    (color: rgb("#fb923c"), name: "orange"),
    (color: oklch(38.6%, 0.089, 62deg), name: "brown"),
    (color: oklch(62.9%, 0.008, 145deg), name: "grey"),
    (color: rgb("#0891b2"), name: "teal"),
  ),
)
// Twelve colours is as many as a bag can tell apart by name, so the palettes
// cap the column count rather than stretching to meet it.
#let palette-size = palettes.at(0).len()

#let check-columns(columns) = assert(
  columns <= palette-size,
  message: "ledger: no palette for more than "
    + str(palettes.at(0).len())
    + " columns",
)

#let palette-for(row, columns) = (
  palettes.at(calc.rem(row, palettes.len())).slice(0, columns)
)

// The strip behind the tallies: a tint faint enough to be written over in pen
// and read through. Kept much lighter than it needs to look on screen ---
// these print CMYK, which lays the colour down heavier than a monitor shows
// it, and the strip's job is to be a ground, not a block of colour. The bar
// down its leading edge carries the colour that a counter is matched against.
//
// Black and white counters need special casing on paper: a black tint is
// grey, and a white strip is the page.
#let strip-fill(entry) = if entry.name == "white" { white } else if (
  entry.name == "black"
) { luma(240) } else { color.mix((entry.color, 12%), (white, 88%)) }

// One saturated edge rather than a box: a bar down the strip's left side.
// The bar is the colour cue --- what a counter drawn from the bag is matched
// against --- so it is wide enough to read as the colour rather than as a
// line of it, which a hairline of a dark hue is not. The other three sides
// are the tint's own edges. White has no bar to draw --- a white rule on
// paper is nothing --- so it keeps a hairline outline, which is also what
// gives its strip an area to write in.
// Named, because the strip's own padding is measured off it: a box stroke is
// drawn centred on the edge, so half the bar sits inside the box and the
// tally marks have to start clear of it.
#let strip-bar = 5pt

#let strip-stroke(entry) = if entry.name == "white" {
  (rest: (paint: luma(140), thickness: 0.5pt, dash: "dashed"))
} else { (left: strip-bar + entry.color, rest: none) }

// The counter itself, drawn: a dot in the full colour with a hairline so the
// white one is visible. This is what a participant matches a counter against.
#let counter-dot(entry, size: 3.2mm) = circle(
  radius: size / 2,
  fill: entry.color,
  stroke: 0.4pt + luma(0),
)


// ===== The printed counters =====
//
// ledger-counters.typ lays the counters out as square cells with a gutter
// between them, so cutting them apart means cutting anywhere in the white
// rather than along a hairline; the brief in ledger.typ tells the facilitator
// how many of each colour a sheet yields, so the numbers live here where both
// can see them.
// One palette out and back is eight squares across a portrait A4.
#let counter-cell = 19mm
#let counter-gap = 4mm
#let counter-margin = 10mm

// Rows of counters on the page: as many as fit, rounded down to a multiple
// of six, because the three palettes cycle down the rows and the row order
// has to be a palindrome (see ledger-counters.typ), so each half of the page
// needs a whole number of cycles. Needs `context` for the page size.
#let counter-rows() = {
  let rows = calc.floor(
    (page.height - 2 * counter-margin + counter-gap)
      / (counter-cell + counter-gap),
  )
  rows - calc.rem(rows, 2 * palettes.len())
}

// Each colour appears twice in its row and its palette takes a third of the
// rows.
#let counters-per-colour() = 2 * counter-rows() / palettes.len()
