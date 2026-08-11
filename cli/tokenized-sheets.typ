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

// Sheets take the compact 8-colour palette: the pairs are set around 16-19pt
// here, where the cutouts' 30 colours stop being tellable apart, and every
// swatch has to answer to a colour word called across a room. See
// cutout-common.typ for why each palette is the size it is.
#import "cutout-common.typ": (
  brand-font, brand-gold, brand-lockup, compact-palette, derive-n,
  inter_word_gap, renderers,
)
#let (coloured-word, render-cutout, word-box, entry-for, ..) = renderers(
  palette: compact-palette,
)

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

// The colour key: every palette colour boxed with its own name in it, so the
// person at the front can name the colour along with the token ("who has
// _cat_? it's a teal one") and the room can narrow the search by colour before
// reading a token. Only the compact palette names its colours --- eleven is
// few enough to name, thirty is not --- so this is a sheets-only figure.
//
// Chips flow as inline text rather than sitting in a grid: the key has to fit
// whatever slack the column or header has left, and a paragraph reflows into
// it where a fixed column count would either overflow or leave a ragged
// half-row. The extra leading keeps consecutive rows of boxes from touching.
//
// `lead-in` prefixes the chips inline rather than sitting on its own line, so
// on a participant's sheet the key costs one line rather than two. It is not
// optional there: a row of boxed words in the palette colours is exactly what
// the rest of the page is made of, and without a label naming it as the key,
// somebody scanning for a match will try to match against it.
#let colour-key(size: 10pt, gap: 0.45em, lead-in: none) = block(
  above: 0.8em,
  below: 0.8em,
  {
    set par(leading: 0.85em, justify: false)
    set text(size: size)
    let chips = compact-palette.colors.map(e => box(word-box(e, e.name)))
    if lead-in != none {
      chips.insert(0, text(fill: muted, style: "italic", lead-in))
    }
    chips.join(h(gap))
  },
)

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

  columns(2, gutter: 1.6em)[
    The pages after this one are #sheets.len() *search sheets*, built from
    #emph(doc_metadata.title) by #doc_metadata.author. Print them one-sided and
    hand out *one sheet per person* --- every sheet is different, and nothing
    needs cutting out.

    // The sheet count follows the corpus, not the room, so most rooms are the
    // wrong size for it. Both directions have a right answer and neither is
    // obvious, which is why they are here rather than left to the facilitator.
    *If the room is a different size*, match it to the sheets rather than the
    other way round. More people than sheets: print the set twice and hand out
    both copies. Every #pair-noun is then held by two people, so every count
    doubles and the proportions --- which is all the model is --- do not move.
    It buys some insurance too, because one person away no longer takes a
    #pair-noun out of the room with them. Fewer people than sheets: give the
    spares out rather than leaving them on the table, two or three to a person
    if it comes to that. A sheet nobody holds is a hole in the model.

    Each sheet holds #per_sheet #strong(pair-noun-plural). A *token* is one word
    or one punctuation mark; a #pair-noun is a *next token* paired with the
    *previous #prev-words-phrase* that came immediately before it somewhere in
    the original text.

    // An all-alphabetic pair reads best as the example; a corpus with no such
    // pair (e.g. Chinese) falls back to whatever is first. Set inline rather
    // than as a labelled diagram: every sheet now carries its own worked
    // example in its instruction line, so this only has to name the parts.
    #let alphabetic = all_tokens.find(t => (
      t.text.find(regex("[A-Za-z]")) != none
        and t.previous_words.all(p => p.find(regex("[A-Za-z]")) != none)
    ))
    #let sample = if alphabetic != none { alphabetic } else {
      all_tokens.first()
    }

    In #pair-chip(sample), the boxed #prev-words-phrase #if (
      previous-words-count > 1
    ) [are] else [is] the previous #prev-words-phrase and #emph(sample.text) is
    the next token. Each token keeps the same colour wherever it appears, so
    scan by colour first and read second. With only
    #compact-palette.colors.len() colours and far more tokens than that, a
    colour narrows the search rather than settling it --- always check the token
    itself.

    // The colour named here is looked up rather than written in, so the
    // sentence stays true of whatever token the corpus supplied above.
    Say the colour when you call a token out --- "who has #emph(sample.text)?
    it's a #entry-for(sample.text).name one" --- and most of the page stops
    being worth reading. The swatches are chosen to answer to these words, so
    the words are the ones to use; the sheets themselves print no key, because a
    strip of swatches at the top of a page of swatches is one more thing to scan
    past.

    #colour-key()

    == Running a round

    // Seeding sits above the list rather than in it: it happens once, and as a
    // numbered step it reads like something to redo every round.
    Seed the board first. Ask someone to read out any #pair-noun from their
    sheet --- both tokens, boxed one first --- and write it up. It matters that
    the opening comes off a sheet rather than out of your head: the room
    supplies the beginning as well as everything after it. Then, each round:

    + *Call out the last #prev-words-phrase* of the text so far.
    + Everyone scans their own sheet for #pair-noun-plural whose previous
      #prev-words-phrase #if previous-words-count > 1 [match] else [matches].
      *Hands up* --- one hand each, and anyone with more than one match just
      goes with the first they spot.
    + *Pick a raised hand at random* and ask for that #{ pair-noun }'s next
      token.
    + A scribe writes the token on the board. That token becomes part of the
      context for the next round. Repeat.

    // No hand-placed column break. One was tuned to balance the brief as it
    // stood, and then broke as soon as the brief grew: with the room-size and
    // seeding paragraphs added, a break at this point left the second column
    // holding a single list item and pushed the worked example onto a second
    // page. Letting the columns fill costs the semantic split it bought --- the
    // break no longer lands between "how to run it" and "what it demonstrates"
    // --- and buys a brief that stays laid out as the text changes.
    Picking at random matters. If you take whoever shouts first you are sampling
    the fastest reader, not the text --- and the whole point is that the room
    samples the way the model does.

    == What to watch for

    *The hands are the probability distribution.* Every #pair-noun was dealt to
    exactly one person, and the deal spreads each context across as many people
    as it will go, so a common continuation really does put more hands in the
    air than a rare one. Nobody has to explain weighted sampling; the room
    performs it. (Roughly: for a context more common than the class is big,
    somebody holds two matches but raises one hand, which flattens the busiest
    contexts.)

    *Nobody holds the model.* No single sheet can continue the text on its own.
    The model only exists across the whole room --- and if somebody is away,
    their share of it is missing, and some contexts will draw no hands at all.

    // Only for a corpus built from several files. The boundary is real work the
    // CLI does --- each text is tokenised on its own, so no pair spans the join
    // --- and the crossing it makes possible is the whole reason to combine
    // texts, so a facilitator who doesn't know to watch for it misses the point.
    #if doc_metadata.at("documents", default: 1) > 1 [
      *The seam between the texts.* This corpus is
      #number-word(doc_metadata.documents)
      separate texts, tokenised apart so that no #pair-noun straddles the join.
      Nothing on the sheets says which text a pair came from, and the model
      cannot tell either --- so wherever two of the texts share a context,
      generation crosses from one to the other with nothing marking the
      crossing.
    ]

    *Quiet rounds.* One hand is not a stall --- a word with a single
    continuation is the model working. Nor will you run dry: a word has nothing
    following it only if it appears nowhere but the very last position in the
    text, which is at most one word in the whole deal. So no hands at all almost
    always means an empty seat --- two of them, if you printed the set twice ---
    and that is worth saying out loud. Reseed from any #pair-noun and carry on.

    // Provenance, so it belongs at the foot of the brief rather than in the
    // middle of the instructions. Its two lines also come off the taller
    // column, which is what buys the worked example room on this page for a
    // corpus wordy enough to have pushed it onto a second.
    #text(size: 9pt, fill: muted)[
      #doc_metadata.total_tokens tokens, #doc_metadata.unique_tokens unique
      #sym.dot.c #calc.round(doc_metadata.entropy, digits: 2) bits/token
      #sym.dot.c perplexity #calc.round(doc_metadata.perplexity, digits: 1)
      #sym.dot.c branching factor
      #calc.round(doc_metadata.branching_factor, digits: 2)
    ]
  ]

  // No pagebreak: the two-column briefing rarely fills a page, so the worked
  // example follows it and the whole teacher-facing brief stays on one sheet
  // of paper. It spills to a second page only for a wordier corpus.
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
              *Start anywhere.* Pick any #pair-noun --- say this one --- and
              write its previous #prev-words-phrase #emph[and] its next token on
              the board.
            ] else [
              *Round #str(i).* Call out the last #prev-words-phrase on the board
              (#emph(called)). Another sheet has a match, so that person raises
              a hand and reads out #emph(answer.token.text).
            ]
            (
              prose,
              pair-chip(answer.token),
              written-so-far(previous-words-count + 1 + i),
            )
          })
          .flatten(),
      )

      Keep going for as long as you like. The text the room writes will sound
      like #emph(doc_metadata.title) without ever repeating it --- that is the
      model generating, not the corpus being read out.
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
// A sheet spanning two pages says so. Without it both pages read "Sheet 1 of
// 24" and are indistinguishable: a participant can't tell which half they are
// holding, and nobody collating the stack can see that a sheet is incomplete.
// A single-page sheet says nothing extra, since there is nothing to
// disambiguate.
#let sheet-footer(index, page-index, page-count) = align(
  center,
  text(font: brand-font, fill: luma(150), size: 8pt)[
    Sheet #str(index + 1) of #str(sheets.len())
    #if page-count > 1 [
      (page #str(page-index + 1) of #str(page-count))
    ]
    #sym.dash.em #doc_metadata.title #sym.dash.em www.llmsunplugged.org
  ],
)

