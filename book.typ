// Set the document properties and font
#set document(title: "N-Gram Language Model")
#set text(font: "Libertinus Serif", size: 8pt)

// Load the JSON data
#let data = json("out.json")

// Create a state variable to track the current prefix
#let current_prefix = state("current-prefix", "")

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

#for (i, item) in data.enumerate() {
  // The first element is the prefix
  let prefix = item.at(0)
  let total_count = item.at(1)
  let followers = item.slice(2)
  current_prefix.update(prefix)

  text(prefix, size: 1.2em, weight: "bold")
  if followers.len() > 1 {
    h(0.3em)
    box(outset: 0.12em, fill: luma(40%))[#text(weight: "bold", fill: white)[#total_count]]
  }

  h(0.6em)

  // Process follower entries
  for follower in followers {
    box([#text(weight: "semibold")[#follower.at(1)]#text(fill: luma(80%))[|]#text(fill: luma(20%))[#follower.at(0)]])
    h(0.5em)
  }

  v(0.1em)
}
