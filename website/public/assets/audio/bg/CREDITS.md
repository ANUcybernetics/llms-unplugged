# Background music credits

Tracks used as deck background music (toggled with Shift+M via the `<BgMusic />`
component). All tracks sourced from [Pixabay](https://pixabay.com/music/) under
the [Pixabay Content License](https://pixabay.com/service/license-summary/) ---
free for commercial and non-commercial use, attribution optional but provided
here as a courtesy.

## Tracks

<!--
Entry template:

- **`filename.opus`** --- *Track Title* by [Contributor](https://pixabay.com/users/contributor-xxxx/)
  ([source](https://pixabay.com/music/track-id/))
-->

- **`lofi-sentimental-jazzy-love.opus`** --- _Lo-Fi Music Loop - Sentimental
  Jazzy Love_ by Arthur Wild
  ([source](https://pixabay.com/music/lofi-lo-fi-music-loop-sentimental-jazzy-love-473154/))
- **`hype-drill.opus`** --- _Hype Drill Music_ by kontraa (Pixabay track
  438398, uploaded 2025-11-17 --- contributor profile and exact page URL not
  verified)
- **`alex-morgan-background.opus`** --- _Background Music_ by alex-morgan
  (Pixabay track 528319, uploaded 2026-05-02 --- contributor profile and
  exact page URL not verified)

## Encoding

Source files are compressed to 32 kbps mono Opus:

```sh
ffmpeg -i input.mp3 -ac 1 -b:a 32k -c:a libopus output.opus
```
