import { describe, it, expect } from "vitest";
import { tally } from "../src/lib/tally";

describe("tally", () => {
  it("returns empty string for 0", () => {
    expect(tally(0)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(tally(null as unknown as number)).toBe("");
  });

  it("returns single marks for 1-4", () => {
    expect(tally(1)).toBe("|");
    expect(tally(2)).toBe("||");
    expect(tally(3)).toBe("|||");
    expect(tally(4)).toBe("||||");
  });

  it("returns group character for 5", () => {
    expect(tally(5)).toBe("卌");
  });

  it("returns group plus marks for 6-9", () => {
    expect(tally(6)).toBe("卌 |");
    expect(tally(7)).toBe("卌 ||");
    expect(tally(8)).toBe("卌 |||");
    expect(tally(9)).toBe("卌 ||||");
  });

  it("returns multiple groups for 10+", () => {
    expect(tally(10)).toBe("卌 卌");
    expect(tally(11)).toBe("卌 卌 |");
    expect(tally(15)).toBe("卌 卌 卌");
  });
});
