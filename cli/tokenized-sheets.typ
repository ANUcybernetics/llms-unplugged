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

// Sheets take the compact 11-colour palette: the pairs are set around 16pt
// here, where the cutouts' 30 colours stop being tellable apart. See
// cutout-common.typ for why each palette is the size it is.
#import "cutout-common.typ": (
  brand-gold, compact-palette, derive-n, inter_word_gap, renderers,
)
#let (coloured-word, render-cutout, ..) = renderers(palette: compact-palette)

// Get configuration from sys.inputs
#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let json_path = sys.inputs.at("json_path", default: "sheets.json")
#let font_size = eval(sys.inputs.at("font_size", default: "16pt"))
#let columns_per_sheet = int(sys.inputs.at("columns", default: "4"))

#set text(font: ("Libertinus Serif", "Noto Serif CJK SC"), size: 11pt)
#set page(paper: paper_size, margin: (x: 12mm, y: 14mm))

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
  let pick = (candidates, avoid: none) => {
    let preferred = candidates.filter(clean)
    let pool = if preferred.len() > 0 { preferred } else { candidates }
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
    let answer = pick(candidates, avoid: result.last().sheet)
    result.push(answer)
    written.push(answer.token.text)
  }
  result
}

// A pair as it appears in the instructions: unboxed, exactly as it appears on
// the sheets. `box` only to keep it from breaking across lines.
#let pair-chip(token) = box(render-cutout(token))

#let instructions-page() = {
  set page(footer: align(
    center,
    text(fill: brand-gold, size: 9pt, "www.llmsunplugged.org"),
  ))
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
    [= Search sheets: how to run the activity],
    image("favicon.svg", width: 1.6cm),
  )

  columns(2, gutter: 1.6em)[
    The pages after this one are #sheets.len() *search sheets*, built from
    #emph(doc_metadata.title) by #doc_metadata.author. Print them one-sided and
    hand out *one sheet per person* --- every sheet is different, and nothing
    needs cutting out.

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

    #text(size: 9pt, fill: muted)[
      #doc_metadata.total_tokens tokens, #doc_metadata.unique_tokens unique
      #sym.dot.c #calc.round(doc_metadata.entropy, digits: 2) bits/token
      #sym.dot.c perplexity #calc.round(doc_metadata.perplexity, digits: 1)
      #sym.dot.c branching factor
      #calc.round(doc_metadata.branching_factor, digits: 2)
    ]

    == Running a round

    + *Call out the last #prev-words-phrase* of the text so far.
    + Everyone scans their own sheet for #pair-noun-plural whose previous
      #prev-words-phrase #if previous-words-count > 1 [match] else [matches].
      *Hands up* --- one hand each, and anyone with more than one match just
      goes with the first they spot.
    + *Pick a raised hand at random* and ask for that #{ pair-noun }'s next
      token.
    + A scribe writes the token on the board. That token becomes part of the
      context for the next round. Repeat.

    Picking at random matters. If you take whoever shouts first you are sampling
    the fastest reader, not the text --- and the whole point is that the room
    samples the way the model does.

    // Break here rather than after the anatomy section: it splits the brief
    // into "what this is / how to run it" and "what it demonstrates", and it
    // balances the two columns, which keeps the worked example on this page.
    #colbreak()

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

    *Running dry.* If no hands go up, you have reached a context that only ever
    occurred at the very end of the text. Start again from any #pair-noun.
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

// Footer for one sheet. The number comes from the loop index rather than the
// page counter, so it stays right even if a sheet overflows onto a second page.
#let sheet-footer(index) = align(
  center,
  text(fill: luma(150), size: 8pt)[
    Sheet #str(index + 1) of #str(sheets.len()) #sym.dash.em #doc_metadata.title
    #sym.dash.em www.llmsunplugged.org
  ],
)

// Monochrome renderers for the worked example in the instruction line. The
// example is a reading aid, not one of the pairs to be searched, so it stays
// black and white --- in the palette colours it would read as just another
// token on the page and pull the eye away from the real ones.
#let mono-word-box(t) = highlight(
  fill: luma(60),
  extent: 0.1em,
  radius: 2pt,
  text(fill: white, weight: "bold", t),
)
#let mono-cutout(token) = {
  let parts = token.previous_words.map(mono-word-box)
  parts.push(text(fill: black, weight: "bold", token.text))
  parts.join(h(inter_word_gap))
}

// An all-alphabetic pair off this participant's own sheet, so the example in
// the instruction line is one they can actually go and find. Punctuation-only
// contexts make a confusing example, hence the preference.
#let sheet-example(sheet) = {
  let clean = t => (
    t.text.find(regex("[A-Za-z]")) != none
      and t.previous_words.all(p => p.find(regex("[A-Za-z]")) != none)
  )
  let found = sheet.find(clean)
  if found != none { found } else { sheet.at(0, default: none) }
}

// The rule of the game, so a participant who missed the briefing can still play
// from the sheet alone.
#let sheet-header(sheet) = {
  let example = sheet-example(sheet)
  block(width: 100%, below: 0.9em)[
    #text(size: 10pt, fill: muted)[
      When the #prev-words-phrase called out #if (
        previous-words-count > 1
      ) [match] else [matches] the boxed #prev-words-phrase of a #pair-noun
      below, raise your hand, and read out that #{ pair-noun }'s *next token* if
      you're picked. If more than one #pair-noun matches, just go with the first
      one you spot. (A token is one word or one punctuation mark.)
      #if example != none [
        For example, if the #prev-words-phrase called out
        #if previous-words-count > 1 [are] else [is]
        "#example.previous_words.join(" ")", then the #pair-noun #mono-cutout(
          example,
        ) is a match and you answer #strong(text(fill: black, example.text)).
      ]
    ]
    #v(0.5em)
    #line(length: 100%, stroke: 0.8pt + luma(120))
  ]
}

#for (i, sheet) in sheets.enumerate() {
  if i > 0 { pagebreak(weak: false) }
  // Scoped to this iteration, so each sheet gets its own numbered footer. The
  // pagebreak above means the rule always lands on a fresh page.
  set page(footer: sheet-footer(i))

  // Each sheet is exactly one page tall, split into an auto-height header and
  // a `1fr` body that absorbs whatever height the header leaves. That definite
  // body height is what lets the pair grid's own `1fr` rows stretch, so the
  // rows always reach the bottom margin instead of trailing off partway down a
  // short sheet.
  block(
    width: 100%,
    height: 100%,
    grid(
      rows: (auto, 1fr),
      sheet-header(sheet),

      // A regular grid rather than a ragged flow: scanning aligned columns for
      // a colour is much faster than scanning wrapped text, and it makes the
      // sorted variant read as the lookup table it is. Pairs sit on the page
      // unboxed --- the colour already delineates them, and a border per pair
      // adds 160-odd rectangles of visual noise to a page meant to be scanned.
      grid(
        columns: (1fr,) * columns_per_sheet,
        rows: (1fr,) * calc.ceil(sheet.len() / columns_per_sheet),
        column-gutter: 1.2em,
        align: left + horizon,
        ..sheet.map(t => render-cutout(t))
      ),
    ),
  )
}
