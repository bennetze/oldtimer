# Medienrechte-Register

**Stand:** 6 October 2026 (original/media-family workflow; approvals still pending)
**Rechteinhaber laut Auftraggeber:** DIE OLDTIMERMANUFAKTUR GmbH  
**Status:** Entwicklungsnachweis; Belege vor Produktionsfreigabe vervollständigen

## Wozu dieser Nachweis dient

Die Aussage „die Rechte liegen bei der GmbH“ ist eine wichtige Bestätigung, aber im
Streitfall allein noch kein vollständiger Beleg. Belastbar wird die Rechtekette durch
Originaldateien, Verträge, Rechnungen, Einwilligungen und eine Zuordnung jeder
veröffentlichten Datei zu diesen Unterlagen. Belege gehören in einen internen,
nicht öffentlichen Projektordner; in diesem Repository werden nur Status und
Fundstelle festgehalten.

## Aktueller Medienbestand

| Gruppe | Aktueller Ursprung | Öffentliche Darstellung | Bestätigter Status | Noch abzulegen |
| --- | --- | --- | --- | --- |
| `hero-site.mp4`, `hero-site.webm`, Poster und Bewegungs-Fallbacks | Reales Hero-Video und daraus erzeugte Ableitungen | Hero der Startseite und Open-Graph-Bild | Auftraggeber bestätigt sämtliche Bild-/Videorechte bei der GmbH | Original/Master, Produktions-/Übertragungsvertrag, Rechnung, Freigabe erkennbarer Personen, Fahrzeug-/Kennzeichenfreigabe, Liste der erzeugten Ableitungen |
| KI-Motive wie `about-*`, `handwerk-motorbau-*` und die bisherigen synthetischen Projektmotive in `src/assets/oldtimer/` (nicht pauschal alle übrigen Dateien) | KI-generierte Entwicklungsplatzhalter | Am 28.09.2026 vollständig entfernt | Historischer Entwicklungsbestand; nicht mehr ausgeliefert | Verwendetes KI-System und Konto, Erstellungsdatum, geltende Nutzungsbedingungen/Lizenz, Prompts/Job-IDs soweit vorhanden; anschließend dokumentierte Entfernung/Ersetzung |
| Reale Werkstattaufnahmen `L100*.webp`, insbesondere die auf `/handwerk/` verwendeten Dateien | Neu eingebundene reale Werkstattfotografie | Karosserie, Polsterei und Lackiererei sowie repräsentative Metadaten | Nicht als KI-Platzhalter einordnen; allgemeine Rechtebestätigung der GmbH bleibt dokumentiert | Je Motiv Original-/Urheberzuordnung, Nutzungsumfang und gegebenenfalls Freigaben erkennbarer Personen intern zuordnen; Dateinamensmuster ist kein eigenständiger Rechtebeleg |
| `handwerk`, `ueberuns`, `projekte`: MP4/WebM, Poster und Bewegungs-Fallbacks | Reale Videoaufnahmen laut Bestätigung des Auftraggebers am 28.09.2026; Produktion und Ableitungen einzeln dokumentieren | Drei zusätzliche bewegte Bereiche der Startseite | Allgemeine Rechtebestätigung bleibt bestehen; konkrete Belegzuordnung und Herkunft pro Familie prüfen | Master, Urheber-/Übertragungsnachweis, reale oder synthetische Herkunft, Personen-/Standortfreigaben soweit erforderlich sowie sämtliche erzeugten Ableitungen zuordnen |
| Zukünftige Aufnahmen des Fotoshootings | Noch nicht erstellt | Finale Personen-, Team-, Werkstatt-, Standort- und Projektbilder | Noch offen | Fotografenvertrag mit ausschließlichen oder ausreichend weiten Nutzungsrechten, Honorar/Rechnung, Rohdateien, Model Releases, Mitarbeitereinwilligungen, Property-/Location-Releases, Fahrzeug-/Kennzeichenfreigaben |
| `public/favicon.svg`, `.ico`, `apple-touch-icon.png` | Aktuelles weißes Fahrzeugsignet; kein OM-Monogramm | Browser-/Gerätesymbol der Entwicklungsvorschau | Herkunft und endgültige Freigabe separat nachweisen | Originalzuordnung, Urheber-/Markenrechte und Freigabe der Ableitungen |
| Jost (historisch) | Jost Project Authors | Am 28.09.2026 als ungenutzte Schrift entfernt | SIL Open Font License 1.1 | Schrift und zugehörige Auslieferungslizenz entfernt; aktuelle Schriften siehe unten |
| Fahrzeugbilder unter `src/pages/projekte/*/<fahrzeug>/` | Migration der bestehenden Website `oldtimermanufaktur.de`; Quellen je Fahrzeug in `vehicle.json` und `VEHICLE-MIGRATION-AUDIT.json` dokumentiert | Karten, Detailseiten und Open-Graph-Bilder der Projektarchive und Fahrzeugangebote | Auftraggeber bestätigt die Rechte der GmbH zur erneuten Veröffentlichung und Erstellung responsiver Ableitungen | Interne Original-/Urheberzuordnung und vorhandene Freigaben anhand der dokumentierten Quell-URLs ablegen; die im Migrationsaudit ausgewiesene, nur durch korrigierte Dateiendungs-Großschreibung abrufbare Quelle bei der internen Zuordnung berücksichtigen |

