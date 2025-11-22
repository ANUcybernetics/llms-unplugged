export const data = {
  pagination: {
    data: "collections.llmsDocs",
    size: 1,
    alias: "doc",
  },
  eleventyExcludeFromCollections: true,
  permalink: (data) => data.doc.relativePath,
};

export function render({ doc }) {
  return doc.content;
}
