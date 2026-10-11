# Privacy notice: confirmed facts, outstanding details and compliance actions

Reviewed 9 October 2026 after the company’s questionnaire answers. German and
English text is authored in `src/content/legal/privacy.js` and rendered at
`/datenschutz/` and `/en/datenschutz/`. The development-preview labels and release
gates remain active. The notice is not finally approved, and no deployment occurred.
It describes the intended IONOS production website, not the existing Joomla website
or the GitHub preview. GitHub content is removed from the production notice at the
user’s explicit request; the live preview still needs separate privacy information.

## Confirmed by the company

- Current company name, address and published contacts are correct.
- IONOS is selected for hosting; email accounts are also at IONOS. No additional
  cloud-storage services are used. Exact products and contracts remain unprovided.
- Mario Schrank handles privacy enquiries, internal privacy responsibility and
  confirmation of the notice. He is not appointed as a data protection officer.
- Two to at most three people regularly process personal data. The numerical
  threshold in section 38 BDSG is not reached; independent statutory triggers
  still need screening. No mandatory appointment exemption is certified.
- Information is normally deleted immediately, at latest after one month. The
  notice applies this to general/unsuccessful enquiries no longer needed for
  handling; the starting point still needs explicit confirmation. Statutory retention duties
  were explicitly confirmed as exceptions.
  It is not a one-month promise for host logs, backups or statutory business records.
- All employees have signed forms covering confidentiality and image rights.
  The text, voluntary nature, withdrawal information and publication scope have
  not been reviewed. This does not establish permissions for customers/visitors.
- The company reports EU-only processing. Product documentation, subprocessors,
  support access and the separately operated GitHub preview remain to be checked.
- No extra scripts/services are planned. The new site is not deployed to IONOS.
  The old Joomla site and GitHub preview will be taken offline when the new site
  goes live.
- The custom cursor has already been removed. Source inspection confirms no
  cookie-writing, localStorage, sessionStorage, IndexedDB or old pointer preference
  in current website code. Local archive search uses history.state; language is
  selected through browser language and URLs, not a persistent preference store.

The current German questions and answer fields are in `DATENSCHUTZ-FRAGEBOGEN.md`.

## 1. Information still needed

1. **IONOS products and agreements:** product names, contracting entities, contract
   date/AVV coverage, subprocessor list, processing/backup countries and support
   access. Company EU-only confirmation is recorded, not rejected, but not verified
   against these documents. No blanket assurance is made for GitHub.
2. **Hosting logs and defaults:** request/error/security fields, IP treatment,
   purposes, retention, access, deletion, backups and active statistics/CDN/WAF/bot
   services. A general one-month enquiry rule cannot determine provider retention.
3. **GitHub preview:** actual operator and role, responsibility/contracts, countries,
   transfer basis, log retention and privacy information while it remains publicly accessible. Its closure at launch
   is confirmed; its details are excluded from the production notice.
4. **Communication and deletion details:** telephone/fax providers; IONOS mail
   product, filters/forwarding, voicemail/call logs, copies/backups and external IT.
   Confirm one month starts when an enquiry is no longer needed/handling is finished,
   how each copy is deleted and any further legal holds. Statutory retention
   exceptions are confirmed. Mario owns the process.
5. **Publication scope and evidence:** redacted wording of employee forms; voluntary
   consent, purpose, withdrawal and coverage of public website/preview, DE/EN,
   thumbnails and metadata. Other people, customer-related vehicles, plates and
   documents remain unconfirmed. Establish publication/deletion criteria and any
   Article 14 information duties. Image-use rights and confidentiality alone do not
   establish a valid GDPR publication basis.
6. **Special processing/internal procedures:** only if applicable, recruitment,
   CCTV, sensitive data, DPIA/DPO triggers and additional purposes. Document existing
   access/security, rights handling, breach response and processing records; do not
   presume that naming Mario confirms implementation. Repository exposure and old
   versions containing image metadata still need assessment.

## 2. Changes and checks needed for compliance

1. **Finish DE/EN hosting and publication details.** Confirm the above facts and
   replace remaining provisional wording before final approval. Public preview
   transparency duties apply now; preview/noindex is not an exemption.
