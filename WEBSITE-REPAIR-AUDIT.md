# Website repair audit — 30 September 2026

The requested security, correctness and performance repairs are implemented. The
existing visual design, header/texture edits, routes, authored vehicle records,
offline editor and preview release safeguards are preserved. Nothing was deployed.
This register records identified findings and evidence, not a guarantee that no
other defect or vulnerability exists.

## Repair register

| Priority | Finding | Resolution |
| --- | --- | --- |
| P1 | Meta CSP followed early scripts and resources. | Localization finalizes script hashes, then places CSP immediately after charset. Generated-page verification enforces ordering and hashes; attribute scripts remain prohibited. |
| P1 | Historical migration overwrote reviewed records without checked approval and omitted mandatory English fields. | Both entry points stop before fetch/write and direct operators to `vehicles:review`. Extraction logic remains behind an unconditional guard in `scripts/historical/`. |
| P2 | Timestamp-based image caching could publish stale or corrupted derivatives. | Source bytes, encoder settings/version and target roles are fingerprinted. Internal manifests record hashes/dimensions; cache and output bytes are checked. Atomic writes preserve complete replacements. |
| P2 | Single-size vehicle images and missing dimensions. | Card variants up to 480px/960px; production details up to 800px. Duplicate natural widths are collapsed; no image is enlarged. Accurate dimensions and responsive descriptors are verified against generated files. Original URLs and lightbox sources remain intact. |
| P2 | Search repeated normalization/animation work and left departing cards focusable. | Titles normalize once; only changed cards animate. Departing cards become inert immediately. Cancellation cannot hide newer results; live reduced motion completes visibility changes. |
| P2 | Search results retained the pagination label. | German/English result labels replace the page label during filtering and restore it when cleared. History state preserves queries without request URLs or tracking storage. |
| P2 | Section keys retained stale indices after native scrolling; zero visibility selected arbitrary sections. | Native scroll/key/pointer input clears stale state; arrows use current geometry including the footer. Controlled scroll completion clears its transient target. Observers ignore zero ratios. |
| P2 | Custom scrolling continued after motion preference changes or menu opening. | Active animation frames stop immediately on reduced motion, menu opening, wheel/touch/pointer interruptions. |
| P2 | Full-size lightbox stage intercepted backdrop dismissal. | Empty-stage and dialog clicks close; image clicks remain open. Escape and focus restoration are preserved. |
| P3 | Repeated metadata reads and category collection retrieval. | Rendering uses an internal image manifest; category collections cache only during builds. Development rereads collections and notices regenerated manifest changes. |
| P3 | Website checks depended on the companion editor checkout. | `test:site` runs website tests and discovery. `npm test` and both editor integration suites remain unchanged and still require their companion checkout. |
| P3 | Outdated technical audit references. | README, this register and technical references in the prior audit refreshed. Legal findings remain carried forward rather than newly certified. |

## Verification evidence

- `npm run test:site`: **39 tests pass**, plus vehicle discovery fixture.
- `npm run build` and `npm run build:pages`: **344 HTML pages**, **172 language
  pairs**, **314 authored vehicle-language pages** verified. Includes CSP order and
  hashes, links, responsive/intrinsic dimensions, metadata and crawler dates.
- `npm run crawlers:check`: **338 canonical sitemap URLs** validated.
- `node scripts/migrate-vehicle-languages.mjs --check`: no unresolved records.
- `npm run security:check`: **zero known advisories**, **252 verified registry
  signatures**, **71 verified attestations**. No dependency changes were needed.
- Repeated production gallery generation: **0 regenerated, 3,205 reused** source
  images; 3,443 derivative files, **48.1 MiB**. Existing output bytes are checked,
  and unchanged files are not recopied.
- 151 images have a 480px candidate: combined files fall from **4,617,660 bytes**
  to **2,941,858 bytes** (about **36%**). This is a file-size comparison, not a claim
  of measured end-to-end page speed; selection depends on viewport and pixel density.
- GitHub Pages artifact: **1,389 files / 110.7 MiB**, within **1,800 / 150 MiB**
  budgets. Baseline was 1,245 files / 107.5 MiB; added responsive variants account
  for the increase. Pages retains its four-gallery-image limit.
- Build source-diff fingerprints matched before/after the Pages build. Sitemap
  synchronization was explicit and reviewed: canonical routes stay unchanged;
  shared last-modified dates advance to 30 September 2026. robots.txt policy is
  unchanged and reviewed; llms.txt retains existing approved wording and additions.

## Browser evidence and limits

The local in-app browser verified desktop (1440px) and mobile (390px) archive
layouts, German/English result labels, no-match/clear behavior, 24-card pagination
restoration, detail navigation and Back restoration, category-dialog Escape/focus,
lightbox image/empty-stage clicks and returned focus. A 390×400 menu remained
scrollable. Checked pages had no captured browser errors and no horizontal overflow.
Homepage hero was playing muted; offscreen videos stayed paused/unloaded and no
animated fallback was inserted. Desktop section navigation and Home/arrow behavior
were checked. Motion preference changes and history restoration without browser
form restoration have deterministic Node regressions.

GitHub Pages preview confirmed the `/oldtimer/` responsive asset paths, loaded
card variants, early CSP and retained `noindex` metadata. Development rendering
also loaded the responsive archive manifest. German and English mobile homepages
kept their header and headings clear, with no horizontal overflow and muted hero
playback.

Screenshots are local QA artifacts in `.codex-qa/repair-desktop.png` and
`.codex-qa/repair-mobile.png`; they are excluded from deployment.
Safari and Firefox were not separately tested. Actual hosting headers, Apache
redirects/compression, external iframe protection and deployed error HTTP statuses
remain unverified. Legal notices, media-rights evidence and company/hosting facts
remain release dependencies described in `LEGAL-COMPLIANCE-AUDIT.md`. The offline
editor was not audited or modified; its missing-checkout baseline does not imply a
website regression.
