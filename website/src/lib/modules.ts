import { type CollectionEntry, getCollection } from "astro:content";
import { type Topic, topicOrder } from "./topics";

export type Module = CollectionEntry<"modules">;

/**
 * Single source of truth for how modules are grouped and ordered across the
 * site. Both the /modules index cards and the module sidebar derive from this,
 * so a module's placement is defined once --- by its `topic` and `order`
 * frontmatter --- rather than in hand-maintained lists.
 *
 * Modules with `listed: false` (e.g. weighted-randomness) are reachable only
 * via direct links from other modules and are omitted from every listing
 * surface.
 */
async function listedModules(): Promise<Module[]> {
  const all = await getCollection("modules");
  return all.filter((m) => m.data.listed !== false).toSorted((a, b) => a.data.order - b.data.order);
}

/** Listed modules for a single topic, in display order. */
export async function modulesInTopic(topic: Topic): Promise<Module[]> {
  return (await listedModules()).filter((m) => m.data.topic === topic);
}

export interface ModuleGroup {
  title: string;
  modules: Module[];
}

/**
 * The two top-level nav groups: Fundamentals (the `fundamentals` topic) and
 * Extensions (every other topic, in `topicOrder`, ordered within each topic by
 * `order`).
 */
export async function moduleNavGroups(): Promise<ModuleGroup[]> {
  const listed = await listedModules();
  const inTopic = (t: Topic) => listed.filter((m) => m.data.topic === t);
  const extensionTopics = topicOrder.filter((t) => t !== "fundamentals");
  return [
    { title: "Fundamentals", modules: inTopic("fundamentals") },
    { title: "Extensions", modules: extensionTopics.flatMap(inTopic) },
  ];
}
