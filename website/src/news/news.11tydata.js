export default {
  layout: "post.njk",
  author: "Ben Swift",
  tags: ["news"],
  eleventyComputed: {
    permalink: (data) => `/news/${data.page.fileSlug}/`,
  },
};
