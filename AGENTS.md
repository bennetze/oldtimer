# Repository Guidelines

## Project Structure & Module Organization

This is a small Astro site for the German classic car restoration company
“Die Oldtimermanufaktur”. Source lives in `src/`:

- `src/pages/` contains route entry points: the German homepage in `index.astro`,
  the company profile in `ueber-uns.astro`, legal pages in `impressum.astro` and
  `datenschutz.astro`, and the custom not-found page in `404.astro`.
- `src/layouts/` contains shared page shells such as `Layout.astro`.
- `src/components/` contains reusable Astro components such as `SiteChrome.astro`
  and `LegalArticle.astro`.
- `src/assets/` contains source-controlled assets imported by pages and components.
- `src/assets/oldtimer/` contains generated homepage and subpage imagery. Keep
  project-referenced generated assets in this folder or another source-controlled
  asset folder, not only under `$CODEX_HOME/generated_images/`.
- `public/` contains static files served from the site root, including favicons.
  Its `.htaccess` maps IONOS/Apache 404 responses to the generated `/404.html`.

## Working Language

Use English for collaboration with the user, including questions, progress updates,
implementation explanations, reviews, technical documentation, commit messages, and
pull request text. Do not infer the conversation language from the German website or
its content. Switch the working language only when the user explicitly asks.

Keep public-facing website copy in German unless the user explicitly requests a
different language for a specific deliverable. German content requirements apply to
the website output, not to the surrounding conversation or technical explanation.

Root configuration includes `astro.config.mjs`, `tsconfig.json`, `package.json`, and
`package-lock.json`. The default production build is served from the root of
`https://www.oldtimermanufaktur.de/`. The GitHub Pages build uses `/oldtimer/` only
when `DEPLOY_TARGET=github-pages`; use `import.meta.env.BASE_URL` or the existing
`sitePath` helper for internal URLs instead of hardcoding either deployment base.

`public/sitemap.xml` is the production sitemap and must stay synchronized with the
public website. Whenever anything about the site changes, edit the sitemap in the
same change. Add or remove canonical URLs when routes change, and update `<lastmod>`
for every affected indexable page when its content, structured data, links, or other
significant page output changes. For a site-wide change, update all affected entries.
Never add redirects, duplicate/non-canonical URLs, or the noindex 404 page.

`public/robots.txt` is the production crawler policy served at `/robots.txt` and
must stay synchronized with the public website. Whenever the website changes,
review and update it in the same change so crawler permissions, protected asset
patterns, and the production sitemap reference remain accurate. Adjust directives
when routes, public asset types, indexing policy, or the sitemap location changes.
Keep the production hostname in its `Sitemap` directive, preserve access to normal
indexable pages unless requirements explicitly change, and do not use robots.txt as
a substitute for page-level `noindex` metadata.

`public/llms.txt` is the production LLM-facing site summary served at `/llms.txt`.
Whenever the website changes, update this file in the same change so its concise
German summary, factual context, canonical page links, and link descriptions match
the published site. Add newly published pages when they are useful to agents, revise
descriptions when page content changes, and remove retired routes. Follow the
llms.txt Markdown structure and never list placeholder, non-existent, redirected,
duplicate, or noindex pages.

Whenever anything new is implemented on the public site, add or update the relevant
Open Graph metadata directly in the same code change. This includes every new public
page and every implementation that changes a page's title, description, canonical
URL, content, or representative imagery. Use the shared `Layout.astro` props so the
rendered `<head>` includes `og:title`, `og:type`, `og:image`, `og:url`,
`og:description`, `og:locale`, `og:site_name`, and the applicable structured image
properties, including meaningful `og:image:alt` text. Open Graph URLs must be
absolute and respect the configured production or GitHub Pages base. Do not defer
Open Graph metadata to a later change, and keep the shared defaults intact so every
route, including error pages, emits a complete baseline set of tags.

Whenever the website changes in a way that meaningfully affects structured data, add
or update the relevant JSON-LD in the same code change. This includes changes to the
business identity, legal or contact details, address, services, people, page purpose,
canonical URLs, representative imagery, or other facts modeled in Schema.org. Use the
shared `Layout.astro` JSON-LD graph and props for site-wide entities and page types,
and connect page-specific nodes with stable absolute `@id` values. Keep the JSON-LD
truthful, consistent with visible page content, canonical URLs, Open Graph metadata,
and the active production or GitHub Pages base. Do not invent opening hours, ratings,
prices, social profiles, locations, services, or other facts that are not confirmed.
Keep noindex error pages out of the JSON-LD graph, and validate affected generated
pages after every structured-data change.

## Legal and Compliance Change Reminder

