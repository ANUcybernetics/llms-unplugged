#let anu-colors = (
  white: white,
  gold: rgb("#be830e"),
  unilink-gold: rgb("#945F00"),
  unilink-blue: rgb("#00549E"),
  black: black,
  copper: rgb("#be4e0e"),
  teal: rgb("#0085ad")
)

#let anu-template(
  title: "",
  subtitle: none,
  author: none,
  body
) = {
  // Page setup
  set page(
    paper: "a4",
    margin: (
      left: 3.3cm,
      right: 2cm,
      top: 2.6cm,
      bottom: 2.6cm
    ),
    background: context {
      // Gold vertical rule
      place(
        left,
        dx: 1.9cm,
        rect(
         width: 0.75pt,
          height: 100%,
          fill: anu-colors.gold
        )
      )

      // logos only on first page
      if counter(page).get().first() == 1 {
        place(
          top + left,
          dx: 1.11cm,
          dy: 2cm,
          rect(
            fill: anu-colors.white,
            width: 5cm,
            height: 2.5cm,
            place(
              center + horizon,
              image("./ANU_Secondary_Horizontal_GoldBlack.svg", width: 4.7cm)
            )
          )
        )
        place(
          top + right,
          dx: -1.11cm,
          dy: 2cm,
          rect(
            fill: anu-colors.white,
            width: 5cm,
            height: 2.5cm,
            place(
              center + horizon,
              image("./ANU_SOCY_MARK_CMYK.svg", height: 2cm)
            )
          )
        )
      }
    }
  )

  // Font setup
  let public-sans = "Public Sans"

  // Basic text styling
  set text(
    font: public-sans,
    weight: "light",
    size: 11pt
  )

  // Link styling
  show link: it => {
    set text(fill: anu-colors.unilink-gold)
    it
  }

  // Citation styling
  show cite: it => {
    set text(fill: anu-colors.copper)
    it
  }

  // Heading styling
  show heading: it => {
    set text(font: public-sans, weight: "semibold")
    pad(top: 0.5em ,bottom: 0.5em, it)
  }

  // Title page content
  v(10em)
  align(left)[
    #text(font: public-sans, weight: "regular", size: 24pt)[#title]
    #if subtitle != none {
      v(0.1em)
      linebreak()
      text(font: public-sans, weight: "regular", size: 16pt, style: "italic", fill: anu-colors.gold)[#subtitle]
    }
    #if author != none {
      v(1em)
      text(size: 18pt)[#author]
    }
  ]
  v(3em)

  // Main content
  body
}

// Usage
#show: doc => anu-template(
  title: "Document Title",
  author: "Author Name",
  doc
)
