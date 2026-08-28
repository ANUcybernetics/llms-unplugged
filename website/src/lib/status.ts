/**
 * Display labels for the road-tested status badges on modules and lessons.
 * The enums themselves live in src/content.config.ts.
 */
export const moduleStatusLabels = {
  tested: "workshop-tested",
  piloted: "piloted",
  experimental: "experimental",
} as const;

export const lessonStatusLabels = {
  tested: "workshop-tested",
  "early-access": "early access",
} as const;

export type ModuleStatus = keyof typeof moduleStatusLabels;
export type LessonStatus = keyof typeof lessonStatusLabels;
