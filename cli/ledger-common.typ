// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// The counter palettes for the ledger family, shared by ledger.typ (the
// sheets, whose tally strips take these colours) and ledger-counters.typ
// (the printable counters themselves), so the strip a participant matches
// against and the counter in their hand come from one definition.

#import "cutout-common.typ": palette as cutout-palette

// ===== The counter palettes =====
//
// Two palettes of `columns` colours: the first for odd rows, the second for
// even ones. A prefix spilling onto a second row therefore has 2 × `columns`
// distinct strips, and the bag can tell them apart.
//
// The eight colours are the cutouts palette, which was chosen on printed
// (CMYK) pairwise distance with every swatch at the xkcd-survey centroid of
// its name --- see the notes in cutout-common.typ --- so a counter can be
// matched to a strip by name as well as by eye, and the two activities share
// one set of colour words. The split puts the four most immediately nameable
// on the odd rows, which is all a single-row prefix ever uses. On the sheets
// the dot beside each strip is set in the full colour and the strip behind
// the tallies in a tint light enough to write on; every entry is dark enough
// to carry a white label on the printed counters.
#let named(name) = cutout-palette.colors.find(e => e.name == name)
#let palettes = (
  ("red", "green", "blue", "black").map(named),
  ("magenta", "purple", "brown", "grey").map(named),
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

// The tint behind the tallies: light enough to write on, still recognisably
// the colour. Mixed in OKLab so the dark swatches lighten evenly.
#let strip-fill(entry) = color.mix(
  (entry.color, 24%),
  (white, 76%),
  space: oklab,
)

#let strip-stroke(entry) = 0.8pt + entry.color

// The counter itself, drawn: a dot in the full colour. This is what a
// participant matches a counter against.
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
#let counter-cell = 20mm
#let counter-gap = 4mm
#let counter-margin = 10mm

// Rows of counters on a page of `height`: as many as fit, rounded down to
// even, because the two palettes alternate rows and an odd count would print
// one palette more than the other.
#let counter-rows(height) = {
  let rows = calc.floor(
    (height - 2 * counter-margin + counter-gap) / (counter-cell + counter-gap),
  )
  rows - calc.rem(rows, 2)
}

// Each colour appears twice in its row and its palette takes half the rows,
// so a sheet yields one counter of each colour per row.
#let counters-per-colour(height) = counter-rows(height)
