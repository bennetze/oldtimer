# Die Oldtimermanufaktur

Static Astro website. Public content is German and English. This is still a
development preview, not an approved production release.

## Development and verification

Use Node >=22.12.0 and npm 11.18.0. Install the reviewed lockfile reproducibly:

```sh
npm ci
npm run dev
npm run test:site
npm test
npm run build
npm run build:pages
npm run security:check
```

`security:check` audits all dependency types and checks registry signatures.
Network access to npm is required. A clean audit only covers currently known
advisories; signatures do not guarantee that package code is safe. Use
`npm outdated --all` when reviewing updates. Keep transitive versions within their
parents' constraints; do not use forced audit fixes. Deprecated `whatwg-encoding`
remains required by Cheerio's encoding helper.

`.npmrc` enforces version-specific install-script approvals in `package.json`.
Review changed lifecycle scripts before approving another version. Do not disable
the policy to make installation pass. The package is private to prevent publishing.

Offline-editor contract tests require the sibling `../oldtimer-intern` checkout.
If absent, those suites fail explicitly; do not skip or remove them. `npm run
test:site` runs website tests and discovery without loading those companion suites.

Builds check metadata, links, bilingual content, CSP and deployment artifacts.
Keep credentials, photo backups, tooling, dependencies and source maps out of
`public/`. The artifact gate rejects common leaked files, credential patterns and
server executables; it is not a complete secret scanner.

The old `vehicles:import` migration command is disabled. Its extraction code is
retained as a non-executable historical reference. Use `vehicles:review` and the
checked approval-token workflow for imports; never rerun the historical migration.

## Assets

All real photographs, including unused photos, are retained. Original-photo
backups under `.cache/image-originals/` must not be removed as ordinary cache.
Current gallery derivatives use `.cache/vehicle-gallery-v3/` and are reproducible.
The internal manifests record source and derivative hashes, encoding settings and
image dimensions. Builds verify cached and published bytes before reuse and replace
changed files atomically. Original 1600px-or-smaller URLs remain stable. Cards also
have 480px/960px variants; production details have an 800px variant where useful.
GitHub Pages details retain their existing sizes and gallery limit.
After editing source images during a running dev session, run `npm run vehicles:gallery`
to refresh derivatives; the development metadata cache notices the changed manifest.
Vehicle collections are cached only in production builds.

WOFF2 fonts are lossless container conversions of retained TTF masters, with full
glyph coverage and variable axes. FontTools 4.66.0 with WOFF dependencies generated
them using `TTFont`, `flavor = 'woff2'`, and `save`. No runtime font conversion or
external font service is involved. Preserve the published licenses.

## Hosting and release

`npm run build` targets `https://www.oldtimermanufaktur.de/`.
`npm run build:pages` targets the `/oldtimer/` GitHub Pages base and preserves preview
noindex behavior. Deploy only generated `dist/`, never the repository root.

```sh
# Publishes only when explicitly requested:
npm run deploy
```

This builds and publishes `dist/` to the `gh-pages` branch. GitHub Pages must use
that branch's root. Builds and security checks do not deploy on their own.

Apache `.htaccess` provides security headers, text compression, one-year immutable
caching for hashed `_astro` assets, and revalidation for HTML and stable gallery
URLs. GitHub Pages ignores these directives. Validate real headers, MIME types,
compression, redirects and error responses on the final host before release.
The localized page CSP is placed immediately after the charset, before scripts
and resource links. Keep the Apache header CSP and hashed page CSP together; removing inline allowances
from the header without accounting for inline scripts would break the website.

The production domain still served Joomla/K2 during the 2026-09-28 audit. A future
approved release must retire or isolate the old PHP application, not leave its
executables behind the static site. Repository cleanup does not secure that server.
Complete factual, media-rights and legal approval before disabling preview flags.

See [WEBSITE-REPAIR-AUDIT.md](WEBSITE-REPAIR-AUDIT.md) for the repair register and verification limits.