// A facilitator briefs the activity, so the participant sheets carry no
// instructions: the prose and the worked example live in the facilitator brief
// at the front of the PDF, and repeating them on every sheet costs search
// space, especially when printed A5.
//
// This used to print the colour key as well, so a participant could resolve
// "it's a teal one" against a swatch. The eight-colour palette is named rather
// than merely distinct --- every swatch is pinned to what a room would call
// it --- so the key was explaining words nobody needed explained, in a strip
// of swatches that looks exactly like the pairs below it. What is left is the
// brand lockup, which is shorter than the key it replaces.
//
// Raster rather than the vector lockup, and only here. Typst re-emits an SVG's
// paths into every page that places it --- measured at 3.1 KB a page against
// 0.6 KB for a raster, which is stored once and referenced --- so a 120-sheet
// set would pay for the outlined title 120 times over. The brief and the
// cutouts instructions keep the vector: they place it once, where it is free.
// 756px is 600dpi at the 32mm this prints at, and ~850dpi once the sheets are
// imposed two-up onto A5, so nothing visible is given up for it.
// Regenerate after changing the lockup:
//   convert -background none -density 1200 lockup-light.svg -resize 756x lockup-light.png
//   convert lockup-light.png -depth 8 -strip PNG32:lockup-light.png
#let sheet-header() = block(width: 100%, below: 0.5em)[
  #image("lockup-light.png", width: 32mm)
  #v(0.2em)
  #line(length: 100%, stroke: 0.8pt + luma(120))
]

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
            sheet-header(),
            rows-grid(page-rows, columns_per_sheet),
          )
        } else {
          rows-grid(page-rows, columns_per_sheet)
        },
      )
    }
  }
}
