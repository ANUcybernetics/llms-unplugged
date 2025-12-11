<script setup lang="ts">
/* eslint-disable no-undef -- browser globals used in client-side component */
import { ref, onMounted, computed } from "vue";

type Status = "idle" | "loading" | "ready" | "compiling" | "success" | "error";
type Workflow = "booklet" | "cutouts";

const status = ref<Status>("idle");
const statusMessage = ref("Initialising compiler...");
const previewHtml = ref<string>("");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typst = ref<any>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wasmModule = ref<any>(null);

const inputText = ref("");
const inputTitle = ref("");
const inputAuthor = ref("");
const ngramSize = ref(2);
const workflow = ref<Workflow>("booklet");
const fileName = ref("");

const hasInput = computed(
  () => inputText.value.trim().length > 0 && inputTitle.value.trim().length > 0,
);

const FONT_URLS = {
  "Libertinus Serif": [
    "https://cdn.jsdelivr.net/fontsource/fonts/libertinus-serif@latest/latin-400-normal.woff2",
    "https://cdn.jsdelivr.net/fontsource/fonts/libertinus-serif@latest/latin-700-normal.woff2",
    "https://cdn.jsdelivr.net/fontsource/fonts/libertinus-serif@latest/latin-400-italic.woff2",
  ],
  "Libertinus Sans": [
    "https://cdn.jsdelivr.net/fontsource/fonts/libertinus-sans@latest/latin-400-normal.woff2",
    "https://cdn.jsdelivr.net/fontsource/fonts/libertinus-sans@latest/latin-700-normal.woff2",
  ],
  "IBM Plex Mono": [
    "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-400-normal.woff2",
    "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@latest/latin-700-normal.woff2",
  ],
};

const SOCY_LOGO_SVG = `<?xml version="1.0" encoding="iso-8859-1"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
<polygon style="fill:#000000;" points="600.362,274.305 362.804,274.305 530.783,106.326 494.205,69.749 326.227,237.728
  326.227,0.169 274.498,0.169 274.498,274.305 0.362,274.305 0.362,326.033 237.921,326.033 69.942,494.013 106.519,530.591
  274.498,362.612 274.498,600.17 326.227,600.17 326.227,326.033 600.362,326.033 "/>
</svg>`;

