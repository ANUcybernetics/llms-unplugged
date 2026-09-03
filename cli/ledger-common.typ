// Copyright (c) 2025 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// What ledger.typ (the sheets, whose tally strips take the counter colours)
// and ledger-counters.typ (the printable counters themselves) share, so the
// strip a participant matches against and the counter in their hand are drawn
// by one piece of code from one list of colours.

#import "booklet-common.typ" as bc
#import "cutout-common.typ": token-font

// ===== Printed tokens =====
//
// One printed token: a word, or --- for the punctuation marks, which are
// prefixes and followers like any other, since what follows "." is how a
// sentence starts --- the same symbol tile the booklets use. A bare full stop
// in a cell is a speck: easy to read as an empty cell, and hard to tell from
// a comma across a table. The tile is a square at the size of the words
// beside it, so it is both legible and the mark a reader who has seen a
// booklet already knows. `punct` is the set of marks the tokeniser kept as
// standalone tokens, which the CLI passes in.
#let token-text(t, punct, size: 13pt, fill: black, weight: "bold") = if (
  t in punct
) {
  text(
    font: token-font,
    fill: fill,
    bc.punct-box(t, size: size, weight: weight, stroke-color: fill),
  )
} else {
  text(font: token-font, size: size, weight: weight, fill: fill, t)
}

// ===== The counter palette =====
//
// The colours a room has counters in come in as data: the CLI's --palette
// writes them into ledger.json as `(name, hex)` entries, and everything that
// needs a colour --- the strips, the counters page, the brief's key --- reads
// that one list. Nothing here knows a colour by name, so a set printed for a
// bag of eight balls is a different JSON list rather than a different
// template.
//
// The list is flat and the rows cycle through it `columns` at a time: twelve
// colours at four columns give a prefix three rows of distinct strips, eight
// give two. The CLI drops any colour past the last whole row, so the length
// always divides.
#let read-palette(data) = data.palette.map(e => (
  color: rgb(e.hex),
  name: e.name,
))

#let palette-cycles(palette, columns) = calc.floor(palette.len() / columns)

#let check-columns(palette, columns) = assert(
  palette-cycles(palette, columns) >= 1,
  message: "ledger: the palette has fewer colours than there are columns",
)

#let palette-for(palette, row, columns) = {
  let k = calc.rem(row, palette-cycles(palette, columns))
  palette.slice(k * columns, count: columns)
}

// A colour light enough that a bar of it would be invisible on paper and a
// tint of it indistinguishable from the page: white, and anything near it.
// The one property the templates read off a colour, so that white counters
// need no special case by name.
#let pale(entry) = oklab(entry.color).components().first() > 90%

// The strip behind the tallies: the colour's hue at a fixed pale lightness
// and a fraction of its chroma, so every strip in a set is equally faint
// whatever the colour is and equally easy to write over in pen. Lighter than
// it needs to look on screen --- these print CMYK, which lays the colour down
// heavier than a monitor shows it, and the strip's job is to be a ground, not
// a block of colour. The bar down its leading edge carries the colour that a
// counter is matched against.
//
// A pale colour has no tint to give: its strip is the page, and the dashed
// outline below is what gives it an area to write in.
#let strip-fill(entry) = if pale(entry) { white } else {
  let (_, chroma, hue, ..) = oklch(entry.color).components()
  oklch(94%, chroma * 0.15, hue)
}

// One saturated edge rather than a box: a bar down the strip's left side.
// The bar is the colour cue --- what a counter drawn from the bag is matched
// against --- so it is wide enough to read as the colour rather than as a
// line of it, which a hairline of a dark hue is not. The other three sides
// are the tint's own edges. A pale colour has no bar to draw --- a white rule
// on paper is nothing --- so it keeps a hairline outline instead.
// Named, because the strip's own padding is measured off it: a box stroke is
// drawn centred on the edge, so half the bar sits inside the box and the
// tally marks have to start clear of it.
#let strip-bar = 5pt

#let strip-stroke(entry) = if pale(entry) {
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
// One palette out and back is `2 * columns` squares across the page, at 19mm
// each unless a wide palette needs them smaller to fit.
#let counter-gap = 4mm
#let counter-margin = 10mm

#let counter-cell(columns) = calc.min(
  19mm,
  (page.width - 2 * counter-margin - (2 * columns - 1) * counter-gap)
    / (2 * columns),
)

// Rows of counters on the page: as many as fit, rounded down to a multiple of
// twice the number of palettes, because the palettes cycle down the rows and
// the row order has to be a palindrome (see ledger-counters.typ), so each half
// of the page needs a whole number of cycles. Needs `context` for the page
// size.
#let counter-rows(columns, cycles) = {
  let cell = counter-cell(columns)
  let rows = calc.floor(
    (page.height - 2 * counter-margin + counter-gap) / (cell + counter-gap),
  )
  rows - calc.rem(rows, 2 * cycles)
}

// Each colour appears twice in its row and its palette takes an equal share
// of the rows.
#let counters-per-colour(columns, cycles) = (
  2 * counter-rows(columns, cycles) / cycles
)
