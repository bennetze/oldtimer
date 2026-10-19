# Vehicle editing and checked website imports

The offline editor is `../oldtimer-intern/index.html`. Open it directly in a
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
a German explanation. Unsafe imported records are rejected rather than silently
rewritten. Images must decode as JPEG, PNG, WebP or AVIF, match their filename type,
and remain within the documented UI limits. All order values must be safe integers
and unique within their category; automatic beginning/end values are negative/positive.

## German and English authoring

The editor UI is German. Enter both languages in the paired Deutsch / English
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

German-only folders must be completed with authored English before importing.
The editor and checked website importer reject incomplete bilingual records. Existing website records were
migrated using the existing English translations without changing their dates.

## Media review for new or replaced vehicles

The internal editor exports website source files; it does not approve media rights
or update a release inventory. Before publication, add or update the original/master
or enumerated media-family record in [MEDIA-RIGHTS-REGISTER.md](MEDIA-RIGHTS-REGISTER.md).
Identify the vehicle route and source filenames, creator/rights holder, permitted
website/derivative/social-preview uses, restrictions, private evidence reference,
named approver and date. Assess recognisable people and identifying/private details
where applicable. Keep personal evidence in the private archive, not in vehicle JSON.

Enter photograph-specific German and English alternatives for every gallery
occurrence. New gallery alternatives start empty; the editor identifies missing
text before export. Numbered placeholders are rejected by the
editor, checked importer and website validator, with the affected image and
language identified. The final build retains the same accessibility check. Saving a vehicle does not update `dist`; after
building, reconcile the final release media against the approved originals/families
using [PRODUCTION-RELEASE-CHECKLIST.md](PRODUCTION-RELEASE-CHECKLIST.md). Generated
variants can share their original's evidence within the approved scope. No CSV,
new vehicle fields or separate evidence attachment in the editor is required.

## ZIP export and manual transfer

The internal editor no longer saves vehicle files into the project. Select the
website project, create/edit the vehicle, then choose **Prüfen & exportieren** and
**ZIP erstellen**. Export automatically checks the selected project for conflicting
routes, duplicate order values and external changes. **Änderungen prüfen** provides
the same read-only review beforehand. Project selection requests read access;
historical transaction recovery is a separate action.

For a new car, extract the ZIP outside the website repository. Inside its category
folder, copy **both** `<slug>.astro` and the sibling `<slug>/` folder into
`src/pages/projekte/<category>/`. Do not nest the category folder or replace the
whole archive. If the destination already exists, open that exact vehicle in the
editor rather than overwriting it as a new car. Back up the exact original pair
before an intentional manual replacement.

After copying, run from the website repository:

```sh
npm run vehicles:sync
npm run build
```

Review the sitemap diff. Use `npm run build:pages` for the GitHub Pages preview.
The sync step is required because ordinary builds validate the tracked sitemap
without rewriting source. The editor does not run these commands or publish.
Refresh its project list after transferring files before exporting further cars.

A category move needs removal of the original pair and redirects for the old URLs;
the ZIP contains only the new vehicle pair. Use the interactive transfer below and
select the displayed original vehicle for moves. Its backups and crawler updates
also make it an alternative to manual copying for additions or replacements.

## Review, then apply

### Simple interactive transfer (recommended)

For new vehicles, category moves, content edits, or both, extract the ZIP outside
the website repository, then run the same command from the website root:

```sh
npm run vehicles:transfer
```

Drag the extracted folder into the terminal when prompted and press Enter. Either
the export's enclosing folder or its category folder works.
Finder/Windows collision suffixes such as `fahrzeugangebote 4` and
`fahrzeugangebote (2)` are accepted; you do not need to rename these folders.
The wizard reads the destination from the validated export. If an existing vehicle has the same slug,
select its displayed number; the title, category and exact original route are shown.
An empty or invalid selection cancels. Replacements are never approved from a title
match or applied without explicitly selecting the original.

The command uses short German status messages and asks for confirmation with `JA`.
It does not create or open an extra review page. Any other answer cancels without writes. This
uses the same checked importer and rechecks the review before applying. The explicit
path and `--from` options remain available for technical users, but the wizard needs
neither. Piped confirmation is refused.

