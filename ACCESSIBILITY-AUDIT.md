# Accessibility audit and implementation register

Reviewed 2026-09-30. Scope: the development preview, German and English routes, WCAG 2.2 A/AA. No deployment or production release approval. This is an evidence register, not a conformance declaration. The site cannot yet be described as fully accessible or universally compatible.

## Evidence and limits

All 344 generated HTML pages were scanned, including 172 language pairs and 314 vehicle detail pages. The scan found one focusable main and primary heading per page, valid accessibility references, unique IDs, named links/controls, explicit image alternative attributes, direct gallery image links and search status semantics. There were no heading-level jumps or invariant failures. These checks do not determine whether authored alternatives adequately describe a photograph.

Manual browser sampling covered the homepage, Handwerk, company profile, project overview, all three archives, a BMW 507 detail gallery, pagination, legal pages and 404. German routes were checked at 1440, 390 and 320 CSS pixels; English templates at 390. A subsequent sweep of all 344 generated routes at 320px found no document horizontal overflow or clipped headings. A separate WCAG text-spacing sweep of all 344 routes found no document overflow or clipped headings, paragraphs or list items. These geometry checks do not establish all visual/state criteria. Additional checks covered a 390×400 menu, custom text-spacing overrides, a 200% root-font fixture, search/no-match/clear, detail visit and Back restoration, mobile category navigation, modal Escape/focus restoration, reduced-motion controller branches, and direct navigation/image links with enhancement scripts removed.

Actual Chrome 400% page zoom was verified in the browser UI and restored to 100%. The root-font fixture is not a substitute for a native browser text-only enlargement test. Feature-removal fixtures run in a current browser and are not evidence that an actual legacy engine passes. Script-removal fixtures verify script-independent HTML but do not replace testing with the browser JavaScript setting disabled.

Native browser keyboard and accessibility-tree menu checks were performed in Chrome 154.0.8037.93, Firefox 156.0.1 and Safari 27.0 on macOS 27.0. Opening the menu removed background content from the exposed tree, reverse Tab wrapped to the pointer checkbox, and Escape returned focus to Menu. Accessibility-tree inspection is not a screen-reader speech test. VoiceOver was not enabled. At the user’s explicit request, no further VoiceOver or VoiceOver Utility interaction will be performed; direct VoiceOver behavior remains unverified. Chromium in-app browser checks supplied DOM, viewport and interaction evidence.

## Findings and disposition

