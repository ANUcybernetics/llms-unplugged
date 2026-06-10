export type FileType = "txt" | "md" | "docx" | "pdf";

export function getFileType(filename: string): FileType | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "txt":
      return "txt";
    case "md":
    case "markdown":
      return "md";
    case "docx":
      return "docx";
    case "pdf":
      return "pdf";
    default:
      return null;
  }
}

export async function extractTextFromDocx(
  arrayBuffer: ArrayBuffer,
): Promise<{ text: string; warnings: string[] }> {
  const mammoth = await import("mammoth");
  const result = await mammoth.default.extractRawText({ arrayBuffer });
  return {
    text: result.value,
    warnings: result.messages.map((msg) => msg.message),
  };
}

export async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Configure worker on first use; Vite bundles it as an asset, so there's no
  // third-party CDN dependency at runtime.
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).href;
  }

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  /* eslint-disable no-await-in-loop -- pages must be extracted sequentially */
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    textParts.push(pageText);
  }
  /* eslint-enable no-await-in-loop */

  return textParts.join("\n\n");
}
