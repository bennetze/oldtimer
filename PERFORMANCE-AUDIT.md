# Performance audit and reproduction

## Scope and safeguards

The implementation preserves the existing static Astro pages, URLs, bilingual
vehicle records, media, motion controls, preview flags and production release gate.
There is no visitor telemetry or external runtime service. Asset encoding and the
browser harness are development tools. Do not deploy implicitly.

## Repeatable browser measurements

1. Run `npm run build` or `npm run build:pages`.
2. Run `npm run audit:performance` (append `-- --pages` for the Pages build).
3. Open `http://127.0.0.1:4329/__performance` in the browser being tested.
4. Set its viewport to 1440 × 900, then repeat at 390 × 844. Record pixel density.
5. Start the suite and leave that tab foreground and untouched. Run browsers
   serially; the localhost server deliberately has one active cache policy.
6. Results and medians are saved under `.codex-qa/performance/results.json`.
   Use a separate `PERFORMANCE_OUTPUT` for each browser/build/baseline.

The suite covers every page family, archive categories, later pagination, the
largest reference vehicle detail, legal/error pages and representative English
routes. Each route has three measured cold and three measured warm visits under
normal and forced reduced motion. Warm groups include an excluded priming visit.
Append `?route=%2F` to audit only the homepage. A complete viewport suite takes
about 23 minutes. To retain a baseline, copy the built directory outside the repo
and set `PERFORMANCE_ROOT` to that copy. No tracked build files are instrumented.

Recorded metrics: LCP, CLS (maximum session window), resource transfer bytes,
request count, long-task time, first video-playing time, selected media, viewport,
user agent and active DOM size. Unsupported metrics remain null. A six-second
observation window excludes resource requests still in flight; it is not a
measurement of total movie bytes or a full-page scroll. Warm video ranges can
still transfer bytes. The server supports byte ranges but does not model Apache,
HTTP/2, TLS or production compression. Reports are local lab observations, not
field Core Web Vitals or hosting verification.

For throttled comparisons use the same Chromium DevTools network/CPU settings
for both revisions, with browser-level cache disabling **off** (the harness
controls cold/warm policy). Run Safari and Firefox independently as compatibility
checks. Inspect network requests for source selection, conditional fallback
loading, media ranges and cache reuse. Capture performance traces while scrolling
Handwerk/company pages, searching archives and opening/closing menus. Compare
layout duration, frame work, long tasks and interaction response; do not infer INP
from a quiet page-load measurement.

## Asset generation

- `npm run encode-video -- input.mov output-name` generates the shared MP4,
  WebM, animated AVIF and WebP. It preserves 25 fps and uses Safari-safe H.264,
  yuv420p, fast-start, no audio/data/subtitle streams. Keep originals.
- On FFmpeg builds without libwebp, install the official `img2webp` utility;
  the helper extracts temporary frames and keeps frame timing.
- Desktop and mobile use the same original video and animated fallback files.
  Mobile derivatives and viewport/density selection were removed at the user's
  request. Pages omits the existing animated WebP fallbacks as before.
- Install `fonttools[woff]==4.66.0` in a disposable Python virtual environment and
  run `python scripts/subset-fonts.py`. It regenerates WOFF2 subsets and fonts.css,
  checks complete original character coverage, variable axes, horizontal metrics
  and disjoint Unicode ranges. Original TTF/WOFF2 masters and OFL notices remain.
- Astro generates responsive WebP posters (640/960/1280/1920 px, quality 80) and
  the 1280 px texture (quality 80). The JPEG poster fallback remains available.

## Delivery and maintenance

The same motion sources are attached on desktop and mobile only before eligible
playback; resizing never restarts playback. The responsive
still's selected resource supplies the video poster. Offscreen and reduced-motion
sections do not fetch video. Playback rejection/errors retain immediate fallback;
a stalled movie gets eight seconds without playback or buffering progress before
fallback. Pause, preference changes and recovery cancel pending work.

Only the current archive page's cards start in the active DOM. Off-page cards use
an inert template, authored by the same component; a first search materializes
them once and restores category ordering. Query history stays local to its browser
history entry. No network search or persistent query storage is added.

