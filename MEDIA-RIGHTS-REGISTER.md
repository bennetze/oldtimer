# Medienrechte-Register

**Stand:** 5. September 2026
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
| KI-Motive wie `about-*`, `handwerk-motorbau-*` und die bisherigen synthetischen Projektmotive in `src/assets/oldtimer/` (nicht pauschal alle übrigen Dateien) | KI-generierte Entwicklungsplatzhalter | Nur als klar gekennzeichnete Entwicklungsvorschau | Nicht für die finale Veröffentlichung vorgesehen | Verwendetes KI-System und Konto, Erstellungsdatum, geltende Nutzungsbedingungen/Lizenz, Prompts/Job-IDs soweit vorhanden; anschließend dokumentierte Entfernung/Ersetzung |
| Reale Werkstattaufnahmen `L100*.webp`, insbesondere die auf `/handwerk/` verwendeten Dateien | Neu eingebundene reale Werkstattfotografie | Karosserie, Polsterei und Lackiererei sowie repräsentative Metadaten | Nicht als KI-Platzhalter einordnen; allgemeine Rechtebestätigung der GmbH bleibt dokumentiert | Je Motiv Original-/Urheberzuordnung, Nutzungsumfang und gegebenenfalls Freigaben erkennbarer Personen intern zuordnen; Dateinamensmuster ist kein eigenständiger Rechtebeleg |
| `handwerk`, `ueberuns`, `projekte`: MP4/WebM, Poster und Bewegungs-Fallbacks | Weitere projektlokale Video-Familien; ursprüngliche Produktion und Ableitungen einzeln dokumentieren | Drei zusätzliche bewegte Bereiche der Startseite | Allgemeine Rechtebestätigung bleibt bestehen; konkrete Belegzuordnung und Herkunft pro Familie prüfen | Master, Urheber-/Übertragungsnachweis, reale oder synthetische Herkunft, Personen-/Standortfreigaben soweit erforderlich sowie sämtliche erzeugten Ableitungen zuordnen |
| Zukünftige Aufnahmen des Fotoshootings | Noch nicht erstellt | Finale Personen-, Team-, Werkstatt-, Standort- und Projektbilder | Noch offen | Fotografenvertrag mit ausschließlichen oder ausreichend weiten Nutzungsrechten, Honorar/Rechnung, Rohdateien, Model Releases, Mitarbeitereinwilligungen, Property-/Location-Releases, Fahrzeug-/Kennzeichenfreigaben |
| `public/favicon.svg`, `.ico`, `apple-touch-icon.png` | Im Projekt erstelltes neutrales OM-Monogramm | Browser-/Gerätesymbol der Entwicklungsvorschau | Originäre einfache Projektgrafik; später zu ersetzen | Datum/Urheber dieser Erstellung und spätere Freigabe des endgültigen Unternehmenszeichens |
| `src/assets/fonts/jost-variable.ttf` | Jost Project Authors | Lokale Webschrift | SIL Open Font License 1.1 | Lizenzdatei wird unter `public/licenses/Jost-OFL-1.1.txt` mit ausgeliefert |
| Fahrzeugbilder unter `src/pages/projekte/*/<fahrzeug>/` | Migration der bestehenden Website `oldtimermanufaktur.de`; Quellen je Fahrzeug in `vehicle.json` und `VEHICLE-MIGRATION-AUDIT.json` dokumentiert | Karten, Detailseiten und Open-Graph-Bilder der Projektarchive und Fahrzeugangebote | Auftraggeber bestätigt die Rechte der GmbH zur erneuten Veröffentlichung und Erstellung responsiver Ableitungen | Interne Original-/Urheberzuordnung und vorhandene Freigaben anhand der dokumentierten Quell-URLs ablegen; die im Migrationsaudit ausgewiesene, nur durch korrigierte Dateiendungs-Großschreibung abrufbare Quelle bei der internen Zuordnung berücksichtigen |

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
