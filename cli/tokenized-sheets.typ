// Per-participant search sheets for the no-cutting variant of the cutouts
// lesson.
//
// Instead of cutting a corpus into pieces and spreading them on a table, the
// CLI shuffles the cutouts and deals them round-robin into one sheet per
// participant. Everyone keeps their own sheet, finds the token pairs matching
// the context that was just called out, and reads out the next token. The room
// as a whole holds the corpus statistics, so the number of hands that go up for
// a given token is that token's count in the text.
//
// The shuffle is what makes this work: in corpus order an uncut page is just
// the source text with boxes drawn around it.

// Palette, colour hash and token renderers, shared with tokenized-cutouts.typ.
#import "cutout-common.typ": (
  brand-font, brand-gold, brand-lockup, derive-n, inter_word_gap, palette,
  renderers,
)
#let (
  coloured-word,
  render-cutout,
  word-box,
  entry-for,
  colour-key,
  ..,
) = renderers()

// Get configuration from sys.inputs
#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let json_path = sys.inputs.at("json_path", default: "sheets.json")
#let font_size = eval(sys.inputs.at("font_size", default: "16pt"))
#let columns_per_sheet = int(sys.inputs.at("columns", default: "4"))
// Cap on the rows of pairs per page, or 0 for no cap. Uncapped, a sheet takes
// as many rows as its pairs need and stays on one page, which is the point of
// the activity: one sheet per person. A cap spaces the rows further apart ---
// they stretch to fill the page --- at the cost of a second page per sheet.
#let rows_per_page = int(sys.inputs.at("rows", default: "0"))

#set text(font: ("Libertinus Serif", "Noto Serif CJK SC"), size: 11pt)
// Bound rather than written inline, because the sheet layout has to work out
// the usable width for itself: `layout()` would hand it over directly but is a
// container, and containers may not contain the pagebreaks a multi-page sheet
// needs. So the width is derived from the page and this margin instead.
#let margin_x = 12mm
#let margin_y = 14mm
#set page(paper: paper_size, margin: (x: margin_x, y: margin_y))

#let json_data = json(json_path)
#let sheets = json_data.sheets
#let doc_metadata = json_data.metadata

#let all_tokens = sheets.flatten()
#let n = derive-n(all_tokens)
#let previous-words-count = n - 1
// "Token", not "word": a corpus tokenises punctuation separately, so plenty of
// the dealt pairs are boxed on a full stop or a comma and "the last word called
// out" would be describing something that isn't on the page.
#let previous-words-noun = if previous-words-count == 1 { "token" } else {
  "tokens"
}
// Phrase like "token" / "2 tokens", so the prose reads correctly for any n.
#let prev-words-phrase = if previous-words-count > 1 [#str(
    previous-words-count,
  ) #previous-words-noun] else [#previous-words-noun]

// What one dealt item is called. "Token pair" is exact at n=2 --- two tokens,
// the boxed one and the one that follows it --- and is the term the talk and
// the workshop use. A trigram deals three tokens at a time, so anything past
// bigrams falls back to the generic noun rather than lying about the count.
#let pair-noun = if previous-words-count == 1 { "token pair" } else {
  "token group"
}
#let pair-noun-plural = pair-noun + "s"

#let muted = rgb("#666")

// Small counts read as words in running prose, and a corpus is only ever
// combined from a handful of texts. Anything past the list falls back to the
// numeral rather than growing a spelling table nobody will ever print.
// Bounds-checked rather than left to `.at()`'s default: a negative index wraps
// to the end of a Typst array, so an unguarded n = 1 would spell itself "nine".
#let number-word = n => if n >= 2 and n <= 9 {
  ("two", "three", "four", "five", "six", "seven", "eight", "nine").at(n - 2)
} else {
  str(n)
}

// ===== Instructions page (teacher-facing, printed once) =====

