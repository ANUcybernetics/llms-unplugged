import type { SidebarSection } from "astro-theme-university/types";
import { moduleNavGroups } from "./modules";

export async function getModuleSidebar(): Promise<SidebarSection[]> {
  const groups = await moduleNavGroups();
  return groups
    .filter((group) => group.modules.length > 0)
    .map((group) => ({
      title: group.title,
      items: group.modules.map((module) => ({
        label: module.data.title,
        href: `/modules/${module.id}/`,
      })),
    }));
}
