# Die Oldtimermanufaktur

Astro-Website der Oldtimermanufaktur.

## Entwicklung

```sh
npm install
npm run dev
```

`npm run build` erzeugt den Build für die Produktionsdomain
`https://www.oldtimermanufaktur.de/`.

## GitHub Pages veröffentlichen

```sh
npm run deploy
```

Der Befehl baut die Website mit dem für GitHub Pages erforderlichen Basispfad
`/oldtimer/` und veröffentlicht den Inhalt von `dist/` automatisch im Branch
`gh-pages`. Ein manuelles Kopieren des Ordners ist nicht mehr nötig.

Die GitHub-Pages-Einstellung des Repositorys muss auf `gh-pages` und `/ (root)`
zeigen.
