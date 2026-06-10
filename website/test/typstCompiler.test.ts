import { describe, expect, it } from "vitest";
import {
  appendLog,
  clearError,
  type CompilerState,
  createInitialState,
  sanitiseFilename,
  setError,
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
