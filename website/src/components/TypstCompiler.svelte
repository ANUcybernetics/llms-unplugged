<script lang="ts">
  import { onMount } from "svelte";
  import { extractTextFromDocx, extractTextFromPdf, getFileType } from "../lib/fileExtract";
  import {
    clearError,
    compileDocument,
    type CompilerState,
    createInitialState,
    initCompiler,
    LEDGER_COLOUR_CHOICES,
    type LedgerDocument,
    type LedgerPrefill,
    type Status,
    type Workflow,
  } from "../lib/typstCompiler";
  import { isPale, LEDGER_COLUMNS, LEDGER_PALETTE } from "../lib/ledger";

  let compilerState = $state<CompilerState>(createInitialState());
  let inputText = $state("");
  let inputTitle = $state("");
  let inputAuthor = $state("");
  let ngramSize = $state(2);
  let workflow = $state<Workflow>("booklet");
  let fileName = $state("");
  // The ledger's own knobs: the room's counter colours (the default palette's
  // first so many), what the rows come printed with, and the group size.
  let ledgerColours = $state(LEDGER_COLOUR_CHOICES.at(-1)!);
  let ledgerPrefill = $state<LedgerPrefill>("prefixes");
  let ledgerSheets = $state<number | null>(null);

  let ledgerPalette = $derived(LEDGER_PALETTE.slice(0, ledgerColours));

  let hasInput = $derived(inputText.trim().length > 0 && inputTitle.trim().length > 0);
  let isReady = $derived(compilerState.status === "ready");

  function updateState(updater: (s: CompilerState) => CompilerState) {
    compilerState = updater(compilerState);
  }

  onMount(() => {
    initCompiler(updateState);
  });

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const EXTRACTION_TIMEOUT = 30000;

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    updateState((s) => clearError(s));

    if (file.size > MAX_FILE_SIZE) {
      updateState((s) => ({
        ...s,
        errorMessage: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`,
      }));
      target.value = "";
      return;
    }

    fileName = file.name;
    const fileType = getFileType(file.name);

    if (!fileType) {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "unknown";
      updateState((s) => ({
        ...s,
        errorMessage: `Unsupported file type (.${ext}). Use .txt, .md, .docx, or .pdf files.`,
      }));
      target.value = "";
      return;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");

    function extractWithTimeout<T>(promise: Promise<T>): Promise<T> {
      return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Extraction timed out after 30 seconds")),
            EXTRACTION_TIMEOUT,
          ),
        ),
      ]);
    }

    try {
      let content: string;

      if (fileType === "txt" || fileType === "md") {
        content = await file.text();
      } else if (fileType === "docx") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await extractWithTimeout(extractTextFromDocx(arrayBuffer));
        content = result.text;
      } else if (fileType === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        content = await extractWithTimeout(extractTextFromPdf(arrayBuffer));
      } else {
        return;
      }

      inputText = content;
      if (!inputTitle) {
        inputTitle = baseName.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }
    } catch (error) {
      updateState((s) => ({
        ...s,
        errorMessage: `Failed to read file: ${(error as Error).message}`,
      }));
      target.value = "";
    }
  }

  function handleCompile(outputType: "svg" | "pdf", document: LedgerDocument = "sheets") {
    if (!isReady || !hasInput) return;
    compileDocument(
      {
        text: inputText,
        title: inputTitle,
        author: inputAuthor,
        ngramSize,
        workflow,
        outputType,
        ledger: {
          colours: ledgerColours,
          prefill: ledgerPrefill,
          // An empty box binds to null, and the min= on a number input is
          // advisory: anything under one means "as many as the text fills".
          sheets: ledgerSheets !== null && ledgerSheets >= 1 ? ledgerSheets : undefined,
          document,
        },
      },
      updateState,
    );
  }

  // What each choice leaves the room to do; the labels are too short to say it
  // and a select truncates anything longer.
  const PREFILL_HINTS: Record<LedgerPrefill, string> = {
    prefixes: "the followers and their tallies are discovered as the text is read",
    followers: "the followers are printed, so only the tallies are left to make",
    tallies: "the whole trained model, printed: a worked example or an answer key",
  };

  function rowsWord(colours: number): string {
    const rows = colours / LEDGER_COLUMNS;
    return rows === 1 ? "one row of strips" : `${rows} rows of strips`;
  }

  function statusLabel(status: Status): string {
    switch (status) {
      case "idle":
      case "loading":
        return "Loading compiler...";
      case "ready":
        return "Compiler ready";
      case "compiling":
        return "Compiling...";
      case "success":
        return "Done";
      case "error":
        return "Error occurred --- try refreshing the page";
    }
  }

  function statusIcon(status: Status): string {
    switch (status) {
      case "ready":
      case "success":
        return "check";
      case "error":
        return "error";
      default:
        return "spinner";
    }
  }
</script>

<div class="typst-compiler">
  <div class="input-section">
    <h3>Input text</h3>

    <div class="file-upload">
      <label class="file-label">
        <input
          type="file"
          accept=".txt,.md,.markdown,.docx,.pdf"
          class="file-input"
          onchange={handleFileUpload}
        />
        <span class="file-button">Choose file</span>
        <span class="file-name">{fileName || "No file chosen"}</span>
      </label>
    </div>

    <div class="text-input">
      <textarea
        bind:value={inputText}
        placeholder="Or paste your text here..."
        rows="8"
        aria-label="Training text"
        disabled={!isReady}></textarea>
    </div>

    <div class="metadata-inputs">
      <div class="input-group">
        <label for="typst-title-input">Title</label>
        <input
          id="typst-title-input"
          type="text"
          bind:value={inputTitle}
          placeholder="Document title (required)"
          disabled={!isReady}
        />
      </div>
      <div class="input-group">
        <label for="typst-author-input">Author</label>
        <input
          id="typst-author-input"
          type="text"
          bind:value={inputAuthor}
          placeholder="Author name (optional)"
          disabled={!isReady}
        />
      </div>
    </div>
  </div>

  <div class="options-section">
    <h3>Options</h3>

    <div class="option-row">
      <div class="option-group">
        <label for="typst-ngram-select">N-gram size</label>
        <select id="typst-ngram-select" bind:value={ngramSize} disabled={!isReady}>
          <option value={2}>Bigram (n=2)</option>
          <option value={3}>Trigram (n=3)</option>
          <option value={4}>4-gram (n=4)</option>
        </select>
      </div>

      <div class="option-group">
        <label for="typst-workflow-select">Output type</label>
        <select id="typst-workflow-select" bind:value={workflow} disabled={!isReady}>
          <option value="booklet">Booklet (dice lookup tables)</option>
          <option value="cutouts">Cutouts (printable token cards)</option>
          <option value="ledger">Ledger (tally sheets and counters)</option>
        </select>
      </div>
    </div>

    {#if workflow === "ledger"}
      <div class="option-row ledger-options">
        <div class="option-group">
          <label for="typst-ledger-colours-select">Counter colours</label>
          <select id="typst-ledger-colours-select" bind:value={ledgerColours} disabled={!isReady}>
            {#each LEDGER_COLOUR_CHOICES as colours (colours)}
              <option value={colours}>{colours} colours ({rowsWord(colours)})</option>
            {/each}
          </select>
          <ul class="swatches" aria-label="The counter colours in use">
            {#each ledgerPalette as colour (colour.name)}
              <li
                class="swatch"
                class:pale={isPale(colour.hex)}
                style:background={colour.hex}
                title={colour.name}
              >
                <span class="visually-hidden">{colour.name}</span>
              </li>
            {/each}
          </ul>
        </div>
        <div class="option-group">
          <label for="typst-ledger-prefill-select">Printed on the sheets</label>
          <select id="typst-ledger-prefill-select" bind:value={ledgerPrefill} disabled={!isReady}>
            <option value="prefixes">Prefixes only</option>
            <option value="followers">Prefixes and followers</option>
            <option value="tallies">Everything</option>
          </select>
          <p class="hint">{PREFILL_HINTS[ledgerPrefill]}</p>
        </div>
        <div class="option-group">
          <label for="typst-ledger-sheets-input">Sheets (group size)</label>
          <input
            id="typst-ledger-sheets-input"
            type="number"
            min="1"
            step="1"
            bind:value={ledgerSheets}
            placeholder="As many as the text fills"
            disabled={!isReady}
          />
        </div>
      </div>
    {/if}
  </div>

  <div class="controls">
    <button disabled={!isReady || !hasInput} onclick={() => handleCompile("svg")}>
      {workflow === "ledger" ? "Preview sheets (SVG)" : "Preview (SVG)"}
    </button>
    {#if workflow === "ledger"}
      <button disabled={!isReady || !hasInput} onclick={() => handleCompile("pdf", "sheets")}>
        Download sheets PDF
      </button>
      <button disabled={!isReady || !hasInput} onclick={() => handleCompile("pdf", "counters")}>
        Download counters PDF
      </button>
      <button disabled={!isReady || !hasInput} onclick={() => handleCompile("pdf", "text")}>
        Download text PDF
      </button>
    {:else}
      <button disabled={!isReady || !hasInput} onclick={() => handleCompile("pdf")}>
        Download PDF
      </button>
    {/if}
  </div>

  {#if compilerState.errorMessage}
    <div class="error-banner" role="alert">
      <span class="error-icon">&#10007;</span>
      <span class="error-text">{compilerState.errorMessage}</span>
      <button
        class="error-dismiss"
        onclick={() => updateState((s) => clearError(s))}
        aria-label="Dismiss error">&times;</button
      >
    </div>
  {/if}

  <div class="status-indicator {compilerState.status}">
    <span class="status-icon">
      {#if statusIcon(compilerState.status) === "spinner"}
        <span class="spinner"></span>
      {:else if statusIcon(compilerState.status) === "check"}
        <span>&#10003;</span>
      {:else}
        <span>&#10007;</span>
      {/if}
    </span>
    <span class="status-text">{statusLabel(compilerState.status)}</span>
  </div>

  <details class="log-details">
    <summary>Show log</summary>
    <div class="status-log {compilerState.status}">
      <pre>{compilerState.log.join("\n")}</pre>
    </div>
  </details>

  {#if compilerState.previewHtml}
    <div class="preview">
      {@html compilerState.previewHtml}
    </div>
  {/if}
</div>

<style>
  .typst-compiler {
    margin: 1.5rem 0;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--at-border-radius);
    margin-bottom: 1rem;
    background: var(--at-error-soft);
    border: 1px solid color-mix(in srgb, var(--at-error) 50%, transparent);
    color: var(--at-error);
    font-size: 0.9rem;
  }

  .error-icon {
    flex-shrink: 0;
    font-weight: bold;
  }

  .error-text {
    flex: 1;
  }

  .error-dismiss {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0 0.25rem;
    line-height: 1;
    opacity: 0.7;
  }

  .error-dismiss:hover {
    opacity: 1;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: var(--at-border-radius);
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .status-indicator.idle,
  .status-indicator.loading {
    background: var(--at-bg-alt);
    border: 1px solid var(--at-border);
    color: var(--at-text-secondary);
  }

  .status-indicator.ready,
  .status-indicator.success {
    background: var(--at-success-soft);
    border: 1px solid color-mix(in srgb, var(--at-success) 50%, transparent);
    color: var(--at-success);
  }

  .status-indicator.compiling {
    background: var(--at-warning-soft);
    border: 1px solid color-mix(in srgb, var(--at-warning) 50%, transparent);
    color: var(--at-warning);
  }

  .status-indicator.error {
    background: var(--at-error-soft);
    border: 1px solid color-mix(in srgb, var(--at-error) 50%, transparent);
    color: var(--at-error);
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

  /* Visually hidden but still focusable — display:none would make the file
     picker unreachable by keyboard and invisible to screen readers. */
  .file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .file-button {
    background: var(--at-bg-alt);
    border: 1px solid var(--at-border);
    padding: 0.5rem 1rem;
    border-radius: var(--at-border-radius);
    font-size: 0.9rem;
    transition: background-color 0.2s;
    color: var(--at-text);
  }

  .file-input:focus-visible ~ .file-button {
    outline: 2px solid var(--at-accent);
    outline-offset: 2px;
  }

  .file-button:hover {
    background: var(--at-bg-elevated);
  }

  .file-name {
    color: var(--at-text-secondary);
    font-size: 0.9rem;
  }

  .text-input textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--at-border);
    border-radius: var(--at-border-radius);
    font-family: var(--font-mono);
    font-size: 0.85rem;
    resize: vertical;
    background: var(--at-bg);
    color: var(--at-text);
  }

  .text-input textarea:disabled {
    background: var(--at-bg-alt);
    cursor: not-allowed;
  }

  .metadata-inputs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-top: 0.75rem;
  }

  .input-group,
  .option-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .input-group label,
  .option-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--at-text-secondary);
  }

  .input-group input,
  .option-group select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--at-border);
    border-radius: var(--at-border-radius);
    font-size: 0.9rem;
    background: var(--at-bg);
    color: var(--at-text);
  }

  .input-group input:disabled,
  .option-group select:disabled {
    background: var(--at-bg-alt);
    cursor: not-allowed;
  }

  .option-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .ledger-options {
    grid-template-columns: repeat(3, 1fr);
    margin-top: 1rem;
  }

  .option-group input[type="number"] {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--at-border);
    border-radius: var(--at-border-radius);
    font-size: 0.9rem;
    background: var(--at-bg);
    color: var(--at-text);
  }

  .option-group input[type="number"]:disabled {
    background: var(--at-bg-alt);
    cursor: not-allowed;
  }

  /* The colours the strips will print in, so the count reads as a palette. */
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin: 0.35rem 0 0;
    padding: 0;
    list-style: none;
  }

  .swatch {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--at-text) 25%, transparent);
  }

  .swatch.pale {
    border-style: dashed;
  }

  .hint {
    margin: 0.1rem 0 0;
    font-size: 0.8rem;
    line-height: 1.35;
    color: var(--at-text-secondary);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .controls button {
    background: var(--at-accent);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: var(--at-border-radius);
    cursor: pointer;
    font-size: 1rem;
    font-family: inherit;
  }

  .controls button:hover:not(:disabled) {
    background: var(--at-accent-hover);
  }

  .controls button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .log-details {
    margin: 1rem 0;
  }

  .log-details summary {
    cursor: pointer;
    color: var(--at-text-secondary);
    font-size: 0.875rem;
  }

  .status-log {
    padding: 1rem;
    border-radius: var(--at-border-radius);
    margin-top: 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    max-height: 200px;
    overflow-y: auto;
    background: var(--at-bg-alt);
    border: 1px solid var(--at-border);
  }

  .status-log pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .preview {
    background: white;
    border: 1px solid var(--at-border);
    border-radius: var(--at-border-radius);
    padding: 1rem;
    margin-top: 1rem;
  }

  .preview :global(svg) {
    max-width: 100%;
    height: auto;
  }

  @media (max-width: 640px) {
    .metadata-inputs,
    .option-row,
    .ledger-options {
      grid-template-columns: 1fr;
    }
  }
</style>
