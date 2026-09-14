# Vehicle editing and checked website imports

The offline editor is `../oldtimer-fahrzeuge/index.html`. Open it directly in a
browser. No vehicle content leaves the browser until you download the ZIP.

## Create or edit

For an existing vehicle, choose its folder containing `vehicle.json` and all local
images, or select those files together using the fallback picker. Validation must
complete before the current form is replaced. Accompanying Astro files are never
executed. Imported filenames, bytes, date, order, lead selection, block sequence,
and each gallery occurrence's alternative text and caption are preserved. Repeated
references may be intentional. The slug is locked while editing.

A category change shows the old and new routes. Keep the existing order unless a
different position is intended; the website importer checks target-category order
collisions. Choose today's date explicitly when the content has changed. Existing
legacy source URLs remain unchanged on an unchanged route; new vehicles and category
moves use the canonical `/projekte/<category>/<slug>/` URL.

Rich-text paste uses the website allowlist. Unsupported formatting is removed with
an English explanation. Unsafe imported records are rejected rather than silently
rewritten. Images must decode as JPEG, PNG, WebP or AVIF, match their filename type,
and remain within the documented UI limits. All order values must be safe integers
and unique within their category; automatic beginning/end values are negative/positive.

## German and English authoring

The editor UI is English. Enter both languages in the paired Deutsch / English
fields. A block has one position and two independent rich-text editors. Gallery
images and their order are shared, with separate alternative text and captions per
language and per occurrence. Required text must be complete in both languages.
Captions may be omitted in both; entering one requires its counterpart.

The JSON keeps German in `title`, `description`, `cardImageAlt`, `leadImageAlt`,
block `html`, and gallery `alt`/`caption`. Their English counterparts are `titleEn`,
`descriptionEn`, `cardImageAltEn`, `leadImageAltEn`, `htmlEn`, `altEn` and `captionEn`.
Images are exported only once. The website renders German at the original route and
English at `/en/` plus that route; do not create separate English folders or pages.
Model names may legitimately be identical in both languages.

For an old German-only folder, explicitly select the legacy-import checkbox. The
tool preserves its German content and leaves English empty. Complete all English
fields before export. The checked website importer rejects incomplete bilingual
records; the legacy option is confined to authoring. Existing website records were
migrated using the existing English translations without changing their dates.

## Review, then apply

Extract the downloaded ZIP into a temporary directory **outside** this repository.
Never extract it over `src/pages/projekte`. It contains the existing paired layout:

```text
<category>/
├── <slug>.astro
└── <slug>/
    ├── vehicle.json
    ├── card.jpg
    └── other-local-images.jpg
```

From the website repository, check the extracted category directory:

```sh
npm run vehicles:review -- check /absolute/temp/aktuelle-projekte
```

For an intentional replacement or category move, include the exact original route
in both commands, for example `--from aktuelle-projekte/example-car`. Similar titles
never authorize a replacement. Review the complete added/changed/removed file list,
SHA-256 hashes and before/after text (including metadata and crawler files). The
`from` and `to` fields identify moves. The supplied Astro wrapper is discarded and a
trusted wrapper is generated locally.

Vehicle presentation comes from `src/components/VehicleDetailPage.astro`, including
the shared leather background texture (875px repeat, 25% opacity). Existing vehicles
and new generator imports inherit it in both languages; do not add texture assets,
styling, or new fields to individual vehicle exports.

After approving that exact review, apply using its token:

```sh
npm run vehicles:review -- apply /absolute/temp/aktuelle-projekte --approve TOKEN
```

Include the same `--from` when replacing or moving. Any source or destination change
invalidates the token. Stop other repository editing during application. Then run:

```sh
npm test
npm run build
npm run build:pages
```

No command above commits or publishes. `npm run vehicles:sync` explicitly refreshes
the sitemap after manual route/date changes. Ordinary builds only check source
crawler files; `llms.txt` is maintained manually. Checked moves update existing LLM
links and `src/config/vehicle-redirects.json`. Builds create Apache redirects and
noindex HTML redirect pages, respecting both deployment bases and language routes.
Redirects are excluded from vehicle discovery and indexing.

## Failure and recovery

Apply stages validated files and keeps `.cache/vehicle-import-backup-*`. Each backup
contains `review.json` with original/new hashes, `before/` with overwritten/removed
files, and any remaining `stage/` files. `COMPLETED` marks success. Caught write errors
restore the previous bytes automatically. Keep backups until the resulting site has
been checked and an ordinary repository backup exists.

Abrupt termination (power loss, forced process kill) can interrupt multiple-file
replacement; this is not a filesystem-wide atomic transaction. A remaining
`.cache/vehicle-import.lock` prevents another import. Before removing it, ensure no
import process remains, preserve a copy of the affected tree, inspect the newest
backup/review, and restore every listed path from `before/`. For entries whose
original hash is null, remove only the corresponding newly added file after checking
its current hash against the review. Remove empty new vehicle directories, restore
the old pair, and run discovery/crawler checks. If current bytes differ from both
reviewed versions, resolve those edits manually; do not overwrite them blindly.
Only remove the lock after recovery is verified. Run a fresh check for another apply.

## Regression checks

`npm test` exercises cross-project contract compatibility and isolated importer
fixtures, including unchanged/edited round trips, moves, stale approvals, symlinks,
invalid images, unsafe HTML, duplicate orders and simulated rollback.

`node scripts/test-vehicle-browser.mjs` serves a test-only instrumented copy on
localhost, with temporary artifacts and fixture images. Open the displayed URL to
run the browser cases. The distributed editor remains a single dependency-free HTML
file. A complete direct `file://` export and Safari/Firefox keyboard checks remain
separate acceptance checks whenever the test environment cannot perform them.
