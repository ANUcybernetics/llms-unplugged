// Set the document properties and font
#set document(title: "N-Gram Language Model")
#set text(font: "Libertinus Serif", size: 11pt)
#set page(margin: (x: 2cm, y: 2cm))

// Load the JSON data
#let data = json("out.json")

// Function to create a styled heading from a prefix
#let prefix-heading(prefix) = {
  set text(fill: white, weight: "bold")
  set align(left)

  box(
    fill: black,
    inset: 8pt,
    radius: 2pt,
    width: auto,
    [#prefix.join(" ")]
  )
}

// Function to create a formatted follower entry
#let follower-entry(word, count) = {
  box(
    width: auto,
    inset: (x: 3pt, y: 2pt),
    [#text(weight: "bold")[#count] #text[|] #word]
  )
}

// Title page
#align(center)[
  #block(text(font: "Libertinus Serif", weight: "bold", size: 24pt)[
    N-Gram Language Model
  ])
  #v(1cm)
  #block(text(font: "Libertinus Serif", style: "italic", size: 14pt)[
    Generated from corpus analysis
  ])
  #v(3cm)
  #block[
    #datetime.today().display("[day] [month repr:long] [year]")
  ]
]

#pagebreak()
// Loop through each item in the JSON array to create sections
#for item in data {
  // The first element is the prefix array
  let prefix = item.at(0)

  // Create section heading with the prefix
  heading(level: 2, prefix-heading(prefix))

  // Process follower entries (all elements after the first one)
  let followers = item.slice(1)
  // Display followers in the normal flow of text without a container
  for (i, follower) in followers.enumerate() {
    follower-entry(follower.at(0), follower.at(1))
    if i < followers.len() - 1 {
      h(0.5cm) // Add horizontal spacing between entries
    }
  }

  // Add space after each section
  v(1cm)
}
