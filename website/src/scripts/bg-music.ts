// Hidden background-music toggle for decks. Press Shift+M to play/pause.
// Picks a random track on first play; that track then loops until page
// reload. Pause/resume preserves position.
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

  const audio = new Audio();
  audio.loop = true;
  audio.preload = "none";

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
    if (!e.shiftKey || e.code !== "KeyM" || e.repeat) return;
    e.preventDefault();
    if (audio.paused) {
      if (!audio.src) {
        audio.src = TRACKS[Math.floor(Math.random() * TRACKS.length)];
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

export {};
