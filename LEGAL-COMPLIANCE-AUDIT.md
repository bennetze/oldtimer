# Website security and compliance audit

**Reviewed: 13 September 2026.** Current source has 157 vehicle records and builds
344 HTML pages, including 172 German/English pairs. This audit supersedes the
5 September verification counts. Legal work is audit-only: the legal pages, company
claims, real vehicle records and release/preview safeguards were not replaced.

## Implemented and verified technical repairs

| Finding | Resolution and evidence |
| --- | --- |
| Editor/website HTML mismatch and unsafe insertion | Explicit allowlist before paste/render and serialization; bold/italic normalization; empty/unsafe records rejected. Browser payload fixtures also run through the independent website validator. |
| Missing safe existing-vehicle workflow | Folder import preserves original bytes/names, metadata, block order and per-occurrence gallery text. Category changes preserve slug. Local check/apply importer requires exact original route and a fresh fingerprint token. |
| Trust in supplied executable wrappers | Imported Astro is ignored; a trusted wrapper is generated locally. Symlinks including source ancestors, traversal, unsupported files and image-conversion collisions fail before application. |
| Image and ZIP bounds | Signature/type/decode checks, pixel/file/aggregate limits, safe integer ZIP offsets/counts/name lengths, immutable export snapshot and busy-state controls. |
| Replacement recovery | Staging, recoverable backups, exclusive import lock and rollback on caught failures. Abrupt termination requires manual backup recovery; it is not a filesystem-wide atomic transaction. Recovery instructions are in VEHICLE-CONTENT-GUIDE.md. |
| Category moves | Old pair removed only after replacement writes; redirect mapping emits Apache and noindex HTML redirects for both bases. No real vehicle was moved or replaced. |
| Keyboard/editor behavior | Keyboard formatting with saved selection, labeled editors, focus restoration, handle-only drag and button alternatives. Gallery-first import no longer depends on a selected card. |
| Shared presentation | Focus visibility, control targets, readable wrapping, responsive form text and viewport-constrained dialogs refined without changing Jost/editorial styling or intentional light vehicle pages. |
| Eager media and repeated copying | Below-fold homepage videos use preload none; second poster is lazy/normal priority. Browser observed only hero playing/ready and three offscreen videos paused with readyState 0. Cached gallery output no longer recopies unchanged files on every build. |
| Archive search lost on Back | Reproduced in the built browser; filter now lives in its history entry, preserving unrelated state. Browser Back restores both query and filtered result; clear works. No query is added to request URLs. |
| CSP attribute directive | Middleware script directive matching now excludes script-src-attr; built verification enforces prohibited inline event handlers and script hashes. |
| Dependency advisories | Updated Astro to 7.3.2, Sharp to 0.35.4 and affected transitive packages. Current npm audit reports zero known advisories; this is not proof of absence of all vulnerabilities. |

## Open issue register and remedy plan

A confirmed missing notice is distinguished below from a final legal conclusion.
The existing publicly accessible GitHub preview must be assessed now; a preview
label or noindex is not an exemption. Hosting behavior was not inspected live.

| Priority / status | Evidence and consequence | Required action / owner |
| --- | --- | --- |
| High / confirmed missing provider information | `src/pages/impressum.astro` explicitly says the provider notice is still in preparation. Business contact snippets elsewhere do not establish a complete notice. | Company: supply verified legal entity, address, representatives, register/court/number, applicable tax identifiers and any relevant professional details. Obtain approved provider notice for the preview and production. Assess accessibility of that information under § 5 DDG. |
| High / confirmed missing privacy transparency | `src/pages/datenschutz.astro` explicitly says it is not a privacy notice. Even a static preview can process visitor IP/log data. | Company/hosting owner: identify preview and production controllers, providers, purposes, lawful bases, recipients/transfers, retention, rights and contacts. Approve notice reflecting actual processing under GDPR Articles 12–14; do not defer all preview transparency to production. |
| High / missing hosting facts | Local fonts/media and no embedded analytics found in source; host-injected resources, logs, processors and mail handling remain unknown. | Hosting owner: record provider/subprocessors, processing locations, agreements, access and deletion schedules for logs and email enquiries. Inspect actual network requests and storage on each deployed target. |
| Medium / conditional terminal-access risk | No consent-based tracking mechanism is identified in source. Local archive search uses per-entry browser history state for Back restoration; URL-based language selection is present; language detection reads browser language preferences. | Privacy reviewer: assess the actual browser/host terminal access and necessity against § 25 TDDDG. Do not add a blanket consent banner without identifying the operation requiring consent. |
| High / conditional price and seller-role risk | Vehicle offers and enquiry-only sale flow remain. Existing “Preis auf Anfrage” wording is not evidence of an exemption. | Company/German legal reviewer: establish seller versus intermediary role, consumer audience, concrete offer presentation, total-price obligations, tax treatment and actual contract journey under PAngV and applicable consumer rules. Do not invent prices. |
| Medium / BFSG applicability unresolved | The site directs consumers toward vehicle/service enquiries; absence of checkout alone does not resolve scope. Company size/turnover criteria are not documented. | Company/legal reviewer: assess actual consumer journey and microenterprise criteria, required accessibility information and applicable technical requirements. Engineering target remains WCAG 2.2 AA; current tests are not a conformance certification. |
| Medium / missing claim and media evidence | Preview flags still identify synthetic placeholders. Existing history, qualifications, vehicle condition/availability and rights confirmations need supporting records. | Company/editor: reconcile visible copy, translations, metadata and real business facts; verify availability and seller authority. Complete private evidence references in MEDIA-RIGHTS-REGISTER.md without publishing releases/customer records. |
| Medium / conditional AI transparency obligations | Synthetic placeholder imagery remains; the Commission says Article 50 applies from 2 August 2026. | Company/editor: classify each relevant synthetic asset and applicable deployer obligations, including potential deepfake disclosure, using current guidance. Preserve current disclosure; do not assume every AI-assisted asset has identical obligations or that a generic footer settles all cases. |
| Medium / host-dependent security | Built meta CSP works on static output; Apache directives require Apache. HSTS/frame-ancestors and real redirect/404 behavior depend on response headers. | Hosting owner: verify HTTPS, canonical redirects, MIME types, HTTP headers, response CSP, injection/storage and both language error routes on the actual host. Do not represent source configuration as deployed protection. |