// Build a genuine three-step chain out of the dealt pairs, recording which
// sheet each answer came from. Every context in the corpus is on somebody's
// sheet, so the walk always finds a continuation until it reaches the tail of
// the text. Returns an array of `(sheet: <1-based>, token: <token>)`.
#let chain-example(sheets, steps: 3) = {
  // context string -> the pairs that can answer it, with their sheet number
  let index = (:)
  for (i, sheet) in sheets.enumerate() {
    for t in sheet {
      let key = t.previous_words.join(" ")
      index.insert(
        key,
        index.at(key, default: ()) + ((sheet: i + 1, token: t),),
      )
    }
  }

  // Prefer pairs made only of alphabetic words: a chain that runs through a
  // free-standing "." reads strangely in the worked example.
  let clean = e => (
    e.token.text.find(regex("[A-Za-z]")) != none
      and e.token.previous_words.all(p => p.find(regex("[A-Za-z]")) != none)
  )
  // Prefer an answer from a sheet other than the one that just answered:
  // every sheet holds some continuation of a common context, so taking the
  // first match every time would walk the whole example through sheet 1 and
  // hide the point that the model is spread across the room.
  // Prefer a token the board has not already written. A frequent context can
  // otherwise answer with a token that leads straight back to it --- Australia
  // walked "and" -> "Vietnam" -> "and" -> "Vietnam" --- and an example that
  // visibly repeats itself sits badly under a closing line about generating
  // text without repeating the corpus.
  let pick = (candidates, avoid: none, written: ()) => {
    let preferred = candidates.filter(clean)
    let clean-pool = if preferred.len() > 0 { preferred } else { candidates }
    let novel = clean-pool.filter(e => e.token.text not in written)
    let pool = if novel.len() > 0 { novel } else { clean-pool }
    let elsewhere = pool.filter(e => e.sheet != avoid)
    if elsewhere.len() > 0 { elsewhere.first() } else { pool.first() }
  }

  let first_sheet = sheets.at(0, default: ())
  if first_sheet.len() == 0 { return () }

  let result = (pick(first_sheet.map(t => (sheet: 1, token: t))),)
  let seed = result.first()
  let written = seed.token.previous_words + (seed.token.text,)
  while result.len() < steps {
    let key = written.slice(written.len() - previous-words-count).join(" ")
    let candidates = index.at(key, default: ())
    if candidates.len() == 0 { break }
    let answer = pick(candidates, avoid: result.last().sheet, written: written)
    result.push(answer)
    written.push(answer.token.text)
  }
  result
}

// A pair as it appears in the instructions: unboxed, exactly as it appears on
// the sheets. `box` only to keep it from breaking across lines.
#let pair-chip(token) = box(render-cutout(token))

// "the first 300 tokens of _Title_" when the set was read under a budget,
// else just the title: a facilitator should know a set is not the whole text.
#let corpus-phrase(metadata) = if "max_tokens" in metadata [the first
  #metadata.max_tokens tokens of #emph(metadata.title)] else [#emph(
    metadata.title,
  )]

