import { describe, it, expect } from "vitest";
import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";

function createMarkdownRenderer() {
  const md = new MarkdownIt();
  md.use(footnote);
  return md;
}

describe("markdown footnotes", () => {
  const md = createMarkdownRenderer();

  it("renders inline footnote references as superscript links", () => {
    const input = "Some text[^1]\n\n[^1]: Footnote content";
    const output = md.render(input);

    expect(output).toContain("footnote-ref");
    expect(output).toContain('href="#fn1"');
    expect(output).not.toContain("[^1]");
  });

  it("renders footnote definitions in a footer section", () => {
    const input = "Some text[^note]\n\n[^note]: This is the footnote.";
    const output = md.render(input);

    expect(output).toContain("footnotes");
    expect(output).toContain("This is the footnote.");
  });

  it("renders multiple footnotes with unique IDs", () => {
    const input = "First[^a] and second[^b]\n\n[^a]: Note A\n\n[^b]: Note B";
    const output = md.render(input);

    expect(output).toContain('href="#fn1"');
    expect(output).toContain('href="#fn2"');
    expect(output).toContain("Note A");
    expect(output).toContain("Note B");
  });
});
