export default {
  layout: "base.njk",
  tags: ["topic"],
  eleventyComputed: {
    permalink: (data) => `/topics/${data.page.fileSlug}/`,
  },
};
