import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm.js";
import Highlight from "reveal.js/plugin/highlight/highlight.esm.js";
import Notes from "reveal.js/plugin/notes/notes.esm.js";

Reveal.initialize({
  hash: true,
  slideNumber: true,
  transition: "fade",
  transitionSpeed: "fast",
  width: "100%",
  height: "100%",
  margin: 0.04,
  markdown: {
    separator: /^---$/m,
    separatorVertical: /^--$/m,
    separatorNotes: /^Note:/m,
    smartypants: true,
  },
  plugins: [Markdown, Highlight, Notes],
});
