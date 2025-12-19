import { defineConfig } from "vitepress";
import { RssPlugin, type RSSOptions } from "vitepress-plugin-rss";
import checker from "vite-plugin-checker";

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
  // Include news posts in the feed
  filter: (post) => post.url.startsWith("/news/") && post.url !== "/news/",
};

export default defineConfig({
  title: "LLMs Unplugged",
  description:
    "Ready-to-use teaching resources for understanding how large language models work through hands-on activities. No computers required.",

  // Use clean URLs (no .html extension)
  cleanUrls: true,

  // Ignore RSS feed link (generated after dead link check)
  ignoreDeadLinks: ["/feed.rss"],

  // Add lazy loading to images and enable typographer for smart dashes
  markdown: {
    typographer: true,
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
    plugins: [
      RssPlugin(RSS_OPTIONS),
      checker({
        vueTsc: true,
        eslint: {
          useFlatConfig: true,
          lintCommand: 'eslint ".vitepress/**/*.{ts,vue}"',
        },
      }),
    ],
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
    // Plausible Analytics
    [
      "script",
      {
        defer: "",
        "data-domain": "www.llmsunplugged.org",
        src: "https://plausible.io/js/script.file-downloads.js",
      },
    ],
  ],

  // Theme configuration
  themeConfig: {
    logo: "/favicon.svg",

    nav: [
      { text: "Lessons", link: "/lessons/" },
      { text: "News", link: "/news/" },
      { text: "FAQ", link: "/faq" },
      { text: "About", link: "/about" },
    ],

    sidebar: {
      "/lessons/": [
        {
          text: "Fundamentals",
          items: [
            { text: "Training", link: "/lessons/training" },
            { text: "Generation", link: "/lessons/generation" },
          ],
        },
        {
          text: "Extensions",
          items: [
            {
              text: "Pre-trained Generation",
              link: "/lessons/pretrained-generation",
            },
            { text: "Trigram", link: "/lessons/trigram" },
            { text: "Sampling", link: "/lessons/sampling" },
            { text: "Context Columns", link: "/lessons/context-columns" },
            { text: "Word Embeddings", link: "/lessons/word-embeddings" },
            { text: "LoRA", link: "/lessons/lora" },
            { text: "Synthetic Data", link: "/lessons/synthetic-data" },
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
        '© <a href="https://benswift.me">Ben Swift</a> · A <a href="https://cybernetics.anu.edu.au/cybernetic-studio/">Cybernetic Studio</a> project at the <a href="https://cybernetics.anu.edu.au">ANU School of Cybernetics</a>',
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
