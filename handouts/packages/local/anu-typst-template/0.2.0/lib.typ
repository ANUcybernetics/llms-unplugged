// Base colors
#let base-gold = rgb("#be830e")
#let base-copper = rgb("#be4e0e")
#let base-teal = rgb("#0085ad")

#let anu-colors = (
  white: white,
  light-grey: rgb("#e6e6e6"),
  dark-grey: rgb("#0d0d0d"),
  black: black,
  // Grey tints using HSL
  grey-1: color.hsl(0deg, 0%, 90%),
  grey-2: color.hsl(0deg, 0%, 72%),
  grey-3: color.hsl(0deg, 0%, 55%),
  grey-4: color.hsl(0deg, 0%, 38%),
  // Gold and tints
  gold: base-gold,
  gold-tint: rgb("#f5edde"), // Keeping original for compatibility
  gold-1: color.hsl(40deg, 36%, 94%),
  gold-2: color.hsl(40deg, 56%, 77%),
  gold-3: color.hsl(40deg, 71%, 66%),
  gold-4: color.hsl(40deg, 86%, 48%),
  // Copper and tints
  copper: base-copper,
  copper-tint: rgb("#f7eae2"), // Keeping original for compatibility
  copper-1: color.hsl(22deg, 36%, 93%),
  copper-2: color.hsl(22deg, 56%, 77%),
  copper-3: color.hsl(22deg, 71%, 66%),
  copper-4: color.hsl(22deg, 86%, 48%),
  // Teal and tints
  teal: base-teal,
  teal-tint: rgb("#d7e8f0"), // Keeping original for compatibility
  teal-1: color.hsl(194deg, 50%, 88%),
  teal-2: color.hsl(194deg, 70%, 74%),
  teal-3: color.hsl(194deg, 85%, 60%),
  teal-4: color.hsl(194deg, 100%, 39%),
  // Link colors
  unilink-gold: rgb("#945f00"),
  unilink-blue: rgb("#00549e"),
  // SOCY-specific colours
  socy-yellow: rgb("#e6ff44"),
  socy-yellow-print: rgb("#d8f147"),
)

