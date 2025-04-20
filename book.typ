// Set the document properties and font
#set document(title: "N-Gram Language Model")
#set text(font: "Libertinus Serif", size: 8pt)

// Load the JSON data
#let data = json("out.json")

// Create a state variable to track the current prefix
#let current_prefix = state("current-prefix", data.at(0).at(0))

#set page(
  "a5",
  // margin: (x: 2cm, y: 2cm),
  columns: 3,
  header: {
    set align(left)
    text(weight: "bold")[#context current_prefix.at(here())]
    line(length: 100%, stroke: 0.5pt + luma(50%))
  }
)

// Title page
// #align(center)[
//   #block(text(font: "Libertinus Serif", weight: "bold", size: 24pt)[
//     N-Gram Language Model
//   ])
//   #v(1cm)
//   #block(text(font: "Libertinus Serif", style: "italic", size: 14pt)[
//     Generated from corpus analysis
//   ])
//   #v(3cm)
//   #block[
//     #datetime.today().display("[day] [month repr:long] [year]")
//   ]
// ]
// #pagebreak()

#for (i, item) in data.enumerate() {
  // The first element is the prefix
  let prefix = item.at(0)
  current_prefix.update(prefix)

  text(prefix, size: 1.2em, weight: "bold")

  h(0.5em)

  // Process follower entries
  let followers = item.slice(1)
  for follower in followers {
    box([#text(weight: "semibold")[#follower.at(1)]#text(fill: luma(80%))[|]#text(fill: luma(20%))[#follower.at(0)]])
    h(0.5em)
  }

  v(0.1em)
}
