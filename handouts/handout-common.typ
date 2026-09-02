// Copyright (c) 2026 Ben Swift
// Licensed under CC BY-NC-SA 4.0. See handouts/LICENSE for details.
//
// Page furniture for the printed worksheets: the word mark, the gold rule
// and the URL, in the same arrangement the CLI puts on a search sheet or a
// ledger. A worksheet and a set of sheets get handed out in the same hour, so
// they are the same artefact family and read as one.
//
// The brand itself comes from cli/cutout-common.typ rather than being
// restated here --- one definition of the gold, the face and the mark across
// everything the project prints. The Makefile compiles with `--root ..`, so
// the cross-directory import resolves.
#import "../cli/cutout-common.typ": brand-font, brand-gold, brand-lockup

#let lockup_width = 34mm
// The lockup's own artwork sits 8/197.4 of its width below the baseline;
// shifting by that much sets it on the line with the title beside it.
#let lockup_baseline_shift = lockup_width * 8 / 197.4

// The running header: the mark, the sheet's title opposite it, and the gold
// rule under both.
#let handout-header(title) = {
  set par(leading: 0pt, spacing: 0pt)
  set text(font: brand-font, size: 11.5pt, fill: black)
  box(brand-lockup(width: lockup_width), baseline: lockup_baseline_shift)
  h(1fr)
  if title != none { title }
  v(2mm)
  line(length: 100%, stroke: 0.8pt + brand-gold)
}

#let handout-footer() = align(
  center,
  text(font: brand-font, fill: brand-gold, size: 9pt, "www.llmsunplugged.org"),
)

// Wrap a worksheet: `#show: handout.with(title: [...])`. Everything the
// project says is set in the brand face; a worksheet that sets its own face
// for some part of its body (a corpus in Libertinus, say) overrides it there.
#let handout(
  title: none,
  paper: "a4",
  flipped: false,
  margin: 15mm,
  body,
) = {
  set page(
    paper: paper,
    flipped: flipped,
    margin: (rest: margin, top: margin + 8mm, bottom: margin + 6mm),
    header: handout-header(title),
    header-ascent: 40%,
    footer: handout-footer(),
  )
  set text(font: brand-font, size: 11pt)
  body
}
