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
- **`hype-drill.opus`** --- _Hype Drill Music_ by kontraa
  ([source](https://pixabay.com/music/trap-hype-drill-music-438398/))
- **`alex-morgan-background.opus`** --- _Background Music_ by alex-morgan
  ([source](https://pixabay.com/music/arabic-background-music-528319/))

## Encoding

Source files are compressed to 32 kbps mono Opus:

```sh
ffmpeg -i input.mp3 -ac 1 -b:a 32k -c:a libopus output.opus
```