| ID | Finding / affected components | Evidence and disposition |
| --- | --- | --- |
| A01 | Global Up/Down section navigation interfered with native navigation | Removed as approved. Explicit section links and scroll controls remain. Regression checks that native arrow events are not prevented. |
| A02 | Custom pointer could override a preferred system pointer | Approved menu checkbox added in both languages. Explicit choice persists in `oldtimer.systemPointer`; unchecked removes it. Storage denial preserves the in-memory choice. No cookies, tracking or transmission. Privacy review recorded in LEGAL-COMPLIANCE-AUDIT.md; production legal text unchanged. |
| A03 | Menu depended on native `inert` | Fallback saves/restores original tabindex, aria-hidden and pointer state; focus moves before background isolation. Native and fallback restoration regressions pass. |
| A04 | Gallery enlargement depended on native dialog APIs | Shared modal helper provides fallback isolation, Tab containment, Escape and opener restoration. Original-image anchors remain usable without scripts. Native and simulated fallback checked. |
| A05 | Legacy optional media listeners, animations and observers | Legacy `addListener`, guarded animation methods, promise-less `play()`, geometry-based video visibility and guarded observers added. Current-engine feature-removal tests pass; actual older engines remain unverified. |
| A06 | Essential unsupported CSS and script failure paths | Viewport and font fallbacks, blur-free readable surfaces and older-focus treatment added. Fragment links, footer navigation, pagination and image links remain in HTML. Search/motion controls stay hidden until their controller initializes. Global hidden enforcement prevents author display rules exposing hidden controls/results. |
| A07 | Enlarged text and text spacing clipped the header/homepage | Approved conditional wrapping and measured header scroll margins added. 320px, real 400% Chrome zoom and root-font fixture checked. Native 200% text-only testing remains outstanding. |
| A08 | OS contrast modes needed explicit surfaces | Approved forced-color system colors, contrast-mode surfaces and cursor suppression added. CSS and feature logic inspected. Actual Windows forced colors and macOS contrast preference changes unverified. |
| A09 | Search accessible name overrode its visible label | Removed the override; associated visible label is the name. Polite atomic result status added. Hidden-card animation is guarded; unsupported inert uses immediate hiding. Search and Back restoration checked. |
| A10 | Labelled generic elements / paragraph name | Gallery, section-cue and collage groups now use group semantics; prohibited paragraph label removed while retaining visible qualifications. No authored vehicle record changed. |
| A11 | White homepage headings over bright motion frames | Stronger overlay preview approved, then revised at user's direction: homepage text `#ffffff`, base shade 40% instead of 56%, existing gradients preserved. Large headings (minimum 27.2px) have a conservative 3.10:1 bound over a white image beneath both gradient minima. This bound does not certify translucent navigation/icons or every UI state. |
| A12 | Shared translucent header can fail text contrast | White-frame upper bound for original dark header is about 1.91:1 for full-opacity #eeeeee text; inactive language links worse. Approved preview applied: dark header alpha .85, light header alpha .96. Conservative inactive-language-link bounds are 4.98:1 and 4.56:1 respectively; normal lettering has greater contrast. |
| A13 | Archive placeholder/border and focus treatment | Original placeholder #888 on white ≈3.54:1, below normal-text 4.5:1. Approved preview applied: #555 placeholder (7.46:1 on white), border alpha .55 (4.17:1 on white) and 2px input focus outline. |
| A14 | Numbered gallery alternatives do not describe each photograph | All 6,132 generated gallery alternative occurrences use vehicle title plus numbered-photo wording. These are inadequate for distinguishing documented views/details. User explicitly excluded Projekte, archives and vehicle articles from replacement descriptions. Their German/English alternatives remain unchanged; this known content limitation remains recorded. Separately, all 22 visually reviewed bilingual editorial/representative descriptions outside Projekte were approved and applied; see audits/accessibility/EDITORIAL-IMAGE-DESCRIPTIONS.md. Presence of alt is not marked a content pass. |
| A15 | Language of parts in authored vehicle copy | Trusted rendering now annotates the exact English phrases “The Winner is:”, “The WINNER!” and “Best of Show” in validated German copy with lang=en. Tests preserve authored text/formatting and the strict content boundary; no vehicle record edited. Full language-of-parts content inspection remains unverified. |
| A16 | Translucent section controls/focus over moving photography | Main heading improvement does not resolve every inactive rail dot, arrow or focus outline. Comprehensive frame/state contrast and target-spacing assessment remains unverified; Both separate previews approved and implemented on 2026-09-30. Scroll arrows use full-opacity white with thin dark edges; rail dots use solid white/dark edges (reversed on light pages). Keyboard focus uses a 2px outline at 3px offset and contrasting 6px outer edge on section links and playback controls. Legacy focus receives the same fallback; forced colors retain system Highlight/ButtonText. Sizes and positions unchanged. Built-site checks confirmed 1440px desktop, 390px mobile, light-page and legacy-fixture computed styles, section activation and no document overflow. Comprehensive moving-frame contrast remains unverified. |
| A17 | Media and content completeness | Four background MP4s inspected: single H.264 yuv420p video stream, no audio/data. Motion is decorative and has pause/manual-play controls. All four clips were visually sampled at one frame per second; no informative instruction/audio story identified. Complete decoded-frame FFmpeg photosensitivity screening covered 283/236/241/246 frames, but its heuristic flagged lighting/transitions and is not a WCAG general/red-flash certification. The WCAG flash threshold remains unverified. Approved editorial alternatives applied; excluded project alternatives remain a known limitation. |

## WCAG 2.2 A/AA register

“Pass (scoped)” means the stated templates or interactions passed the described check; it never implies untested content, engines or assistive technologies passed. “Unverified” needs further direct/content testing. “N/A” records absent functionality and must be reassessed when it is introduced. WCAG 2.2 removed 4.1.1 Parsing; unique IDs are still checked as a robustness invariant.