## Decorative leather texture

Texture asset added on 2026-09-13: `src/assets/oldtimer/leather-texture.webp`
is an AI-assisted repeating derivative of the user-supplied `src/assets/oldtimer/L1007006.webp`.
The image editing tool softened the central leather grain into a neutral tile;
the result was resized to 1200 × 1200 and encoded as WebP for decorative use
on the gradient subpages and individual vehicle pages. The source photograph was converted from JPEG to WebP at approximately 3 megapixels
(quality 82) on 2026-09-17; the existing decorative texture is unchanged. This records
the requested preview use, not a new confirmation of production media rights;
associate the source with its internal rights evidence before release.

## Mindestunterlagen für das Fotoshooting

1. **Fotografenvertrag:** Urheber und Auftraggeber, Motive, Vergütung und konkrete
   Nutzungsrechte für Website, Social Preview/Open Graph, soziale Netzwerke,
   Presse/PR, zeitliche und räumliche Reichweite, Bearbeitung, Zuschnitt,
   Unterlizenzierung an Hosting-/Agenturdienstleister und Archivierung.
2. **Personenfreigaben:** Name, konkreter Nutzungszweck, Medien/Kanäle,
   Widerrufs-/Löschprozess und Unterschrift. Bei Beschäftigten darf die Freiwilligkeit
   nicht nur unterstellt werden; die Freigabe sollte getrennt vom Arbeitsvertrag
   dokumentiert werden.
3. **Sach-/Standortfreigaben:** Zustimmung für private Werkstätten, Gebäude,
   Sammlungen und erkennbare fremde Fahrzeuge, soweit erforderlich.
4. **Kennzeichen und sensible Details:** Vor Veröffentlichung bewusst entscheiden,
   ob Kennzeichen, Dokumente, Kundenangaben, Werkzeugnummern, Bildschirme oder andere
   identifizierende Details sichtbar bleiben dürfen; sonst retuschieren.
5. **Dateizuordnung:** Eindeutige Original-ID/Dateiname, Aufnahmedatum, Urheber,
   abgebildete Personen/Objekte, zugehörige Release-ID und die daraus erzeugten
   Webdateien dokumentieren.

## Approval records for originals and media families

Maintain one record per identifiable original/master or clearly enumerated asset
family with the same rights and approval scope. A family must identify its members;
a broad filename pattern or a company-wide statement alone is not sufficient.
Responsive sizes, format conversions and immutable copies may share their
original's evidence when the approved scope covers those uses. A new original or
materially different use requires review; no separate CSV or vehicle-schema field
is required.

| Original/master ID and source files or vehicle route | Creator / rights holder | Licence and permitted uses, edits, credits and restrictions | Persons/private details: applicable basis or release reference | Evidence reference | Named approver and approval date | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Not yet supplied | Pending | Pending | Pending assessment | Pending | Pending | Not approved |

