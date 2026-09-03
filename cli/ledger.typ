// Ledger sheets: the model as a table of rows, one per prefix, with a tally
// strip beside every follower.
//
// Training is tallying: read the text a pair at a time, find the prefix's row,
// find (or write in) the follower, add a mark to its strip. Generation is a
// bag of counters: for the current prefix, put one counter into the bag per
// tally mark, in the colour of that follower's strip; draw one; read the
// follower whose strip is that colour. The strips are coloured by column, not
// by word, so one set of counters serves every row. Three palettes cycle
// down the rows, which is what lets a prefix with more followers than columns
// continue onto the rows below and still hand the bag twelve distinct
// colours.
//
// A set is dealt across a group's sheets in alphabetical runs, and each sheet
// says in its header which prefixes it holds, so "who has _the_?" is answered
// by reading headers rather than by everyone searching their page.

#import "cutout-common.typ": brand-font, brand-gold, brand-lockup
#import "ledger-common.typ": (
  check-columns, counter-dot, counters-per-colour, palette-for, palettes,
  strip-bar, strip-fill, strip-stroke, token-text as common-token-text,
)

#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let json_path = sys.inputs.at("json_path", default: "ledger.json")
// What the rows come printed with, each level adding to the one before it:
// "prefixes" (the prefix column filled in), "followers" (prefixes and
// followers, tallies left to make) or "tallies" (the trained model, marks and
// all). Presentation rather than data, so it is an input and not part of the
// JSON: the same set prints at any level.
#let prefill = sys.inputs.at("prefill", default: "prefixes")
// Every level from "followers" up prints the follower words.
#let prints_followers = prefill in ("followers", "tallies")
// The marks the sheet sets in a symbol tile. An input rather than JSON for
// the same reason `prefill` is, but the CLI sources it from the tokeniser, so
// it is exactly the set that was kept as standalone tokens.
#let punct-chars = sys.inputs.at("punctuation", default: ".,!?;:").clusters()

#let data = json(json_path)
#let sheets = data.sheets
#let columns = data.columns
#let rows_per_page = data.rows_per_page
// Absent for blank sheets, which carry no corpus.
#let metadata = data.at("metadata", default: none)
#check-columns(columns)

#let margin = 10mm
#set page(paper: paper_size, flipped: true, margin: margin)
#set text(font: brand-font, size: 10pt)

#let muted = rgb("#666")

// ===== One sheet =====

#let header_gap = 2mm
#let lockup_width = 36mm
#let header_title_size = 11.5pt
#let lockup_baseline_shift = lockup_width * 8 / 197.4

// One printed token, word or symbol tile (see ledger-common.typ), for the
// marks this set kept as tokens.
#let token-text(t, size: 13pt, fill: black, weight: "bold") = common-token-text(
  t,
  punct-chars,
  size: size,
  fill: fill,
  weight: weight,
)

// The prefix as it prints: the context tokens, spaced.
#let prefix-text(prefix, size: 13pt, fill: black) = {
  for (i, t) in prefix.enumerate() {
    if i > 0 { h(0.35em) }
    token-text(t, size: size, fill: fill)
  }
}

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

// One number, counting up by one across every page of every sheet, and where
// to find the project. No corpus title: on a set built to withhold its sources
// it is a placeholder anyway, and on any other set the facilitator has just
// said what the text is. What is left is the pair of things a page found on
// the floor after the session cannot be put back in the stack without.
//
// The number is the page counter rather than the sheet index, so a sheet
// running to two pages gets two distinct numbers instead of two pages reading
// alike. The counter is reset after the facilitator brief, so the first sheet
// page is page 1.
#let sheet-footer = align(
  center,
  context text(fill: luma(150), size: 8pt)[
    #counter(page).display()
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

// ===== Printed tallies =====
//
// One five-bar gate: `n` marks (1--5), the fifth struck through the other
// four, drawn at `unit` --- the spacing between uprights, which everything
// else is measured in.
#let tally-gate(n, unit) = {
  let (w, h) = (4 * unit, 3.5 * unit)
  // Inked in proportion to the mark, so a gate reads as a gate at any size:
  // heavy enough to carry over the faint strip in print, with a floor so the
  // smallest marks do not thin away to nothing.
  let ink = calc.max(0.45pt, unit / 5) + black
  box(width: w, height: h, {
    for i in range(calc.min(n, 4)) {
      place(top + left, dx: (i + 0.5) * unit, line(end: (0pt, h), stroke: ink))
    }
    if n >= 5 {
      place(top + left, dy: h, line(end: (w, -h), stroke: ink))
    }
  })
}

