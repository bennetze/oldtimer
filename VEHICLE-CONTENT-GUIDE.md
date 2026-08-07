# Fahrzeugseiten verwalten

Die Projektarchive werden beim Build aus den direkten `.astro`-Dateien ihrer
Kategorie ermittelt. Es gibt keine zentrale Fahrzeugliste.

## Fahrzeug hinzufügen

Für ein neues Fahrzeug werden genau zwei gleich benannte Geschwister angelegt:

```text
src/pages/projekte/aktuelle-projekte/
├── 200-beispiel-fahrzeug.astro
└── 200-beispiel-fahrzeug/
    ├── vehicle.json
    ├── card.jpg
    ├── image-01.jpg
    └── …
```

Die `.astro`-Datei kann von einem bestehenden Fahrzeug derselben Kategorie kopiert
werden; lediglich die Kennung in `getEntry()` wird angepasst. `vehicle.json` enthält
die Sortierung und alle Inhaltsblöcke. Sämtliche referenzierten Bilder müssen direkt
im gleich benannten Ordner liegen.

`order` ist eine innerhalb der Kategorie einmalige ganze Zahl. Kleinere Werte werden
im Archiv früher angezeigt. Bestehende Fahrzeuge verwenden positive fortlaufende
Werte; neue Fahrzeuge können für eine automatische Position am Anfang negative und
für eine automatische Position am Ende große positive Werte verwenden.

Für andere Archive gilt dieselbe Struktur unter `vergangene-projekte` oder
`fahrzeugangebote`. Ein Fahrzeug wird entfernt, indem seine `.astro`-Datei und sein
gleich benannter Ordner gemeinsam entfernt werden.

## Validierung

```sh
npm run test:vehicle-discovery
npm run vehicles:sync
npm run build
```

Der Build bricht bei ungleichen Datei-/Ordnerpaaren, fehlenden Datensätzen oder
Bildern, falschen Kategorien, doppelten Sortierwerten und doppelten Routen mit einer
konkreten Fehlermeldung ab. Sitemap und `llms.txt` werden dabei automatisch aus dem
validierten Bestand neu erzeugt.