#let instructions-page() = {
  set page(footer: align(
    center,
    text(
      font: brand-font,
      fill: brand-gold,
      size: 9pt,
      "www.llmsunplugged.org",
    ),
  ))
  // The brief is the project talking, so it is set in the project's typeface.
  // Only the token pairs quoted inside it stay Libertinus, and they carry that
  // with them from the renderers.
  set text(font: brand-font, size: 10pt)
  show heading: set block(above: 1.5em, below: 0.9em)
  set par(justify: false)

  let sheet_sizes = sheets.map(s => s.len())
  let smallest = calc.min(..sheet_sizes)
  let largest = calc.max(..sheet_sizes)
  let per_sheet = if smallest == largest [#smallest] else [
    #smallest#sym.dash.en#largest
  ]

  grid(
    columns: (1fr, auto),
    column-gutter: 1em,
    align: (left + horizon, right + horizon),
    [= Search sheets: how to run the activity], brand-lockup(width: 45mm),
  )

  // Written for somebody who has seen the activity run, not as a standalone
  // explanation of it: what a facilitator cannot reconstruct from memory is
  // the mechanics of this deal --- one sheet each, what a pair is, how to
  // handle a room that isn't the size of the set --- so that is what is here.
  // Everything the room works out for itself on the day has been cut.
  //
  // Two hand-split columns rather than a `columns()` flow. The brief is now
  // short enough that flowed columns misbehave either way: in the page flow
  // `columns` gives the first column the whole remaining height and fills it,
  // leaving the second empty and pushing the worked example onto a second
  // page, and a fixed height tuned to balance them breaks a section --- a
  // numbered list, on the corpora with the longest brief --- across the
  // gutter. Splitting by hand costs a little balance (the columns end at
  // different heights, and by how much depends on the corpus) and buys a break
  // that always lands between sections.
  //
  // Left: what the set is and how to read a sheet. Right: how to run it.
  let brief-what = [
    The pages after this one are #sheets.len() *search sheets*, dealt from
    #corpus-phrase(doc_metadata) by #doc_metadata.author. Print them one-sided and
    hand out *one sheet per person*; every sheet is different, and nothing needs
    cutting out. Each holds #per_sheet #strong(pair-noun-plural): a *next token*
    with the *previous #prev-words-phrase* that came before it in the text.

    // The sheet count follows the corpus, not the room, so most rooms are the
    // wrong size for it. Both directions have a right answer and neither is
    // obvious, which is why they are here rather than left to the facilitator.
    *Match the room to the sheets*, not the other way round. More people than
    sheets: print the whole set again, once per extra roomful. Every count
    multiplies equally, so the proportions --- which is all the model is ---
    hold. Fewer: hand the spares out anyway, two or three to a person. A sheet
    nobody holds is a hole in the model.

    // An all-alphabetic pair reads best as the example; a corpus with no such
    // pair (e.g. Chinese) falls back to whatever is first.
    #let alphabetic = all_tokens.find(t => (
      t.text.find(regex("[A-Za-z]")) != none
        and t.previous_words.all(p => p.find(regex("[A-Za-z]")) != none)
    ))
    #let sample = if alphabetic != none { alphabetic } else {
      all_tokens.first()
    }

    // The colour named here is looked up rather than written in, so the
    // sentence stays true of whatever token the corpus supplied above.
    In #pair-chip(sample), the boxed #prev-words-phrase #if (
      previous-words-count > 1
    ) [are] else [is] the context and #emph(sample.text) is the next token. A
    token keeps its colour wherever it appears, so say the colour as you call
    one out --- "who has #emph(sample.text)? it's a #entry-for(sample.text).name
    one" --- and the room can scan by colour before reading. With
    #palette.colors.len() colours and far more tokens, a colour narrows the
    search rather than settling it.

    #colour-key()
  ]

  let brief-how = [
    == Running a round

    // Seeding sits above the list rather than in it: it happens once, and as a
    // numbered step it reads like something to redo every round.
    Seed the board: someone reads out any #pair-noun from their sheet, boxed
    #prev-words-phrase first, and both go up --- the room supplies the beginning
    too. Then, each round:

    + *Call out the last #prev-words-phrase* on the board.
    + *Hands up* from everyone holding a matching #pair-noun --- one hand each.
    + *Pick a raised hand at random* --- whoever shouts first is the fastest
      reader, not a sample of the text --- and ask for its next token.
    + The scribe writes that token up. It is part of the next context. Repeat.

    == What to watch for

    *The hands are the probability distribution.* Every #pair-noun sits with
    exactly one person, so a common continuation puts more hands in the air than
    a rare one. Nobody has to explain weighted sampling; the room performs it.

    *Nobody holds the model.* No single sheet can continue the text on its own.
    One hand is not a stall --- but no hands at all means an empty seat, so
    reseed from any #pair-noun and say why.

    // Only for a corpus built from several files. The boundary is real work the
    // CLI does --- each text is tokenised on its own, so no pair spans the join
    // --- and the crossing it makes possible is the whole reason to combine
    // texts, so a facilitator who doesn't know to watch for it misses the point.
    #if doc_metadata.at("documents", default: 1) > 1 [
      *The seam.* This corpus is #number-word(doc_metadata.documents) texts,
      tokenised apart so no #pair-noun straddles the join. Nothing says which
      text a pair came from, and the model cannot tell either --- so where two
      texts share a context, generation crosses between them unmarked.
    ]

    // Provenance, so it belongs at the foot of the brief rather than in the
    // middle of the instructions.
    #text(size: 9pt, fill: muted)[
      #doc_metadata.total_tokens tokens, #doc_metadata.unique_tokens unique
      #sym.dot.c #calc.round(doc_metadata.entropy, digits: 2) bits/token
      #sym.dot.c perplexity #calc.round(doc_metadata.perplexity, digits: 1)
      #sym.dot.c branching factor
      #calc.round(doc_metadata.branching_factor, digits: 2)
    ]
  ]

  // The grid trims the leading spacing of each cell, so the heading opening
  // the right-hand column starts level with the left one rather than 1.5em
  // down it.
  grid(
    columns: (1fr, 1fr),
    column-gutter: 1.6em,
    align: top,
    brief-what, brief-how,
  )

  // No pagebreak: the two columns take about half the page, so the worked
  // example follows them and the whole facilitator brief stays on one sheet of
  // paper.
  let chain = chain-example(sheets)
  if chain.len() >= 2 {
    // The running text the board accumulates: the seed pair's context,
    // followed by the next token each pair in the chain contributes.
    let written = (
      chain.first().token.previous_words + chain.map(e => e.token.text)
    )
    let written-so-far(count) = {
      let words = written.slice(0, count)
      align(center, block(
        fill: luma(245),
        inset: (x: 0.7em, y: 0.4em),
        radius: 3pt,
      )[#words.join(" ")])
    }

    let column-label = label => text(
      size: 9pt,
      fill: muted,
      style: "italic",
      label,
    )

    // Unbreakable: the example is only legible read as a whole, so it moves to
    // the next page intact rather than leaving an orphaned row or closing
    // sentence behind.
    block(breakable: false)[
      == Worked example

      #grid(
        columns: (1.1fr, auto, 1fr),
        column-gutter: 1.4em,
        row-gutter: 0.9em,
        align: (col, row) => (
          (if col == 0 { left } else { center })
            + (if row == 0 { bottom } else { horizon })
        ),

        [],
        column-label[the #pair-noun that answers],
        column-label[on the board],

        ..chain
          .enumerate()
          .map(((i, answer)) => {
            // Before round i the board holds `previous-words-count + i` words;
            // the context called out is the last `previous-words-count` of them,
            // rendered in the same colours the sheets use.
            let called = written
              .slice(i, previous-words-count + i)
              .map(w => coloured-word(w))
              .join(" ")
            let prose = if i == 0 [
              *Start anywhere.* Someone reads out a #pair-noun --- say this one
              --- and both its tokens go on the board.
            ] else [
              *Round #str(i).* Call out #emph(called) --- the last
              #prev-words-phrase on the board. A sheet across the room matches
              it, and that person reads out #emph(answer.token.text).
            ]
            (
              prose,
              pair-chip(answer.token),
              written-so-far(previous-words-count + 1 + i),
            )
          })
          .flatten(),
      )

      Keep going for as long as you like. What the room writes will sound like
      #emph(doc_metadata.title) without ever repeating it --- that is the model
      generating, not the corpus being read out.
    ]
  }

  pagebreak()
}

#instructions-page()

// ===== The participant sheets, one page each =====

// The sheets carry no title block of their own: the page is for searching, and
// every millimetre above the pairs is one the rows don't get. Provenance ---
// which sheet this is, which text it came from --- lives in the footer instead.
#set page(header: none)
#set text(size: font_size)

// Footer for one page of one sheet. The sheet number comes from the loop index
// rather than the page counter, so it stays right however many pages a sheet
// runs to.
//
// Which sheet, then where to find the project. No corpus title: on a set built
// to withhold its sources it is a placeholder anyway, and on any other set the
// facilitator has just said what the text is. What is left is the pair of
// things a page on the floor after the session cannot be reunited with the
// stack, or looked up, without.
//
// A sheet spanning two pages says so. Without it both pages read "1/24" and
// are indistinguishable: a participant can't tell which half they are holding,
// and nobody collating the stack can see that a sheet is incomplete. It stays
// spelled out where the sheet number is terse, because it appears on the rare
// page that needs explaining rather than on all of them.
#let sheet-footer(index, page-index, page-count) = align(
  center,
  text(font: brand-font, fill: luma(150), size: 8pt)[
    #str(index + 1)/#str(sheets.len())
    #if page-count > 1 [
      (page #str(page-index + 1) of #str(page-count))
    ]
    #sym.dash.em www.llmsunplugged.org
  ],
)

