// Hidden background-music toggle for decks. Press M to play/pause.
// On page load TRACKS is shuffled into a playlist; the first toggle starts
// playlist[0], and each track advances to the next on `ended`, wrapping
// back to index 0 after the last. Pause/resume preserves position.
//
// Import once per deck via:
//   <script>import "../scripts/bg-music";</script>
//
// To add tracks: drop .opus files into public/assets/audio/bg/ and list
// them in TRACKS below.

const TRACKS: string[] = [
  "/assets/audio/bg/lofi-sentimental-jazzy-love.opus",
  "/assets/audio/bg/hype-drill.opus",
  "/assets/audio/bg/alex-morgan-background.opus",
];

declare global {
  interface Window {
    __bgMusic?: true;
  }
}

if (TRACKS.length > 0 && !window.__bgMusic) {
  window.__bgMusic = true;

  const playlist = [...TRACKS];
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }
  let index = 0;

  const audio = new Audio();
  audio.preload = "none";
  audio.addEventListener("ended", () => {
    index = (index + 1) % playlist.length;
    audio.src = playlist[index];
    audio.play().catch(() => {});
  });

  const toast = document.createElement("div");
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "1rem",
    right: "1rem",
    padding: "0.5rem 0.9rem",
    background: "rgba(0, 0, 0, 0.75)",
    color: "white",
    fontFamily: "system-ui, sans-serif",
    fontSize: "0.9rem",
    borderRadius: "4px",
    opacity: "0",
    transition: "opacity 200ms",
    pointerEvents: "none",
    zIndex: "9999",
  });
  document.body.appendChild(toast);

  let toastTimer: ReturnType<typeof setTimeout>;
  const flash = (msg: string) => {
    toast.textContent = msg;
    toast.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.style.opacity = "0"), 1000);
  };

  document.addEventListener("keydown", (e) => {
    if (e.code !== "KeyM" || e.repeat) return;
    // Plain M only: let Cmd/Ctrl/Alt/Shift+M (e.g. macOS minimise) through,
    // and don't fire while typing in a form field.
    if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement;
    if (
      el instanceof HTMLElement &&
      (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA")
    ) {
      return;
    }
    e.preventDefault();
    if (audio.paused) {
      if (!audio.src) {
        audio.src = playlist[index];
      }
      audio.play().then(
        () => flash("♪ Music on"),
        () => flash("Music failed to play"),
      );
    } else {
      audio.pause();
      flash("Music off");
    }
  });
}

// eslint-disable-next-line unicorn/require-module-specifiers -- marks this side-effect script as a module so the `declare global` above is valid
export {};