const BOOK_TEMPLATE = `
// Simplified book template for browser PoC
#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let font_size = sys.inputs.at("font_size", default: "10pt")
#let num_columns = sys.inputs.at("columns", default: "2")
#let json_path = sys.inputs.at("json_path", default: "model.json")

#set text(font: "Libertinus Serif", size: eval(font_size))
#set page(
  paper: paper_size,
  margin: (inside: 2.4cm, outside: 1.5cm, top: 3cm, bottom: 2cm),
)

#let json_data = json(json_path)
#let data = json_data.data
#let doc_metadata = json_data.metadata

#let model-type(n) = {
  if n == 1 { "unigram" }
  else if n == 2 { "bigram" }
  else if n == 3 { "trigram" }
  else { str(n) + "-gram" }
}

#set document(
  title: doc_metadata.title,
  author: (doc_metadata.author, "Ben Swift"),
)

#let punct-box(content, baseline: -0.2em) = box(
  rect(
    fill: none,
    stroke: 0.25pt + black,
    radius: 1pt,
    inset: (x: 0.1em, y: 0pt),
    outset: (y: 0pt),
    text(content, weight: "bold", baseline: baseline),
  ),
)

#let display-with-punctuation(text-content, size: 1.5em, weight: "bold") = {
  let parts = text-content.split(" ")
  for (i, part) in parts.enumerate() {
    if part == "." or part == "," {
      let styled-punct = text(part, size: size, weight: weight, baseline: -0.2em)
      box(rect(fill: none, stroke: 0.25pt + black, radius: 1pt, inset: (x: 0.1em, y: 0pt), outset: (y: 0pt), styled-punct))
    } else if part == "—" {
      text(" — ", size: size, weight: weight)
    } else {
      text(part, size: size, weight: weight)
    }
    if i < parts.len() - 1 and parts.at(i + 1) != "—" and part != "—" { h(0.3em) }
  }
}

#let format-dice-indicator(total_count, num_followers) = {
  if num_followers > 1 and total_count != 10 {
    let num-dice = str(total_count).len()
    text(baseline: -0.1em, size: 0.9em, fill: black, "♦" * num-dice)
  }
}

#let format-follower(word, count, show-count: true) = {
  if word == "." or word == "," {
    if show-count { box([#text(weight: "semibold")[#count]|#punct-box(word)]) }
    else { punct-box(word) }
  } else {
    if show-count { box([#text(weight: "semibold")[#count]|#text[#word]]) }
    else { box([#word]) }
  }
}

#let format-followers(followers) = {
  for follower in followers {
    let word = follower.at(0)
    let count = follower.at(1)
    let show-count = followers.len() > 1
    format-follower(word, count, show-count: show-count)
    h(0.5em)
  }
}

#let format-entry(prefix, total_count, followers) = {
  display-with-punctuation(prefix, size: 1.5em, weight: "bold")
  h(0.2em)
  format-dice-indicator(total_count, followers.len())
  h(0.6em)
  format-followers(followers)
}

// Title page
#place(top + left)[#image("socy-logo-bw.svg", width: 1.8cm)]
#align(center + horizon)[
  #v(2cm)
  #text(font: "Libertinus Sans", weight: "bold", size: 3em)[#doc_metadata.title]
  #v(1cm)
  #text(font: "Libertinus Sans", size: 1.5em)[A #model-type(doc_metadata.n) language model]
]
#place(bottom + right)[
  #text(font: "IBM Plex Mono", size: 14pt)[Cybernetic\\\\ Studio]
]
#pagebreak()

// Copyright page
#set text(size: 11pt)
#align(horizon)[
  #text(size: 1.2em, style: "italic")[#doc_metadata.title] by #doc_metadata.author
  #v(0.5cm)
  © 2025 Ben Swift
  #v(0.5cm)
  This work is licensed under CC BY-NC-SA 4.0.
  #v(0.5cm)
  Published by Cybernetic Studio Press
]
#pagebreak()

// Main content
#set page(columns: int(num_columns), numbering: "1")

#for (i, item) in data.enumerate() {
  let prefix = item.at(0)
  let total_count = item.at(1)
  let followers = item.slice(2)
  format-entry(prefix, total_count, followers)
  v(0.1em)
}
`;