// A facilitator briefs the activity, so the participant sheets carry no
// instructions: the prose and the worked example live in the facilitator brief
// at the front of the PDF, and repeating them on every sheet costs search
// space, especially when printed A5.
//
// This used to print the colour key as well, so a participant could resolve
// "it's a green one" against a swatch. The eight-colour palette is named rather
// than merely distinct --- every swatch is pinned to what a room would call
// it --- so the key was explaining words nobody needed explained, in a strip
// of swatches that looks exactly like the pairs below it. What is left is the
// brand lockup, which is shorter than the key it replaces.
//
// The vector lockup, the same one the brief and the cutouts instructions
// place. This header used to take a rasterised copy instead, because Typst
// re-emits an SVG's paths into every page that places it rather than storing
// them once: about 2 KB a page here, so a 120-sheet set carries the outlined
// title 120 times over and the showcase participants PDF goes 911 KB -> 1.2 MB.
// The published sets move by 20--75 KB. That is the whole cost, and it buys
// back a lockup that resamples with the page --- one asset, no export step
// coupled to the printed width, and nothing to re-run when the mark changes.
//
// The rule sits in brand gold with equal air above and below it, so the header
// reads as one band --- lockup, gap, rule, gap --- rather than a mark with a
// hairline stuck under it.
//
// Absolute rather than em, because the gap is brand furniture and `--font-size`
// is a density knob for the pairs: at 19.2pt an em-based gap is half again the
// gap the same header takes at 13pt. Both come off `header_gap`, and both are
// `v()` inside the block --- the one below cannot be the block's own `below`,
// because the header is a grid cell and trailing block spacing there is
// trimmed away.
#let header_gap = 2.5mm

