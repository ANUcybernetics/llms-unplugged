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
    topicTitle: (data) => {
      const topics = data.topics || [];
      const match = topics.find((topic) => topic.id === data.topic);
      if (!match) {
        throw new Error(
          `Missing or unknown topic for lesson "${data.page.fileSlug}". Add a valid topic ID in frontmatter.`,
        );
      }
      return match.title;
    },
  },
};
