export function tally(n: number): string {
  if (n === 0 || n === null || n === undefined) return "";
  const groups = Math.floor(n / 5);
  const remainder = n % 5;
  let marks = "";
  for (let i = 0; i < groups; i++) {
    marks += "卌 ";
  }
  if (remainder > 0) {
    marks += "|".repeat(remainder);
  }
  return marks.trim();
}
