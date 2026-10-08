# Internal editor follow-up (2026-10-07)

The website now uses the editor's existing flat `vehicle.json` contract. There are
no new required fields, sidecar files or central per-car layout/audit dependencies.
Creating, editing and moving cars does not require an editor schema migration.
The website renders the saved block order directly, in German and English.

The remaining work improves editor clarity and previews; it is not required to
make current saves compatible with the website. Lead-image help and documentation
should be updated; a full page preview and gallery splitting are usability additions.

## Documentation and interface alignment

1. **Add a website-like review preview.** The current editor shows authoring controls,
   rather than a complete vehicle-page preview. Show text, contact blocks and gallery
   photo runs vertically at desktop and mobile widths, with uncropped photos up to
   420px wide. Consecutive photos use one column below 760px, up to two from
   760px and up to three from 1100px; copy/contact blocks end each photo run. Display each occurrence's bilingual caption beneath its own photo.
   Reflect the lead-image rule: a selected photo already in the story supplies
   metadata without a duplicated opening photo. A lead outside the story appears
   before the first block. Explain that rule next to the existing lead selector.
2. **Make the reading sequence clearer.** Keep the current block controls and image
   ordering, but make it obvious that their sequence is the website sequence.
   Optionally add a “Galerie teilen” action so an owner can place a text block between
   two photo sets without manually rebuilding galleries. Preserve occurrence-specific
   alternatives/captions and provide keyboard controls and predictable focus.
3. **Update documentation.** Replace the old centered-copy/layout descriptions
   in the internal AGENTS.md and README with the vertical layout and lead behavior.
   Explain that related copy is placed immediately before/after its gallery, and
   a photo-specific caption is edited on that photo. No grouping configuration or
   historical-source snapshot needs to be maintained.
4. **Extend workflow checks when those UI changes are implemented.** Cover gallery
   splitting, text-before/image/text-after order, repeated image occurrences with
   distinct captions, both languages, save/reopen and ZIP round-trip. Confirm that
   category moves preserve the sequence and that rollback/recovery restores it.

## Existing mechanisms to retain

- The six-step offline workflow, local classic scripts and file:// operation.
- Reviewed direct saves, immutable review snapshots, durable backups and recovery.
- The vehicle page/folder pair, current strict validators and bilingual fields.
- Category move redirects, canonical/source URL rules, sitemap and llms updates.
- Separate build/publish workflow; saving source does not rebuild dist.

The website's current tests now check all maintained records against the embedded
editor validator. Browser and importer fixtures still exercise the existing save,
move and export contracts. No internal editor files were changed in this task.
