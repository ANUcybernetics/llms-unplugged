import { init, track } from "@plausible-analytics/tracker";

init({
  domain: "www.llmsunplugged.org",
});

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href$=".pdf"]');
  if (link) {
    track("File Download", { props: { url: link.getAttribute("href") } });
  }
});

// Add a class to enable any progressive enhancement styles
document.documentElement.classList.add("js-enabled");

// Mobile menu toggle
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.getElementById("mobile-menu");

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", !isExpanded);
    menuToggle.setAttribute(
      "aria-label",
      isExpanded ? "Open menu" : "Close menu",
    );
    mobileMenu.classList.toggle("hidden");

    const openIcon = menuToggle.querySelector(".menu-icon-open");
    const closeIcon = menuToggle.querySelector(".menu-icon-close");
    openIcon?.classList.toggle("hidden");
    closeIcon?.classList.toggle("hidden");
  });

  // Close menu on Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !mobileMenu.classList.contains("hidden")) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
      mobileMenu.classList.add("hidden");
      menuToggle.querySelector(".menu-icon-open")?.classList.remove("hidden");
      menuToggle.querySelector(".menu-icon-close")?.classList.add("hidden");
      menuToggle.focus();
    }
  });
}

// Improve skip-link behavior by moving focus to the main content target
const skipLink = document.querySelector(".skip-link");
if (skipLink) {
  skipLink.addEventListener("click", () => {
    const targetId = skipLink.getAttribute("href")?.slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    target.setAttribute("tabindex", "-1");
    target.focus();

    // Clean up the temporary tabindex to avoid interfering with normal tab order
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), {
      once: true,
    });
  });
}
