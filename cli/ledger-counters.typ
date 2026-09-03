// Printable counters for the ledger activity: a page of coloured squares in
// the set's palette, to cut up and draw from a bag. The colours are the ones
// the sheets print, read from the same ledger.json.
//
// The page is symmetric under a flip about either axis: every row is one
// palette out and back (its colours in order, then in reverse), the palettes
// cycle down the rows, and the row order is itself a palindrome (with three
// palettes: 1 2 3 1 2 3 3 2 1 3 2 1).
// That is what makes it print double-sided with no imposition step: the PDF
// is two identical pages, and whichever edge the printer flips on, each square
// lands on a square of its own colour on the back. A counter drawn from the
// bag then reads the same whichever face is up. Print it duplex, as many
// copies as the brief asks for.

#import "ledger-common.typ": (
  check-columns, counter-cell, counter-gap, counter-margin, counter-rows, pale,
  palette-cycles, palette-for, read-palette,
)

#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let json_path = sys.inputs.at("json_path", default: "ledger.json")

#let data = json(json_path)
#let columns = data.columns
#let palette = read-palette(data)
#check-columns(palette, columns)
#let cycles = palette-cycles(palette, columns)
#set page(paper: paper_size, margin: counter-margin)
#set text(font: "Public Sans")

// Black text on the light counters, white on the dark: decided by OKLab
// lightness rather than by name, so a palette change cannot leave a label
// unreadable. The threshold sits between teal (about 58%) and grey (63%),
// where the two choices trade places on contrast.
#let label-fill(entry) = if oklab(entry.color).components().first() > 60% {
  luma(0)
} else { white }

// A counter light enough to be the page is nothing unless something marks its
// edge; the same lightness test the strips use for their outline.
#let counter(entry, cell) = box(
  width: cell,
  height: cell,
  fill: entry.color,
  stroke: if pale(entry) {
    (paint: luma(150), thickness: 0.5pt, dash: "dashed")
  } else { none },
  align(center + horizon, text(size: 8pt, fill: label-fill(entry), entry.name)),
)

// A palette out and back: each of its colours twice, in mirror positions.
#let mirrored(palette) = palette + palette.rev()

// Row i takes its palette so that the sequence reads the same from either
// end: 0 1 2 0 1 2 ... in the top half, mirrored in the bottom half.
#let palette-index(i, rows) = if i < rows / 2 {
  calc.rem(i, cycles)
} else { calc.rem(rows - 1 - i, cycles) }

#let page-of-counters() = context {
  let rows = counter-rows(columns, cycles)
  let cell = counter-cell(columns)
  let row-of(i) = mirrored(palette-for(
    palette,
    palette-index(i, rows),
    columns,
  ))
  align(center + horizon, grid(
    columns: 2 * columns,
    rows: rows,
    // The gutter is the cut guide: anywhere in the white does.
    gutter: counter-gap,
    ..range(rows).map(i => row-of(i).map(e => counter(e, cell))).flatten(),
  ))
}

#page-of-counters()
#pagebreak()
#page-of-counters()
