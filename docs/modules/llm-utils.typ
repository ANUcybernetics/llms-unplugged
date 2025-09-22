#let tally(n) = {
  if n == 0 { return [] }
  let groups = int(n / 5)
  let remainder = calc.rem(n, 5)
  let marks = ""
  for i in range(groups) {
    marks += "卌 "
  }
  if remainder > 0 {
    for i in range(remainder) {
      marks += "|"
    }
  }
  marks
}