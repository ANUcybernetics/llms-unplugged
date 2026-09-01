// Ledger sheets: the model as a table of rows, one per prefix, with a tally
// strip beside every follower.
//
// Training is tallying: read the text a pair at a time, find the prefix's row,
// find (or write in) the follower, add a mark to its strip. Generation is a
// bag of counters: for the current prefix, put one counter into the bag per
// tally mark, in the colour of that follower's strip; draw one; read the
// follower whose strip is that colour. The strips are coloured by column, not
// by word, so one set of counters serves every row. Odd and even rows take
// different palettes, which is what lets a prefix with more followers than
// columns continue onto the row below and still hand the bag eight distinct
// colours.
//
// A set is dealt across a group's sheets in alphabetical runs, and each sheet
// says in its header which prefixes it holds, so "who has _the_?" is answered
// by reading headers rather than by everyone searching their page.

#import "cutout-common.typ": brand-font, brand-gold, brand-lockup, token-font

#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let json_path = sys.inputs.at("json_path", default: "ledger.json")
// What the rows come printed with: "prefixes" (the prefix column filled in)
// or "followers" (prefixes and followers, tallies left to make). Presentation
// rather than data, so it is an input and not part of the JSON: the same set
// prints at either level.
#let prefill = sys.inputs.at("prefill", default: "prefixes")

#let data = json(json_path)
#let sheets = data.sheets
#let columns = data.columns
#let rows_per_page = data.rows_per_page
// Absent for blank sheets, which carry no corpus.
#let metadata = data.at("metadata", default: none)

#let margin = 10mm
#set page(paper: paper_size, flipped: true, margin: margin)
#set text(font: brand-font, size: 10pt)

#let muted = rgb("#666")

// ===== The counter palettes =====
//
// Two palettes of `columns` colours: the first for odd rows, the second for
// even ones. A prefix spilling onto a second row therefore has 2 × `columns`
// distinct strips, and the bag can tell them apart.
//
// These are the colours counters come in, not colours chosen for print. Red,
// blue, green and yellow are the four every set of maths counters has; the
// second four are the next most common. The printed swatch only has to be
// recognisably that colour --- a participant matches a counter in the hand
// against a name and a dot on the page, so the dot is set in the full colour
// and the strip behind the tallies in a tint light enough to write on.
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
#assert(
  columns <= palettes.at(0).len(),
  message: "ledger.typ: no palette for more than "
    + str(palettes.at(0).len())
    + " columns",
)

#let palette-for(row) = palettes.at(calc.rem(row, 2)).slice(0, columns)

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

// ===== One sheet =====

#let header_gap = 2mm
#let lockup_width = 36mm
#let header_title_size = 11.5pt
#let lockup_baseline_shift = lockup_width * 8 / 197.4

// The prefix as it prints: the context tokens, spaced. Punctuation prefixes
// are real and common (what follows "." is how a sentence starts), so they
// are set exactly like words rather than boxed --- a box would suggest a
// different kind of thing, and on this sheet it is the same kind of thing.
#let prefix-text(prefix, size: 13pt, fill: black) = text(
  font: token-font,
  size: size,
  weight: "bold",
  fill: fill,
  prefix.join(" "),
)

// Header: the lockup, the set's title, and --- the part that does the work ---
// the range of prefixes this sheet holds, set large enough to be read across a
// table.
#let sheet-header(sheet) = block(width: 100%, below: 0pt, {
  set par(leading: 0pt, spacing: 0pt)
  set text(size: header_title_size)
  grid(
    columns: (auto, 1fr, auto),
    align: (left + bottom, center + bottom, right + bottom),
    box(
      brand-lockup(width: lockup_width),
      baseline: lockup_baseline_shift,
    ),
    data.title,
    if sheet.range != none {
      let (first, last) = sheet.range
      (
        prefix-text(first, size: 14pt)
          + h(0.5em)
          + sym.arrow.r
          + h(0.5em)
          + prefix-text(last, size: 14pt)
      )
    } else { [] },
  )
  v(header_gap)
  line(length: 100%, stroke: 0.8pt + brand-gold)
  v(header_gap)
})

#let sheet-footer(index, page-index, page-count) = align(
  center,
  text(fill: luma(150), size: 8pt)[
    #str(index + 1)/#str(sheets.len())
    #if page-count > 1 [
      (page #str(page-index + 1) of #str(page-count))
    ]
    #sym.dash.em www.llmsunplugged.org
  ],
)

