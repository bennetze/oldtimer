# Company film source

The original `Timeline 1.mp4` was moved here as `about-us-master.mp4`.
Full-quality masters are ignored by Git; keep this local file for future encodes.
The website imports only the browser exports in the parent directory.

The master contains 1920×1080 H.264 at 25 fps, stereo AAC audio, a German
subtitle track incorrectly tagged as English, and a camera timecode stream.
The browser MP4 preserves the original AAC audio and subtitle wording/timing, corrects
that subtitle language tag to German, and removes the timecode stream.
The WebM uses VP9 and Opus; both browser formats use the external German WebVTT
track with the original cue text and timing. The poster is the first decoded frame.

Recreate the assets from the repository root. Extract the WebVTT track first,
then use it as the subtitle input for the MP4 to preserve exact cue timing:

```sh
ffmpeg -y -i src/assets/oldtimer/video-sources/about-us-master.mp4 \
  -map 0:s:0 -c:s webvtt src/assets/oldtimer/about-us.de.vtt
ffmpeg -y -i src/assets/oldtimer/video-sources/about-us-master.mp4 \
  -i src/assets/oldtimer/about-us.de.vtt \
  -map 0:v:0 -map 0:a -map 1:s:0 -map_metadata -1 -metadata:s:s:0 language=deu \
  -c:v libx264 -preset slow -crf 23 -maxrate 2800k -bufsize 5600k \
  -pix_fmt yuv420p -profile:v high -level 4.0 -c:a copy -c:s mov_text \
  -movflags +faststart -write_tmcd 0 src/assets/oldtimer/about-us.mp4
ffmpeg -y -i src/assets/oldtimer/video-sources/about-us-master.mp4 \
  -map 0:v:0 -map 0:a -map_metadata -1 -c:v libvpx-vp9 -crf 35 \
  -b:v 2200k -maxrate 2200k -bufsize 4400k -deadline realtime \
  -cpu-used 6 -row-mt 1 -pix_fmt yuv420p -c:a libopus -b:a 160k \
  src/assets/oldtimer/about-us.webm
ffmpeg -y -i src/assets/oldtimer/video-sources/about-us-master.mp4 \
  -map 0:v:0 -frames:v 1 -q:v 2 src/assets/oldtimer/about-us-poster.jpg
```

This is a user-supplied film for the development preview. The existing production
media-rights release gate also applies to this film, its soundtrack, and people shown.
