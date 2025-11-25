export default {
  layout: "base.njk",
  tags: ["lesson"],
  eleventyComputed: {
    permalink: (data) => {
      if (data.topic) {
        return `/topics/${data.topic}/${data.page.fileSlug}/`;
      }
      return `/lessons/${data.page.fileSlug}/`;
    },
  },
};
