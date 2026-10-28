# Local website tools

The tools provide a German browser interface for preview, vehicle transfer,
vehicle deletion, production builds and GitHub Pages publication. The launcher opens the existing vehicle editor;
these actions continue its sixth step, **Prüfen & speichern**, with preview/build actions below the save controls. They are never included in the published website. Opening the
editor directly via `file://` still provides the offline authoring/ZIP workflow.

## Start

Keep this layout together when moving or handing off the project:

```text
Website/                       # parent folder; no Git repository here
├── Bearbeitung.command        # macOS
├── Bearbeitung.cmd            # Windows
├── Bearbeitung.sh             # Linux
├── Website/                   # oldtimer Git repository, including .git
└── Intern/                    # oldtimer-intern Git repository, main branch
```

The GitHub repository names and remotes stay unchanged. Keep the demo checkout
separate; never switch `Intern` to `demo`. The launcher validates the complete
internal editor before exposing website actions.

Install Node.js and npm matching `Website/package.json`, then run `npm ci` once
inside the inner `Website` folder on each destination computer. Do not transfer
`node_modules` between operating systems. Git authentication is needed only for
GitHub publication. The editor itself needs no dependencies.

- macOS: double-click `Bearbeitung.command` in the parent folder.
- Windows: double-click `Bearbeitung.cmd` in the parent folder.
- Linux: run `Bearbeitung.sh` in the parent folder; double-click behavior depends
  on the desktop's file-manager settings.
- Alternatively: run `npm run tools` inside the inner `Website` folder.

All three launchers resolve the website relative to their own location, including
paths containing spaces. When selecting the project in the editor, choose the
**inner Website folder** containing `package.json`, `src` and `public`.
Keep the terminal open. Moving the project requires stopping tools/preview first.

The launcher templates are versioned in `Website/scripts/launchers/`. After an
update, regenerate the parent copies by running `node scripts/install-launchers.mjs`
inside the inner website folder. The parent folder does not need a third Git repo.

The launcher opens the default browser. If it cannot, open the link printed in its
terminal window. Keep that window open. `Ctrl+C` stops the panel and its preview;
closing just the browser tab leaves them running. A vehicle operation already
applying changes completes before shutdown, so stopping the tool does not interrupt
the checked transaction. An abrupt OS shutdown still requires the existing import
lock/backup recovery procedure.

After an editor update, stop the previous launcher with `Ctrl+C` and reopen it.
Each running launcher keeps the full set of editor assets it loaded at startup,
so later checkout changes cannot mix scripts from different versions. The embedded
font is permitted locally for watermark and draft previews; no remote fonts load.

## Workflow

Select the launcher website folder in editor step one, then select/create and edit
vehicles through the existing six steps. The launcher checks the selected source
snapshot against its own website before accepting it. The full launcher path is
shown; commands always operate there. Identical copies may share a snapshot, so
choose the displayed folder.

In the final step:

1. Review the sandboxed vehicle preview. The optional **Änderungen prüfen** action
   remains read-only.
2. Click **Im Projekt speichern**. The editor validates its current immutable record
   and image snapshot, then stages the paired page/folder automatically outside the
   website. There is no ZIP download, extraction or folder re-selection.
3. The exact original selected earlier and destination route appear before **JA**.
   The direct save never guesses replacement from a slug/title. New drafts fail on
   destination collisions; edits/moves use the selected exact original. A changed
   loaded project snapshot invalidates the operation, including changes during staging.
4. Confirmation applies the existing checked transaction with backups, rollback,
   crawler/redirect updates and preview assets. Source success with preview failure
   is reported accurately; fix its cause and restart preview rather than adding a new car.
5. Use **Website-Vorschau starten/öffnen** and reload its page after changes. A
   preview started in another terminal is managed from that terminal.
6. Use **Fahrzeugliste aktualisieren** before continuing to edit the saved car.
   Cancellation preserves the draft/review. Successful saving recognizes the
   unchanged prepared draft; other unsaved changes retain discard confirmation.
7. Stop the panel preview before **Website erstellen**, which runs the production
   build into `dist/` without publishing. **GitHub Pages veröffentlichen** separately
   asks for `JA`, builds for Pages and publishes to `gh-pages`, not the production host.
   Git authentication must already be configured.

**ZIP herunterladen (optional)** remains available for handing off the vehicle.
Opening `index.html` directly retains offline ZIP export and the terminal transfer
workflow. The launcher is needed for direct project saving.

**Weitere Projektaktionen → Fahrzeug zum Löschen suchen** provides deletion with
search, exact selection and `JA`, using the same checked transaction and backups.
No ZIP is needed. Its completion asks to refresh the vehicle list while retaining
the current draft until you choose to refresh.

The existing website release requirements still apply. The interface does not
grant approval to publish a development preview as the production site.

## Maintenance and boundaries

