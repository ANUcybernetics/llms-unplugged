// Set the document prophaydoserties and font
#set document(title: "N-Gram Language Model")
#set text(font: "Libertinus Serif", size: 8pt)

// Load the JSON data
#let data = json("model.json")

// Create a state variable to track the current prefix
#let current_prefix = state("current-prefix", "")

#set page(
  "a5",
  margin: (x: 1cm, y: 1cm),
  columns: 3,
  // header: {
  //   set align(left)
  //   text(weight: "bold")[#context current_prefix.at(here())]
  //   line(length: 100%, stroke: 0.5pt + luma(50%))
  // }
)
#for (i, item) in data.enumerate() {
  // The first element is the prefix
  let prefix = item.at(0)
  let total_count = item.at(1)
  let followers = item.slice(2)
  current_prefix.update(prefix)

  // this is the prefix text with a label
  [#text(prefix, size: 1.3em, weight: "bold")#label("prefix-" + prefix)]

  // the dice roll number
  if total_count != 120 {
    h(0.5em)
    box[♢ #text(weight: "bold")[#total_count]]
  }

  h(0.6em)

  // the followers for this prefix (with weights)
  for follower in followers {
    if followers.len() > 1 {
      box([#text[#follower.at(1)]#text(fill: luma(80%))[|]#text[#follower.at(0)]])
    } else {
      box([#follower.at(0)])
    }
    h(0.5em)
  }

  v(0.1em)
}
