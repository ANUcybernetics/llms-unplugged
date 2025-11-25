// Language model utility functions for generating tables and grids
// Mirrors functionality from handouts/utils.typ for web content

/**
 * Convert a number to tally marks
 * Uses 卌 for groups of 5, | for remainders
 * @param {number} n - The number to convert
 * @returns {string} Tally mark representation
 */
function tally(n) {
  if (n === 0 || n == null) return "";
  const groups = Math.floor(n / 5);
  const remainder = n % 5;
  let marks = "";
  for (let _i = 0; _i < groups; _i++) {
    marks += "卌 ";
  }
  if (remainder > 0) {
    marks += "|".repeat(remainder);
  }
  return marks.trim();
}

/**
 * Process a cell value - convert numbers to tally marks
 * @param {*} cell - Cell value (number, string, or other)
 * @returns {string} Processed cell content
 */
function processCell(cell) {
  if (typeof cell === "number") {
    return tally(cell);
  }
  return cell ?? "";
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const s = String(str);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generate an HTML table with consistent formatting
 * Automatically applies tally marks to numeric cells
 * @param {string[]} headers - Column headers
 * @param {Array<Array<*>>} data - 2D array of row data
 * @returns {string} HTML table markup
 */
function lmTable(headers, data) {
  const headerRow = headers
    .map(
      (h) =>
        `<th class="px-3 py-2 text-center font-semibold">${escapeHtml(h)}</th>`,
    )
    .join("");

  const bodyRows = data
    .map((row) => {
      const cells = row
        .map((cell, i) => {
          const content = processCell(cell);
          const align = i === 0 ? "text-left" : "text-center";
          return `<td class="px-3 py-2 ${align} font-mono">${escapeHtml(content)}</td>`;
        })
        .join("");
      return `<tr class="border-b border-anu-gold/30">${cells}</tr>`;
    })
    .join("");

  return `<div class="overflow-x-auto my-6">
<table class="w-full border-collapse border border-anu-gold/50 text-sm">
<thead class="bg-anu-gold/10">
<tr class="border-b border-anu-gold">${headerRow}</tr>
</thead>
<tbody>${bodyRows}</tbody>
</table>
</div>`;
}

/**
 * Generate a bigram grid table for word co-occurrence matrices
 * @param {string[]} headers - Column headers (first should be empty for row labels)
 * @param {Array<Array<*>>} rows - 2D array including row labels in first column
 * @returns {string} HTML table markup
 */
function lmGrid(headers, rows) {
  const headerRow = headers
    .map((h) => {
      const content = h ? `<code>${escapeHtml(h)}</code>` : "";
      return `<th class="px-2 py-2 text-center font-semibold min-w-[3rem]">${content}</th>`;
    })
    .join("");

  const bodyRows = rows
    .map((row) => {
      const cells = row
        .map((cell, i) => {
          const processed = processCell(cell);
          if (i === 0) {
            const content = processed
              ? `<code>${escapeHtml(processed)}</code>`
              : "";
            return `<td class="px-2 py-2 text-left font-semibold">${content}</td>`;
          }
          return `<td class="px-2 py-2 text-center font-mono">${escapeHtml(processed)}</td>`;
        })
        .join("");
      return `<tr class="border-b border-anu-gold/30">${cells}</tr>`;
    })
    .join("");

  return `<div class="overflow-x-auto my-6">
<table class="border-collapse border border-anu-gold/50 text-sm">
<thead class="bg-anu-gold/10">
<tr class="border-b border-anu-gold">${headerRow}</tr>
</thead>
<tbody>${bodyRows}</tbody>
</table>
</div>`;
}

/**
 * Automatically calculate and render a bigram grid from a token sequence
 * @param {string[]} tokens - Array of tokens (words/punctuation)
 * @param {Object} options - Optional settings
 * @param {number} [options.nrows] - Number of rows to display (default: all unique tokens)
 * @param {number} [options.ncols] - Number of columns to display (default: all unique tokens + 1)
 * @returns {string} HTML table markup
 */
function lmGridAuto(tokens, options = {}) {
  // Get unique tokens in order of first appearance
  const unique = [...new Set(tokens)];

  // Count bigram occurrences
  const counts = new Map();
  for (let i = 0; i < tokens.length - 1; i++) {
    const key = `${tokens[i]}->${tokens[i + 1]}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // Determine dimensions
  const nrows = options.nrows ?? unique.length;
  const ncols = options.ncols ?? unique.length + 1;

  // Build headers (first empty, then tokens up to ncols limit)
  const headers = [""];
  for (let i = 0; i < ncols - 1; i++) {
    headers.push(i < unique.length ? unique[i] : "");
  }

  // Build rows with counts
  const rows = [];
  for (let rowIdx = 0; rowIdx < nrows; rowIdx++) {
    const row = [];
    if (rowIdx < unique.length) {
      const from = unique[rowIdx];
      row.push(from);
      for (let colIdx = 0; colIdx < ncols - 1; colIdx++) {
        if (colIdx < unique.length) {
          const to = unique[colIdx];
          const key = `${from}->${to}`;
          const count = counts.get(key) || 0;
          row.push(count > 0 ? count : "");
        } else {
          row.push("");
        }
      }
    } else {
      for (let i = 0; i < ncols; i++) {
        row.push("");
      }
    }
    rows.push(row);
  }

  return lmGrid(headers, rows);
}

/**
 * Parse a space-separated token string into an array
 * @param {string} tokenString - Space-separated tokens
 * @returns {string[]} Array of tokens
 */
function parseTokens(tokenString) {
  return tokenString.trim().split(/\s+/).filter(Boolean);
}

// Export functions for use in Eleventy
export { tally, lmTable, lmGrid, lmGridAuto, parseTokens };
