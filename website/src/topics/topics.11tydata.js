export default {
  layout: "base.njk",
  templateEngineOverride: "njk,md",
  tags: ["topic"],
  eleventyComputed: {
    permalink: (data) => `/topics/${data.page.fileSlug}/`,
  },
};
