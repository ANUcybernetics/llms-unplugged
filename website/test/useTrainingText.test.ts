import { describe, it, expect, beforeEach } from "vitest";
import {
  useTrainingText,
  resetTrainingText,
} from "../.vitepress/theme/composables/useTrainingText";

const DEFAULT_TEXT = "the cat sat on the mat .";

describe("useTrainingText", () => {
  beforeEach(() => {
    resetTrainingText();
  });

  it("returns default text after reset", () => {
    const text = useTrainingText();
    expect(text.value).toBe(DEFAULT_TEXT);
  });

  it("shares state between multiple calls", () => {
    const text1 = useTrainingText();
    const text2 = useTrainingText();
    text1.value = "shared value";
    expect(text2.value).toBe("shared value");
  });

  it("reset restores default text", () => {
    const text = useTrainingText();
    text.value = "changed";
    resetTrainingText();
    expect(text.value).toBe(DEFAULT_TEXT);
  });
});