// A follower's marks, filling the strip they are given. The unit shrinks
// until the marks fit: a common prefix's commonest follower runs to forty-odd
// even in a picture book, and the alternative to shrinking is a strip that
// spills over its neighbours. It shrinks to fit `budget` --- the largest
// count anywhere in the entry --- rather than this follower's own count, so
// one prefix's strips are all drawn at one size and the ink on them is
// proportional to the counts, which is the claim the bag makes. Below the
// floor the marks would be a smudge, so a count that will not fit even there
// prints as a numeral.
#let tally_unit_max = 1.1mm
#let tally_unit_min = 0.3mm

#let tally-marks(count, budget) = layout(size => {
  // Gates across the strip and rows of them down it, at a given unit: gates
  // sit `unit` apart, their rows `1.2 * unit`.
  let per-row(unit) = calc.max(1, calc.floor((size.width + unit) / (5 * unit)))
  let fits(unit, gates) = {
    let rows = calc.ceil(gates / per-row(unit))
    rows * 3.5 * unit + (rows - 1) * 1.2 * unit <= size.height
  }
  let budget_gates = calc.ceil(budget / 5)
  let unit = tally_unit_max
  while unit > tally_unit_min and not fits(unit, budget_gates) {
    unit -= 0.05mm
  }

  let gates = calc.ceil(count / 5)
  if fits(unit, gates) {
    grid(
      columns: per-row(unit),
      column-gutter: unit,
      row-gutter: 1.2 * unit,
      ..range(gates).map(g => tally-gate(calc.min(5, count - 5 * g), unit)),
    )
  } else {
    align(center + horizon, text(size: 7pt, str(count)))
  }
})

// The tally strip: tinted to its colour, with a bar down its leading edge in
// the full colour to match a counter against and the colour's name in the
// corner so it can be called out --- without the room agreeing on what
// "purple" looks like in print. The tint gives the strip its area, so it
// needs no box drawn around it. On a "tallies" sheet the marks fill it; the
// corner keeps its name, which is what a drawn counter is matched against, so
// the marks get the strip less that much height.
#let strip_label_size = 5.5pt
#let tally-strip(entry, follower, budget) = box(
  width: 100%,
  height: 100%,
  fill: strip-fill(entry),
  stroke: strip-stroke(entry),
  // Air around the marks, and on the left enough of it to clear the half of
  // the colour bar that falls inside the box: a tally drawn hard against the
  // bar reads as part of it.
  inset: (left: strip-bar / 2 + 2mm, rest: 2mm),
  {
    if prefill == "tallies" and follower != none {
      block(
        width: 100%,
        height: 100% - 2 * strip_label_size,
        tally-marks(follower.count, budget),
      )
    }
    place(
      bottom + right,
      text(size: strip_label_size, fill: luma(60), entry.name),
    )
  },
)

// The word cell beside a strip: the follower, if the sheet prints them, else
// room to write one.
#let follower-cell(follower) = if follower != none and prints_followers {
  align(
    left + horizon,
    pad(x: 1.5mm, token-text(follower.text, size: 12pt, weight: "regular")),
  )
} else { [] }

// The prefix cell: the prefix on an entry's first row, repeated in grey on
// the rows after it, nothing on a padding row.
#let prefix-cell(row) = {
  let content = if row.entry == none { [] } else if (
    row.k == 0
  ) { prefix-text(row.entry.prefix) } else {
    prefix-text(row.entry.prefix, size: 11pt, fill: luma(140))
  }
  align(left + horizon, pad(x: 1.5mm, content))
}

// One page of rows. The grid takes the whole height it is given, so the rows
// share it equally: `rows_per_page` is the density knob and the row height
// follows from it.
// The word cell against its strip. A strip comes out about as tall as a row,
// so this ratio is what sets its shape: 1.6 to 1 leaves it a golden rectangle
// at the default twelve rows a page, wider than tall, which both suits the
// eye and gives the tally marks room to be drawn at a legible size. A very
// different `--rows` moves it off golden, since rows share the page height.
#let word_fr = 1.47fr
#let strip_fr = 1fr

