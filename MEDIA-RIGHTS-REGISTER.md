# Medienrechte-Register

**Stand:** 28. September 2026
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
| `public/favicon.svg`, `.ico`, `apple-touch-icon.png` | Im Projekt erstelltes neutrales OM-Monogramm | Browser-/Gerätesymbol der Entwicklungsvorschau | Originäre einfache Projektgrafik; später zu ersetzen | Datum/Urheber dieser Erstellung und spätere Freigabe des endgültigen Unternehmenszeichens |
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

## Freigabetabelle für finale Dateien

Diese Tabelle für jedes finale Motiv ausfüllen und die Belege intern unter der
angegebenen Referenz ablegen.

| Webdatei | Original-ID | Urheber | Rechteübertragung/Lizenz | Personen-Release | Standort/Fahrzeug/Kennzeichen | Freigabedatum | Belegreferenz | Final freigegeben |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| _noch offen_ |  |  |  |  |  |  |  | Nein |

## Produktionssperre

Die Produktionsfreigabe bleibt gesperrt, solange eine verwendete Datei keine
ausgefüllte Tabellenzeile und keine auffindbare Belegreferenz besitzt. Für jedes
ersetzte Platzhalterbild müssen außerdem Alternativtext, Open-Graph-Metadaten,
strukturierte Daten, `llms.txt` und der sichtbare Entwicklungshinweis erneut geprüft
werden.

## Contact map assets — reviewed 2026-09-13

- `src/assets/graphics/germany-silhouette.svg`: derived from [Germany-Outline.svg](https://commons.wikimedia.org/wiki/File:Germany-Outline.svg), by chris / Chrkl, 2010-06-30. The author releases the work into the public domain worldwide, with an unrestricted any-purpose permission where that dedication is not possible. Commercial use is permitted. Source: https://upload.wikimedia.org/wikipedia/commons/f/f2/Germany-Outline.svg. Removed editor metadata and cancelling transforms; retained the single silhouette path, added a responsive viewBox and changed the fill. No internal boundaries or labels. Original metadata also credits Patricia FIDI / openclipart.org, Public Domain.
- `src/assets/graphics/geo-alt-fill.svg`: user-supplied file moved from the repository root, unchanged. Matches [Bootstrap Icons geo-alt-fill](https://icons.getbootstrap.com/icons/geo-alt-fill/). MIT licence retained in `public/licenses/Bootstrap-Icons-MIT.txt` from https://raw.githubusercontent.com/twbs/icons/main/LICENSE.
- Marker placement is approximate, based on Fischbach/Rhön at 50.65° N, 10.14° E: https://www.wikidata.org/wiki/Q688059. The visible label and postal address use Fischbach. Both assets are served locally.
- Reviewed `public/robots.txt`: no route, indexing, photographic-asset policy or sitemap-location change is needed for these SVG graphics.

## Local typography — reviewed 2026-09-20

- `src/assets/fonts/cinzel-variable.ttf`: user-supplied Cinzel variable font, used for headings and titles. SIL Open Font License 1.1 bundled at `public/licenses/Cinzel-OFL-1.1.txt`; source: https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/OFL.txt.
- `src/assets/fonts/cormorant-garamond-variable.ttf`: user-supplied Cormorant Garamond variable font, used for body and UI text. SIL Open Font License 1.1 bundled at `public/licenses/CormorantGaramond-OFL-1.1.txt`; source: https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt.
- Both original font files are hosted locally; no external font requests are introduced.

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

Cinzel and Cormorant Garamond are served as local WOFF2 derivatives of their retained
TTF masters. FontTools 4.66.0 performed container compression without subsetting;
glyph order, Unicode maps and variable axes were verified against the originals.
The existing OFL licenses remain published. Jost and its unused license were removed.
These changes do not constitute production approval or new rights evidence.
