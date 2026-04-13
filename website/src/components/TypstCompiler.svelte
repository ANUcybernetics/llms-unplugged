<script lang="ts">
  import { onMount } from "svelte";
  import {
    getFileType,
    extractTextFromDocx,
    extractTextFromPdf,
  } from "../lib/fileExtract";
  import {
    createInitialState,
    initCompiler,
    compileDocument,
    clearError,
    type Status,
    type Workflow,
    type CompilerState,
  } from "../lib/typstCompiler";

  let compilerState = $state<CompilerState>(createInitialState());
  let inputText = $state("");
  let inputTitle = $state("");
  let inputAuthor = $state("");
  let ngramSize = $state(2);
  let workflow = $state<Workflow>("booklet");
  let fileName = $state("");

  let hasInput = $derived(
    inputText.trim().length > 0 && inputTitle.trim().length > 0,
  );
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
      const ext = file.name.includes(".")
        ? file.name.split(".").pop()
        : "unknown";
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
        const result = await extractWithTimeout(
          extractTextFromDocx(arrayBuffer),
        );
        content = result.text;
      } else if (fileType === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        content = await extractWithTimeout(extractTextFromPdf(arrayBuffer));
      } else {
        return;
      }

      inputText = content;
      if (!inputTitle) {
        inputTitle = baseName
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    } catch (error) {
      updateState((s) => ({
        ...s,
        errorMessage: `Failed to read file: ${(error as Error).message}`,
      }));
      target.value = "";
    }
  }

  function handleCompile(outputType: "svg" | "pdf") {
    if (!isReady || !hasInput) return;
    compileDocument(
      inputText,
      inputTitle,
      inputAuthor,
      ngramSize,
      workflow,
      outputType,
      updateState,
    );
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
        disabled={!isReady}
      ></textarea>
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
        <select
          id="typst-ngram-select"
          bind:value={ngramSize}
          disabled={!isReady}
        >
          <option value={2}>Bigram (n=2)</option>
          <option value={3}>Trigram (n=3)</option>
          <option value={4}>4-gram (n=4)</option>
        </select>
      </div>

      <div class="option-group">
        <label for="typst-workflow-select">Output type</label>
        <select
          id="typst-workflow-select"
          bind:value={workflow}
          disabled={!isReady}
        >
          <option value="booklet">Booklet (dice lookup tables)</option>
          <option value="cutouts">Cutouts (bucket training tokens)</option>
        </select>
      </div>
    </div>
  </div>

  <div class="controls">
    <button
      disabled={!isReady || !hasInput}
      onclick={() => handleCompile("svg")}
    >
      Preview (SVG)
    </button>
    <button
      disabled={!isReady || !hasInput}
      onclick={() => handleCompile("pdf")}
    >
      Download PDF
    </button>
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
    border-radius: 0.375rem;
    margin-bottom: 1rem;
    background: rgba(220, 53, 69, 0.15);
    border: 1px solid rgba(220, 53, 69, 0.5);
    color: #f08090;
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
    border-radius: 0.375rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .status-indicator.idle,
  .status-indicator.loading {
    background: var(--color-bg-soft);
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);
  }

  .status-indicator.ready,
  .status-indicator.success {
    background: rgba(40, 167, 69, 0.15);
    border: 1px solid rgba(40, 167, 69, 0.5);
    color: #6fcf7f;
  }

  .status-indicator.compiling {
    background: rgba(255, 193, 7, 0.15);
    border: 1px solid rgba(255, 193, 7, 0.5);
    color: #ffd54f;
  }

  .status-indicator.error {
    background: rgba(220, 53, 69, 0.15);
    border: 1px solid rgba(220, 53, 69, 0.5);
    color: #f08090;
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
    background: var(--color-bg-soft);
    border: 1px solid var(--color-border);
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    transition: background-color 0.2s;
    color: var(--color-text);
  }

  .file-button:hover {
    background: var(--color-bg-elevated);
  }

  .file-name {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .text-input textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    resize: vertical;
    background: var(--color-bg);
    color: var(--color-text);
  }

  .text-input textarea:disabled {
    background: var(--color-bg-soft);
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
    color: var(--color-text-secondary);
  }

  .input-group input,
  .option-group select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    font-size: 0.9rem;
    background: var(--color-bg);
    color: var(--color-text);
  }

  .input-group input:disabled,
  .option-group select:disabled {
    background: var(--color-bg-soft);
    cursor: not-allowed;
  }

  .option-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .controls button {
    background: var(--color-brand);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
    font-family: inherit;
  }

  .controls button:hover:not(:disabled) {
    background: var(--color-brand-hover);
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
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }

  .status-log {
    padding: 1rem;
    border-radius: 0.5rem;
    margin-top: 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    max-height: 200px;
    overflow-y: auto;
    background: var(--color-bg-soft);
    border: 1px solid var(--color-border);
  }

  .status-log pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .preview {
    background: white;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 1rem;
  }

  .preview :global(svg) {
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
