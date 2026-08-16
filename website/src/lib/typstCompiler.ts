import { bookletCommon, bookTemplate, cutoutCommon, cutoutsTemplate } from "../templates";
// Fonts the templates reference, all bundled locally. The subset faces come from
// the system fonts via scripts/subset-booklet-fonts.py; the full faces are the
// upstream typst-assets v0.13.1 files, vendored verbatim so rendering matches
// what typst.ts's own default pack produced. They are uncompressed OTF/TTF
// because Typst parses only uncompressed sfnt fonts and silently ignores woff2.
//
// Nothing here is a "default asset" any more: typst.ts's defaults are fetched
// from cdn.jsdelivr.net at init (17 faces, 8.5 MB, including 5.5 MB of maths
// fonts these templates never use), which made every page view depend on a
// third-party CDN. disableDefaultFontAssets() below switches that off, so every
// face the templates can reach has to be listed here.
import serifCjkFontUrl from "../assets/fonts/NotoSerifCJKsc-Regular-subset.otf?url";
import sansCjkFontUrl from "../assets/fonts/NotoSansCJKsc-Regular-subset.otf?url";
import libertinusSansRegularUrl from "../assets/fonts/LibertinusSans-Regular-subset.otf?url";
import libertinusSansBoldUrl from "../assets/fonts/LibertinusSans-Bold-subset.otf?url";
import monaspaceArgonUrl from "../assets/fonts/MonaspaceArgon-Regular-subset.otf?url";
import publicSansRegularUrl from "../assets/fonts/PublicSans-Regular-subset.otf?url";
import publicSansBoldUrl from "../assets/fonts/PublicSans-Bold-subset.otf?url";
// Body text (book.typ, tokenized-cutouts.typ) plus the weights/styles the
// templates apply over it. Full faces, not subsets: this renders arbitrary
// user-supplied text, so clipping the glyph coverage would drop characters.
//
// This list is exactly the faces both templates actually select, established by
// rendering each of them against the full 17-face pack and against candidate
// subsets, then byte-comparing the SVG: these five reproduce the old output
// exactly, and dropping any one of them changes it. Semibold is the surprise --
// something in the templates resolves to weight 600, and without this face 33
// glyphs render from a different weight.
import libertinusSerifRegularUrl from "../assets/fonts/LibertinusSerif-Regular.otf?url";
import libertinusSerifBoldUrl from "../assets/fonts/LibertinusSerif-Bold.otf?url";
import libertinusSerifItalicUrl from "../assets/fonts/LibertinusSerif-Italic.otf?url";
import libertinusSerifSemiboldUrl from "../assets/fonts/LibertinusSerif-Semibold.otf?url";
// Typst's default face for #raw(), used for the URL and version in book.typ.
import dejaVuSansMonoUrl from "../assets/fonts/DejaVuSansMono.ttf?url";
// The typst.ts runtime wasm is bundled from the pinned npm packages rather than
// fetched from a CDN, so builds are deterministic and work offline. `?url`
// yields the emitted asset path; the wasm itself is only fetched when the
// compiler/renderer first initialises (via the getModule hooks below).
// Copied from cli/ by scripts/copy-cli-templates.ts, like the templates
// themselves: cutout-common.typ loads it with image("lockup-light.svg"). The
// title is baked to outlines, so it needs no font at render time.
import lockupSvg from "../templates/lockup-light.svg?raw";
import compilerWasmUrl from "@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url";
import rendererWasmUrl from "@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url";

export type Status = "idle" | "loading" | "ready" | "compiling" | "success" | "error";
export type Workflow = "booklet" | "cutouts";

export interface CompilerState {
  status: Status;
  log: string[];
  previewHtml: string;
  errorMessage: string;
}

const SOCY_LOGO_SVG = `<?xml version="1.0" encoding="iso-8859-1"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
<polygon style="fill:#000000;" points="600.362,274.305 362.804,274.305 530.783,106.326 494.205,69.749 326.227,237.728
  326.227,0.169 274.498,0.169 274.498,274.305 0.362,274.305 0.362,326.033 237.921,326.033 69.942,494.013 106.519,530.591
  274.498,362.612 274.498,600.17 326.227,600.17 326.227,326.033 600.362,326.033 "/>
</svg>`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let typst: any = null;
let wasmModule: typeof import("../wasm-pkg/llms_unplugged.js") | null = null;

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
    const module = await import("@myriaddreamin/typst.ts/contrib/all-in-one-lite");
    typst = module.$typst;

    typst.setCompilerInitOptions({ getModule: () => compilerWasmUrl });
    typst.setRendererInitOptions({ getModule: () => rendererWasmUrl });

    // Preload the bundled faces into the compiler's font book (fonts are
    // resolved by family name off this book --- mapping them into the shadow
    // filesystem does not register them). disableDefaultFontAssets() must come
    // with them: without a loader that states an opinion on `assets`,
    // TypstCompilerDriver.init appends its own CDN font loader.
    typst.use(
      module.TypstSnippet.preloadFonts([
        serifCjkFontUrl,
        sansCjkFontUrl,
        libertinusSansRegularUrl,
        libertinusSansBoldUrl,
        monaspaceArgonUrl,
        publicSansRegularUrl,
        publicSansBoldUrl,
        libertinusSerifRegularUrl,
        libertinusSerifBoldUrl,
        libertinusSerifItalicUrl,
        libertinusSerifSemiboldUrl,
        dejaVuSansMonoUrl,
      ]),
      module.TypstSnippet.disableDefaultFontAssets(),
    );

    onUpdate((s) => appendLog(s, "Compiler options configured"));
    onUpdate((s) => appendLog(s, "Registering bundled fonts..."));

    onUpdate((s) => appendLog(s, "Adding SVG logo..."));
    const encoder = new TextEncoder();
    typst.mapShadow("/socy-logo-bw.svg", encoder.encode(SOCY_LOGO_SVG));
    typst.mapShadow("/lockup-light.svg", encoder.encode(lockupSvg));

    onUpdate((s) => appendLog(s, "Adding templates..."));
    await typst.addSource("/book.typ", bookTemplate);
    await typst.addSource("/cutouts.typ", cutoutsTemplate);
    // book.typ and cutouts.typ import these by relative path, which resolves
    // to the VFS root because the importers themselves sit there.
    await typst.addSource("/booklet-common.typ", bookletCommon);
    await typst.addSource("/cutout-common.typ", cutoutCommon);

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
      a.download = `${sanitiseFilename(title)}-${workflowName}-${ngramSize}gram.pdf`;
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