// Expand a page's entries into physical rows: each `(entry, k)` is the k-th
// row of that entry, or `(none, 0)` for a padding row. The page is padded to
// `rows_per_page` so every page's rows are the same height and a short last
// page looks like a sheet rather than a fragment --- and on a blank sheet the
// padding rows are the whole point.
#let physical-rows(entries) = {
  let rows = ()
  for entry in entries {
    let n = calc.max(1, calc.ceil(entry.followers.len() / columns))
    for k in range(n) { rows.push((entry: entry, k: k)) }
  }
  while rows.len() < rows_per_page { rows.push((entry: none, k: 0)) }
  rows
}

// The tally strip: tinted to its colour, with the counter dot and the colour's
// name in the corner so the strip can be matched to a counter --- or called
// out --- without the room agreeing on what "orange" looks like in print.
#let tally-strip(entry) = box(
  width: 100%,
  height: 100%,
  fill: strip-fill(entry),
  stroke: strip-stroke(entry),
  inset: 0.8mm,
  radius: 1.5pt,
  place(
    bottom + right,
    stack(
      dir: ltr,
      spacing: 0.6mm,
      align(horizon, text(size: 5.5pt, fill: luma(60), entry.name)),
      counter-dot(entry, size: 2.6mm),
    ),
  ),
)

// The word cell beside a strip: the follower, if the sheet prints them, else
// room to write one.
#let follower-cell(follower) = if follower != none and prefill == "followers" {
  align(
    left + horizon,
    pad(x: 1.5mm, text(font: token-font, size: 12pt, follower.text)),
  )
} else { [] }

// The prefix cell: the prefix on an entry's first row, a continuation mark on
// the rows after it, nothing on a padding row.
#let prefix-cell(row) = {
  let content = if row.entry == none { [] } else if (
    row.k == 0
  ) { prefix-text(row.entry.prefix) } else {
    text(size: 11pt, fill: luma(140), "↳")
    h(0.4em)
    prefix-text(row.entry.prefix, size: 11pt, fill: luma(140))
  }
  align(left + horizon, pad(x: 1.5mm, content))
}

// One page of rows. The grid takes the whole height it is given, so the rows
// share it equally: `rows_per_page` is the density knob and the row height
// follows from it.
#let rows-grid(rows) = {
  let prefix_w = 42mm
  let cells = ()
  for (y, row) in rows.enumerate() {
    let palette = palette-for(y)
    cells.push(grid.cell(x: 0, y: y, fill: luma(245), prefix-cell(row)))
    for c in range(columns) {
      let follower = if row.entry == none { none } else {
        row.entry.followers.at(row.k * columns + c, default: none)
      }
      cells.push(grid.cell(x: 1 + 2 * c, y: y, follower-cell(follower)))
      cells.push(grid.cell(
        x: 2 + 2 * c,
        y: y,
        inset: 0.9mm,
        tally-strip(palette.at(c)),
      ))
    }
  }

  // Rules: a heavy line where one prefix ends and the next begins, a light
  // one between the rows of a single prefix, so a continuation reads as part
  // of the row above it. A blank sheet has no entries, so every rule is heavy
  // and the parity is left to the strips.
  let hlines = range(rows.len() + 1).map(y => {
    let continues = (
      y < rows.len() and rows.at(y).entry != none and rows.at(y).k > 0
    )
    grid.hline(
      y: y,
      stroke: if continues { 0.4pt + luma(170) } else { 0.8pt + luma(0) },
    )
  })
  let vlines = (
    (grid.vline(x: 0, stroke: 0.8pt + luma(0)),)
      + range(columns + 1).map(c => grid.vline(
        x: 1 + 2 * c,
        stroke: if c == 0 { 0.8pt + luma(0) } else { 0.4pt + luma(120) },
      ))
  )

  grid(
    columns: (prefix_w,) + ((3fr, 1fr) * columns),
    rows: (1fr,) * rows.len(),
    inset: 0pt,
    ..hlines,
    ..vlines,
    ..cells,
  )
}

// ===== The facilitator brief =====

