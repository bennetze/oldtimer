# Website security and compliance audit

**Reviewed:** 5 September 2026

**Scope:** Current Astro working tree, including 157 vehicle records and 172 generated pages.

**Release status:** Technical maintenance does not grant production/legal clearance.

This replaces the earlier audit's current-status claims. The site has expanded since
that review: it includes vehicle offers, real workshop photography, archive search
and additional background videos. Older blanket statements about no offers, all
non-hero imagery being synthetic, and completed security checks are no longer current.

The user explicitly excluded the contents of Impressum and Datenschutzerklärung.
Those texts were neither reviewed nor rewritten. Existing release prerequisites for
approved legal texts, factual claims and final media remain in force.

## Approved repairs

- Patched only the vulnerable transitive resolutions: js-yaml 4.3.0 → 4.3.2 and
  nanoid 3.3.16 → 3.3.18. The identified denial-of-service advisories concern build
  dependencies; no remotely accessible Node endpoint was identified in this static
  site. See the [js-yaml advisory](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj)
  and [nanoid advisory](https://github.com/advisories/GHSA-2v37-7h3g-55p8).
- Added allowlist validation and validated serialization before rendering vehicle
  HTML, including manually edited records. Existing valid formatting and contact
  links are preserved; active content fails the build with record/block context.
  No active injected payload was found in the existing records.
- Added per-page Astro CSP script hashes, prohibited inline event handlers, and
  retained the style attributes used by the current design. Apache's baseline and
  frame-ancestor protection remain host-dependent; the per-page meta policy also
  works on static hosts that ignore `.htaccess`. Meta CSP cannot replace HTTP-only
  protections such as `frame-ancestors` or HSTS.
- Corrected custom-cursor activation at narrow widths and inside native image
  dialogs; made the existing menu scrollable and its skip-link background inert.
- Added pause controls to all four homepage video sections; pause covers the hero
  heading animation and animated fallbacks. Preference changes, offscreen/hidden
  states and late playback failures must not override pause. These repairs address
  [WCAG 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).
- Corrected duplicate homepage heading IDs and safe editorial fragment lookup.
- Added empty-archive fallback metadata/content and history/search restoration.
  The history-return risk was identified in code but did not reproduce in the audit
  browser; it is recorded as defensive robustness work.
- Replaced build-time crawler source overwrites with explicit sitemap synchronization
  and read-only build checks. The German LLM summary remains manually maintained.
  Sitemap and page dates now use reviewed content/template dates. Vehicle preview
  dimensions come from served WebP files; current dimensions already matched, so
  this is a safeguard for future resized/rotated uploads.

## Indexing and preview decisions

At the user's explicit request, production-root pages remain indexable. GitHub Pages
remains a noindex development preview without canonical links or JSON-LD. Complete
Open Graph metadata remains available on both targets. Existing noindex legal/error
routes remain excluded from the sitemap. Indexability is not a legal release approval.

Keep the existing visible AI-placeholder disclosure and preview flags until the
previously agreed replacement and release checks have been completed. Confirm which
assets are synthetic; do not label newly supplied real workshop photography as AI.
For applicable synthetic content, assess disclosure at first exposure, including
accessible alternatives and representative images. Article 50 does not impose a
blanket identical labelling rule on every AI-assisted asset. See the Commission's
[transparency guidance](https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations).

## Outstanding legal and factual questions

### Vehicle offers and price disclosure

There are ten vehicle offers; seven records contain “Preis auf Anfrage”. The user
explicitly requires telephone/email enquiries and does not want published fixed
prices, checkout or booking. Those decisions and the existing listing text are
preserved; no price fields were added.

This flow does not establish an exemption from price disclosure. Whether a particular
presentation is an offer requiring a total price must be assessed under
[§ 3 PAngV](https://www.gesetze-im-internet.de/pangv_2022/__3.html), considering the
actual seller, consumer audience and sales arrangement. A subsequent contract can
also require distance-selling assessment depending on the real process, even without
a website checkout. Obtain focused German legal review before releasing these offers
as cleared. Do not invent prices, assume 19% VAT or present the issue as resolved.

### Company and vehicle claims

Preserve the user-requested copy while obtaining evidence for founding history,
qualifications, awards, management, advertised services and contact details. For
vehicle records, confirm current availability, condition, originality, provenance,
awards and time-sensitive statements such as new inspection/TÜV. One offer describes
sale on a customer's behalf; establish the actual seller and the business's role.
Migration from the old site is not proof that these statements remain current.

Unverified does not mean false. Inaccurate claims about availability, characteristics
or qualifications can raise issues under
[§ 5 UWG](https://www.gesetze-im-internet.de/uwg_2004/__5.html). Keep visible copy,
metadata and structured data consistent after any subsequently approved correction.

### Accessibility law

Do not rely on the earlier audit's assumption that BFSG can apply only when a complete
checkout exists. Assess the consumer-facing service in view of concluding a contract,
including the enquiry flow, against the
[Bundesfachstelle's guidance](https://www.bundesfachstelle-barrierefreiheit.de/DE/Barrierefreiheitsstaerkungsgesetz/FAQ-elektronischer-Geschaeftsverkehr/faq-elektronischer-Geschaeftsverkehr_node).
The service exemption for microenterprises requires the actual company criteria to
be established: fewer than ten persons and annual turnover or balance-sheet total
not exceeding EUR 2 million. Applicability and any required accessibility information
remain open. Technical accessibility improvements proceed regardless of exemption.

### Media evidence

Preserve the previously recorded confirmation that image/video rights lie with the
GmbH and that migrated vehicle images may be reused. Update the media register for
real workshop assets and additional video families, with private references to actual
licences and applicable releases. Ownership confirmation alone does not identify the
scope of each person's consent or every reuse right. Do not publish private evidence,
customer documents or releases in this repository or the site output.

### Hosting, privacy and security

The production host is not selected. Source inspection found locally served fonts,
images and videos; no analytics, advertising scripts, tracking storage, service
workers or third-party embeds. Archive search is local and does not submit its query
to a server. Google Maps is an outgoing link, not an embedded map. Jost's OFL licence
continues to be shipped locally.

No consent banner is introduced merely because the site has a search field or
contact links. Check the actual host's cookies and other terminal access against
[§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html) before release.
Hosting logs and telephone/email enquiries can still involve personal data under the
[GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng).

Once hosting is chosen, verify HTTPS and redirect behavior, real response headers,
404 handling, injected scripts/cookies, processor arrangements, locations and
subprocessors, logging purposes/access/retention, and mail-provider arrangements.
Transfer relevant HTTP rules if the host ignores `.htaccess`. No live production
server configuration was changed or certified during this maintenance pass.

## Verification record

- `npm test`: nine focused regressions passed, plus the vehicle-discovery fixture.
  The motion tests exercise reduced-motion changes, manual playback, late playback
  callbacks, stalled playback and animated-fallback cleanup using a simulated DOM.
- `npm run build` and `npm run build:pages`: both passed for all 172 pages, including
  CSP hashes, duplicate IDs, local links, image dimensions, metadata dates, motion
  controls and crawler consistency. The Pages artifact passed its size limits.
  Build source-hash comparison found no build-generated changes to tracked source.
- An isolated copy with all three vehicle categories empty built successfully:
  ten pages, seven sitemap URLs, fallback images and German empty-state messages.
- `npm audit`: zero known vulnerabilities reported after the two dependency patches.
- Local built-output browser checks and the Astro dev-server smoke check passed.
  Checked desktop/mobile widths (1440px/390px), the 800px cursor breakpoint,
  short-screen menu scrolling, modal focus containment/restoration, gallery cursor,
  pause controls, archive search/clear/history and malformed fragment navigation.
  Successful video playback did not insert animated fallback sources; inspected
  pages reported no browser warnings or errors.

Safari and Firefox were unavailable. Reduced-motion and playback-failure races were
tested with the automated simulation, not certified across those browsers. The final
host remains undecided; response headers, host-injected resources and operational
privacy arrangements still require verification there.
