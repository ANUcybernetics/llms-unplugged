// Set the document properties and font
#set document(title: "N-Gram Language Model")
#set text(font: "Libertinus Serif", size: 8pt)

// Load the JSON data
#let data = json("out.json")

// Create a state variable to track the current prefix
#let current_prefix = state("current-prefix", data.at(0).at(0))

#set page(
  margin: (x: 2cm, y: 2cm),
  columns: 3,
  header: {
    set align(left)
    text(weight: "bold")[#context current_prefix.get().join(" ")]
    line(length: 100%, stroke: 0.5pt)
  }
)

// Function to create a styled heading from a prefix
#let prefix-heading(prefix) = {
  // Update the current prefix state
  current_prefix.update(prefix)

  set align(left)
  text(weight: "bold")[#prefix.join(" ")]
  line(length: 100%, stroke: 0.5pt)
}

// Function to create a formatted follower entry
#let follower-entry(word, count) = {
    [#count #text[|] #word]
}

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

// Loop through each item in the JSON array to create sections
#for item in data {
  // The first element is the prefix array
  let prefix = item.at(0)
  current_prefix.update(prefix)

  // Create section heading with the prefix
  text(prefix.join(" "), weight: "bold")

  h(0.4em)

  // Process follower entries (all elements after the first one)
  let followers = item.slice(1)
  // Display followers in the normal flow of text without a container
  for (i, follower) in followers.enumerate() {
    box([#follower.at(1)#text[|]#follower.at(0)])
    h(0.5em)
  }

  v(0.1em)
}