#let lockup_width = 40mm

// The five title tokens the mark can spell --- LL, Ms, Un, plug, ged --- one
// static file each, the same five frames the favicon animates through. A sheet
// takes the next one in turn, so a set reads the title out across every five
// sheets instead of stamping the same frame on all 120. Nothing depends on
// which frame a given sheet gets: the mark says who this is either way, and a
// participant only ever sees their own.
#let lockups = range(1, 6).map(i => "lockup-light-" + str(i) + ".svg")

// Set to the wordmark's own cap height rather than to the pairs: the two sit
// on one line and read as one piece of header furniture, where `--font-size`
// is a density knob that moves with the corpus. The lockup is 197.4 units wide
// by 28 tall with a 14-unit cap, so at 40mm that cap is 2.84mm, which Public
// Sans (cap height 0.7em) reaches at 11.5pt.
#let header_title_size = 11.5pt

// An SVG sits on the text baseline by its bottom edge, and the lockup's bottom
// edge is not its baseline: the wordmark rides 8 units up a 28-unit tile,
// which is the room its descenders need. Dropping the box by those 8 units
// puts the mark's baseline on the line's own, so the title beside it shares a
// baseline with the word "Unplugged" rather than sitting under it.
#let lockup_baseline_shift = lockup_width * 8 / 197.4

// `box` around the lockup, and `par.spacing` zeroed, because an image is
// inline content: it opens a paragraph, so the rule under it inherited 1.2em
// of paragraph spacing on top of the gap set here --- 8mm at 19.2pt, which is
// most of the gap and grows with `--font-size`. Zeroed, the header is exactly
// as tall as the mark, the rule and the two gaps, and the ~8mm it was spending
// on invisible paragraph spacing goes to the pairs instead.
//
// The corpus title goes at the far end of the same line, pushed rather than
// placed in its own grid cell, so the two really are one line of text and
// share its baseline. It is the same string the brief names the corpus by ---
// `--title` sets both --- so a sheet says what it is from without the
// facilitator having to repeat it, and a set built to withhold its sources
// carries whatever stands in for them there.
#let sheet-header(index) = block(width: 100%, below: 0pt, {
  set par(leading: 0pt, spacing: 0pt)
  set text(font: brand-font, size: header_title_size)
  box(
    image(lockups.at(calc.rem(index, lockups.len())), width: lockup_width),
    baseline: lockup_baseline_shift,
  )
  h(1fr)
  doc_metadata.title
  v(header_gap)
  line(length: 100%, stroke: 0.8pt + brand-gold)
  v(header_gap)
})

// ===== Laying the pairs out =====

#let column_gap = 1.2em

// How many column slots a pair needs. Nearly all take one, but every corpus
// has a few --- a long context token beside a long next token --- that are
// wider than a single column. A row of fixed height cannot absorb those: the
// pair wraps onto a second line and collides with the row beneath it, which is
// what the Australia sheets were doing. Measuring the rendered pair against
// the column width lets a wide one occupy two slots instead (or more, up to
// the full width), and every cell stays exactly one line tall.
#let span-for(body, col-width, gutter, columns) = {
  let w = measure(body).width
  let n = 1
  while n < columns and w > col-width * n + gutter * (n - 1) { n += 1 }
  n
}

