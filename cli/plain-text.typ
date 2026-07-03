// Plain text typesetting — reads a text file with YAML frontmatter and typesets it

#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let text_path = sys.inputs.at("text_path")

#set text(font: ("Libertinus Serif", "Noto Serif CJK SC"), size: 14pt)
#set page(paper: paper_size, margin: 2cm)
#set par(leading: 0.8em, spacing: 1.2em)

#let raw_content = read(text_path)

// Strip YAML frontmatter (everything between first and second ---)
#let parts = raw_content.split("---")
#let body = parts.slice(2).join("---").trim()

// Extract title and author from frontmatter
#let frontmatter = parts.at(1, default: "")
#let title = {
  let m = frontmatter.match(regex("title:\s*(.+)"))
  if m != none { m.captures.at(0).trim() }
}
#let author = {
  let m = frontmatter.match(regex("author:\s*(.+)"))
  if m != none { m.captures.at(0).trim() }
}

#align(center)[
  #text(size: 1.8em, weight: "bold")[#title]
  #v(0.3em)
  #text(size: 1.2em, style: "italic")[#author]
]

#v(1em)

#body
