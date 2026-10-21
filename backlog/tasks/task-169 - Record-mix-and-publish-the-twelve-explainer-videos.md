---
id: TASK-169
title: 'Record, mix and publish the twelve explainer videos'
status: To Do
assignee: []
created_date: '2026-10-15 05:50'
updated_date: '2026-10-21 02:27'
labels:
  - video
dependencies:
  - TASK-167
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Take the twelve-video series (ops/video/<slug>, scripts in ops/video/scripts/, see ops/video/README.md) from scratch TTS to published videos: a final review pass, Ben and Ushini record the voice-over from the reading copy, the best takes are cut in and the animations re-timed to them, Uppbeat music is mixed under the voice, and after notes rounds the 4K50 masters go to YouTube (@llmsunplugged) and are embedded on the site.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A review pass over every script and composition has applied the craft fixes, and Ben has approved or rejected each proposed line or [beat] change
- [ ] #2 The reading copy (ops/video/voice.py reading) is regenerated from the final scripts and in Ben's and Ushini's hands before recording
- [ ] #3 Ben's and Ushini's takes are in the bucket, never in git
- [ ] #4 Each video's voice track is cut from the best takes by transcript (word-timed, the last reading of a line wins), with timing.json and captions re-derived from it and every cue landing on its word
- [ ] #5 Ben's chosen Uppbeat tracks are mixed under the voice, ducked, with subtle voice processing (highpass, compression, de-essing, light room, limiter) at one loudness across all twelve
- [ ] #6 Ben and Ushini have signed off 1080p drafts of all twelve after notes rounds
- [ ] #7 4K50 masters (plus the Overview's portrait variant) are rendered from the signed-off cuts and uploaded to the bucket
- [ ] #8 All twelve are on YouTube at @llmsunplugged with the VTT captions, descriptions and the Uppbeat credits
- [ ] #9 Each video is embedded on its module or lesson page, and the Overview on the landing page
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Consider updating how the videos show ledgers and their animations to match the Oct 2026 ledger deck rework (commits 62ee756d..716a8934), which Ben thinks is an improvement: lowercase sheets except I, a tokenise step (text as written → lowercase tokens with the full stops split off) before training, the sheet built pair by pair with rows added as they're met, one row per frame for one-word rows, and a separate fill step before every cup draw. Book text is shown as plain text distinct from the paper ledger, and the cup label changes instantly while the counters fly.
<!-- SECTION:NOTES:END -->