The launcher uses Node built-ins and serves only the editor's explicitly allowed
HTML/CSS/classic-script files. `Intern/website-tools.js` supplies the
final-step adapter and is inactive without the launcher marker. `scripts/lib/control-panel.mjs` adapts the existing
checked transfer/deletion functions through their `write`/`confirm` interface, preserving
immutable reviews, exact selection, stale-input checks, locks, backups, rollback,
crawler changes and supervised preview refresh. It does not pipe approval into a
terminal. Draft controls and navigation are locked during website operations,
while prompts stay accessible. Tool inputs do not invalidate vehicle reviews.

Only the fixed `dev`, `build` and `deploy` package commands can start processes.
They run via npm's JavaScript entry point without an additional shell. The GitHub
Pages build sets its environment through `scripts/build-pages.mjs`, so Windows
does not require Unix environment-assignment syntax.

The HTTP listener binds only to `127.0.0.1` on an automatically selected port.
Requests require the per-launch secret in the browser link; API requests also
check Host and Origin. There is no remote service, telemetry, persistent browser
storage or arbitrary command endpoint. Keep the launcher link private. Folder
staging is limited to 2,000 files, 128 MiB per file and 2 GiB total; importer
validation still applies to every vehicle. Temporary staging is removed after an
operation or normal shutdown. Crash leftovers use the system temporary directory
and never the website source tree.

No tool can promise zero maintenance across future operating systems, browsers,
Node versions and Git authentication changes. Reusing the website runtime and
transaction code keeps the extra maintenance small. Native Windows/Linux launchers
and folder-picker behavior must be verified on those systems before claiming
full platform compatibility.

## Verification

Run `node --test tests/control-panel.test.mjs` for disposable HTTP/transaction
fixtures. They cover project-snapshot matching, offline inactivity, access
protection, path traversal, explicit selection,
cancellation, stale approval, direct draft saves across all four transfer cases, confirmed deletion,
backups, preview controls and publication approval. Deployment is simulated in
tests; it never publishes. Existing importer/deletion tests cover transaction
failure and recovery separately. The browser UI can be inspected with
`npm run tools -- --no-open`.

The initial standalone version was verified on macOS with 124 Node regressions; 22 offline-editor and 14
project-workflow browser cases; real editor ZIP integrity and folder selection
through approval/cancellation; preview start/stop and production build through the
panel; production and GitHub Pages build verification. Disposable panel fixtures
cover all four confirmed transfer cases and deletion. Native Windows/Linux,
Safari/Firefox, the editor's native `file://` permission flow, deployment to GitHub,
and the full four-case live-preview browser matrix were not verified in this
change. No real vehicle was imported/deleted and nothing was published.

The merged editor adds `/tools-workflow` to the browser harness, covering step
placement, saving current drafts without ZIP/folder selection, incomplete drafts,
fresh preparation after edits, prompt locking and cancellation,
publication approval, refresh after deletion and responsive layout. See the
editor's USER-GUIDE.md for the complete authoring workflow.

Merged-editor verification on macOS: 126 Node tests, 24 extended editor browser
cases, 16 extended project-workflow cases and 7 integrated-tool cases all passed.
Both production and GitHub Pages builds passed. Native desktop Chrome selected
and read the real website through its folder picker/permission prompt and passed
source-snapshot matching; an existing vehicle loaded without source changes.
The outstanding-prompt view after loss of project selection is covered by the
browser fixture. No real vehicle was transferred/deleted and nothing was published.
Windows/Linux and native `file://` permissions remain unverified.

Direct-save verification on macOS: 129 Node tests, 24 editor browser cases,
16 project-workflow cases and 8 integrated-tool cases passed. Both production
and GitHub Pages builds passed. Disposable fixtures cover automatic draft staging,
the exact selected original, all four transfer cases, cancellation and stale
project detection before confirmation and before writing. No real vehicle was
saved/deleted and nothing was published. Native Windows/Linux execution remains
unverified.

## Folder relocation verification (2026-10-26)

The working repositories now live at `Website/Website` and `Website/Intern`,
with `Bearbeitung.command`, `Bearbeitung.cmd` and `Bearbeitung.sh` in their parent.
Both Git histories, remotes, main branches and existing editor changes were retained.
The separate local demo worktree's Git link was repaired after moving the editor.

Verification from the new paths: 151 Node tests plus the discovery fixture;
49 editor, 17 project-workflow and 10 integrated-tools browser checks; production
and GitHub Pages builds. Relocation tests cover parent paths with spaces and
starting shell launchers from another working directory. The actual parent launcher
served the full internal editor and started/stopped the real bilingual preview.
Disposable panel fixtures cover checked additions, edits, category moves and deletion;
no real vehicle was saved or deleted, and all 3,774 checked vehicle/crawler files
remained unchanged. Native Windows/Linux execution and native folder-picker prompts
were not repeated for this relocation. Nothing was published.
