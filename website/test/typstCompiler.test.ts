import { describe, it, expect } from "vitest";
import {
  createInitialState,
  appendLog,
  sanitiseFilename,
  type CompilerState,
} from "../src/lib/typstCompiler";

describe("createInitialState", () => {
  it("returns idle status with empty log and no preview", () => {
    const state = createInitialState();
    expect(state.status).toBe("idle");
    expect(state.log).toEqual([]);
    expect(state.previewHtml).toBe("");
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

  it("does not mutate the original state", () => {
    const state = createInitialState();
    const updated = appendLog(state, "test");
    expect(state.log).toHaveLength(0);
    expect(updated.log).toHaveLength(1);
  });

  it("preserves other state fields", () => {
    const state: CompilerState = {
      status: "ready",
      log: ["existing"],
      previewHtml: "<svg></svg>",
    };
    const updated = appendLog(state, "new");
    expect(updated.status).toBe("ready");
    expect(updated.previewHtml).toBe("<svg></svg>");
    expect(updated.log).toHaveLength(2);
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
    expect(sanitiseFilename("Chapter 1: The Beginning")).toBe(
      "chapter-1--the-beginning",
    );
  });
});
