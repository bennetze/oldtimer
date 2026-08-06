# Medienrechte-Register

**Stand:** 6. August 2026
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
| Alle übrigen Dateien in `src/assets/oldtimer/` | KI-generierte Entwicklungsplatzhalter | Nur als klar gekennzeichnete Entwicklungsvorschau | Nicht für die finale Veröffentlichung vorgesehen | Verwendetes KI-System und Konto, Erstellungsdatum, geltende Nutzungsbedingungen/Lizenz, Prompts/Job-IDs soweit vorhanden; anschließend dokumentierte Entfernung/Ersetzung |
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
