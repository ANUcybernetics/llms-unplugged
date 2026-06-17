import { type CollectionEntry, getCollection } from "astro:content";
import { type Topic, topicOrder } from "./topics";

export type Lesson = CollectionEntry<"lessons">;

/**
 * Single source of truth for how lessons are grouped and ordered across the
 * site. Both the /lessons index cards and the lesson sidebar derive from this,
 * so a lesson's placement is defined once --- by its `topic` and `order`
 * frontmatter --- rather than in hand-maintained lists.
 *
 * Lessons with `listed: false` (e.g. weighted-randomness) are reachable only
 * via direct links from other lessons and are omitted from every listing
 * surface.
 */
async function listedLessons(): Promise<Lesson[]> {
  const all = await getCollection("lessons");
  return all.filter((l) => l.data.listed !== false).toSorted((a, b) => a.data.order - b.data.order);
}

/** Listed lessons for a single topic, in display order. */
export async function lessonsInTopic(topic: Topic): Promise<Lesson[]> {
  return (await listedLessons()).filter((l) => l.data.topic === topic);
}

export interface LessonGroup {
  title: string;
  lessons: Lesson[];
}

/**
 * The two top-level nav groups: Fundamentals (the `fundamentals` topic) and
 * Extensions (every other topic, in `topicOrder`, ordered within each topic by
 * `order`).
 */
export async function lessonNavGroups(): Promise<LessonGroup[]> {
  const listed = await listedLessons();
  const inTopic = (t: Topic) => listed.filter((l) => l.data.topic === t);
  const extensionTopics = topicOrder.filter((t) => t !== "fundamentals");
  return [
    { title: "Fundamentals", lessons: inTopic("fundamentals") },
    { title: "Extensions", lessons: extensionTopics.flatMap(inTopic) },
  ];
}