Production gallery delivery URLs include the derivative's SHA-256 and receive
immutable Apache caching. Stable original URLs remain available and revalidated.
They share physical bytes through local hard links; deployed files are ordinary
assets. Pages retains stable URLs and its existing image count/size constraints
because its host ignores Apache configuration. The gallery manifest's existing
validated content hashes determine the delivery URLs without another cache format
or a second image encoder. Source changes, corruption repair and pruning retain
the original integrity checks. Confirm actual hosting headers separately.

No font preload is added without browser evidence that it improves LCP. Normal
font payload is about 161 KB instead of 237 KB; less-common characters load the
additional subsets as needed, rather than becoming unsupported.

## Acceptance checks

### Historical implementation measurements (2026-09-30)

These measurements predate the requested removal of mobile video variants.
Homepage normal-motion transfer reductions below no longer describe the current
shared-video implementation; remeasure before quoting current savings. Deferred
loading, responsive posters and other optimizations remain in place.

Chromium 154, local GitHub Pages output, unthrottled network/CPU, three measured
runs per homepage cache/motion scenario at 390 × 844 and 1440 × 900, plus the
archive's normal-motion cache scenarios and reduced-motion cold cache. These are six-second
completed-resource transfer medians, not production speed estimates:

| Cold-cache scenario | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Homepage, 390 px, normal motion | 13,760,461 B | 5,559,719 B | 60% |
| Homepage, 390 px, reduced motion | 13,760,461 B | 276,964 B | 98% |
| Homepage, 1440 px, normal motion | 13,760,461 B | 11,672,158 B | 15% |
| Homepage, 1440 px, reduced motion | 13,760,461 B | 339,398 B | 98% |
| Past-project archive, 390 px, normal motion | 1,288,658 B | 889,857 B | 31% |

The archive starts with 24 active cards instead of 134, and 297 active elements
instead of 956. Template markup remains in the HTML to preserve local category-wide
search. Successful homepage playback fetched no animated fallback; reduced motion
fetched no video. The short local runs do not establish a repeatable LCP or video
startup improvement. Archive CLS was unchanged; homepage CLS stayed near zero.

All 75 Node regressions and vehicle discovery passed. Both builds validate 344
pages and leave tracked and untracked source files unchanged. Pages contains
1,420 files / 144.6 MiB. Crawler validation covers 338 sitemap URLs; explicit
sitemap synchronization required no changes. The shared reviewed date already
matches this review. Robots policy was reviewed and remains appropriate.

Mobile archive search found off-page Opel cards and restored results after a
detail visit and Back; selected German language persisted in materialized links.
Safari and Firefox checks covered autoplay/pause and menu keyboard focus,
Escape and focus return. Desktop/mobile frame comparisons and mobile archive
screenshots retained the existing crops, texture and typography. The shared desktop MP4s have one H.264/yuv420p stream; their encoding is unchanged.

The full route/browser/throttling matrix, high-density visual acceptance,
zoom/text-spacing review, form-restoration-disabled browser run, interaction
performance traces, and actual Apache cache/compression/range responses remain
unverified. The harness and instructions support these follow-up measurements;
the runtime batching changes are not claimed as a measured interaction gain.

Run `npm test`, `npm run vehicles:sync`, `npm run crawlers:check`, `npm run build`
and `npm run build:pages`. Review the sync diff and confirm neither build changes
tracked files. Keep Pages below 1800 files/150 MiB. Check CSP on built output.

Compare desktop/mobile/high-density visuals, typography and motion timing. Test
keyboard menu focus/return, zoom/text spacing, system-pointer preference, section
links, reduced motion/manual playback, delayed/error playback, fallback recovery,
archive search/clear/Back with form restoration disabled, direct gallery links and
lightbox Escape. Without JavaScript, pagination and links remain usable. Reject
noticeable visual differences or repeatable loading/interaction regressions.

Production-host header/range checks and a complete throttled cross-browser trace
matrix must be recorded separately; localhost results do not establish them.
