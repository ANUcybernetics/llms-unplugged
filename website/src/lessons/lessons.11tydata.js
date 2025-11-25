export default {
  layout: "base.njk",
  tags: ["lesson"],
  eleventyComputed: {
    permalink: (data) => {
      const topics = data.topics;
      const lessonOrder = data.order;
      const topic = topics.find((t) => t.lessons.includes(lessonOrder));
      if (topic) {
        return `/topics/${topic.id}/${data.page.fileSlug}/`;
      }
      return `/lessons/${data.page.fileSlug}/`;
    },
  },
};