const CUTOUTS_TEMPLATE = `
// Tokenized cutouts for bucket training
// Generates rows of tokens with continuous horizontal lines for easy cutting

// Configuration
#let font_size = 36pt // Master size - change this to scale everything
#let index_size = 0.2em
#let cell_padding_x = 0.15em
#let cell_padding_top = 0.15em
#let cell_padding_bottom = 0.35em // Extra space for descenders
#let border_width = 0.5pt // Keep absolute for crisp lines
#let border_color = luma(180)

// Get configuration from sys.inputs
#let paper_size = sys.inputs.at("paper_size", default: "a4")
#let json_path = sys.inputs.at("json_path", default: "cutouts.json")

#set text(font: "Libertinus Serif", size: font_size)

#set page(
  paper: paper_size,
  margin: 1.5cm,
)

// Load the JSON data
#let json_data = json(json_path)
#let tokens = json_data.tokens
#let doc_metadata = json_data.metadata

// Helper to style punctuation with overline
// When used in corner labels, pass the fill colour to match the stroke
#let style-punct(t, stroke_color: black, large: false) = {
  let is_punct = t == "." or t == ","
  if is_punct {
    let size_factor = if large { 1.25em } else { 1em }
    text(size: size_factor, weight: "bold", overline(
      offset: -0.25em,
      stroke: 0.05em + stroke_color,
      t,
    ))
  } else {
    text(t)
  }
}

// Helper to format prefix array as styled text
#let format-prefix(prefix_arr, stroke_color: black) = {
  if prefix_arr == none or prefix_arr.len() == 0 {
    none
  } else {
    let styled_parts = prefix_arr.map(t => style-punct(
      t,
      stroke_color: stroke_color,
    ))
    styled_parts.join([ ])
  }
}

// Function to render a single token cell (no horizontal borders)
// The cell width is the maximum of the main token width and the prefix width
#let token-cell(token, is_last: false, height: auto) = {
  let text_content = style-punct(token.text, large: true)

  // Right border unless last in row
  let right_stroke = if is_last { none } else { border_width + border_color }

  let index_fill = if token.keep { luma(160) } else { luma(200) }

  // Get prefix from token (will be empty array if not present or for first n-1 tokens)
  let prefix_arr = token.at("prefix", default: ())
  let prefix_content = format-prefix(
    prefix_arr,
    stroke_color: if token.keep { luma(160) } else { luma(200) },
  )

  // Measure main content and prefix to determine cell width
  let main_measured = measure(text_content)
  let prefix_measured = if prefix_content != none {
    measure(text(size: index_size)[#prefix_content])
  } else {
    (width: 0pt)
  }

  // Cell width is the max of main content and prefix, plus padding
  let content_width = calc.max(main_measured.width, prefix_measured.width)

  let cell_content = if token.keep {
    // Kept token: black text
    box(
      width: content_width + 2 * cell_padding_x,
      height: height,
      stroke: (left: none, right: right_stroke, top: none, bottom: none),
      inset: (x: cell_padding_x),
      [
        #if prefix_content != none {
          place(top + left, dx: -0.1em, dy: 0.05em)[
            #text(size: index_size, fill: luma(160))[#prefix_content]
          ]
        }
        #place(bottom + right, dx: 0.1em, dy: -0.05em)[
          #text(size: index_size, fill: index_fill)[#token.index]
        ]
        #align(horizon)[#text_content]
      ],
    )
  } else {
    // Discarded token: greyed out, dashed right border
    let right_stroke_dashed = if is_last {
      none
    } else {
      (paint: border_color, thickness: border_width, dash: "dashed")
    }
    box(
      width: content_width + 2 * cell_padding_x,
      height: height,
      stroke: (left: none, right: right_stroke_dashed, top: none, bottom: none),
      inset: (x: cell_padding_x),
      [
        #if prefix_content != none {
          place(top + left, dx: -0.1em, dy: 0.05em)[
            #text(size: index_size, fill: luma(200))[#prefix_content]
          ]
        }
        #place(bottom + right, dx: 0.1em, dy: -0.05em)[
          #text(size: index_size, fill: index_fill)[#token.index]
        ]
        #align(horizon)[#text(fill: luma(160))[#text_content]]
      ],
    )
  }

  cell_content
}

// We need to use a table-like approach with full-width rows
// Each row has a top border, and we add a bottom border after the last row

// Height for all cells - must fit tallest content (punctuation at 1.25em + overline)
#let cell_height = 1.5em

// Use block layout with manual line breaks to create rows
#set par(leading: 0pt, spacing: 0pt)
#set block(spacing: 0pt)

// Create a layout that flows tokens and adds horizontal rules between lines
#layout(size => {
  let max_width = size.width
  let rows = ()
  let current_row = ()
  let current_width = 0pt

  // Measure and distribute tokens into rows
  for token in tokens {
    let cell = token-cell(token, height: cell_height)
    let cell_size = measure(cell)

    if current_width + cell_size.width > max_width and current_row.len() > 0 {
      // Start new row
      rows.push(current_row)
      current_row = ((token: token, width: cell_size.width),)
      current_width = cell_size.width
    } else {
      current_row.push((token: token, width: cell_size.width))
      current_width += cell_size.width
    }
  }

  // Don't forget the last row
  if current_row.len() > 0 {
    rows.push(current_row)
  }

  // Render rows with horizontal lines
  for (row_idx, row) in rows.enumerate() {
    // Top border for this row
    line(length: 100%, stroke: border_width + border_color)

    // Render tokens in this row
    box(width: 100%)[
      #for (i, item) in row.enumerate() {
        token-cell(item.token, is_last: i == row.len() - 1, height: cell_height)
      }
    ]
  }

  // Bottom border after last row
  line(length: 100%, stroke: border_width + border_color)
})
`;

function log(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  statusMessage.value += `\n[${timestamp}] ${message}`;
}

