# Browser-audit finding closure

Reviewed 6 October 2026. Tested the **root-base localhost production preview** at
`http://127.0.0.1:4341`, not the hosted GitHub Pages site. Development safeguards remain
active. No deployment or replacement of legal texts was performed.

| Finding | Status | Result and evidence |
| --- | --- | --- |
| F1: orphaned letter in mobile offers heading | Fixed | Category-specific German sizing below 680px preserves the wording and other headings. Chrome/WebKit checked one-line headings at 320×568 and 390×844 in both languages/motion preferences; native Safari confirmed the German heading at both widths. [320px capture](release/evidence/offers-320.png), [native Safari 390px](release/evidence/safari-offers-390.png). |
| F2: generic numbered gallery alternatives | Fixed | All 157 records inventoried; 153 contain galleries. All 3,066 occurrences / 3,021 distinct image hashes inspected and given authored DE/EN visible-subject descriptions. Captions, vehicle copy, filenames, routes and image order preserved; only gallery alternatives and reviewed record dates changed. Build audit now fails the known generic pattern, with DE/EN rejection fixtures. Both builds report zero generic alternatives; existing locale contract feeds thumbnails, enlargement links and lightbox images. |
| F3: production approval gate | Externally blocked | Engineering approval package prepared. Per-file rights evidence, individual releases, approved legal texts/company claims, final hosting facts and named approvals have not been supplied. [Checklist](PRODUCTION-RELEASE-CHECKLIST.md), [register](MEDIA-RIGHTS-REGISTER.md), [published inventory](release/published-media-inventory.csv). No item is marked approved merely because its file exists. |
| F4: subpage menu background competes with navigation | Fixed for readability; blur root cause not established | Reproduced settled background interference in automated WebKit before editing; native Safari's pre-change blur worked. Shared/home menu panels now use `rgba(16,16,16,.96)` and both blur declarations. Settled screenshots show readable navigation; headless WebKit retains faint low-contrast page silhouettes because its blur still renders differently. Prefixes are compatibility hardening, not a proven cause/fix for that compositing difference. [Before](release/evidence/webkit-menu-before.png), [after](release/evidence/webkit-menu-after.png), [viewport/language overview](release/evidence/webkit-settled-overview.png), [settled native Safari](release/evidence/safari-menu-after.png). |

## Verification

- `npm test`: 82 passing tests plus vehicle discovery fixture.
- `npm run build` and `npm run build:pages`: pass. Both validate 344 pages, 157 vehicles,
  314 authored language detail pages, CSP hashes, IDs, links, image dimensions, dates,
  complete Open Graph metadata and JSON-LD. Accessibility output: 8,818 images,
  6,132 gallery links, zero generic alternatives, heading jumps or invariant failures.
- Tracked-source SHA-256 comparison before/after builds: no build rewrites. The final
  local artifact is the root production build. Apache output retains
  `ErrorDocument 404 /404.html`; actual final-host Apache behavior remains pending.
- `npm run vehicles:sync` explicitly run and reviewed: 338 sitemap URLs, no sitemap
  diff because the existing shared reviewed date already set the effective date to
  6 October. Archive/vehicle template dates and changed vehicle records reviewed for
  that date. German `llms.txt` updated. `robots.txt` reviewed: existing page access,
  protected photographic formats and production sitemap reference remain correct.
- Broad automated run: all 344 generated routes requested, 240 page/viewport/language
  cases across 15 representative routes in installed Chrome and WebKit; zero page
  errors, unexpected resource HTTP failures or CSP violations. Search/Back, empty
  searches/clear, category and lightbox focus, motion/fallback/manual reduced-motion
  playback passed. Four initial recovery assertions incorrectly expected “404” in
  the semantic heading; the page intentionally says “Diese Spur führt ins Leere.”
  Correct status, noindex and home-link recovery are verified in the focused run.
- Focused rerun: **416/416 pass** at 1440×900, 390×844, 320×568 and 844×390, both DE/EN,
  normal/reduced motion. Checks include single-line narrow headings, settled menu
  background, last-control visibility, focus containment/restoration, thumbnail/link/
  lightbox description propagation, footer legal navigation and missing-route 404
  recovery. [Machine-readable results](release/evidence/automated-checks.json).
  All 64 settled heading/menu screenshots inspected; complete local working evidence
  and initial reports remain in `.codex-qa/browser-fixes-2026-10-06/`.
- One initial WebKit landscape focus-visibility assertion failed immediately after
  keyboard input. Six isolated repetitions showed the control scrolled into view;
  the full focused rerun waits for that geometry to settle and passes. No interaction
  change was needed or inferred from this isolated result.
- Reusable optional Playwright checks: `scripts/test-browser-fixes.mjs`, configured
  with `PLAYWRIGHT_MODULE`, `SITE_URL`, `SCREENSHOT_DIR`, and optionally
  `CHROME_CHANNEL=chrome`. Playwright is supplied by the QA runtime, not added as a
  website dependency. The static numbered-alternative regression is in
  `tests/accessibility-audit.test.mjs`.

## Native and external coverage limits

Native Safari 27.0 was available before the Mac locked. The privacy-page menu was
checked before/after on the desktop window: background content left the accessibility
tree, Shift-Tab wrapped to the pointer checkbox, Escape returned to the opener.
Responsive Design Mode checked German offers at 390×844 and 320×568, the settled
320px menu, and English archive rendering at 320px. These are desktop viewport checks,
not hardware-phone tests.

**Unverified:** fresh native Chrome and Firefox UI checks, and the remainder of the
native Safari viewport/language/interaction matrix. The Mac locked during the retest;
automatic unlock failed twice, and an unlock request was sent. Their earlier native
pre-change audit is not presented as post-fix verification. Installed Chrome automation
and WebKit automation add coverage but do not replace those missing native checks.
No physical phones or assistive-technology sessions were available for this run.

**Externally blocked:** final-host TLS/headers/logs/provider acceptance, production
legal/factual/media approval and any retirement of the previous hosted application.
The exact evidence, responsible approver roles and pending status are in the release
checklist. Technical completion does not clear that gate.
