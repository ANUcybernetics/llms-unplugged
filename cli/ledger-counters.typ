// Printable counters for the ledger activity: a page of coloured squares in
// the ledger palettes, to cut up and draw from a bag.
//
// The page is symmetric under a flip about either axis: every row is one
// palette out and back (red, blue, green, yellow, yellow, green, blue, red),
// the three palettes cycle down the rows, and the row order is itself a
// palindrome (1 2 3 1 2 3 3 2 1 3 2 1).
// That is what makes it print double-sided with no imposition step: the PDF
// is two identical pages, and whichever edge the printer flips on, each square
// lands on a square of its own colour on the back. A counter drawn from the
// bag then reads the same whichever face is up. Print it duplex, as many
// copies as the brief asks for.

#import "ledger-common.typ": (
  counter-cell, counter-gap, counter-margin, counter-rows, palette-count,
  palettes-in-use as palettes,
)

#let paper_size = sys.inputs.at("paper_size", default: "a4")
#set page(paper: paper_size, margin: counter-margin)
#set text(font: "Public Sans")

// Black text on the light counters, white on the dark: decided by OKLab
// lightness rather than by name, so a palette change cannot leave a label
// unreadable. The threshold sits between teal (about 58%) and grey (63%),
// where the two choices trade places on contrast.
#let label-fill(entry) = if oklab(entry.color).components().first() > 60% {
  luma(0)
} else { white }

// The white counter is the page unless something marks its edge.
#let counter(entry) = box(
  width: counter-cell,
  height: counter-cell,
  fill: entry.color,
  stroke: if entry.name == "white" {
    (paint: luma(150), thickness: 0.5pt, dash: "dashed")
  } else { none },
  align(center + horizon, text(size: 8pt, fill: label-fill(entry), entry.name)),
)

// A palette out and back: each of its colours twice, in mirror positions.
#let mirrored(palette) = palette + palette.rev()

// Row i takes its palette so that the sequence reads the same from either
// end: 0 1 2 0 1 2 ... in the top half, mirrored in the bottom half.
#let palette-index(i, rows) = if i < rows / 2 {
  calc.rem(i, palette-count)
} else { calc.rem(rows - 1 - i, palette-count) }

#let page-of-counters() = context {
  let rows = counter-rows()
  let row-of(i) = mirrored(palettes.at(palette-index(i, rows)))
  align(center + horizon, grid(
    columns: 2 * palettes.at(0).len(),
    rows: rows,
    // The gutter is the cut guide: anywhere in the white does.
    gutter: counter-gap,
    ..range(rows).map(i => row-of(i).map(counter)).flatten(),
  ))
}

#page-of-counters()
#pagebreak()
#page-of-counters()