2. **Verify provider arrangements.** Check AVV coverage, roles, subprocessors and any
   necessary transfer safeguards. IONOS says AVVs are part of new contracts from
   19 July 2022; verify the actual contracts rather than inventing a signed AVV.
3. **Browser checks:** pointer storage is removed, so the former persistence action
   is resolved. Assess remaining functional search/history, language and device
   access under section 25 TDDDG. There is no identified tracking-consent operation
   in current site code; a banner is not added speculatively. Inspect real host
   cookies/headers/requests after deployment before declaring all hosting cookie-free.
4. **Operational deletion:** implement the clarified enquiry rule, proportionate
   log retention and mailbox/backup schedules. Keep statutory business-record
   retention and justified legal holds distinct from general enquiry deletion.
5. **Publication permissions:** review employee forms and customer/visitor/vehicle
   data; document the applicable bases or remove/anonymise uncovered material,
   including previews, metadata and responsive image variants.
6. **GPS cleanup completed in current image files:** ExifTool inspected 10,947
   images under src/ and public/; six additional tracked release images had no GPS tags.
   An all-namespace GPS scan of all 10,953 files also found no remaining GPS tags.
   Three source JPEGs had GPS tags; all GPS tags in
   those files were removed. A second complete scan found none and no read errors.
   Pixel hashes, dimensions, EXIF orientation and colour profiles are unchanged.
   Other camera/MakerNote warnings were not repaired because they do not prevent
   GPS inspection and broad metadata repair is outside scope. Old Git objects and
   previously published copies are not changed by a working-tree edit. Assess and
   remove exposed historical copies separately if necessary; no history rewrite
   or deployment is authorised by this cleanup.
7. **Deployment and organisation:** verify HTTPS, host headers, requests/storage,
   least-privilege access, MFA, updates, backups, rights/breach procedures and any
   required records/assessments. Naming a responsible person or drafting a notice
   does not perform these checks.
8. **Joomla transition and future changes:** retire the old site at the confirmed
   cutover; its distinct privacy/external-resource issues remain relevant while it
   is live. Keep both languages current when purposes/providers change. Preserve
   all existing production-release gates until facts, media evidence, legal text
   approval and actual-host checks are completed.

## Verification on 9 October 2026

- All 81 Node tests and the discovery fixture passed.
- Production and GitHub Pages builds passed their page, CSP, metadata, language
  and accessibility validators; the final content was rebuilt after scope changes.
- All 344 generated production pages had no externally loaded scripts, embeds,
  image/source files, stylesheets, preconnections or DNS prefetch links.
- The eight generated JS files contained no cookie-setting or persistent
  preference-store APIs. Four representative local HTTP responses had no
  Set-Cookie header. These are local checks, not IONOS/GitHub header guarantees.
- Desktop German and mobile English layouts and language links were checked;
  no horizontal overflow or browser console errors were observed.
- The final Pages artifact contained 3,756 inspected images with no GPS tags
  and no ExifTool read errors.
- Sitemap synchronization made no tracked sitemap changes; robots.txt was
  reviewed and its existing route/media policy remains applicable.

## Primary references

- [GDPR](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679)
- [Section 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html)
- [Section 38 BDSG](https://www.gesetze-im-internet.de/bdsg_2018/__38.html)
- [Section 26 BDSG](https://www.gesetze-im-internet.de/bdsg_2018/__26.html)
- [DSK guidance on digital services](https://www.datenschutzkonferenz-online.de/media/oh/OH_Digitale_Dienste.pdf)
- [GitHub Pages visitor logging](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection)
- [IONOS AVV information](https://www.ionos.de/hilfe/datenschutz/allgemeine-informationen-zur-datenschutz-grundverordnung-dsgvo/vereinbarung-zur-auftragsverarbeitung-avv-mit-ionos-abschliessen/)

A German privacy professional should review the final facts, unresolved legal bases
and final notice. Source inspection does not verify hosting contracts, business
practice or legal approval. EU GDPR/ePrivacy and SME simplification proposals must
be tracked as proposals until their enacted text and application dates apply.
