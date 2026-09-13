# German and English

German routes remain unchanged. `routes.mjs` registers the same Astro pages under
`/en/`, including each page's existing static pagination. Middleware translates
rendered text and metadata at build time and in development. English HTML is
readable without JavaScript; assets and interactions are shared.

`en.json` maps normalized German source text to reviewed English translations.
Add translations whenever copy, image alternatives or metadata change. Proper
names remain unchanged; `translate.js` handles recurring vehicle labels and years.
`npm test` rejects new vehicle copy without an explicit translation. Review both
languages in the browser after layout or copy changes.

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