async function initCompiler() {
  status.value = "loading";
  statusMessage.value = "Initialising typst.ts compiler...";

  try {
    const cdnUrl =
      "https://cdn.jsdelivr.net/npm/@myriaddreamin/typst.ts@0.5.3/dist/esm/contrib/all-in-one-lite.bundle.js";
    const module = await import(/* @vite-ignore */ cdnUrl);
    typst.value = module.$typst;

    typst.value.setCompilerInitOptions({
      getModule: () =>
        "https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.5.3/pkg/typst_ts_web_compiler_bg.wasm",
    });

    typst.value.setRendererInitOptions({
      getModule: () =>
        "https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-renderer@0.5.3/pkg/typst_ts_renderer_bg.wasm",
    });

    log("Compiler options configured");
    log("Loading fonts from CDN...");

    for (const [fontFamily, urls] of Object.entries(FONT_URLS)) {
      for (const url of urls) {
        const filename = url.split("/").pop()!;
        log(`Loading ${fontFamily}: ${filename}...`);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }
        const fontData = await response.arrayBuffer();
        typst.value.mapShadow(`/fonts/${filename}`, new Uint8Array(fontData));
      }
    }

    log("Adding SVG logo...");
    const encoder = new TextEncoder();
    typst.value.mapShadow("/socy-logo-bw.svg", encoder.encode(SOCY_LOGO_SVG));

    log("Adding templates...");
    await typst.value.addSource("/book.typ", BOOK_TEMPLATE);
    await typst.value.addSource("/cutouts.typ", CUTOUTS_TEMPLATE);

    log("Loading text processing WASM module...");
    const wasmUrl = new URL(
      "../../../src/wasm-pkg/llms_unplugged.js",
      import.meta.url,
    );
    const wasm = await import(/* @vite-ignore */ wasmUrl.href);
    await wasm.default();
    wasmModule.value = wasm;
    log("WASM module loaded");

    status.value = "ready";
    log("Ready! Enter text or upload a file to begin.");
  } catch (error) {
    status.value = "error";
    log(`Error: ${(error as Error).message}`);
  }
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  fileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    inputText.value = content;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    if (!inputTitle.value) {
      inputTitle.value = baseName
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };
  reader.readAsText(file);
}