// Pack items --- each a `(body, span)` --- into rows of `columns` slots.
//
// First fit rather than strict order: when the next item is too wide for the
// slots left in the row, the first later item that does fit is pulled forward
// rather than leaving the row short. The deal reaching this template is
// already shuffled, so the order within a sheet carries no meaning and
// reordering costs nothing, where a hole in the grid is visible.
#let pack-rows(items, columns) = {
  // `span-for` never returns more than `columns`, and the loop below relies on
  // it: an item too wide for an empty row would never be placed and the while
  // would spin forever. Fail loudly instead of hanging the build.
  assert(
    items.all(it => it.span <= columns),
    message: "a token pair was given a span wider than the sheet",
  )
  let rows = ()
  let row = ()
  let used = 0
  let pending = items
  while pending.len() > 0 {
    let idx = pending.position(it => it.span <= columns - used)
    if idx == none {
      // Nothing left fits the remaining slots; start a fresh row.
      rows.push(row)
      row = ()
      used = 0
    } else {
      row.push(pending.at(idx))
      used += pending.at(idx).span
      pending = pending.slice(0, idx) + pending.slice(idx + 1)
      if used == columns {
        rows.push(row)
        row = ()
        used = 0
      }
    }
  }
  if row.len() > 0 { rows.push(row) }
  rows
}

// Split rows into pages of at most `per-page`, balanced. A sheet needing 21
// rows at 18 to a page becomes two pages of 11 and 10, not one of 18 and one
// of 3. Rows stretch to fill whichever page they land on, so an unbalanced
// split prints one crowded page and one nearly empty one; worse, letting a
// fixed-pitch grid break where it runs out of room strands a single row on a
// third page whenever a sheet overruns by one.
#let paginate(rows, per-page) = {
  // An empty sheet still gets a page, so a participant dealt nothing is handed
  // a blank rather than silently skipped in the numbering.
  if rows.len() == 0 { return ((),) }
  // Uncapped: the whole sheet on one page, however many rows that takes.
  if per-page <= 0 { return (rows,) }
  let pages = calc.max(1, calc.ceil(rows.len() / per-page))
  let each = calc.ceil(rows.len() / pages)
  range(0, rows.len(), step: each).map(i => rows.slice(
    i,
    calc.min(i + each, rows.len()),
  ))
}

// One page of packed rows.
//
// Cells are placed at explicit coordinates rather than flowing, because a
// spanning cell would otherwise let the grid's own auto-placement pull the
// following pair up beside it and undo the packing.
//
// A regular grid rather than a ragged flow, because scanning aligned columns
// for a colour is much faster than scanning wrapped text, and it makes the
// sorted variant read as the lookup table it is. Pairs sit unboxed --- the
// colour already delineates them, and a border per pair would add 160-odd
// rectangles of visual noise to a page meant to be scanned.
#let rows-grid(rows, columns) = {
  let cells = ()
  for (y, row) in rows.enumerate() {
    let x = 0
    for it in row {
      cells.push(grid.cell(x: x, y: y, colspan: it.span, it.body))
      x += it.span
    }
  }
  grid(
    columns: (1fr,) * columns,
    rows: (1fr,) * rows.len(),
    column-gutter: column_gap,
    align: left + horizon,
    ..cells
  )
}

#for (i, sheet) in sheets.enumerate() {
  if i > 0 { pagebreak(weak: false) }

  // `context` for `measure`, for resolving the em-based gutter to a length,
  // and for the page width the column width is derived from.
  context {
    let gutter = column_gap.to-absolute()
    let usable = page.width - 2 * margin_x
    let col-width = (
      (usable - gutter * (columns_per_sheet - 1)) / columns_per_sheet
    )
    let items = sheet.map(t => {
      let body = render-cutout(t)
      (body: body, span: span-for(body, col-width, gutter, columns_per_sheet))
    })

    let pages = paginate(pack-rows(items, columns_per_sheet), rows_per_page)

    for (p, page-rows) in pages.enumerate() {
      if p > 0 { pagebreak(weak: false) }
      // Set per page rather than per sheet, so the footer can say which page
      // of the sheet this is. The pagebreaks mean it always lands on a fresh
      // page, which is what lets a page-level set rule take effect here.
      set page(footer: sheet-footer(i, p, pages.len()))

      // Each page is exactly one page tall. The first splits into an
      // auto-height header and a `1fr` body that absorbs whatever height the
      // header leaves; later pages give the whole height to the pairs. Either
      // way the body has a definite height, which is what lets the pair grid's
      // own `1fr` rows stretch to the bottom margin instead of trailing off
      // partway down the page.
      block(
        width: 100%,
        height: 100%,
        if p == 0 {
          grid(
            rows: (auto, 1fr),
            sheet-header(i),
            rows-grid(page-rows, columns_per_sheet),
          )
        } else {
          rows-grid(page-rows, columns_per_sheet)
        },
      )
    }
  }
}
