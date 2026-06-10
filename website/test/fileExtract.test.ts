import { describe, expect, it } from "vitest";
import { getFileType } from "../src/lib/fileExtract";

describe("getFileType", () => {
  it("identifies .txt files", () => {
    expect(getFileType("document.txt")).toBe("txt");
    expect(getFileType("my file.txt")).toBe("txt");
    expect(getFileType("DOCUMENT.TXT")).toBe("txt");
  });

  it("identifies .md and .markdown files", () => {
    expect(getFileType("readme.md")).toBe("md");
    expect(getFileType("README.MD")).toBe("md");
    expect(getFileType("notes.markdown")).toBe("md");
    expect(getFileType("NOTES.MARKDOWN")).toBe("md");
  });

  it("identifies .docx files", () => {
    expect(getFileType("document.docx")).toBe("docx");
    expect(getFileType("My Document.docx")).toBe("docx");
    expect(getFileType("REPORT.DOCX")).toBe("docx");
  });

  it("identifies .pdf files", () => {
    expect(getFileType("document.pdf")).toBe("pdf");
    expect(getFileType("My Report.pdf")).toBe("pdf");
    expect(getFileType("MANUAL.PDF")).toBe("pdf");
  });

  it("returns null for unsupported file types", () => {
    expect(getFileType("image.png")).toBeNull();
    expect(getFileType("spreadsheet.xlsx")).toBeNull();
    expect(getFileType("document.doc")).toBeNull();
    expect(getFileType("archive.zip")).toBeNull();
    expect(getFileType("noextension")).toBeNull();
  });

  it("handles filenames with multiple dots", () => {
    expect(getFileType("my.document.v2.txt")).toBe("txt");
    expect(getFileType("report.final.pdf")).toBe("pdf");
    expect(getFileType("notes.backup.md")).toBe("md");
  });

  it("handles empty and edge cases", () => {
    expect(getFileType("")).toBeNull();
    expect(getFileType(".txt")).toBe("txt");
    expect(getFileType(".")).toBeNull();
  });
});