#let rows-grid(rows) = {
  let prefix_w = 42mm
  let cells = ()
  for (y, row) in rows.enumerate() {
    let palette = palette-for(y, columns)
    // The tallies on all of an entry's rows are drawn to its largest count.
    let budget = if row.entry == none { 1 } else {
      calc.max(1, ..row.entry.followers.map(f => f.count))
    }
    cells.push(grid.cell(x: 0, y: y, prefix-cell(row)))
    for c in range(columns) {
      let follower = if row.entry == none { none } else {
        row.entry.followers.at(row.k * columns + c, default: none)
      }
      cells.push(grid.cell(x: 1 + 2 * c, y: y, follower-cell(follower)))
      cells.push(grid.cell(
        x: 2 + 2 * c,
        y: y,
        inset: 0.9mm,
        tally-strip(palette.at(c), follower, budget),
      ))
    }
  }

  // Rules: a line where one prefix ends and the next begins, a fainter one
  // between the rows of a single prefix, so a continuation reads as part of
  // the row above it. A blank sheet has no entries, so every rule is the
  // heavier one and the parity is left to the strips.
  //
  // No frame and no rules between the follower cells: the strips are a strong
  // enough vertical rhythm to be the columns, and the table is bounded by the
  // header's rule above and the footer below. Only the two boundaries that
  // carry meaning get ink --- between prefixes, and between the prefix and
  // its followers.
  let hlines = range(1, rows.len()).map(y => {
    let continues = rows.at(y).entry != none and rows.at(y).k > 0
    grid.hline(
      y: y,
      stroke: if continues { 0.3pt + luma(205) } else { 0.5pt + luma(70) },
    )
  })
  let vlines = (grid.vline(x: 1, stroke: 0.5pt + luma(150)),)

  grid(
    columns: (prefix_w,) + ((word_fr, strip_fr) * columns),
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
// "the first 300 tokens of _Title_" when the set was read under a budget,
// else just the title: a facilitator should know a set is not the whole text.
#let corpus-phrase(metadata) = if "max_tokens" in metadata [the first
  #metadata.max_tokens tokens of #if (
    metadata.at("documents", default: 1) > 1
  ) [each of] #emph(metadata.title)] else [#emph(metadata.title)]

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
  let prefix-noun = if n-prefix == 1 [prefix word] else [#(
      str(n-prefix) + "-word"
    ) prefix]
  let entries = sheets.map(s => s.pages.flatten()).flatten()
  let prefixes = entries.len()
  let max-count = calc.max(
    1,
    ..entries.map(e => e.followers.map(f => f.count)).flatten(),
  )
  let max-followers = calc.max(0, ..entries.map(e => e.followers.len()))

  let prefill-sentence = if prefill == "tallies" [
    The rows come complete: prefixes, followers, and the tally marks this text
    produced.
  ] else if prefill == "followers" [
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
    The pages after this one are #sheets.len() *ledger sheets* built from
    #corpus-phrase(metadata) by #metadata.author. Together they are the model:
    #prefixes rows, one per #prefix-noun, dealt across the sheets in
    alphabetical runs. Each sheet's header says the first and last prefix it
    holds, so a group of #sheets.len() can find any prefix by reading headers.
    Print one-sided and hand out one sheet per person.

    A row is a prefix followed by #columns *follower cells*. Each cell has room
    for a follower word and, beside it, a coloured *tally strip*. A prefix with
    more than #columns followers continues onto the row below, where its prefix
    is repeated in grey. #prefill-sentence

    == The colours

    The strips are coloured by column, not by word, and cycle through three sets
    of #columns down the rows --- so a prefix that runs to three rows has #str(
      3 * columns,
    ) different colours and the bag can tell them apart.
    #if prefill != "tallies" [
      Don't explain the colours until the generation round; during training they
      are just stripes.
    ]

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
      key("rows 1, 4, 7 ...", palette-for(0, columns)),
      key("rows 2, 5, 8 ...", palette-for(1, columns)),
      key("rows 3, 6, 9 ...", palette-for(2, columns)),
    ))

    *Bring* one bag per group and counters in these #str(3 * columns) colours,
    at least #max-count of each: that is the most times any one follower appears
    in this text, and so the most counters of one colour a single draw can need.
    The CLI writes #raw("counters.pdf") beside this file: print it double-sided
    (either binding works) and cut the squares apart for
    #context counters-per-colour() of each colour per sheet.
    #if prefill != "tallies" [
      It also writes #raw("text.pdf"), the text as the tokeniser read it, for
      the training round: print one per group.
    ]
  ]

  let training = if prefill == "tallies" [
    == Already trained

    These sheets are the finished model: the marks on them are the counts the
    text produced, so there is no training round to run. Hand them out and start
    at generation. To run the training round as well, print a second set with
    #raw("--prefill prefixes") and keep this one as the answer key.
  ] else [
    == Training

    One person reads the text aloud from #raw("text.pdf"), a pair of tokens at a
    time: the prefix, then the word after it. Whoever holds that prefix finds
    its row, finds the follower (writing it into the next empty cell if it is
    new) and adds one tally mark to that follower's strip. Then the reader moves
    along by one token, so the word just tallied becomes the next prefix.
    Punctuation is a token like any other: a full stop has followers, and so has
    a comma. The text page numbers every token, so a group that loses its place
    can say where it was.

    When the text runs out, the tallies are the model.
  ]

  let brief-how = [
    #training

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

#counter(page).update(1)
#set page(footer: sheet-footer)

#for (i, sheet) in sheets.enumerate() {
  if i > 0 { pagebreak(weak: false) }
  for (p, entries) in sheet.pages.enumerate() {
    if p > 0 { pagebreak(weak: false) }
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
