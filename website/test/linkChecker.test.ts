import { describe, expect, it } from "vitest";
import { extractPdfLinks, resolveLinkPath } from "./utils/linkChecker";

describe("linkChecker", () => {
  describe("extractPdfLinks", () => {
    it("extracts absolute PDF links", () => {
      const html = '<a href="/assets/pdfs/document.pdf">Download</a>';
      expect(extractPdfLinks(html)).toEqual(["/assets/pdfs/document.pdf"]);
    });

    it("extracts relative PDF links", () => {
      const html = '<a href="../docs/guide.pdf">Guide</a>';
      expect(extractPdfLinks(html)).toEqual(["../docs/guide.pdf"]);
    });

    it("extracts multiple PDF links", () => {
      const html = `
        <a href="/first.pdf">First</a>
        <a href="/second.pdf">Second</a>
        <a href="relative/third.pdf">Third</a>
      `;
      expect(extractPdfLinks(html)).toEqual(["/first.pdf", "/second.pdf", "relative/third.pdf"]);
    });

    it("returns empty array when no PDF links", () => {
      const html = '<a href="/page.html">Page</a><a href="/image.png">Image</a>';
      expect(extractPdfLinks(html)).toEqual([]);
    });

    it("ignores non-href PDF references", () => {
      const html = '<img src="/image.pdf"><div data-file="doc.pdf">';
      expect(extractPdfLinks(html)).toEqual([]);
    });

    it("handles PDF links with query strings", () => {
      const html = '<a href="/doc.pdf?v=1">Doc</a>';
      expect(extractPdfLinks(html)).toEqual([]);
    });
  });

  describe("resolveLinkPath", () => {
    it("resolves absolute paths relative to dist dir", () => {
      const result = resolveLinkPath(
        "/assets/pdfs/doc.pdf",
        "/project/dist/lessons/training.html",
        "/project/dist",
      );
      expect(result).toBe("/project/dist/assets/pdfs/doc.pdf");
    });

    it("resolves relative paths relative to HTML file", () => {
      const result = resolveLinkPath(
        "../pdfs/doc.pdf",
        "/project/dist/lessons/training.html",
        "/project/dist",
      );
      expect(result).toBe("/project/dist/pdfs/doc.pdf");
    });

    it("resolves same-directory relative paths", () => {
      const result = resolveLinkPath("doc.pdf", "/project/dist/docs/index.html", "/project/dist");
      expect(result).toBe("/project/dist/docs/doc.pdf");
    });
  });
});
