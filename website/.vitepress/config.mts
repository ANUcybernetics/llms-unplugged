import { defineConfig } from "vitepress";
import { RssPlugin, type RSSOptions } from "vitepress-plugin-rss";

const RSS_OPTIONS: RSSOptions = {
  title: "LLMs Unplugged",
  baseUrl: "https://www.llmsunplugged.org",
  copyright: "© Ben Swift, CC BY-NC-SA 4.0",
  description:
    "Ready-to-use teaching resources for understanding how large language models work through hands-on activities.",
  language: "en-AU",
  author: {
    name: "Ben Swift",
    email: "ben.swift@anu.edu.au",
    link: "https://benswift.me",
  },
  // Include lesson pages in the feed
  filter: (post) => post.filepath.startsWith("lessons/"),
};

export default defineConfig({
  title: "LLMs Unplugged",
  description:
    "Ready-to-use teaching resources for understanding how large language models work through hands-on activities. No computers required.",

  // Use clean URLs (no .html extension)
  cleanUrls: true,

  // Add lazy loading to images
  markdown: {
    image: {
      lazyLoading: true,
    },
  },

  // Exclude non-content files and build artifacts
  srcExclude: [
    "**/README.md",
    "**/AGENTS.md",
    "**/CLAUDE.md",
    "**/LICENSE",
    "_site/**",
  ],

  // Vite plugins
  vite: {
    plugins: [RssPlugin(RSS_OPTIONS)],
  },

  // Site metadata
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    ["meta", { name: "theme-color", content: "#be830e" }],
    // RSS feed
    [
      "link",
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: "LLMs Unplugged RSS Feed",
        href: "/feed.rss",
      },
    ],
    // Google Fonts: Public Sans
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,300..900;1,300..900&display=swap",
      },
    ],
    // Open Graph
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "LLMs Unplugged" }],
    [
      "meta",
      {
        property: "og:image",
        content: "https://www.llmsunplugged.org/og-image.jpg",
      },
    ],
    // Twitter
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    [
      "meta",
      {
        name: "twitter:image",
        content: "https://www.llmsunplugged.org/og-image.jpg",
      },
    ],
  ],

  // Theme configuration
  themeConfig: {
    logo: "/favicon.svg",

    nav: [
      { text: "Home", link: "/" },
      { text: "Lessons", link: "/lessons/" },
      { text: "Topics", link: "/topics/" },
      { text: "Educators", link: "/educators" },
      { text: "FAQ", link: "/faq" },
      { text: "About", link: "/about" },
    ],

    sidebar: {
      "/lessons/": [
        {
          text: "Fundamentals",
          items: [
            { text: "Basic Training", link: "/lessons/basic-training" },
            {
              text: "Weighted Randomness",
              link: "/lessons/weighted-randomness",
            },
            { text: "Basic Generation", link: "/lessons/basic-generation" },
          ],
        },
        {
          text: "Scaling Up",
          items: [
            { text: "Trigram Model", link: "/lessons/trigram-model" },
            { text: "Context Columns", link: "/lessons/context-columns" },
            {
              text: "Pretrained Generation",
              link: "/lessons/pretrained-generation",
            },
          ],
        },
        {
          text: "How Models Understand",
          items: [
            { text: "Word Embeddings", link: "/lessons/word-embeddings" },
          ],
        },
        {
          text: "Adaptation and Data",
          items: [
            { text: "LoRA", link: "/lessons/lora" },
            { text: "Synthetic Data", link: "/lessons/synthetic-data" },
          ],
        },
        {
          text: "Controlling Output",
          items: [{ text: "Sampling", link: "/lessons/sampling" }],
        },
      ],
      "/topics/": [
        {
          text: "Topics",
          items: [
            { text: "Overview", link: "/topics/" },
            { text: "Fundamentals", link: "/topics/fundamentals" },
            { text: "Scaling Up", link: "/topics/scaling-up" },
            {
              text: "How Models Understand",
              link: "/topics/how-models-understand",
            },
            {
              text: "Adaptation and Data",
              link: "/topics/adaptation-and-data",
            },
            { text: "Controlling Output", link: "/topics/controlling-output" },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/ANUcybernetics/llms-unplugged",
      },
    ],

    footer: {
      message: "Released under CC BY-NC-SA 4.0 License.",
      copyright:
        "© Ben Swift · A Cybernetic Studio project at the ANU School of Cybernetics",
    },

    editLink: {
      pattern:
        "https://github.com/ANUcybernetics/llms-unplugged/edit/main/website/:path",
      text: "Edit this page on GitHub",
    },

    search: {
      provider: "local",
    },
  },
});
