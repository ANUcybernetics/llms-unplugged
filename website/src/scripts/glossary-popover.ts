// Positioning fallback for glossary popovers (src/components/GlossaryTerm.astro)
// in browsers without CSS Anchor Positioning: place the popover under whichever
// button invoked it. A term used twice on a page shares one popover, so the
// invoker is tracked rather than assumed. Lives here rather than in the
// component so the component renders as a single inline node.
if (!CSS.supports("position-area", "bottom span-right")) {
  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".glossary-term");
    if (!btn) return;
    const popover = document.getElementById(btn.getAttribute("popovertarget") ?? "");
    if (!popover) return;
    requestAnimationFrame(() => {
      if (!popover.matches(":popover-open")) return;
      const rect = btn.getBoundingClientRect();
      popover.style.top = `${rect.bottom + 6}px`;
      popover.style.left = `${Math.max(8, rect.left)}px`;
    });
  });
}
