// The training text as the tokeniser read it, for whoever reads it aloud in
// the ledger's training round: every token in its own box, lowercased, the
// punctuation split off into the symbol tile the sheets use, and a running
// number under each so a group that loses its place can say where it was.
// Dropped tokens print dimmed and unnumbered: the rows never counted them,
// so the reader skips them.
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
  footer: align(
    center,
    context text(fill: luma(150), size: 8pt)[
      #counter(page).display()
      #sym.dash.em www.llmsunplugged.org
    ],
  ),
)
#set text(font: brand-font, size: 10pt)
#set par(justify: false)

// ===== Header =====

#let lockup_width = 36mm
#let lockup_baseline_shift = lockup_width * 8 / 197.4

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
  next time.
]

#v(3mm)

// ===== The tokens =====

// One token in its box, with its number beneath. The box is what makes a
// full stop and a comma each their own token to the eye, and what keeps
// "sam-i-am" from reading as three; the number is for finding the place
// again. A dropped token gets a dash where its number would be.
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

#let token-box(t, index) = box(
  inset: (x: 1.4mm * k, y: 1.1mm * k),
  stroke: 0.4pt + if t.keep { luma(160) } else { luma(215) },
  radius: 1.2mm * k,
  stack(
    dir: ttb,
    spacing: 0.8mm * k,
    box(
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
    ),
    align(
      center,
      text(
        size: 6pt * k,
        fill: luma(150),
        if index == none { sym.dash.en } else { str(index) },
      ),
    ),
  ),
)

#let index = counter("token")
#for (d, document) in documents.enumerate() {
  if d > 0 {
    v(3mm)
    line(length: 100%, stroke: 0.4pt + luma(200))
    v(3mm)
  }
  par(leading: 2.4mm * k, {
    for t in document {
      if t.keep {
        index.step()
        context token-box(t, index.get().first())
      } else {
        token-box(t, none)
      }
      [ ]
    }
  })
}