// The brief is one page, printed once, and only when there is a corpus to
// describe: blank sheets are handed to a group that already knows the game.
#let brief() = {
  set page(footer: align(
    center,
    text(fill: brand-gold, size: 9pt, "www.llmsunplugged.org"),
  ))
  show heading: set block(above: 1.4em, below: 0.8em)
  set par(justify: false)

  let n-prefix = if sheets.len() > 0 {
    let e = sheets.map(s => s.pages.flatten()).flatten().first()
    e.prefix.len()
  } else { 1 }
  let prefix-noun = if n-prefix == 1 [prefix word] else [#(str(n-prefix) + "-word") prefix]
  let entries = sheets.map(s => s.pages.flatten()).flatten()
  let prefixes = entries.len()
  let max-count = calc.max(
    1,
    ..entries.map(e => e.followers.map(f => f.count)).flatten(),
  )
  let max-followers = calc.max(0, ..entries.map(e => e.followers.len()))

  let prefill-sentence = if prefill == "followers" [
    The prefixes and their followers are printed; every tally strip starts
    empty.
  ] else [
    The prefixes are printed and the follower cells are empty: each row
    discovers its own followers as the text is read.
  ]

  grid(
    columns: (1fr, auto),
    column-gutter: 1em,
    align: (left + horizon, right + horizon),
    [= Ledger sheets: how to run the activity], brand-lockup(width: 45mm),
  )

  let brief-what = [
    The pages after this one are #sheets.len() *ledger sheets* built from #emph(
      metadata.title,
    ) by #metadata.author. Together they are the model: #prefixes rows, one per
    #prefix-noun, dealt across the sheets in alphabetical runs. Each sheet's
    header says the first and last prefix it holds, so a group of #sheets.len()
    can find any prefix by reading headers. Print one-sided and hand out one
    sheet per person.

    A row is a prefix followed by #columns *follower cells*. Each cell has room
    for a follower word and, beside it, a coloured *tally strip*. A prefix with
    more than #columns followers continues onto the row below, marked with
    #"↳". #prefill-sentence

    == The colours

    The strips are coloured by column, not by word, and alternate between two
    sets of #columns on odd and even rows --- so a prefix that runs to two rows
    has #str(2 * columns) different colours and the bag can tell them apart.
    Don't explain the colours until the generation round; during training they
    are just stripes.

    #let key(label, palette) = grid(
      columns: (auto,) + (auto,) * palette.len(),
      column-gutter: 1.2em,
      align: horizon,
      text(size: 9pt, fill: muted, style: "italic", label),
      ..palette.map(e => stack(
        dir: ltr,
        spacing: 0.4em,
        counter-dot(e),
        align(horizon, text(size: 9pt, e.name)),
      )),
    )
    #block(above: 0.8em, below: 0.8em, stack(
      spacing: 0.7em,
      key("odd rows", palette-for(0)),
      key("even rows", palette-for(1)),
    ))

    *Bring* one bag per group and counters in these #str(2 * columns) colours,
    at least #max-count of each: that is the most times any one follower appears
    in this text, and so the most counters of one colour a single draw can need.
  ]

  let brief-how = [
    == Training

    One person reads the text aloud, a pair of tokens at a time: the prefix,
    then the word after it. Whoever holds that prefix finds its row, finds the
    follower (writing it into the next empty cell if it is new) and adds one
    tally mark to that follower's strip. Then the reader moves along by one
    token, so the word just tallied becomes the next prefix. Punctuation is a
    token like any other: a full stop has followers, and so has a comma.

    When the text runs out, the tallies are the model.

    == Generation

    + *Pick a starting prefix* and find its row.
    + *Load the bag*: for every tally mark on that row, put in one counter in
      the colour of that mark's strip.
    + *Draw one counter* without looking. Its colour names a strip on that row;
      the follower beside it is the next word. Write it down.
    + *Empty the bag.* The word just written is the new prefix: find whoever
      holds it and hand over. Repeat until you hit a full stop you like, or for
      as long as you like.

    A row with a single follower needs no bag: there is only one place to go. A
    row whose strips are all empty is a dead end --- the prefix only ever ended
    the text --- so start again from any prefix.

    == What to watch for

    *The bag is the probability distribution.* A follower with five marks goes
    into the bag five times and comes out about five times as often as one with
    one mark. Nobody has to explain weighted sampling; the bag performs it.

    *Nobody holds the model.* Every hand-over is a lookup in someone else's
    sheet, and the text the group writes down is the group generating, not any
    one of them.

    #text(size: 9pt, fill: muted)[
      #metadata.total_tokens tokens, #metadata.unique_tokens unique #sym.dot.c
      #prefixes prefixes, the widest with #max-followers followers #sym.dot.c
      #calc.round(metadata.entropy, digits: 2) bits/token #sym.dot.c perplexity
      #calc.round(metadata.perplexity, digits: 1)
    ]
  ]

  grid(
    columns: (1fr, 1fr),
    column-gutter: 1.6em,
    align: top,
    brief-what, brief-how,
  )
  pagebreak()
}

#if metadata != none { brief() }

// ===== The sheets =====

#for (i, sheet) in sheets.enumerate() {
  if i > 0 { pagebreak(weak: false) }
  for (p, entries) in sheet.pages.enumerate() {
    if p > 0 { pagebreak(weak: false) }
    set page(footer: sheet-footer(i, p, sheet.pages.len()))
    block(
      width: 100%,
      height: 100%,
      grid(
        rows: (auto, 1fr),
        sheet-header(sheet),
        rows-grid(physical-rows(entries)),
      ),
    )
  }
}