Keep German and EU legal, privacy, cookie, consumer-protection, accessibility, and
licensing implications in mind for every change, but handle this review in proportion
to the actual risk. Routine copy edits, spelling fixes, layout changes, refactors, and
changes to content that do not introduce a new factual or commercial claim normally
need no legal commentary. Perform the check silently and do not interrupt the task
with generic warnings, disclaimers, or a full compliance audit.

Raise a concise legal or compliance note only when the requested change creates or
materially alters a plausible obligation or risk. Typical triggers include collecting
or transmitting personal data; cookies or other device storage; analytics; third-party
scripts, embeds, maps, or externally hosted resources; contact, newsletter, account,
sales, booking, payment, or download flows; prices or substantive commercial claims;
publication of personal data or new media whose rights are unconfirmed; or a change to
the company's identity, contact details, services, legal pages, or consent behavior.
Do not treat every photograph, AI-assisted asset, social link, accessibility tweak, or
ordinary text change as a mandatory legal checkpoint by itself.

When a material trigger exists, explain only the concrete consequence in plain language,
identify the facts or decisions that genuinely need confirmation, and distinguish
between a blocking issue and a non-blocking follow-up. Check whether the imprint,
privacy notice, consumer information, consent flow, accessibility information, rights
documentation, or internal processing records may need an update, but mention only
the items affected by the change. Do not assume that an existing legal basis, consent,
licence, release, or disclosure covers a new use. Do not draft or replace production
legal texts unless the user explicitly includes that work in scope. Recommend review
by a qualified German lawyer or data-protection professional only when the uncertainty
or potential impact warrants it, not as boilerplate.

The current project is an explicitly labelled development preview. While
`src/config/site.ts` reports AI placeholder images, keep the visible disclosure and
the GitHub Pages `noindex` behavior active. Before any production release, confirm
that every placeholder has been replaced by the approved real photography, update
all image alternatives and representative metadata, complete the media-rights
register, verify every factual/company claim, add the approved legal texts, turn off
the preview flags, and repeat the legal, metadata, crawler, accessibility, cookie,
security, and browser checks. Never disable that release gate merely to make a build
look production-ready.

`src/pages/ueber-uns.astro` is an approved production page. For additional commercial
subpages, prefer German, lowercase, URL-oriented routes that match the homepage
navigation, such as `src/pages/projekte.astro`, `src/pages/oldtimer-kaufen.astro`,
`src/pages/restaurierung.astro`, and `src/pages/kontakt.astro`. Their scope and copy
are not defined yet, so do not create them or invent production content without
explicit requirements. There is no planned wedding-car service page.

Before creating several subpages, extract repeated homepage structure from
`src/pages/index.astro` into shared components instead of duplicating it.
`SiteChrome.astro` already owns the fixed blurred site header, full-screen menu
overlay, and footer; reuse it on new pages. Likely further extractions include the
media hero/panel and editorial content sections. Keep page-specific copy and data in
the route file or a small local data module, and keep shared interaction code with the
component that owns the markup.

Every page built from an ordered set of primary sections must use
`src/components/SectionNavigation.astro` with stable section IDs and labels. This
shared component provides the custom desktop section rail, while `SiteChrome.astro`
maps the Up and Down arrow keys to the same ordered targets. Keep the component and
keyboard behavior together on future section-based pages rather than recreating
either feature in page-specific code.

## Build, Test, and Development Commands

Run commands from the repository root.

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the Astro dev server, usually at `http://localhost:4321`.
- `npm run build` creates a production build in `dist/` and is the main verification command.
- `npm run build:pages` creates the GitHub Pages build with the `/oldtimer/` base path.
- `npm run deploy` builds and publishes `dist/` to the `gh-pages` branch.
- `npm run preview` serves the production build locally for final checks.
- `npm run astro -- --help` shows available Astro CLI commands.

Use Node `>=22.12.0`, as declared in `package.json`.

## Coding Style & Naming Conventions

Follow the existing Astro style. Use `.astro` files for pages, layouts, and components. Name components and layouts with `PascalCase` filenames, for example `Welcome.astro`. Keep route files in `src/pages/` lowercase and URL-oriented, for example `about.astro`.

Current files use tabs for indentation in Astro markup and CSS. Keep imports at the top of the frontmatter block. Prefer relative imports for local modules and scoped CSS in the same `.astro` file unless styles need sharing.

All public-facing website copy should be in German unless the user explicitly requests
otherwise for a specific deliverable. This does not set the language used to collaborate
with the user. The current visual direction is
restrained luxury editorial with a very dark grey background (`#111111`), `#eeeeee` as the
main color, and neutral grey lines/interactions. Avoid accent-heavy treatments and avoid
gold, brown, beige, tan, sepia, and retro nostalgia palettes unless explicitly requested.
Use free commercial fonts only. The current homepage uses `Jost` for all typography,
including display, body, and UI text.

