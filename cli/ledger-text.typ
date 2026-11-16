// The training text as the tokeniser read it, for whoever reads it aloud in
// the ledger's training round: every token in its own box, lowercased, the
// punctuation split off into the symbol tile the sheets use. Read as the
// first of a pair, a token in a solid box starts a new row on the sheet and
// one in a dashed box means finding the row it already has. Dropped tokens
// print dimmed: the rows never counted them, so the reader skips them.
//
// Without this page the reader tokenises in their head from a plain printout
// --- lowercasing, peeling the full stop off the last word --- and the sheets
// and the reading drift apart. Written from the same run as the sheets, so
// they cannot.

#import "cutout-common.typ": brand-font, brand-gold, brand-lockup
#import "ledger-common.typ": token-text

#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let json_path = sys.inputs.at("json_path", default: "ledger.json")
// The marks the sheets set in a symbol tile; see ledger.typ.
#let punct-chars = sys.inputs.at("punctuation", default: ".,!?;:").clusters()

#let data = json(json_path)
#let documents = data.text
#let kept = documents.flatten().filter(t => t.keep).len()

#set page(
  paper: paper_size,
  margin: 12mm,
  // A one-page text carries the URL alone; a page number only helps a text
  // long enough to be read off several pages.
  footer: align(
    center,
    context text(fill: luma(150), size: 8pt)[
      #if counter(page).final().first() > 1 [
        #counter(page).display() #sym.dash.em
      ]
      www.llmsunplugged.org
    ],
  ),
)
#set text(font: brand-font, size: 10pt)
#set par(justify: false)

// ===== Header =====

#let lockup_width = 36mm
#let lockup_baseline_shift = lockup_width * 8 / 195.9

#block(width: 100%, below: 0pt, {
  set par(leading: 0pt, spacing: 0pt)
  set text(size: 11.5pt)
  grid(
    columns: (auto, 1fr, auto),
    align: (left + bottom, center + bottom, right + bottom),
    box(
      brand-lockup(width: lockup_width),
      baseline: lockup_baseline_shift,
    ),
    data.title,
    [training text],
  )
  v(2mm)
  line(length: 100%, stroke: 0.8pt + brand-gold)
  v(2mm)
})

#text(size: 9pt, fill: luma(90))[
  #kept tokens. Read it aloud a pair at a time --- a token, then the one after
  it --- and then move along by one, so the token just read second is read first
  next time. When a token in a solid box comes first in the pair, start a new
  row for it; a dashed box means its row is already on the sheet.
]

#v(3mm)

// ===== The tokens =====

// One token in its box. The box is what makes a full stop and a comma each
// their own token to the eye, and what keeps "sam-i-am" from reading as three.
// Its border says what the token does as the first of a pair: solid and darker
// where it starts a new row, dashed and lighter where its row is already on
// the sheet. Solid against dashed survives a greyscale printer, where a colour
// difference would not.
//
// The glyph sits in a fixed-height, vertically centred band rather than on
// its own line: a punctuation mark comes in its symbol tile, which is a box
// of its own and taller than a word's line, so without the band the marks
// print as taller boxes than the words beside them and the reader's eye
// snags on every full stop.
// Half again the size these numbers were drawn against: the reader holds
// this page and reads off it aloud, and at BASE-SIZE the text sat in the top
// quarter of it. Not larger --- the page does not have to be full, and every
// text this activity uses has to stay on one page, whatever its words happen
// to be. Everything below is in units of K, so TOKEN-SIZE is the only number
// to move.
#let base-size = 12pt
#let token-size = 1.5 * base-size
#let k = token-size / base-size
#let token-band = 5.2mm * k

// Per document, per token: does reading this token as the start of a pair
// open a new row on the sheet? A row is a prefix (the n-1 kept tokens ending
// here), and it is new the first time that prefix is followed by anything ---
// counted across every document, since the sheets pool them. Dropped tokens
// are skipped, as the counting skips them, and a document's last kept token
// starts no pair, so neither ever opens a row.
#let context-len = {
  let entries = data.sheets.map(sheet => sheet.pages.flatten()).flatten()
  if entries.len() > 0 { entries.first().prefix.len() } else { 1 }
}
#let opens-row = {
  let seen = (:)
  let flags = ()
  for document in documents {
    let doc-flags = document.map(t => false)
    let kept = range(document.len()).filter(i => document.at(i).keep)
    for (j, i) in kept.enumerate() {
      if j + 1 < kept.len() and j + 1 >= context-len {
        let key = kept
          .slice(j + 1 - context-len, j + 1)
          .map(k => document.at(k).text)
          .join("\u{1f}")
        if key not in seen {
          seen.insert(key, true)
          doc-flags.at(i) = true
        }
      }
    }
    flags.push(doc-flags)
  }
  flags
}

#let token-box(t, new-row) = box(
  inset: (x: 1.4mm * k, y: 1.1mm * k),
  stroke: if not t.keep {
    0.4pt + luma(215)
  } else if new-row {
    (paint: luma(90), thickness: 0.7pt)
  } else {
    (paint: luma(150), thickness: 0.5pt, dash: "dashed")
  },
  radius: 1.2mm * k,
  // In a stack, which has no text baseline, so every token box sits on its
  // bottom edge. Left bare, each box aligns to its content's baseline, and a
  // punctuation tile's is not a word's.
  stack(box(
    height: token-band,
    align(
      horizon,
      token-text(
        t.text,
        punct-chars,
        size: token-size,
        fill: if t.keep { black } else { luma(170) },
      ),
    ),
  )),
)

#for (d, document) in documents.enumerate() {
  if d > 0 {
    v(3mm)
    line(length: 100%, stroke: 0.4pt + luma(200))
    v(3mm)
  }
  par(leading: 2.4mm * k, {
    for (i, t) in document.enumerate() {
      token-box(t, opens-row.at(d).at(i))
      [ ]
    }
  })
}