| Criterion | Status | Evidence / remaining work |
| --- | --- | --- |
| 1.1.1 Non-text Content | Fail | A14; 22 approved editorial descriptions applied; excluded vehicle/gallery alternatives remain inadequate for distinguishing photographs. Decorative backgrounds hidden; logos have adjacent brand name. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | Unverified | Decorative sequences visually sampled; full informative-equivalence assessment remains unverified. |
| 1.2.2 Captions (Prerecorded) | N/A | Inspected background files have no audio; no talking-video content introduced. |
| 1.2.3 Audio Description or Media Alternative | N/A | No synchronized audio/video content identified. |
| 1.2.4 Captions (Live) | N/A | No live media. |
| 1.2.5 Audio Description (Prerecorded) | N/A | No synchronized audio/video content identified. |
| 1.3.1 Info and Relationships | Unverified | Landmarks/headings/references scanned, group semantics repaired; full authored markup/table/list review remains. |
| 1.3.2 Meaningful Sequence | Unverified | Template reading order sampled; full authored block/AT order review remains. |
| 1.3.3 Sensory Characteristics | Pass (scoped) | Sampled controls have named destinations; instructions do not rely only on position/color. |
| 1.3.4 Orientation | Pass (scoped) | No orientation lock; desktop/portrait/short-screen templates sampled. |
| 1.3.5 Identify Input Purpose | N/A | Only local vehicle search/preference input; no personal-data form. |
| 1.4.1 Use of Color | Unverified | Navigation/current state has additional text/shape semantics; full state review pending. |
| 1.4.2 Audio Control | N/A | No automatic audio. |
| 1.4.3 Contrast (Minimum) | Unverified | A11–A13 repaired with measured bounds; full text/state assessment remains unverified. |
| 1.4.4 Resize Text | Unverified | Root-font simulation repaired; native 200% text-only enlargement outstanding. |
| 1.4.5 Images of Text | Pass (scoped) | Sampled UI uses text; brand artwork is a logo exception. Full image corpus review outstanding under 1.1.1. |
| 1.4.10 Reflow | Pass (scoped) | All 344 routes geometry-checked at 320px and representative real Chrome 400%; visual reading order/state assessment remains scoped. |
| 1.4.11 Non-text Contrast | Unverified | A13/A16; complete moving-background/control/focus measurements pending. |
| 1.4.12 Text Spacing | Pass (scoped) | All 344 routes at 320px with WCAG override: no document overflow or clipped headings/paragraphs/list items. All interaction states not exhaustively checked. |
| 1.4.13 Content on Hover or Focus | Unverified | Rail labels sampled; full dismissibility, hoverability and persistence review pending. |
| 2.1.1 Keyboard | Pass (scoped) | Menu, galleries, category links, search, pagination and section links tested; native arrow shortcuts removed. |
| 2.1.2 No Keyboard Trap | Pass (scoped) | Menu/gallery Escape and restoration tested; containment only while modal open. |
| 2.1.4 Character Key Shortcuts | Pass (scoped) | No single-character global shortcut found; removed global arrow navigation. |
| 2.2.1 Timing Adjustable | N/A | No session expiration or time-limited action. |
| 2.2.2 Pause, Stop, Hide | Pass (scoped) | Each looping section exposes pause/manual play; reduced-motion/fallback races covered by regressions. |
| 2.3.1 Three Flashes or Below Threshold | Unverified | Complete-frame heuristic screening completed; WCAG flash area/luminance/red-flash threshold certification outstanding. [Screening method](https://ffmpeg.org/ffmpeg-filters.html#photosensitivity), [WCAG threshold](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold). |
| 2.4.1 Bypass Blocks | Pass (scoped) | Shared skip link targets focusable main on all generated pages; native Chrome behavior checked. |
| 2.4.2 Page Titled | Pass (scoped) | All generated pages have titles; bilingual metadata verification passed. |
| 2.4.3 Focus Order | Unverified | Main/menu/gallery/search focus sampled; shared category dialog now traverses every link in both directions, wraps, closes with Escape and restores focus. Full cross-engine/content-order review outstanding. |
| 2.4.4 Link Purpose (In Context) | Unverified | Generated controls named; full authored links and repeated CTA context review outstanding. |
| 2.4.5 Multiple Ways | Pass (scoped) | Header/footer navigation, project/archive links and search/pagination provide multiple access paths. |
| 2.4.6 Headings and Labels | Unverified | One h1/no heading jumps; full authored descriptive wording review outstanding. |
| 2.4.7 Focus Visible | Unverified | Focus rules and legacy branch present; A13/A16 dynamic contrast review pending. |
| 2.4.11 Focus Not Obscured (Minimum) | Unverified | Measured header scroll margins and zoom checks; exhaustive focus route/state sweep pending. |
| 2.5.1 Pointer Gestures | Pass (scoped) | No multipoint/path-based action required by sampled interactions. |
| 2.5.2 Pointer Cancellation | Pass (scoped) | Links/buttons use click activation; no down-event destructive action identified. |
| 2.5.3 Label in Name | Unverified | Search mismatch fixed; DE/EN names now include their visible abbreviations. Full authored visible-label/name comparison pending. |
| 2.5.4 Motion Actuation | N/A | No device-motion input. |
| 2.5.7 Dragging Movements | Pass (scoped) | No dragging needed to navigate or enlarge images. |
| 2.5.8 Target Size (Minimum) | Unverified | Representative 33-route/viewport geometry sweep recorded control dimensions and nearby spacing. Fixed-header stacking yielded false positives; complete hit-testing/spacing exceptions remain unverified. |
| 3.1.1 Language of Page | Pass (scoped) | All generated html roots use de/en; bilingual boundary build checks pass. |
| 3.1.2 Language of Parts | Unverified | A15 exact known English phrases annotated after validation; complete authored language review pending. |
| 3.2.1 On Focus | Pass (scoped) | Sampled focus does not navigate/change context. |
| 3.2.2 On Input | Pass (scoped) | Search locally filters and announces; pointer checkbox does not navigate. |
| 3.2.3 Consistent Navigation | Pass (scoped) | Shared chrome/archives retain route order and destinations. |
| 3.2.4 Consistent Identification | Pass (scoped) | Shared controls use consistent labels/icons in each language. |
| 3.2.6 Consistent Help | Pass (scoped) | Existing telephone/email contact mechanisms retain shared placement; no new help flow. |
| 3.3.1 Error Identification | N/A | No data-submission form; no-match is announced as search status. |
| 3.3.2 Labels or Instructions | Pass (scoped) | Search has associated label; checkbox has visible label. |
| 3.3.3 Error Suggestion | N/A | No submission/validation flow. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | N/A | No checkout/account/data-modification flow. |
| 3.3.7 Redundant Entry | N/A | No multi-step entry process. |
| 3.3.8 Accessible Authentication (Minimum) | N/A | No authentication. |
| 4.1.2 Name, Role, Value | Unverified | Names/ARIA references scanned; modal/checkbox states tested. Full platform accessibility API review pending. |
| 4.1.3 Status Messages | Pass (scoped) | Search polite atomic status exists and updates; actual screen-reader announcement still unverified. |

## Browser and assistive-technology matrix

| Combination / feature | Direct result |
| --- | --- |
| macOS Chrome keyboard + accessibility tree | Menu isolation, reverse Tab and Escape restoration passed; 400% browser zoom passed. |
| macOS Firefox keyboard + accessibility tree | Menu isolation, reverse Tab and Escape restoration passed. |
| macOS Safari keyboard + accessibility tree | Menu isolation, reverse Tab and Escape restoration passed. |
| In-app Chromium desktop/mobile viewport | Representative bilingual templates, search/Back, galleries, categories and no-script/feature-removal fixtures checked. |
| Safari + VoiceOver speech/browse navigation | Unverified by user instruction; do not use VoiceOver or its utility. Native AX inspection does not establish a VoiceOver pass. |
| Chrome/Edge/Firefox + NVDA on Windows | Unverified; Windows/NVDA unavailable. |
| Edge/Chrome + JAWS on Windows | Unverified; Windows/JAWS unavailable. |
| iOS Safari + VoiceOver | Unverified; viewport resizing is not iOS testing. |
| Android Chrome + TalkBack | Unverified; viewport resizing is not Android testing. |
| OS voice control / speech input | Unverified; label inspection is not direct speech activation. |
| Switch scanning / external switch hardware | Unverified; keyboard evidence only. |
| OS forced colors, increased contrast, enlarged pointer | Unverified directly; conditional code reviewed. System pointer choice persists and works with denied storage in regression tests. |
| OS reduced motion | Controller branches and live changes regression-tested; real OS preference/AT interaction unverified. |
| Real older browser versions | Unverified; missing-feature fixtures tested only in a current engine. |
| Touch hardware / both device orientations | Unverified directly; responsive layouts and single-pointer actions inspected. |

## Verification and reproducibility

- `npm test`: 70 regressions passed plus vehicle-discovery fixture. Includes modal restoration, legacy media listeners, pointer persistence/storage failure, native arrow behavior, guarded hidden results, motion fallback races, native category-dialog full traversal, older focus-selector detection and trusted language annotations.
- `npm run build`: passed production routes, CSP, image dimensions, links, IDs, metadata, authored bilingual vehicle verification and accessibility invariants.
- `npm run build:pages`: passed `/oldtimer/`, preview/noindex safeguards and generated artifact checks. Its existing gallery limit yielded 3,516 image elements and 1,172 direct gallery links; production yielded 8,476 and 6,132 respectively. Both scans had no invariant failures. Final Pages gallery fallback Escape restored the opener and original background state; English archive pagination retained its base-path URLs.
- `npm run vehicles:sync`: explicitly run; 338 canonical sitemap URLs, no tracked sitemap diff because reviewed shared modification date already 2026-09-30.
- `npm run crawlers:check`: validates canonical sitemap, manual llms links and robots policy. llms.txt updated for actual pointer preference, approved editorial alternatives and approved control/focus treatment; project descriptions remain unchanged. robots.txt reviewed: no new routes, asset policy or indexing-scope change; existing policy retained.
- Shared Open Graph/JSON-LD baseline, representative imagery and authored facts retained; representative image alternatives updated with approved descriptions in shared Open Graph/JSON-LD props; no page purpose or modeled business fact changed. Existing build validators verify complete metadata and dates.
- Tracked-source SHA-256 hashes were identical before and after both builds; `git diff --check` passed.
- `npm run audit:accessibility` scans current dist; it is also part of both builds.
- `npm run preview:accessibility` serves built output only on 127.0.0.1:4327. For a Pages artifact: `node scripts/preview-accessibility.mjs github-pages`. Query `audit=nojs|legacy|text|spacing|reduced|header|search|media|controls|focus` provides clearly local test/proposal overrides. No fixture is shipped into dist or deployed. `media` retains the earlier 56% proposal for comparison with the final 40% implementation.

Screenshots and DOM geometry results are local evidence under `.codex-qa/` (ignored by Git): menu desktop, 320px homepage, short menu, real Chrome 400%, root-font fixture, header/search implementation and comparison screenshots, revised white-text homepage, section-control/focus comparison proposals and implementation screenshots (accessibility-controls-focus-implemented.jpg and accessibility-controls-focus-mobile.jpg), full reflow/text-spacing sweeps and sampled target geometry. Their environment paths are local, not public URLs.

## Remaining decisions and verification dependencies

1. Project/archive/vehicle photo alternatives remain unchanged at the user’s instruction. Their known limitations prevent claiming full non-text-content conformance. Complete remaining authored markup/language/link review.
2. Complete moving-frame non-text/focus contrast, target hit-testing/spacing and remaining state checks; preview any additional visible fixes separately.
3. Direct screen-reader, speech/switch, native text-only zoom, mobile hardware and OS display-preference combinations remain unverified. VoiceOver/its utility must not be used on this Mac at the user’s instruction.
4. Complete WCAG flash threshold analysis and other criteria marked unverified. Preview safeguards remain active; no deployment performed.
