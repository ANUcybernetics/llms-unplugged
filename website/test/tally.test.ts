import { describe, it, expect } from "vitest";
import { tally } from "../src/lib/tally";

describe("tally", () => {
  it("returns empty string for 0", () => {
    expect(tally(0)).toBe("");
  });

  it("returns single marks for 1-4", () => {
    expect(tally(1)).toBe("|");
    expect(tally(2)).toBe("||");
    expect(tally(3)).toBe("|||");
    expect(tally(4)).toBe("||||");
  });

  it("returns grouped marks for 5", () => {
    expect(tally(5)).toBe("卌");
  });

  it("returns groups plus remainder", () => {
    expect(tally(6)).toBe("卌 |");
    expect(tally(7)).toBe("卌 ||");
    expect(tally(10)).toBe("卌 卌");
    expect(tally(11)).toBe("卌 卌 |");
  });
});
