# ffmpeg recipes

Everything below assumes one frame grid: `FPS` frames per second starting at the
first frame of the finished video, every part a whole number of frames. Compute
the frame counts once (from the timeline's boundaries) and cut with `-frames:v`,
never with `-t` on the video side --- durations round, frames don't.

## Fetch a recording

```bash
uvx yt-dlp -f "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b" \
  --write-info-json -o "out/video/<slug>/talk.%(ext)s" "https://www.youtube.com/watch?v=<id>"
```

Check the height you actually got
(`ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 talk.mp4`);
a long event recording is often only 720p, and the upscale below is then part of
the plan.

## Audio for transcription

```bash
ffmpeg -y -loglevel error -i talk.mp4 -vn -ac 1 -ar 16000 talk16k.wav
uv run .claude/skills/llmsu-video/scripts/transcribe.py talk16k.wav transcript.json
```

## The section the renderer seeks through

Chrome seeks a `<video>` by decoding from the previous keyframe, so re-encode
just the span the overlay needs with a keyframe every second. Remember the
offset: the page seeks to `t - FROM`.

```bash
ffmpeg -y -loglevel error -ss $FROM -to $TO -i talk.mp4 \
  -an -c:v libx264 -preset fast -crf 16 -g 25 -pix_fmt yuv420p middle.mp4
```

## Frame counts on the grid

With `T0` the first frame's time in the source and `S0`/`S1` the rendered
section's bounds:

```
NA = round((S0 - T0) * FPS)          # part A: source, before the section
NB = round((S1 - T0) * FPS) - NA     # part B: rendered
NC = round((T1 - T0) * FPS) - NA - NB
C0 = T0 + (NA + NB) / FPS            # where part C starts in the source
```

`render-frames.mjs` snaps `--from`/`--to` to the same grid (given the same
`--origin`), so `NB` equals the frames it renders. Check anyway:

```bash
ffprobe -v error -count_frames -select_streams v \
  -show_entries stream=nb_read_frames -of csv=p=0 partB.mp4
```

## Cut the untouched parts (upscaled, faded)

```bash
ENC=(-c:v libx264 -preset fast -crf 14 -pix_fmt yuv420p -g 25 -r $FPS)
ffmpeg -y -loglevel error -ss $T0 -i talk.mp4 -an -frames:v $NA \
  -vf "scale=1920:1080:flags=lanczos,fps=$FPS,fade=t=in:st=0:d=0.5" "${ENC[@]}" partA.mp4
ffmpeg -y -loglevel error -ss $C0 -i talk.mp4 -an -frames:v $NC \
  -vf "scale=1920:1080:flags=lanczos,fps=$FPS,fade=t=out:st=$(bc -l <<<"$NC/$FPS-1"):d=1" "${ENC[@]}" partC.mp4
```

`-ss` before `-i` seeks fast and accurately enough here because the output is
re-encoded; put it after `-i` only when stream-copying.

## A title card over the opening

Render the card to `title.png`
(`render-frames.mjs still assets/title-card.html title.png ...`), then lay it
over part A, holding for `HOLD` seconds and fading out over `FADE`:

```bash
ffmpeg -y -loglevel error -ss $T0 -i talk.mp4 -loop 1 -i title.png -an -frames:v $NA -filter_complex \
  "[0:v]scale=1920:1080:flags=lanczos,fps=$FPS[v];\
   [1:v]format=rgba,fade=t=out:st=$HOLD:d=$FADE:alpha=1[t];\
   [v][t]overlay=shortest=1:enable='lte(t,$(bc -l <<<"$HOLD+$FADE+0.1"))',fade=t=in:st=0:d=0.5" \
  "${ENC[@]}" partA.mp4
```

`shortest=1` and the `enable` window matter: without them the looped PNG keeps
the overlay filter alive past the fade and the part never ends.

## Concatenate the rendered chunks

```bash
ffmpeg -y -loglevel error -f concat -safe 0 -i chunks/chunks.txt -c copy partB.mp4
```

The chunks were encoded with identical settings by the same script, so a stream
copy is safe; re-encoding here would be a second generation for nothing.

## One audio track, then mux

Cut the audio once, from the source, for the whole span. Sync then depends only
on the frame counts adding up.

```bash
TOTAL=$(bc -l <<<"($NA+$NB+$NC)/$FPS")
ffmpeg -y -loglevel error -ss $T0 -i talk.mp4 -t $TOTAL -vn \
  -af "afade=t=in:st=0:d=0.5,afade=t=out:st=$(bc -l <<<"$TOTAL-1"):d=1" -c:a aac -b:a 192k audio.m4a
printf "file '%s'\n" partA.mp4 partB.mp4 partC.mp4 > parts.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i parts.txt -i audio.m4a \
  -c:v copy -c:a copy -movflags +faststart -shortest final.mp4
```

For a video with a recorded voiceover rather than a talk recording, the audio is
the voiceover file and `T0` is 0; the frame arithmetic is unchanged.

## Stills from a deck

A slide as a still, when a video needs one:
`pnpm exec astromotion-pdf <slug> --slides=<out.pdf>` in `website/`, then
`pdftoppm -r 150 -png -f N -l N`. The overlay can also draw the slide's content
itself from the same theme, which is usually cleaner than compositing a
screenshot.
