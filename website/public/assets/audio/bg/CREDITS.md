# Background music credits

Tracks used as deck background music (toggled with M via the `<BgMusic />`
component).

## Pixabay

Used under the
[Pixabay Content License](https://pixabay.com/service/license-summary/) --- free
for commercial and non-commercial use, attribution optional but provided here as
a courtesy.

- **`lofi-sentimental-jazzy-love.opus`** --- _Lo-Fi Music Loop - Sentimental
  Jazzy Love_ by Arthur Wild
  ([source](https://pixabay.com/music/lofi-lo-fi-music-loop-sentimental-jazzy-love-473154/))
- **`hype-drill.opus`** --- _Hype Drill Music_ by kontraa
  ([source](https://pixabay.com/music/trap-hype-drill-music-438398/))
- **`alex-morgan-background.opus`** --- _Background Music_ by alex-morgan
  ([source](https://pixabay.com/music/arabic-background-music-528319/))

## Uppbeat

Music from [Uppbeat](https://uppbeat.io), licensed to Ben Swift for online use.

- **`everyday-every-night.opus`** --- _Everyday, Every Night_ by 2050
- **`kyo-ashita.opus`** --- _kyō, ashita_ by Fourth Dogma
- **`may-as-well-be.opus`** --- _May As Well Be_ by Antarctic Wastelands &
  Norvik (all:ambient)
- **`omg-funk.opus`** --- _OMG Funk_ by Doug Organ
- **`wandered-waltz.opus`** --- _Wandered Waltz_ by Ben McElroy

## Encoding

Every track is downmixed to mono, gain-matched to -18 LUFS integrated loudness
so the shuffled playlist holds a steady volume, and encoded as 32 kbps Opus.
Measure the source's mono loudness, then apply the difference as a static gain:

```sh
ffmpeg -i input.mp3 -af aformat=channel_layouts=mono,ebur128 -f null - 2>&1 | grep ' I:'
# gain = -18 - measured I
ffmpeg -i input.mp3 -map_metadata -1 \
  -af "aformat=channel_layouts=mono,volume=<gain>dB" \
  -c:a libopus -b:a 32k output.opus
```
