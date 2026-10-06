# Legal notice and website compliance review

Reviewed 6 October 2026. Scope: the new Astro website and its bilingual provider
notice. No deployment, alteration of the legacy site, or legal certification.

## Result

The core provider notice is implemented at `/impressum/` and `/en/impressum/`.
Company name, legal form, managing director, address, telephone, email, commercial
register and VAT ID were reconfirmed by the user on 6 October 2026. The text uses
section 5 DDG, direct contact links and authored English wording. It preserves the
shared layout, footer, language switch, section navigation, Open Graph metadata,
development-preview label and legal-page noindex policy. The existing structured
business data already matches these core details; no new business facts or JSON-LD
entities are introduced. Legal pages remain excluded from the sitemap and llms
link lists under the repository's noindex policy.

**The site cannot yet be cleared as legally complete.** Missing conditional
provider disclosures, privacy facts and media release evidence remain unresolved.
The visible preview qualification does not exempt the public preview from legal
duties. Complete the German questionnaire in `IMPRESSUM-FRAGEBOGEN.md`, then update
both authored notice versions and reassess the actual deployment.

## Provider notice findings

- Core disclosures follow [section 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html).
  The old page is a source of company facts, not evidence that all obligations are
  met. A current register extract and company records should substantiate them.
- Clarify assigned W-IdNr., liquidation status, licensed activities and regulated
  profession disclosures. Do not infer a W-IdNr. from the VAT ID, a chamber from
  geography, or a professional designation from marketing language.
- Obtain the headcount and actual participation position under
  [section 36 VSBG](https://www.gesetze-im-internet.de/vsbg/__36.html). The exemption
  for ten or fewer employees at the previous year end concerns subsection 1(1);
  a commitment/obligation may still require naming the competent body. No refusal
  statement or invented arbitration body has been published.
- [Section 37 VSBG](https://www.gesetze-im-internet.de/vsbg/__37.html) requires a
  separate text-form notice after an unresolved consumer dispute; an Impressum
  statement does not replace that workflow.
- Prior project documentation records planned journalistic/editorial material.
  Establish applicability and the suitable responsible individual/address under
  section 18(2) MStV using the
  [media authorities' current legal texts](https://www.die-medienanstalten.de/service/rechtsgrundlagen).
  Do not automatically appoint the managing director.
- Examine regulated trade, licensing and professional-liability information under
  [section 2 DL-InfoV](https://www.gesetze-im-internet.de/dlinfov/__2.html).
  DL-InfoV allows alternative ways of supplying pre-contract information; not
  everything has to be placed in the website notice.
- The old blanket liability exclusion, unverified trademark-register claim and
  legacy 404 image credit have not been copied. Required current-media credits
  depend on actual licences. Privacy belongs in the separate notice.
- The EU ODR platform was discontinued on 20 July 2025 under
  [Regulation (EU) 2024/3228](https://eur-lex.europa.eu/eli/reg/2024/3228/oj).
  Do not add its obsolete link or confuse its removal with the VSBG duties.

## Website-wide findings

- `DATENSCHUTZ-OPEN-ITEMS.md` already documents unresolved GDPR transparency,
  hosting/preview roles, retention, processors/transfers, publication permissions
  and device storage issues. These remain release blockers where applicable.
  Replacing the Impressum cannot resolve them. Source-level local delivery/CSP
  does not verify provider logs, contracts or an actual deployed host.
- Source inspection shows a static website, local fonts/media and contact links.
  There is a stored, user-selected system-pointer preference; do not claim that
  the site uses no storage. Assess its necessity and duration under section 25
  TDDDG with the existing privacy work. No generic cookie banner is added without
  an identified operation requiring consent.
- Determine whether consumer-facing functions qualify as electronic-commerce
  services under [BFSG](https://www.gesetze-im-internet.de/bfsg/__1.html), and any
  service-provider microenterprise exemption under
  [section 3 BFSG](https://www.gesetze-im-internet.de/bfsg/__3.html).
  Telephone/email enquiries and lack of checkout alone do not settle applicability.
  See the [official BFSG guidance](https://www.bundesfachstelle-barrierefreiheit.de/DE/Fachwissen/BFSG/BFSG_node.html).
  If covered, assess the complete applicable accessibility duties and customer
  information, not just automated page checks.
- Check actual consumer contracting and price presentation against applicable
  distance-contract information, withdrawal and price-disclosure rules. Do not
  invent terms, prices or an exemption. No sales/booking flow is added here.
- Complete rights evidence and factual approvals before release, including people,
  logos, image alternatives, translations, Open Graph and structured data. Preserve
  existing preview flags. The legacy live site's privacy/cookie shortcomings
  documented in the privacy review remain a separate migration task.

## Enacted future change and maintenance

[Directive (EU) 2025/2647](https://eur-lex.europa.eu/eli/dir/2025/2647/oj) revises
consumer ADR. The [Commission's implementation notice](https://commission.europa.eu/get-involved/events/adr-transposition-workshop-2026-10-01_en)
identifies March 2028 as the national transposition deadline. Track Germany's
implementing legislation and its application dates; do not treat future directive
changes as already replacing current VSBG requirements. Recheck before deployment
and when company facts, services or relevant law change. Unenacted proposals are
not current obligations; unknown future law cannot be guaranteed in advance.

Given the unresolved company-specific trade, editorial, privacy and consumer
questions, a qualified German lawyer and, for privacy facts, a data-protection
professional should review the completed facts/texts before production clearance.
Technical test success is not legal approval.

## Technical verification

- `npm test`: 81 passing Node tests and the vehicle-discovery fixture.
- `npm run vehicles:sync`: reviewed; no sitemap diff, legal routes stay excluded.
- `npm run build` and `npm run build:pages`: passed all existing output, CSP,
  metadata, translation and static accessibility checks (344 pages, 172 language
  pairs; no static accessibility failures or heading jumps).
- Targeted Pages-output assertions passed for both authored notices, section IDs,
  register/VAT data, local privacy links, deployment base, Open Graph and noindex.
- In-app browser checks at 1440px and 390px confirmed both notice languages and
  language switching, readable layout, local privacy links and the shared header.
  Homepage mobile rendering was also checked.
- Reviewed `robots.txt`: unchanged policy, production sitemap reference retained.
  Updated the manual German llms summary without listing noindex legal routes.
- No live hosting, Safari/Firefox, assistive-technology or complete manual WCAG
  verification was performed. Automated results do not prove legal compliance.
