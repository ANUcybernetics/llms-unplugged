export default {
  layout: "base.njk",
  tags: ["module"],
  eleventyComputed: {
    permalink: (data) => `/modules/${data.page.fileSlug}/`,
  },
};
