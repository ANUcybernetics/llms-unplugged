<script setup lang="ts">
/* eslint-disable no-undef -- browser globals used in client-side component */
import { ref, onMounted, computed } from "vue";
import {
  getFileType,
  extractTextFromDocx,
  extractTextFromPdf,
} from "../utils/fileExtract";
import { bookTemplate, cutoutsTemplate } from "../templates";

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
    await typst.value.addSource("/book.typ", bookTemplate);
    await typst.value.addSource("/cutouts.typ", cutoutsTemplate);

    log("Loading text processing WASM module...");
    const wasm = await import("../../../src/wasm-pkg/llms_unplugged.js");
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

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const EXTRACTION_TIMEOUT = 30000;

  if (file.size > MAX_FILE_SIZE) {
    log(`Error: File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`);
    target.value = '';
    return;
  }

  fileName.value = file.name;
  const fileType = getFileType(file.name);

  if (!fileType) {
    log(`Unsupported file type: ${file.name}`);
    target.value = '';
    return;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");

  const extractWithTimeout = async <T>(promise: Promise<T>): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Extraction timed out after 30 seconds')), EXTRACTION_TIMEOUT)
      )
    ]);
  };

  try {
    let content: string;

    if (fileType === "txt" || fileType === "md") {
      content = await file.text();
      log(`Loaded ${fileType.toUpperCase()} file: ${file.name}`);
    } else if (fileType === "docx") {
      log(`Extracting text from DOCX: ${file.name}...`);
      const arrayBuffer = await file.arrayBuffer();
      const result = await extractWithTimeout(extractTextFromDocx(arrayBuffer));
      content = result.text;
      result.warnings.forEach((warning) => log(`DOCX warning: ${warning}`));
      log(`Extracted ${content.length} characters from DOCX`);
    } else if (fileType === "pdf") {
      log(`Extracting text from PDF: ${file.name}...`);
      const arrayBuffer = await file.arrayBuffer();
      content = await extractWithTimeout(extractTextFromPdf(arrayBuffer));
      if (content.trim().length === 0) {
        log(
          "Warning: No text extracted from PDF. It may be a scanned document or image-based PDF.",
        );
      } else {
        log(`Extracted ${content.length} characters from PDF`);
      }
    } else {
      return;
    }

    inputText.value = content;

    if (!inputTitle.value) {
      inputTitle.value = baseName
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch (error) {
    log(`Error reading file: ${(error as Error).message}`);
    target.value = '';
  }
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
    <div class="input-section">
      <h3>Input text</h3>

      <div class="file-upload">
        <label class="file-label">
          <input
            type="file"
            accept=".txt,.md,.markdown,.docx,.pdf"
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
        <template v-else-if="status === 'error'">
          Error occurred — try refreshing the page
        </template>
      </span>
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
