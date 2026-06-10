export interface DiceMapping {
  word: string;
  count: number;
  diceRange: [number, number];
}

export function partitionDice(diceSides: number, numGroups: number): number[] {
  if (numGroups <= 0) return [];
  if (numGroups > diceSides) {
    return Array(numGroups)
      .fill(0)
      .map((_, i) => (i < diceSides ? 1 : 0));
  }

  const baseSize = Math.floor(diceSides / numGroups);
  const remainder = diceSides % numGroups;
  const sizes: number[] = [];

  for (let i = 0; i < numGroups; i++) {
    sizes.push(i < remainder ? baseSize + 1 : baseSize);
  }

  return sizes;
}

export function createDiceMapping(
  options: { word: string; count: number }[],
  diceSides: number,
  startIndex = 1,
): DiceMapping[] {
  const totalCount = options.reduce((sum, opt) => sum + opt.count, 0);
  if (totalCount === 0) return [];

  const nonZeroOptions = options.filter((opt) => opt.count > 0);
  const mappings: DiceMapping[] = [];
  let currentDice = startIndex;

  for (const option of options) {
    if (option.count === 0) continue;

    const proportion = option.count / totalCount;
    const diceCount = Math.max(1, Math.round(proportion * diceSides));
    const endDice = Math.min(currentDice + diceCount - 1, diceSides);

    mappings.push({
      word: option.word,
      count: option.count,
      diceRange: [currentDice, endDice],
    });

    currentDice = endDice + 1;
    if (currentDice > diceSides) break;
  }

  if (mappings.length > 0 && currentDice <= diceSides) {
    mappings.at(-1)!.diceRange[1] = diceSides;
  }

  const coveredSides = mappings.reduce((sum, m) => sum + (m.diceRange[1] - m.diceRange[0] + 1), 0);

  if (coveredSides < diceSides) {
    console.warn(`Dice mapping only covers ${coveredSides}/${diceSides} sides`);
  }

  if (mappings.length < nonZeroOptions.length) {
    const truncated = nonZeroOptions.length - mappings.length;
    console.warn(
      `${truncated} option(s) were truncated from dice mapping due to insufficient dice sides`,
    );
  }

  return mappings;
}

export function rollDice(diceSides: number, startIndex = 1): number {
  return Math.floor(Math.random() * diceSides) + startIndex;
}

export function findWordForRoll(mappings: DiceMapping[], roll: number): string | null {
  for (const mapping of mappings) {
    if (roll >= mapping.diceRange[0] && roll <= mapping.diceRange[1]) {
      return mapping.word;
    }
  }
  return null;
}
