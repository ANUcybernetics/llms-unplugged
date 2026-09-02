// Printable counters for the ledger activity: a page of coloured squares in
// the ledger palettes, to cut up and draw from a bag.
//
// The page is symmetric under a flip about either axis: every row is one
// palette out and back (red, blue, green, yellow, yellow, green, blue, red),
// the two palettes alternate rows, and the row order is itself a palindrome.
// That is what makes it print double-sided with no imposition step: the PDF
// is two identical pages, and whichever edge the printer flips on, each square
// lands on a square of its own colour on the back. A counter drawn from the
// bag then reads the same whichever face is up. Print it duplex, as many
// copies as the brief asks for.

#import "ledger-common.typ": (
  counter-cell, counter-margin, counter-rows, palettes,
)

#let paper_size = sys.inputs.at("paper_size", default: "a4")
#set page(paper: paper_size, margin: counter-margin)
#set text(font: "Public Sans")

// Dark text on the light counters, light text on the rest.
#let label-fill(entry) = if entry.name in ("white", "yellow") { luma(0) } else {
  white
}

#let counter(entry) = box(
  width: counter-cell,
  height: counter-cell,
  fill: entry.color,
  align(center + horizon, text(size: 8pt, fill: label-fill(entry), entry.name)),
)

// A palette out and back: each of its colours twice, in mirror positions.
#let mirrored(palette) = palette + palette.rev()

// Row i takes palette 0 or 1 so that the sequence reads the same from either
// end: 0 1 0 1 ... in the top half, mirrored in the bottom half.
#let palette-index(i, rows) = if i < rows / 2 { calc.rem(i, 2) } else {
  calc.rem(rows - 1 - i, 2)
}

#let page-of-counters() = context {
  let rows = counter-rows(page.height)
  let row-of(i) = mirrored(palettes.at(palette-index(i, rows)))
  align(center + horizon, grid(
    columns: 2 * palettes.at(0).len(),
    rows: rows,
    // Cut guide: a light dashed rule between squares. Drawn over the fills so
    // it shows on the white counters too.
    stroke: (paint: luma(120), thickness: 0.5pt, dash: "dashed"),
    ..range(rows).map(i => row-of(i).map(counter)).flatten(),
  ))
}

#page-of-counters()
#pagebreak()
#page-of-counters()
