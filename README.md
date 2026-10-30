# Die Oldtimermanufaktur

Static Astro website. Public content is German and English. The website is
published on IONOS.

For a German interface to preview, vehicle transfer/deletion, builds and IONOS
publication, open the `Bearbeitung` launcher in the parent folder for your operating system
or run `npm run tools`. Keep the `Website` and `Intern` folders beside each other;
the editor's [README](../Intern/README.md) describes the workflow.

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

Offline-editor contract tests require the sibling `../Intern` checkout.
If absent, those suites fail explicitly; do not skip or remove them. `npm run
test:site` runs website tests and discovery without loading those companion suites.

Builds check metadata, links, bilingual content, CSP, deployment artifacts and static
accessibility invariants.
`npm run audit:accessibility` scans existing built output;
`npm run preview:accessibility` serves local compatibility/spacing fixtures.
These checks do not establish WCAG conformance or universal compatibility.
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
changed files atomically. Original 1600px-or-smaller URLs remain stable. Production HTML uses SHA-256 delivery aliases for immutable caching; GitHub Pages keeps stable delivery URLs to preserve its artifact budget. Cards also
have 480px/960px variants; production details have an 800px variant where useful.
GitHub Pages details retain their existing sizes and gallery limit.
After editing source images during a running dev session, run `npm run vehicles:gallery`
to refresh derivatives; the development metadata cache notices the changed manifest.
Vehicle collections are cached only in production builds.

The website uses the locally hosted, unmodified Lora 3.008 variable TTF supplied
for this project (`src/assets/fonts/lora-variable.ttf`, weight axis 400–700).
Homepage headings use bold weight (700), subpage headings medium weight (500),
and body copy regular weight (400), with responsive sizes.
No external font service is involved. The font retains its original embedded
copyright/license metadata and reserved name. Its complete SIL OFL 1.1 license
and copyright notice ship at `/licenses/Lora-OFL-1.1.txt`. Commercial website use
and embedding are permitted under that license; it applies to the font, not site
content. Do not subset or modify it under the reserved name without permission.
Upstream: https://github.com/cyrealtype/Lora-Cyrillic
License: https://github.com/google/fonts/blob/main/ofl/lora/OFL.txt

## Hosting and release

`npm run build` targets `https://www.oldtimermanufaktur.de/`.
`npm run build:pages` targets the `/oldtimer/` GitHub Pages base and preserves preview
noindex behavior. Deploy only generated `dist/`, never the repository root.

```sh
# Publishes only when explicitly requested:
npm run deploy
```

This builds the production website and uploads the **contents** of `dist/` directly
to `/` of the IONOS SFTP account, including `.htaccess`. It never pushes to GitHub.
The editor's “Bei IONOS veröffentlichen” action runs this same command after its
separate confirmation. Builds and security checks do not publish on their own.

Copy `.env.ionos.example` to `.env.ionos` and fill in the dedicated SFTP username
and password locally. Quote passwords containing `#` or spaces. Alternatively set
`IONOS_PRIVATE_KEY` to an absolute private-key path. Environment variables override
the local file. `.env.ionos` is ignored by Git and never included in `dist/`; keep
it private and do not send it with the project. The launcher reads it on each run.

`npm run deploy:check` tests login and lists `/` without changing remote files.
`npm run deploy -- --dry-run` builds and validates output without uploading.
The client verifies the server against the published IONOS SSH fingerprints.
Disposable `.DS_Store` and `Thumbs.db` files are stripped before upload. Destination
checks and transfers use up to eight parallel requests and report progress.
Uploads use a temporary file and atomic rename for each destination, with assets
before HTML. Publishing is not an atomic whole-site switch: a failure can leave a
partial update; rerun publishing to finish. Files absent from `dist/` are left
untouched, including any old application files. Domain/DNS settings are unchanged.
A `/.website-deploy.lock` directory prevents concurrent deployments; after an
interrupted run, verify that no upload is active before removing that lock manually.

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
Keep factual, media-rights and legal evidence in the internal project records.

## Performance

Run `npm run audit:performance` for a local browser audit. Generated reports go
in the ignored `.codex-qa/performance/` folder.