The command retains backups, transfers the pair, removes the original pair for a
move, updates redirects for both languages, synchronizes the sitemap, and updates
existing vehicle links in `llms.txt`. Do not copy or delete vehicle files yourself;
no separate `vehicles:sync` is needed for this workflow. Then run `npm run build`
(and `npm run build:pages` for the preview), publish separately, and refresh the
editor's vehicle list. The command never builds or publishes automatically.

After committing, transfer also prepares the production gallery derivatives and
metadata required by the development preview. `npm run dev` now keeps a foreground
preview process, pauses it while a transfer writes, and restarts it after the gallery
is ready. This reloads the vehicle collection and both language routes together.
Old vehicle links redirect in dev as well as in the built website. Reload the browser
after the transfer finishes; you do not need an extra gallery command or manual
dev restart for each car. Stop the preview with Ctrl+C. A newly started preview also
checks its image data, so exports made before this fix can be previewed.

Damaged generated gallery metadata is preserved and regenerated from validated
source. Symlinks and invalid vehicle content still fail closed. If vehicle files
were saved but preview preparation fails, the command explicitly reports that the
vehicle is saved, retains its backup and pauses the preview. Fix the reported cause
and start `npm run dev` again; do not import it again as a new vehicle. An interrupted
import lock must be recovered using the procedure below before previewing.

### Delete a vehicle

Run this command from the website root; no ZIP or options are needed:

```sh
npm run vehicles:delete
```

Enter a search term (or press Enter to list all vehicles), select the vehicle's
number, check the displayed title and exact category/slug, then type `JA` to delete
it. `0`, an invalid selection, or any other confirmation cancels. The command uses
short German messages and does not open another browser page.

Deletion removes the paired Astro page and source folder, removes redirects that
point to that vehicle, updates both languages' sitemap and affected `llms.txt`
links, and refreshes gallery assets and the running development preview. Other
vehicles are retained. The removed vehicle and changed crawler files are backed
up in the printed `.cache/vehicle-import-backup-*` folder. Retired vehicle URLs
return 404; deletion does not invent a replacement vehicle or redirect target.

Reload the browser and refresh the editor's vehicle list afterward. No separate
sync or gallery command is needed. Build and publish separately to remove the car
from the published site. If deletion succeeded but preview preparation failed,
fix the reported cause and restart `npm run dev`; the car is already deleted and
its backup remains available. The same lock and recovery rules below apply.

### Separate check and apply

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

## Hardened editor/import contract

The browser and CLI enforce 2 MiB JSON, 50 MiB and 100 megapixels per image,
2000 vehicle-folder files and 512 MiB payload. Filename components must fit within
255 ASCII bytes and exclude Windows device names. Image stems are reserved without
case sensitivity, including the WebP destination. The Astro route suffix also
counts toward the filename limit. Unknown record, block and gallery-image fields
are rejected rather than silently stripped by the content schema.

Rollback checks lock ownership, current hashes and backup hashes again before each
mutation. Conflicting external edits stop recovery and retain the lock and backup.
A completed browser journal is only finalized/unlocked: obsolete backups are not
restored or required. A cleanup failure after durable commit is reported as saved
with pending unlock. Selecting another project with pending recovery leaves the
current project and draft intact until that candidate is successfully loaded.

Editor fixtures resolve `../oldtimer-intern/index.html` relative to the test code.
Set `VEHICLE_TOOL_PATH` to an alternate editor's absolute `index.html` path. Missing
editors fail explicitly. Browser harnesses remain test-only; native folder-picker
and platform acceptance must be checked separately. Gallery cache v3 validates
manifest routes, derivative metadata and filesystem boundaries before reuse.

## Vehicle display and editor compatibility (2026-10-07)

Every vehicle's `vehicle.json` is the sole source of its text, image references and
reading order. The website displays `blocks` in the exact saved order. Copy, contact
and photo runs stack vertically on desktop and mobile. Consecutive gallery blocks
form one uninterrupted photo run, ending at the next copy or contact block. Photos
display in one column below 760px, up to two from 760px and up to three from 1100px,
with a maximum display width of 420px. Reading order stays left to right, then down. Captions stay under their
own image. The lead image appears separately only when it is not already used in
a gallery. Selecting an existing gallery photo as the lead therefore avoids a
second copy above the story while still supplying representative metadata.

The old-site migration restored 72 German passages and 244 photographs. Its
reviewed relationships have been converted into ordinary ordered vehicle blocks,
including smaller gallery blocks where text belongs between photo sets. All
German/English wording and photo occurrences were retained. There is no central
layout manifest, signature fallback or mandatory old-site audit snapshot.