async function processAndCompile(outputType: "svg" | "pdf") {
  if (!typst.value || !wasmModule.value || status.value !== "ready") return;
  if (!hasInput.value) return;

  status.value = "compiling";
  const workflowName = workflow.value === "booklet" ? "booklet" : "cutouts";
  log(`Processing text for ${workflowName} (n=${ngramSize.value})...`);

  try {
    let jsonString: string;
    const title = inputTitle.value.trim();
    const author = inputAuthor.value.trim() || "Unknown";

    if (workflow.value === "booklet") {
      jsonString = wasmModule.value.process_text_for_booklet(
        inputText.value,
        title,
        author,
        ngramSize.value,
      );
    } else {
      jsonString = wasmModule.value.process_text_for_cutouts(
        inputText.value,
        title,
        author,
        ngramSize.value,
      );
    }

    log("Text processed, updating model data...");
    await typst.value.addSource("/model.json", jsonString);

    const templatePath =
      workflow.value === "booklet" ? "/book.typ" : "/cutouts.typ";
    const jsonPath = "/model.json";

    if (outputType === "svg") {
      log("Compiling to SVG...");
      const svg = await typst.value.svg({
        mainFilePath: templatePath,
        inputs: { json_path: jsonPath },
      });
      previewHtml.value = svg;
      log("SVG compilation successful!");
    } else {
      log("Compiling to PDF...");
      const pdfData = await typst.value.pdf({
        mainFilePath: templatePath,
        inputs: { json_path: jsonPath },
      });
      const blob = new Blob([pdfData], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
      a.download = `${safeTitle}-${workflowName}-${ngramSize.value}gram.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      log("PDF generated and download started!");
    }

    status.value = "ready";
  } catch (error) {
    status.value = "error";
    log(`Error: ${(error as Error).message}`);
    status.value = "ready";
  }
}

onMounted(() => {
  initCompiler();
});
</script>

<template>
  <div class="typst-compiler">
    <div class="status-indicator" :class="status">
      <span class="status-icon">
        <span
          v-if="status === 'idle' || status === 'loading'"
          class="spinner"
        />
        <span v-else-if="status === 'ready' || status === 'success'">✓</span>
        <span v-else-if="status === 'compiling'" class="spinner" />
        <span v-else-if="status === 'error'">✗</span>
      </span>
      <span class="status-text">
        <template v-if="status === 'idle' || status === 'loading'">
          Loading compiler...
        </template>
        <template v-else-if="status === 'ready'">Compiler ready</template>
        <template v-else-if="status === 'compiling'">Compiling...</template>
        <template v-else-if="status === 'success'">Done</template>
        <template v-else-if="status === 'error'">Error occurred</template>
      </span>
    </div>

    <div class="input-section">
      <h3>Input text</h3>

      <div class="file-upload">
        <label class="file-label">
          <input
            type="file"
            accept=".txt"
            class="file-input"
            @change="handleFileUpload"
          />
          <span class="file-button">Choose file</span>
          <span class="file-name">{{ fileName || "No file chosen" }}</span>
        </label>
      </div>

      <div class="text-input">
        <textarea
          v-model="inputText"
          placeholder="Or paste your text here..."
          rows="8"
          :disabled="status !== 'ready'"
        />
      </div>

      <div class="metadata-inputs">
        <div class="input-group">
          <label for="title-input">Title</label>
          <input
            id="title-input"
            v-model="inputTitle"
            type="text"
            placeholder="Document title (required)"
            :disabled="status !== 'ready'"
          />
        </div>
        <div class="input-group">
          <label for="author-input">Author</label>
          <input
            id="author-input"
            v-model="inputAuthor"
            type="text"
            placeholder="Author name (optional)"
            :disabled="status !== 'ready'"
          />
        </div>
      </div>
    </div>

    <div class="options-section">
      <h3>Options</h3>

      <div class="option-row">
        <div class="option-group">
          <label for="ngram-select">N-gram size</label>
          <select
            id="ngram-select"
            v-model="ngramSize"
            :disabled="status !== 'ready'"
          >
            <option :value="2">Bigram (n=2)</option>
            <option :value="3">Trigram (n=3)</option>
            <option :value="4">4-gram (n=4)</option>
          </select>
        </div>

        <div class="option-group">
          <label for="workflow-select">Output type</label>
          <select
            id="workflow-select"
            v-model="workflow"
            :disabled="status !== 'ready'"
          >
            <option value="booklet">Booklet (dice lookup tables)</option>
            <option value="cutouts">Cutouts (bucket training tokens)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="controls">
      <button
        :disabled="status !== 'ready' || !hasInput"
        @click="processAndCompile('svg')"
      >
        Preview (SVG)
      </button>
      <button
        :disabled="status !== 'ready' || !hasInput"
        @click="processAndCompile('pdf')"
      >
        Download PDF
      </button>
    </div>

    <details class="log-details">
      <summary>Show log</summary>
      <div class="status-log" :class="status">
        <pre>{{ statusMessage }}</pre>
      </div>
    </details>

    <!-- eslint-disable-next-line vue/no-v-html -- SVG from typst compiler is trusted -->
    <div v-if="previewHtml" class="preview" v-html="previewHtml"></div>
  </div>
</template>

<style scoped>
.typst-compiler {
  margin: 1.5rem 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.status-indicator.idle,
.status-indicator.loading {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
}

.status-indicator.ready,
.status-indicator.success {
  background: #d4edda;
  border: 1px solid #28a745;
  color: #155724;
}

.status-indicator.compiling {
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
}

.status-indicator.error {
  background: #f8d7da;
  border: 1px solid #dc3545;
  color: #721c24;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.input-section,
.options-section {
  margin-bottom: 1.5rem;
}

.input-section h3,
.options-section h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.file-upload {
  margin-bottom: 0.75rem;
}

.file-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.file-input {
  display: none;
}

.file-button {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.file-button:hover {
  background: var(--vp-c-bg-mute);
}

.file-name {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.text-input textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  resize: vertical;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.text-input textarea:disabled {
  background: var(--vp-c-bg-soft);
  cursor: not-allowed;
}

.metadata-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.75rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.input-group input,
.option-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  font-size: 0.9rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.input-group input:disabled,
.option-group select:disabled {
  background: var(--vp-c-bg-soft);
  cursor: not-allowed;
}

.option-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.controls button {
  background: var(--vp-c-brand-1);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.controls button:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
}

.controls button:disabled {
  background: var(--vp-c-text-3);
  cursor: not-allowed;
}

.log-details {
  margin: 1rem 0;
}

.log-details summary {
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

.status-log {
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  max-height: 200px;
  overflow-y: auto;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
}

.status-log pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview {
  background: white;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.preview :deep(svg) {
  max-width: 100%;
  height: auto;
}

@media (max-width: 640px) {
  .metadata-inputs,
  .option-row {
    grid-template-columns: 1fr;
  }
}
</style>
