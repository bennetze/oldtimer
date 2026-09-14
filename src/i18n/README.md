# German and English

German routes remain unchanged. `routes.mjs` registers the same Astro pages under
`/en/`, including each page's existing static pagination. Middleware translates
rendered text and metadata at build time and in development. English HTML is
readable without JavaScript; assets and interactions are shared.

Vehicle text is stored in each `vehicle.json`: the original fields contain German,
and the corresponding `*En` fields contain English. `vehicleLocale.js` selects the
record's language before rendering. Images, order, block sequence and slugs are shared.
All vehicle records must be bilingual; new vehicle wording does not need dictionary entries.

`en.json` remains the dictionary for shared navigation and other website copy.
Authored vehicle DOM uses `data-authored`; layout metadata has explicit authored-field
flags. JSON-LD uses temporary `__authored` field lists, removed by middleware in both
languages. These boundaries prevent dictionary collisions and double translation while
preserving link localization and CSP hashes. Never put author-controlled markers in
rich text: both HTML languages use the same strict allowlist.

The one-time migration is `node scripts/migrate-vehicle-languages.mjs --check` (read only)
or `--write`. It reuses existing translations, preserves already-authored English,
validates all records before writing, and reports missing reviewed editorial fragments.
It never changes German fields, dates, routes or image files. It is idempotent.

The small head script reads the first browser language preference (`de-*` selects
German; everything else selects English). It never accesses cookies, localStorage,
sessionStorage or a translation service. `/en/` explicitly selects English. The
DE / EN links use `?lang=de` or `?lang=en`; the script carries that choice through
internal navigation, preserving other query parameters and section fragments.
A later visit to a bare German URL detects the browser again. Without JavaScript,
the URL's static language remains readable and the switch still works.

The 404 document sends English visitors to the existing `/en/404/` page, avoiding
redirect loops for missing routes. Both error pages and legal preview pages remain
noindex. The sitemap lists both languages' canonical indexable routes; hreflang,
Open Graph and page JSON-LD describe the matching language. Business and website
identity IDs remain shared. The existing development-preview release gate applies
to both languages.