The existing offline editor can load, edit and export these records, including category changes
using its current contract. Category moves carry the complete story with the
vehicle folder; text edits do not invalidate presentation data. Historical source
comparisons are migration work, not a requirement for owner-authored new cars.
See `EDITOR-COMPATIBILITY-TODO.md` for suggested editor preview/documentation work.

Verify normal maintenance with the contract, import and project-save tests, browser
editor and ZIP-workflow harnesses and both website builds. Build checks compare the rendered block
sequence directly with each current vehicle record, without assuming a fixed
vehicle inventory. Do not introduce sidecar content files without supporting them
in the editor, importer, backup/recovery and ZIP contracts first.


## Optional editor presentation controls

The offline editor now offers **Text neben Bild** with a left/right text selector,
one image and paired German/English rich text. Its image controls retain per-use
alternatives and captions. Mobile views stack the pair. The stored gallery block
has optional `textSide: "left" | "right"`, `html` and `htmlEn`; side-text blocks do
not merge with adjacent galleries. Existing records need no changes.

Gallery occurrences optionally store `size: "small" | "medium" | "large"`.
Small keeps the existing presentation, medium reaches 840 px and large spans the
browser width. In a side-text block, image and text share the available width.
Fixed color spans use `class="om-color-black"` (or red, green, blue, cyan, yellow,
magenta); arbitrary CSS remains rejected by the checked importer.

The **Wasserzeichen für alle Bilder** checkbox immediately enables the preference.
Only ZIP download or saving through Website-Werkzeuge creates watermarked WebP output
copies, including the card. Editing, image import and read-only review keep original
bytes, filenames and previews. Local Lora lettering reads `oldtimermanufaktur.de` in
black or white according to the lower background, with a thin contrasting outline.
Unchecking uses originals for output; importing another vehicle resets the checkbox.
Failed processing preserves the draft. Existing baked-in watermarks cannot be removed.
Transfer, build and publishing remain separate.


## Authoring and presentation contract (2026-10-18)

Direct `file://` use remains offline: review and ZIP export never write source files or run commands. The optional local Website-Werkzeuge launcher supports confirmed checked saves and deletion, plus separate preview, build and publication actions. Saving prepares assets and restarts a supervised preview; it does not build `dist` or publish. Publication always requires its own confirmation. Historical browser recovery remains separate from new saves.

The Standard-first palette is white `#ffffff`, red `#ff9aa2`, green `#8dd9ac`, blue `#a7c7ff`, cyan `#81dbe8`, yellow `#f5dc7b` and magenta `#e6a4db`. The existing `om-color-black` class means readable Standard white. No vehicle migration is needed; old palette values normalize to the corresponding restricted class when edited. Arbitrary CSS remains forbidden and unchanged imported HTML is retained.

Block removal supports **Letzten Block wiederherstellen** for the last 20 removals in the current draft, without a timer. Restoration uses surviving neighbours and preserves later edits. Images intentionally removed from the pool are omitted with an explanation. Switching successfully to another vehicle clears this history; native text undo remains independent. Moves and removals restore keyboard focus and announce the result.

Decoded source dimensions are shown beside card and gallery images. Nonblocking review warnings recommend 480 px for cards/standalone lead images, 420 px for small gallery images, 840 px for medium and 1200 px for large. These hints never change image bytes or replace hard validation. Both descriptions have independent labelled 500-character counters. Category labels use **Abgeschlossene Projekte** while the technical key stays `vergangene-projekte`.

The sandboxed offline preview uses local `vehicle-presentation.js` with immutable presentation data, embedded Lora and decorative texture. It matches centered ordinary copy, left-aligned side text, dark story background, cream/green transitions, contact styling and responsive image sizing. The website keeps local equivalents; cross-project regressions enforce parity. Runtime use never requires the sibling repository. Keep the presentation, watermark and font licence assets together.

Redirects preserve explicit URL language queries. The website does not store language preferences: explicit `lang=de`/`lang=en` takes precedence over the route and browser language. Development redirects run before Astro request normalization. Static redirect HTML retains a no-JavaScript meta refresh and visible fixed destination, plus a CSP-hashed script forwarding the incoming query and fragment when JavaScript is available.
