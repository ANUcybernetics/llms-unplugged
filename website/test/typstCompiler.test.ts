import { describe, expect, it } from "vitest";
import {
  appendLog,
  clearError,
  type CompileRequest,
  type CompilerState,
  createInitialState,
  LEDGER_COLOUR_CHOICES,
  type LedgerDocument,
  outputFilename,
  sanitiseFilename,
  setError,
  templateFor,
} from "../src/lib/typstCompiler";

describe("createInitialState", () => {
  it("returns idle status with empty log, no preview, and no error", () => {
    const state = createInitialState();
    expect(state.status).toBe("idle");
    expect(state.log).toEqual([]);
    expect(state.previewHtml).toBe("");
    expect(state.errorMessage).toBe("");
  });
});

describe("appendLog", () => {
  it("adds a timestamped message to the log", () => {
    const state = createInitialState();
    const updated = appendLog(state, "test message");
    expect(updated.log).toHaveLength(1);
    expect(updated.log[0]).toMatch(/\[.*\] test message/);
  });

  it("preserves existing log entries", () => {
    let state = createInitialState();
    state = appendLog(state, "first");
    state = appendLog(state, "second");
    expect(state.log).toHaveLength(2);
    expect(state.log[0]).toMatch(/first/);
    expect(state.log[1]).toMatch(/second/);
  });
});

describe("setError", () => {
  it("sets the error message and appends to log", () => {
    const state = createInitialState();
    const updated = setError(state, "File too large");
    expect(updated.errorMessage).toBe("File too large");
    expect(updated.log).toHaveLength(1);
    expect(updated.log[0]).toMatch(/Error: File too large/);
  });
});

describe("clearError", () => {
  it("clears an existing error message", () => {
    const state: CompilerState = {
      status: "error",
      log: ["something"],
      previewHtml: "",
      errorMessage: "File too large",
    };
    const updated = clearError(state);
    expect(updated.errorMessage).toBe("");
  });

  it("is a no-op when there is no error", () => {
    const state = createInitialState();
    const updated = clearError(state);
    expect(updated.errorMessage).toBe("");
  });
});

describe("sanitiseFilename", () => {
  it("lowercases and replaces non-alphanumeric chars with hyphens", () => {
    expect(sanitiseFilename("Green Eggs and Ham")).toBe("green-eggs-and-ham");
  });

  it("handles special characters", () => {
    expect(sanitiseFilename("A Christmas Carol!")).toBe("a-christmas-carol-");
  });

  it("trims whitespace", () => {
    expect(sanitiseFilename("  hello world  ")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(sanitiseFilename("")).toBe("");
  });

  it("preserves numbers", () => {
    expect(sanitiseFilename("Chapter 1: The Beginning")).toBe("chapter-1--the-beginning");
  });
});

const request: CompileRequest = {
  text: "",
  title: "Green Eggs and Ham",
  author: "",
  ngramSize: 2,
  workflow: "booklet",
  outputType: "pdf",
  ledger: { colours: 8, prefill: "prefixes", document: "sheets" },
};

describe("templateFor", () => {
  it("routes the booklet and cutouts workflows to their templates", () => {
    expect(templateFor(request)).toEqual({
      path: "/book.typ",
      inputs: { json_path: "/model.json" },
    });
    expect(templateFor({ ...request, workflow: "cutouts" }).path).toBe("/cutouts.typ");
  });

  it("routes each ledger document to its own template", () => {
    const ledger = { ...request, workflow: "ledger" as const };
    const pathFor = (document: LedgerDocument) =>
      templateFor({ ...ledger, ledger: { ...ledger.ledger, document } }).path;
    expect(pathFor("sheets")).toBe("/ledger.typ");
    expect(pathFor("counters")).toBe("/ledger-counters.typ");
    expect(pathFor("text")).toBe("/ledger-text.typ");
  });

  it("passes the prefill to the sheets only, since it is all that prints rows", () => {
    const ledger = { ...request, workflow: "ledger" as const };
    expect(
      templateFor({ ...ledger, ledger: { ...ledger.ledger, prefill: "tallies" } }).inputs,
    ).toEqual({ json_path: "/model.json", prefill: "tallies" });
    expect(
      templateFor({ ...ledger, ledger: { ...ledger.ledger, document: "counters" } }).inputs,
    ).toEqual({ json_path: "/model.json" });
  });
});

describe("outputFilename", () => {
  it("names a booklet or cutouts after the workflow", () => {
    expect(outputFilename(request)).toBe("green-eggs-and-ham-booklet-2gram.pdf");
    expect(outputFilename({ ...request, workflow: "cutouts", ngramSize: 3 })).toBe(
      "green-eggs-and-ham-cutouts-3gram.pdf",
    );
  });

  it("names each of a ledger set's documents", () => {
    const ledger = { ...request, workflow: "ledger" as const };
    expect(outputFilename(ledger)).toBe("green-eggs-and-ham-ledger-sheets-2gram.pdf");
    expect(outputFilename({ ...ledger, ledger: { ...ledger.ledger, document: "counters" } })).toBe(
      "green-eggs-and-ham-ledger-counters-2gram.pdf",
    );
  });
});

describe("LEDGER_COLOUR_CHOICES", () => {
  it("offers whole rows of strips out of the default palette", () => {
    expect(LEDGER_COLOUR_CHOICES).toEqual([4, 8, 12]);
  });
});