Provider information is assessed against [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html).
Privacy transparency and processing arrangements are assessed against the
[GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng), particularly Articles 12–14
and 28. No business/hosting facts were invented to complete those notices.

The terminal-access review must use [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html).
That official page timed out during this check; its current wording still needs
verification before a definitive consent conclusion. The price-review basis is
[§ 3 PAngV](https://www.gesetze-im-internet.de/pangv_2022/__3.html).

The [Bundesfachstelle FAQ](https://www.bundesfachstelle-barrierefreiheit.de/DE/Barrierefreiheitsstaerkungsgesetz/FAQ-elektronischer-Geschaeftsverkehr/faq-elektronischer-Geschaeftsverkehr_node)
describes services aimed at consumer contracts and points to BFSGV/EN 301 549.
Use it to assess the actual journey, not a checkout-only assumption. The
[Commission transparency guidance](https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations)
distinguishes provider marking duties, deployer disclosures and exceptions; apply
it to the actual media and use, rather than claiming blanket AI compliance.

## Verification and acceptance limits

- Inline tool JavaScript syntax check passed.
- `npm test`: 26 Node regressions passed plus discovery fixture. Tests include
  isolated new, unchanged, edited and category-move imports; HTML/image/path attacks;
  duplicate orders; stale source/destination approvals; source-parent symlinks;
  interrupted-write rollback and both redirect bases.
- Real browser localhost harness: 13/13 cases passed, covering slug/date/metadata,
  gallery-first import, corrupt image retention, HTML compatibility, ZIP generation,
  exact metadata round trip, failure state preservation, category moves, image/block
  reordering/removal, calendar/integer/ZIP checks and 1440/390 px overflow.
- Browser-generated ZIP passed `unzip -t`; its JSON and trusted page structure were
  generated through the validated serializer. The extracted browser ZIP also passed the real website importer in read-only check mode. No real website content was imported.
- Both builds passed: 344 HTML pages, 338 sitemap URLs, CSP/IDs/links/image dimensions,
  reviewed metadata, motion controls and 172 language pairs. Pages artifact: 107.5 MB,
  within the configured 150 MB limit. This is built artifact size, not initial load.
- Local built homepage checked at 1440 and 390 px with no horizontal overflow;
  menu opened with focus inside and Escape restored focus to its trigger. Hero
  playback started while the three below-fold videos remained unloaded/paused.
- Built-browser archive search/Back/clear and mobile gallery open/Escape/focus return passed. Inspected pages reported no browser errors or warnings. Keyboard activation of editor italic formatting preserved the selected text.
- `npm audit`: zero known vulnerabilities on 13 September 2026.
- Sitemap explicitly synchronized to reviewed dates. llms.txt descriptions updated;
  robots.txt reviewed with existing preview/indexing and crawler policy preserved.

Direct `file://` navigation is blocked by the available browser tool's URL policy;
localhost testing does not certify that separate acceptance condition. Safari and
Firefox checks, a complete assistive-technology/WCAG audit, field performance/Core
Web Vitals, and deployed response-header/privacy checks remain unavailable. Browser
performance timing is not exposed by the read-only browser inspection API; no
Lighthouse score or load-time claim is made. Reduced-motion races are covered by
Node simulations, not certified across all browsers.

The approved implementation is local and reviewable, but these unavailable checks
and the legal/hosting facts remain acceptance/release work. No commits, deployment,
production legal-text replacement, preview-safeguard removal or existing-vehicle
replacement were performed as part of this implementation.