#let anu(
  title: "",
  subtitle: none,
  author: none,
  footer_text: none,
  paper: "a4",
  margin: auto,
  page-settings: (:),
  config: (:),
  body,
) = {
  // Extract configuration with defaults
  let theme = config.at("theme", default: "light")
  let logos = config.at("logos", default: ())
  let hide = config.at("hide", default: ())

  // Derived settings
  let dark = theme == "dark"
  let show-title-block = "title-block" not in hide
  let show-page-numbers = "page-numbers" not in hide
  let show-anu-logo = "anu-logo" not in hide
  let show-socy-logo = "socy" in logos
  let show-studio-logo = "studio" in logos

  // Theme-dependent colours
  let (bg-color, text-color) = if dark {
    (anu-colors.black, anu-colors.white)
  } else {
    (anu-colors.white, anu-colors.black)
  }
  let table-border-color = text-color
  let page-num-color = if dark { rgb("#b0b0b0") } else { rgb("#808080") }
  let table-line-color = page-num-color
  let table-alt-bg = if dark { rgb("#1a1a1a") } else { anu-colors.light-grey }

  // Calculate margins based on paper size if auto
  let page-margin = if margin == auto {
    // Calculate auto margin value based on page dimensions
    // Typst uses 2.5/21 of the smaller dimension
    let paper-size = if paper == "a4" {
      (width: 210mm, height: 297mm)
    } else if paper == "us-letter" {
      (width: 8.5in, height: 11in)
    } else {
      // For other sizes, we'll just use fixed margins
      (width: 210mm, height: 297mm) // Default to A4
    }

    let auto-margin = calc.min(paper-size.width, paper-size.height) * 2.5 / 21

    // Add extra 0.8cm to left margin for the gold rule and branding
    (
      left: auto-margin + 0.8cm,
      right: auto-margin,
      top: auto-margin,
      bottom: auto-margin,
    )
  } else {
    margin
  }

  // Prepare base page settings
  let base-page-settings = (
    paper: paper,
    fill: bg-color,
    margin: page-margin,
    header: context {
      // Add extra space on first page when secondary logos are present
      if counter(page).get().first() == 1 {
        v(2.5cm) // Extra space to clear the logos
      }
    },
    footer: context {
      let page-num = counter(page).display()
      let total-pages = counter(page).final().first()
      if show-page-numbers {
        if footer_text != none {
          grid(
            columns: (1fr, 1fr),
            align(left)[
              #text(fill: page-num-color, size: 0.8em)[#footer_text]
            ],
            align(right)[
              #text(fill: page-num-color, size: 0.8em)[#page-num / #total-pages]
            ],
          )
        } else {
          align(right)[
            #text(fill: page-num-color, size: 0.8em)[#page-num / #total-pages]
          ]
        }
      } else {
        if footer_text != none {
          align(left)[
            #text(fill: page-num-color, size: 0.8em)[#footer_text]
          ]
        }
      }
    },
  )

  // Merge user-provided page settings with base settings
  let merged-page-settings = base-page-settings + page-settings

  // Page setup with merged settings
  set page(
    ..merged-page-settings,
    background: context {
      // Gold vertical rule
      place(
        left,
        dx: 1.9cm,
        rect(
          width: 0.75pt,
          height: 100%,
          fill: anu-colors.gold,
        ),
      )

      // logos only on first page
      if counter(page).get().first() == 1 {
        // ANU logo (shown by default)
        if show-anu-logo {
          place(
            top + left,
            dx: 1.11cm,
            dy: 2cm,
            rect(
              fill: bg-color,
              width: 5cm,
              height: 2.5cm,
              place(
                center + horizon,
                image(
                  "template/ANU_Secondary_Horizontal_Gold"
                    + if dark { "White" } else { "Black" }
                    + ".svg",
                  width: 4.7cm,
                ),
              ),
            ),
          )
        }

        // SOCY logo (top-right if specified)
        if show-socy-logo {
          place(
            top + right,
            dx: -1.11cm,
            dy: 2cm,
            rect(
              fill: bg-color,
              width: 5cm,
              height: 2.5cm,
              place(center + horizon, image(
                "template/ANU_SOCY_MARK_CMYK.svg",
                height: 2cm,
              )),
            ),
          )
        }
      }

      // Cybernetic Studio logo (on all pages in left margin, rotated)
      if show-studio-logo {
        place(
          left + bottom,
          dx: 1.6cm,
          dy: -2cm,
          rotate(
            -90deg,
            origin: bottom + left,
            text(
              font: "IBM Plex Mono",
              size: 12pt,
              fill: if dark { anu-colors.socy-yellow } else {
                anu-colors.grey-3
              },
            )[Cybernetic Studio],
          ),
        )
      }
    },
  )

  // Font setup
  let public-sans = "Public Sans"

  // Basic text styling
  set text(
    font: public-sans,
    weight: "light",
    size: 11pt,
    fill: text-color,
  )

  // Monospace font for code
  show raw: set text(font: "IBM Plex Mono")

  // Link styling
  show link: set text(fill: if dark { anu-colors.gold-2 } else {
    anu-colors.unilink-gold
  })

  // Citation styling
  show cite: set text(fill: if dark { anu-colors.copper-2 } else {
    anu-colors.copper
  })

  // Heading styling
  show heading: it => {
    let weight = if it.level >= 2 { "bold" } else { "semibold" }
    set text(font: public-sans, weight: weight)
    let spacing = if it.level == 1 {
      (top: 1.2em, bottom: 0.6em)
    } else if it.level == 2 {
      (top: 1em, bottom: 0.4em)
    } else {
      (top: 0.8em, bottom: 0.3em)
    }
    pad(..spacing, it)
  }

  // Inline code styling
  show raw.where(block: false): it => {
    h(0.15em)
    box(
      fill: if dark { anu-colors.unilink-gold } else { anu-colors.gold-tint },
      outset: (x: 0.1em, y: 0.25em),
      radius: 2pt,
      stroke: 0.5pt + if dark { anu-colors.gold-4 } else { anu-colors.gold },
      text(it, size: 1.1em),
    )
    h(0.15em)
  }

  // Table styling
  set table(
    inset: 0.75em,
    stroke: (x, y) => (
      bottom: if y == 0 { 2pt } else { 0.5pt }
        + if y == 0 { table-border-color } else { table-line-color },
    ),
    fill: (x, y) => if y > 0 and calc.odd(x) { table-alt-bg },
  )


  // Title page content
  if show-title-block {
    v(8em)
    align(left)[
      #text(font: public-sans, weight: "regular", size: 24pt)[#title]
      #if subtitle != none [
        #v(0.5em)
        #text(
          font: public-sans,
          weight: "regular",
          size: 16pt,
          style: "italic",
          fill: anu-colors.gold,
        )[#subtitle]
      ]
      #if author != none [
        #v(0.5em)
        #text(size: 18pt)[#author]
      ]
    ]
    v(2em)
  }

  // Main content
  body
}
