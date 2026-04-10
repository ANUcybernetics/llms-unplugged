import { bookTemplate, cutoutsTemplate } from "../templates";

export type Status = "idle" | "loading" | "ready" | "compiling" | "success" | "error";
export type Workflow = "booklet" | "cutouts";

export interface CompilerState {
  status: Status;
  log: string[];
  previewHtml: string;
  errorMessage: string;
}

const FONT_URLS: Record<string, string[]> = {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let typst: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any = null;

export function appendLog(state: CompilerState, message: string): CompilerState {
  const timestamp = new Date().toLocaleTimeString();
  return { ...state, log: [...state.log, `[${timestamp}] ${message}`] };
}

export function setError(state: CompilerState, message: string): CompilerState {
  return { ...appendLog(state, `Error: ${message}`), errorMessage: message };
}

export function clearError(state: CompilerState): CompilerState {
  return { ...state, errorMessage: "" };
}

export function createInitialState(): CompilerState {
  return {
    status: "idle",
    log: [],
    previewHtml: "",
    errorMessage: "",
  };
}

export async function initCompiler(
  onUpdate: (updater: (state: CompilerState) => CompilerState) => void,
): Promise<boolean> {
  onUpdate((s) => ({
    ...appendLog(s, "Initialising typst.ts compiler..."),
    status: "loading",
  }));

  try {
    const cdnUrl =
      "https://cdn.jsdelivr.net/npm/@myriaddreamin/typst.ts@0.7.0-rc2/dist/esm/contrib/all-in-one-lite.bundle.js";
    const module = await import(/* @vite-ignore */ cdnUrl);
    typst = module.$typst;

    typst.setCompilerInitOptions({
      getModule: () =>
        "https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.7.0-rc2/pkg/typst_ts_web_compiler_bg.wasm",
    });

    typst.setRendererInitOptions({
      getModule: () =>
        "https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-renderer@0.7.0-rc2/pkg/typst_ts_renderer_bg.wasm",
    });

    onUpdate((s) => appendLog(s, "Compiler options configured"));
    onUpdate((s) => appendLog(s, "Loading fonts from CDN..."));

    /* eslint-disable no-await-in-loop -- fonts loaded sequentially into shadow FS */
    for (const [fontFamily, urls] of Object.entries(FONT_URLS)) {
      for (const url of urls) {
        const filename = url.split("/").pop()!;
        onUpdate((s) => appendLog(s, `Loading ${fontFamily}: ${filename}...`));
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }
        const fontData = await response.arrayBuffer();
        typst.mapShadow(`/fonts/${filename}`, new Uint8Array(fontData));
      }
    }
    /* eslint-enable no-await-in-loop */

    onUpdate((s) => appendLog(s, "Adding SVG logo..."));
    const encoder = new TextEncoder();
    typst.mapShadow("/socy-logo-bw.svg", encoder.encode(SOCY_LOGO_SVG));

    onUpdate((s) => appendLog(s, "Adding templates..."));
    await typst.addSource("/book.typ", bookTemplate);
    await typst.addSource("/cutouts.typ", cutoutsTemplate);

    onUpdate((s) => appendLog(s, "Loading text processing WASM module..."));
    const wasm = await import("../wasm-pkg/llms_unplugged.js");
    await wasm.default();
    wasmModule = wasm;

    onUpdate((s) => ({
      ...appendLog(s, "Ready! Enter text or upload a file to begin."),
      status: "ready",
    }));
    return true;
  } catch (error) {
    const msg = (error as Error).message;
    onUpdate((s) => ({
      ...setError(s, msg),
      status: "error",
    }));
    return false;
  }
}

export async function compileDocument(
  text: string,
  title: string,
  author: string,
  ngramSize: number,
  workflow: Workflow,
  outputType: "svg" | "pdf",
  onUpdate: (updater: (state: CompilerState) => CompilerState) => void,
): Promise<void> {
  if (!typst || !wasmModule) return;

  const workflowName = workflow === "booklet" ? "booklet" : "cutouts";
  onUpdate((s) => ({
    ...appendLog(clearError(s), `Processing text for ${workflowName} (n=${ngramSize})...`),
    status: "compiling",
  }));

  try {
    const safeAuthor = author.trim() || "Unknown";
    const jsonString =
      workflow === "booklet"
        ? wasmModule.process_text_for_booklet(text, title.trim(), safeAuthor, ngramSize)
        : wasmModule.process_text_for_cutouts(text, title.trim(), safeAuthor, ngramSize);

    onUpdate((s) => appendLog(s, "Text processed, updating model data..."));
    await typst.addSource("/model.json", jsonString);

    const templatePath = workflow === "booklet" ? "/book.typ" : "/cutouts.typ";
    const jsonPath = "/model.json";

    if (outputType === "svg") {
      onUpdate((s) => appendLog(s, "Compiling to SVG..."));
      const svg = await typst.svg({
        mainFilePath: templatePath,
        inputs: { json_path: jsonPath },
      });
      onUpdate((s) => ({
        ...appendLog(s, "SVG compilation successful!"),
        status: "ready",
        previewHtml: svg,
      }));
    } else {
      onUpdate((s) => appendLog(s, "Compiling to PDF..."));
      const pdfData = await typst.pdf({
        mainFilePath: templatePath,
        inputs: { json_path: jsonPath },
      });
      const blob = new Blob([pdfData], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = title
        .trim()
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase();
      a.download = `${safeTitle}-${workflowName}-${ngramSize}gram.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onUpdate((s) => ({
        ...appendLog(s, "PDF generated and download started!"),
        status: "ready",
      }));
    }
  } catch (error) {
    const msg = (error as Error).message;
    onUpdate((s) => ({
      ...setError(s, msg),
      status: "error",
    }));
  }
}

export function sanitiseFilename(title: string): string {
  return title
    .trim()
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
}
