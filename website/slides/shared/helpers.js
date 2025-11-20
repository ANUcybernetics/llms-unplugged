export function formatProbability(value, decimals = 2) {
  return (value * 100).toFixed(decimals) + '%'
}

export function highlightToken(token) {
  return `<span class="text-anu-gold font-bold">${token}</span>`
}

export function createNgramTable(ngrams) {
  return ngrams.map(([context, next, prob]) => ({
    context,
    next,
    probability: formatProbability(prob)
  }))
}

export function diceRoll(sides = 6) {
  return Math.floor(Math.random() * sides) + 1
}