The current design uses immersive, image-led sections, sparse uppercase typography,
generous spacing, thin borders, and quiet grayscale image treatment. Subpages should
feel like part of the same editorial system, not like separate marketing templates.
Prefer:

- Dark full-width sections over floating cards or boxed page sections.
- Large photographic first-viewport signals with restrained overlays for top-level
  service pages.
- Short German headings with uppercase letter spacing, balanced line lengths, and
  concise supporting copy.
- Neutral borders and hover states using translucent `#eeeeee`, not colored accents.
- Imported local images from `src/assets/oldtimer/` with meaningful `alt` text when
  informative and empty `alt` text only for decorative imagery.

Avoid:

- Beige, gold, brown, sepia, cream, or nostalgic retro palettes.
- Decorative gradients, bokeh/orb backgrounds, heavy shadows, rounded card-heavy SaaS
  layouts, or generic stock-photo compositions.
- Mixing fonts or introducing external assets that are not free for commercial use.
- English public-facing labels, placeholder links, or placeholder legal/contact copy
  on production-intended pages.

## Video Asset Encoding

Use this workflow for fullscreen background videos and other autoplaying site videos.
Keep generated video assets in `src/assets/oldtimer/` unless there is a strong reason
to serve them from `public/`.

Prefer the repo helper for future videos:
`npm run encode-video -- path/to/input-video.mov output-base-name`. It generates the
MP4, WebM, animated AVIF, and animated WebP fallback described below.

For Safari-safe autoplay sources, create an MP4 with exactly one video stream:
H.264/AVC, 8-bit `yuv420p`, no audio stream, no subtitle stream, no data/timecode
stream, and web-optimized fast-start metadata. Do not use HEVC/H.265, ProRes,
10-bit color, audio tracks, or camera timecode/data tracks for autoplay backgrounds.

For a landscape fullscreen hero, encode the primary MP4 from a master file like this:

```sh
ffmpeg -y -i input-master.mov \
  -map 0:v:0 -an -dn -sn \
  -vf "fps=25,scale=1920:-2:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 20 -profile:v high -level 4.0 \
  -movflags +faststart \
  src/assets/oldtimer/example-site.mp4
```

Adjust only the final filename for new videos. If the source already has the exact
desired frame rate and size, keep the same output requirements but adjust or remove
the `fps`/`scale` filters deliberately. Raise `-crf` to `22` or `23` for smaller files,
or lower it to `18` for higher quality. Avoid very long hero loops; 6-12 seconds is a
good target for fullscreen background motion.

Create an optional AV1 WebM source when size/performance justify it:

```sh
ffmpeg -y -i input-master.mov \
  -map 0:v:0 -an -dn -sn \
  -vf "fps=25,scale=1920:-2:flags=lanczos,format=yuv420p" \
  -c:v libsvtav1 -preset 8 -crf 32 -pix_fmt yuv420p \
  src/assets/oldtimer/example-site.webm
```

For Safari or browser-policy autoplay failures, use an animated AVIF fallback rather
than animated WebP for fullscreen hero motion. Animated WebP is visibly worse on this
site. Generate the fallback from the final MP4:

```sh
ffmpeg -y -i src/assets/oldtimer/example-site.mp4 \
  -an -dn -sn \
  -vf "fps=25,scale=1920:-2:flags=lanczos,format=yuv420p" \
  -c:v libsvtav1 -preset 7 -crf 21 -pix_fmt yuv420p -f avif \
  src/assets/oldtimer/example-site-motion.avif
```

If the animated AVIF is too large, first try `-crf 23` or `-crf 24`. If it is still too
large, scale to `1280:-2` for non-critical fallbacks. Keep an animated WebP only as a
last-resort `<img>` fallback for browsers that cannot display animated AVIF.

Before using any encoded MP4, validate it with `ffprobe`:

```sh
ffprobe -hide_banner -v error -show_streams -show_format src/assets/oldtimer/example-site.mp4
ffprobe -hide_banner -v error -select_streams a -show_entries stream=index -of csv=p=0 src/assets/oldtimer/example-site.mp4
ffprobe -hide_banner -v error -select_streams d -show_entries stream=index -of csv=p=0 src/assets/oldtimer/example-site.mp4
```

The first command must show one H.264 video stream with `pix_fmt=yuv420p`. The audio
and data-stream checks must print nothing. Stop and re-export/re-encode if an MP4 has
audio, data/timecode, HEVC, 10-bit pixel format, or multiple streams.

