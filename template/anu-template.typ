#let anu-template(
  title: "",
  subtitle: none,
  author: none,
  body
) = {
  // ANU theme colors
  let anu-white = white
  let anu-gold = rgb("#be830e")
  let anu-unilink-gold = rgb("#945F00")
  let anu-unilink-blue = rgb("#00549E")
  let anu-black = black
  let anu-copper = rgb("#be4e0e")
  let anu-teal = rgb("#0085ad")

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
          fill: anu-gold
        )
      )

      // ANU logo only on first page
      if counter(page).get().first() == 1 {
        place(
          top + left,
          dx: 1.11cm,
          dy: 2cm,
          rect(
            fill: anu-white,
            width: 5cm,
            height: 2.5cm,
            place(
              center + horizon,
              image("./ANU_Secondary_Horizontal_GoldBlack.png", width: 4.7cm)
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
    set text(fill: anu-teal)
    it
  }

  // Citation styling
  show cite: it => {
    set text(fill: anu-copper)
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
      text(font: public-sans, weight: "regular", size: 16pt, style: "italic")[#subtitle]
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
