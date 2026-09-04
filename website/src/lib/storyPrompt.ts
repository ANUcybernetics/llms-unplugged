// The "ask one to write us a story" prompt shared by the how-AI-writes-stories
// decks (see partials/yr5-6-what-is-ai.mdx): the CopyButton renders an input
// per field, the presenter fills in the teacher's name, the year level and the
// class's three words, and copies the finished prompt into a chatbot. Nothing
// about a particular room is baked in. An array joined with newlines, so the
// copied text has clean line breaks and no source indentation.

export const STORY_PROMPT = [
  "Write a funny, exciting two-paragraph story featuring [TEACHER NAME] as the hero. The story must naturally incorporate the following three words or ideas: [WORD 1], [WORD 2], and [WORD 3].",
  "The story should be concise and engaging for [YEAR LEVEL] students in Australia. Include:",
  "A surprising problem, mystery, or adventure.",
  "[TEACHER NAME] taking bold action to solve the problem.",
  "Humour that would make [YEAR LEVEL] students laugh.",
  "A memorable twist, showdown, or unexpected ending.",
  "Creative use of the three required words or ideas (avoid simply mentioning them).",
  "Use energetic language and imaginative situations similar to an action-comedy adventure. Keep the story school-appropriate, positive, and easy to read aloud in class.",
].join("\n");

export const STORY_FIELDS = [
  { token: "[TEACHER NAME]", label: "Teacher", size: 18 },
  { token: "[YEAR LEVEL]", label: "Year level", size: 10 },
  { token: "[WORD 1]", label: "Word 1", size: 18 },
  { token: "[WORD 2]", label: "Word 2", size: 18 },
  { token: "[WORD 3]", label: "Word 3", size: 18 },
];