When wiring a background video into Astro, follow the homepage pattern: MP4 source
first, WebM second if present, `autoplay`, `muted`, `loop`, `playsinline`,
`webkit-playsinline`, and `preload="auto"` on the `<video>`. Keep decorative
background video `aria-hidden="true"`. Autoplaying, looping hero motion is a core
site requirement for visitors who have not requested reduced motion.

Use a lightweight still poster as the initially visible layer. Hide the video with
`visibility: hidden` until `play()` resolves or the `playing` event fires, then fade
the video in. Load or inject the animated AVIF/WebP fallback only after autoplay
fails, the video errors, or playback stalls; do not eagerly download it alongside a
successfully playing MP4. This prevents Safari's native play overlay from appearing
when Safari blocks autoplay and avoids downloading two motion assets on the normal
path. Preserve the homepage's accessible play/pause control and its
`prefers-reduced-motion` behavior when changing the hero.

For subpage layout, keep the fixed blurred header and menu overlay consistent across
the site. Navigation links should point to real routes once those pages exist instead
of homepage `#explore` anchors. Preserve keyboard access, Escape-to-close behavior,
focus-visible styles, and the custom cursor being enabled only for fine pointers.
Use `100svh` handling for mobile full-height panels where appropriate.

Keep normal text selection and the browser context menu available for text, links,
and controls. Limit the existing deterrence to media: prevent selection/dragging of
images, pictures, videos, and inline SVG where practical, and suppress the context
menu only when it originates on an image, picture, or video. Do not describe these
client-side measures as copy protection or DRM; every asset delivered to a browser
remains technically retrievable.

## Accessibility

Accessibility is a project requirement. Preserve the shared skip link and give every
page's primary `<main>` the `main-content` ID and `tabindex="-1"`. All controls and
links must remain operable by keyboard with visible `:focus-visible` styles. Do not
remove semantic headings, meaningful labels, informative image alternatives, or the
hero motion control in the interest of visual minimalism.

When a modal-style surface such as the full-screen menu or homepage footer is open,
make the background inert, move focus into the surface, trap focus where appropriate,
support Escape to close, and return focus to the control that opened it. Hidden menu
and footer content must not remain in the accessibility tree or tab order. Keep
`aria-expanded`, `aria-hidden`, and section `aria-current` state synchronized with the
visible UI.

Respect `prefers-reduced-motion`: the hero may start paused for those users while
remaining manually playable, and non-essential smooth scrolling or transitions
should be reduced. Content protection is non-negotiable, but it must not disable
keyboard navigation, focus indication, or assistive-technology semantics.

## Testing Guidelines

No dedicated test framework is configured yet. Run `npm run build` before submitting changes. For visual or behavior changes, also run `npm run dev` and verify the affected page in a browser.

For homepage UI changes, verify desktop and mobile widths. Check that the fixed blurred
header, menu overlay, scroll buttons, custom desktop cursor, generated images, and footer
links render without overlap. The custom cursor should stay disabled on touch/mobile
viewports. Confirm normal-motion visitors receive a playing, muted, looping hero; the
play/pause control works; the animated fallback is not fetched on the successful path;
and reduced-motion visitors can start playback manually.

For subpage work, verify both the new route and the homepage after changes to shared
navigation, layout, or footer components. Check at minimum a desktop viewport around
1440px wide and a mobile viewport around 390px wide. Confirm that page titles,
descriptions, nav active/current states if added, image crops, header blur, menu
overlay, footer links, and focus states remain coherent without text overlap.

For routing or deployment changes, test the generated `404.html`, its home link and
`noindex` metadata, and confirm `dist/.htaccess` retains
`ErrorDocument 404 /404.html`. For interaction changes, check the menu and footer with
keyboard navigation in Safari and Firefox in addition to a Chromium-based browser;
verify that focus is contained while open and restored after closing.

If tests are added later, place them near the code they cover or in a clearly named test directory, and add an `npm test` script.

## Commit & Pull Request Guidelines

The current history uses short commit messages such as `Astro Setup` and `first commit`. Keep commits brief and focused, using an imperative summary when possible, for example `Add homepage layout`.

Pull requests should include a short description, the commands run for verification, and screenshots for visible UI changes. Link related issues when applicable. Avoid mixing unrelated refactors with feature or content changes.

## Agent-Specific Instructions

Keep changes scoped to the requested task. Do not edit generated dependency folders such as `node_modules/` or build output such as `dist/`. Prefer updating existing Astro components and layouts before introducing new structure.

Default to English when communicating with the user. Treat German as the website's
content language, not the working language, unless the user explicitly asks to switch.
Keep explanations direct and natural; do not turn routine implementation updates into
formal legal assessments.

Do not copy code, imagery, logos, or protected trade dress from reference sites. It is fine
to use reference sites for structure, interaction notes, and factual content when requested,
but final visuals and assets should be original and project-local.
