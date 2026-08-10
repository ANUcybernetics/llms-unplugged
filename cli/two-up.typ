// Impose consecutive portrait PDF pages side-by-side at A5 size on A4
// landscape. The source path and page count are supplied by the Makefile.
#let source = sys.inputs.source
#let pages = int(sys.inputs.pages)

#set page(paper: "a4", flipped: true, margin: 0pt)

#for first in range(1, pages + 1, step: 2) {
  if first > 1 { pagebreak() }
  block(width: 100%, height: 100%)[
    #grid(
      columns: (1fr, 1fr),
      rows: (1fr,),
      image(source, page: first, width: 100%, height: 100%, fit: "contain"),
      if first + 1 <= pages {
        image(
          source,
          page: first + 1,
          width: 100%,
          height: 100%,
          fit: "contain",
        )
      } else { [] },
    )
  ]
}