Store contracts, releases and other personal information in a private evidence
archive with controlled access and an appropriate retention/deletion policy.
Record only the reference needed for traceability here; do not put signatures,
identity documents or private contact details in the repository, vehicle records
or public assets. The register is not a GDPR processing record or privacy notice.

## Production approval gate

Release remains pending until every delivered media asset can be connected to an
approved original or explicitly enumerated family and retrievable evidence.
Before publication, review the root build's images, video variants/posters/fallbacks,
branding, fonts and inline graphics against these records. Include unused files
still delivered by the build. Record the reviewed release revision, scope, reviewer,
date and unresolved assets in the release checklist. An unmatched or unapproved
asset must be approved, removed from the release or replaced before release.

For new or replaced vehicle images, review photograph-specific German and English
alternatives, representative Open Graph/JSON-LD metadata and the visible content.
Successful editor saves and builds do not grant publication permission.

## Legal basis of this workflow — reviewed 6 October 2026

The cited provisions concern permission, lawful processing and accountability;
they do not prescribe this project's CSV format. This register and the release
checklist organise evidence, but do not themselves establish compliance:

- [German Copyright Act, section 31](https://www.gesetze-im-internet.de/urhg/__31.html): verify the scope and restrictions of rights of use, including the actual website and derivative uses.
- [KunstUrhG, sections 22 and 23](https://www.gesetze-im-internet.de/kunsturhg/BJNR000070907.html): assess recognisable-person publication, necessary consent and any applicable exceptions; do not assume every image requires the same release.
- [GDPR, Articles 5, 6, 7 and 24](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679): where personal data is involved, document the applicable lawful basis, accountability, and consent evidence where consent is relied upon; apply data minimisation, storage limitation and appropriate safeguards to the evidence archive.

Outstanding legal texts, business/hosting facts and case-specific publication
permissions remain subject to the existing release checklist and its approvers.
Removing the inventory neither waives those requirements nor confirms compliance.

## Contact map assets — reviewed 2026-09-13

- `src/assets/graphics/germany-silhouette.svg`: derived from [Germany-Outline.svg](https://commons.wikimedia.org/wiki/File:Germany-Outline.svg), by chris / Chrkl, 2010-06-30. The author releases the work into the public domain worldwide, with an unrestricted any-purpose permission where that dedication is not possible. Commercial use is permitted. Source: https://upload.wikimedia.org/wikipedia/commons/f/f2/Germany-Outline.svg. Removed editor metadata and cancelling transforms; retained the single silhouette path, added a responsive viewBox and changed the fill. No internal boundaries or labels. Original metadata also credits Patricia FIDI / openclipart.org, Public Domain.
- `src/assets/graphics/geo-alt-fill.svg`: user-supplied file moved from the repository root, unchanged. Matches [Bootstrap Icons geo-alt-fill](https://icons.getbootstrap.com/icons/geo-alt-fill/). MIT licence retained in `public/licenses/Bootstrap-Icons-MIT.txt` from https://raw.githubusercontent.com/twbs/icons/main/LICENSE.
- Marker placement is approximate, based on Fischbach/Rhön at 50.65° N, 10.14° E: https://www.wikidata.org/wiki/Q688059. The visible label and postal address use Fischbach. Both assets are served locally.
- Reviewed `public/robots.txt`: no route, indexing, photographic-asset policy or sitemap-location change is needed for these SVG graphics.

## Local typography — reviewed 2026-10-13

- `src/assets/fonts/lora-variable.ttf`: user-supplied Lora 3.008 variable font, moved unchanged from `Lora-VariableFont_wght.ttf` in the repository root. Used for all website text; weight axis 400–700. Headings and body text differ by size and weight.
- Embedded name records confirm Copyright 2011 The Lora Project Authors (https://github.com/cyrealtype/Lora-Cyrillic), Reserved Font Name "Lora", and SIL Open Font License 1.1. Full copyright notice and license bundled at `public/licenses/Lora-OFL-1.1.txt`; verified against https://github.com/google/fonts/blob/main/ofl/lora/OFL.txt.
- Commercial website embedding and redistribution with the copyright/license notice are permitted. The original binary and embedded notices are unchanged; no subset, conversion or renamed derivative is distributed. The license applies to the font and does not relicense website content.
- Cinzel and Cormorant Garamond masters, derivatives, notices and the old subset generator were removed. Lora is hosted locally; no external font requests, accounts or tracking are introduced.
- Reviewed robots.txt and existing Open Graph/JSON-LD: routes, representative photography, page purpose, factual content and indexing policy are unchanged; existing metadata remains applicable. The shared modification date is 2026-10-13. Preview and production release safeguards remain active.

## Real photography placement — reviewed 2026-09-27

User-supplied photographs from `OldtimermanufakturFotos_2` were converted to
approximately 3 MP WebP (quality 82), retaining source IDs in
`src/assets/oldtimer/oldtimermanufaktur-fotos-2/`. Original JPEGs and the conversion
manifest remain locally in `.cache/image-originals/oldtimermanufaktur-fotos-2-2026-09-27/`.
That ignored backup is not the permanent internal rights-evidence archive.

- Handwerk: `DSC00172` / `DSC00171` replace both synthetic Motorbau images;
  `DSC00189` supplements the existing real Polsterei photographs. At the user's
  specific request, `DSC00878` replaces the rear Lackiererei photograph
  (`L1005678`); `L1005705` remains and `DSC00572` is added.
- Über uns: `DSC00776` replaces Mario's synthetic portrait; the accompanying
  synthetic car image is removed. `DSC00649` / `DSC00382` replace Anton's two
  placeholders. `DSC00806`, `DSC00096`, `DSC00104`, and `DSC00517` replace the
  synthetic team collage. Mario's photograph now represents this page in Open
  Graph; both Person nodes use their respective real portraits.
- Projekte: `DSC00081` (body under restoration), `DSC00624` (finished vehicle
  details) and existing `fahrzeugangebote/73-emw-327-2-1954/image-001.jpg`
  replace the three synthetic covers. The latter remains in its vehicle folder
  unchanged. The restoration photograph also supplies the page's Open Graph image.
- German and English image alternatives describe the real subjects. Remaining
  synthetic imagery, preview disclosures and production release safeguards remain.
- This records the requested development-preview placements, not new evidence of
  copyright ownership or individual releases. Associate the newly supplied images
  with photographer, usage and identifiable-person releases in the internal register
  before production release. No deployment is authorized by this change.
- Reviewed robots.txt: existing WebP/JPEG rules, route permissions and the production
  sitemap reference still apply; no policy change is needed.

### Follow-up placements and layout — 2026-09-27

- The user approved `DSC00113` (workshop work) and `DSC00445` (team discussion)
  for Kontakt, replacing both synthetic exterior/entrance images. Alternatives
  now describe the workshop scenes, not exterior views. These photographs are
  covered by the same pending source/release documentation noted above.
- Polsterei and Lackiererei each group all three real photographs in a left-hand
  parallax collage. The Team montage is compact; desktop project covers now use
  landscape image areas instead of full-height portrait crops. Mobile project
  presentation is preserved. Representative Open Graph images and Person images
  remain accurate; no business facts, routes or crawler policy changed.

### Revised project covers and Team collage — 2026-09-28

- Restored the full-height, three-panel Projekte composition. Portrait originals
  `DSC00407`, `DSC00909`, and `DSC00123` replace the previous cover choices;
  these are illustrative category images, not new statements about a particular
  vehicle's availability or restoration status in the catalogue. The project
  page's representative metadata now uses `DSC00407` with a factual description.
- Restored overlapping Team photographs with distinct parallax speeds, keeping
  all four previously approved subjects and a bounded, smaller collage height.
- Existing pending rights documentation and release safeguards still apply.
  Reviewed robots.txt: image formats, route access and sitemap location unchanged.

## Approved cleanup — 2026-09-28

The 28 AI-generated/AI-assisted image files, including the synthetic leather tile,
were removed. Earlier sections record their historical use, not the current media
inventory. The background now uses the unchanged real `L1007006.webp` photograph.
The owner confirmed `hero-site`, `handwerk`, `ueberuns`, and `projekte` are real
footage; all video sources, posters and motion fallbacks remain unchanged. All real
photographs, including unused photographs and the original-photo backups, remain.

At that review, Cinzel and Cormorant Garamond were served as local WOFF2 derivatives of their retained
TTF masters. FontTools 4.66.0 performed container compression without subsetting;
glyph order, Unicode maps and variable axes were verified against the originals.
The existing OFL licenses remain published. Jost and its unused license were removed.
These changes do not constitute production approval or new rights evidence.

## Release media review — 6 October 2026

Maintain media permissions and approvals in this register against original
photographs, video masters and other asset families. Record the source/master ID,
evidence reference, named approver, approved scope and date. Include website use,
crops, responsive derivatives and social previews in the approved scope where
applicable; generated variants can share the evidence for their original.

Before a release, compare the actual root-build media with the approved originals
and asset families, including video fallbacks/posters, branding, fonts, inline
graphics and any delivered but unused files. A temporary build inventory may assist
that review. No permanent per-derivative CSV is maintained; its removal does not
approve any assets or close the outstanding evidence requirements.

The current header/schema logo is
`src/assets/oldtimer/brand/OTM_oldtimermanufaktur_Logo_v07.png`. Its responsive
derivatives and the existing vehicle-signet favicon family need original/brand
permission evidence. Earlier monogram statements have been corrected. Historical
AI-placeholder and leather-tile sections above describe removed assets, not today's
publication inventory. The background is real `L1007006.webp` photography.

All 157 vehicle records were inventoried. Their 3,066 gallery occurrences use 3,021
distinct image hashes; 153 records contain galleries and four contain none. Actual
photographs were reviewed to author German and English visible-subject alternatives.
This accessibility work supplies no new rights evidence. Captions, vehicle copy,
routes, image order and filenames were preserved.

Font licence files and documented map-icon provenance remain evidence to verify,
not automatic production approval. The company-wide media statements already
recorded above remain intact, but original/creator/release linkage is still missing.
The [production release checklist](PRODUCTION-RELEASE-CHECKLIST.md) records these
evidence requirements, responsible roles and the final-host acceptance gate.

## Editorial photo selection — 23 October 2026

The preview reuses existing local library photographs; no images were generated.
Updated placements are Mario (`oldtimermanufaktur-fotos-2/DSC00803.webp`), team
(`oldtimermanufaktur-fotos-2/DSC00445.webp`, `L1005486.webp`, `L1005816.webp`),
contact (`L1005735.webp`, `oldtimermanufaktur-fotos-2/DSC00439.webp`), bodywork
(`L1005486.webp`, `oldtimermanufaktur-fotos-2/DSC00081.webp`) and the two added
mechanical detail photographs (`oldtimermanufaktur-fotos-2/DSC00171.webp`,
`oldtimermanufaktur-fotos-2/DSC00207.webp`). All paths are below
`src/assets/oldtimer/`. Existing production evidence and approval requirements
remain pending; this placement record does not establish new rights clearance.

## Motor Klassik team photograph — preview use, 23 October 2026

- Original: `Motor Klassik Internet/Querformat/MKL_PORTRAIT_KFZ_MEISTER_ANTON_SCHRANK_AB-5959.jpg`.
- Derivative: `src/assets/oldtimer/motor-klassik/querformat/MKL_PORTRAIT_KFZ_MEISTER_ANTON_SCHRANK_AB-5959.webp`.
- The user explicitly requested this image for the Über uns team section. It is the
  principal team photograph and the page's Open Graph/structured-data image in the
  development preview; German and English versions share the photograph.
- Original/derivative hashes and encoding details: `audits/media/motor-klassik/manifest.json`.
- Production evidence remains pending: photographer/rightsholder, website/social-preview
  usage scope, required credit and applicable permissions for recognizable people.
  This preview-use request does not close the production media-rights release gate.
