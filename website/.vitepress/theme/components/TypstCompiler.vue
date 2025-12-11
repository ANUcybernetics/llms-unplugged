<script setup lang="ts">
/* eslint-disable no-undef -- browser globals used in client-side component */
import { ref, onMounted } from "vue";

type Status = "idle" | "loading" | "ready" | "compiling" | "success" | "error";

const status = ref<Status>("idle");
const statusMessage = ref("Initialising compiler...");
const previewHtml = ref<string>("");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typst = ref<any>(null);

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

const MODEL_JSON = {
  data: [
    [".", 99, ["I", 44], ["not", 58], ["and", 70]],
    ["I", 99, ["do", 40], ["am", 59], ["will", 78], ["would", 94]],
    ["am", 99, [".", 62], ["Sam", 99]],
    ["Sam", 99, ["I", 73], [".", 99]],
    ["do", 99, ["not", 94], ["I", 99]],
    ["not", 99, ["like", 42], [",", 60], ["in", 78], ["eat", 99]],
    ["like", 99, ["them", 77], ["green", 99]],
    [
      "them",
      99,
      ["in", 23],
      ["with", 41],
      [",", 57],
      ["here", 73],
      ["anywhere", 99],
    ],
    ["green", 99, ["eggs", 99]],
    ["eggs", 99, ["and", 99]],
    ["and", 99, ["ham", 42], ["I", 99]],
    ["ham", 99, [".", 54], ["I", 99]],
  ],
  metadata: {
    author: "Dr Seuss",
    n: 2,
    title: "Green Eggs and Ham",
    url: "https://example.com",
    version: "1.0.0",
  },
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

    log("Adding model.json...");
    await typst.value.addSource("/model.json", JSON.stringify(MODEL_JSON));

    log("Adding SVG logo...");
    const encoder = new TextEncoder();
    typst.value.mapShadow("/socy-logo-bw.svg", encoder.encode(SOCY_LOGO_SVG));

    log("Adding book template...");
    await typst.value.addSource("/main.typ", BOOK_TEMPLATE);

    status.value = "ready";
    log("Ready to compile!");
  } catch (error) {
    status.value = "error";
    log(`Error: ${(error as Error).message}`);
  }
}

async function compileToSvg() {
  if (!typst.value || status.value !== "ready") return;

  status.value = "compiling";
  log("Compiling to SVG...");

  try {
    const svg = await typst.value.svg({ mainFilePath: "/main.typ" });
    previewHtml.value = svg;
    status.value = "success";
    log("SVG compilation successful!");
    status.value = "ready";
  } catch (error) {
    status.value = "error";
    log(`Compilation error: ${(error as Error).message}`);
  }
}

async function downloadPdf() {
  if (!typst.value || status.value !== "ready") return;

  status.value = "compiling";
  log("Compiling to PDF...");

  try {
    const pdfData = await typst.value.pdf({ mainFilePath: "/main.typ" });
    const blob = new Blob([pdfData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ngram-model.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    status.value = "success";
    log("PDF generated and download started!");
    status.value = "ready";
  } catch (error) {
    status.value = "error";
    log(`PDF error: ${(error as Error).message}`);
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
        <span v-if="status === 'idle' || status === 'loading'" class="spinner" />
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

    <div class="controls">
      <button :disabled="status !== 'ready'" @click="compileToSvg">
        Preview (SVG)
      </button>
      <button :disabled="status !== 'ready'" @click="downloadPdf">
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
</style>
