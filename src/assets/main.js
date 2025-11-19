import { init } from "@plausible-analytics/tracker";

init({
  domain: "www.llmsunplugged.org",
});

// Add a class to enable any progressive enhancement styles
document.documentElement.classList.add("js-enabled");

// Improve skip-link behavior by moving focus to the main content target
const skipLink = document.querySelector(".skip-link");
if (skipLink) {
  skipLink.addEventListener("click", (event) => {
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
