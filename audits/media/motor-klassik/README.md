# Motor Klassik image preparation and placement guide

Prepared 23 October 2026. These are proposed placements, not published changes.

## Files and encoding

All 25 original JPEGs remain untouched in `Motor Klassik Internet/`. Optimized
copies are in `src/assets/oldtimer/motor-klassik/`, separated into `hochformat/`
and `querformat/` and retaining the original filename stems for traceability.

- Portrait: **1415 × 2121 px**; landscape: **2121 × 1415 px**.
- Approximately 3 megapixels, matching the existing editorial photography.
- WebP quality 82, effort 6, smart chroma subsampling, sRGB, automatic orientation.
- Full composition retained; no cropping, enlargement, retouching or colour grading.
- Embedded EXIF/IPTC/XMP metadata is removed from web derivatives. Original metadata
  remains in the untouched JPEGs; preserve any required photographer credit separately.
- Combined size: **772,645,412 → 5,841,734 bytes**, a **99.24% reduction**.
  Individual optimized files range from approximately **126 to 415 KiB**.

`manifest.json` records all source/output paths, dimensions, byte sizes, encoding
settings and SHA-256 checksums. Every output was decoded and checked for format,
dimensions, removed embedded metadata and reduced size. Originals were rehashed
against the manifest after preparation. Contact sheets show the optimized outputs.

## Recommended first selection

| Photo ID | Proposed existing location | Reason and crop guidance |
| --- | --- | --- |
| **6938** (portrait) | `/ueber-uns/#anton-schrank`, main portrait | Direct eye contact, clear face and company branding; stronger primary profile image. Keep the head and hand in the portrait frame. |
| **4176** (portrait) | `/ueber-uns/#anton-schrank`, supporting image | Shows Anton in a classic convertible and adds an outdoor counterpoint to the workshop portrait. Keep the steering wheel visible. |
| **5959** (landscape) | `/ueber-uns/#das-team`, main group image | Shows the team together in the workshop. Use the full width; a narrow mobile crop would lose people at the edges. Confirm the pictured team is current. |
| **6639** (landscape) | `/ueber-uns/`, supporting image beside the Mario/Anton profiles | Two people together among the cars communicate continuity. Confirm the second person's identity before naming him in copy or alt text. |
| **6297** (landscape) | `/handwerk/#mechanik`, main working image | Clear hands-on work at the engine with a colleague; useful replacement for a static mechanical detail. Keep both people and the working area visible. |
| **6144** (portrait) | `/handwerk/#mechanik`, supporting image | Underbody work broadens the story beyond the engine bay; pairs well with landscape 6297. |
| **5800** (landscape) | `/handwerk/#karosserie`, secondary working image | Welding makes the craft immediately legible. Preserve the torch, protective mask and body panel in the crop. |
| **5591** (portrait) | `/handwerk/#mechanik`, alternative working image | Anton working in an engine bay. More accurate for mechanical work than for engine rebuilding: it does not show a dismantled engine or machining. |

Use a small selection rather than every near-duplicate. Portrait 6938 + outdoor
portrait 4176, team 5959, working pair 6297/6144 and welding 5800 give the broadest
coverage with the least repetition.

These photos are mainly people and mechanical work. They do not show painting,
upholstery or engine machining, so keep the existing specialist imagery in those
sections. Do not assign a pictured car to a project record without confirming its
identity. Keep the homepage's required motion sections; these stills are better
suited to the existing editorial subpages.

## Full inventory and draft German alt text

IDs refer to the final `AB-####` part of each filename. Names follow the supplied
Anton-labelled series and the existing profile; confirm identities before publication.

| ID | Orientation | Subject / selection note | Draft German alt text |
| --- | --- | --- | --- |
| 4176 | Portrait | Outdoor driver portrait; preferred relaxed version | Anton Schrank sitzt am Lenkrad eines offenen historischen Cabriolets. |
| 4198 | Portrait | Outdoor driver portrait; alternative to 4176 | Anton Schrank blickt vom Fahrersitz eines historischen Cabriolets zur Kamera. |
| 5591 | Portrait | Working in engine bay | Anton Schrank arbeitet mit einem Schraubendreher im geöffneten Motorraum. |
| 6144 | Portrait | Underbody inspection/work | Anton Schrank arbeitet unter einem auf der Hebebühne angehobenen Fahrzeug. |
| 6292 | Portrait | Two people working at engine; tighter alternative | Anton Schrank und ein Kollege arbeiten am geöffneten Motorraum eines historischen Automobils. |
| 6333 | Portrait | Two people working at engine; wider portrait alternative | Anton Schrank arbeitet am Motor, während ein Kollege neben ihm in den Motorraum blickt. |
| 6763 | Portrait | Wider workshop portrait with cars | Anton Schrank steht zwischen historischen Automobilen in der Werkstatt und blickt zur Kamera. |
| 6791 | Portrait | Wider workshop portrait looking aside | Anton Schrank steht zwischen historischen Automobilen in der Werkstatt und blickt zur Seite. |
| 6938 | Portrait | Preferred direct workshop portrait | Anton Schrank steht im dunkelblauen Firmenpullover zwischen historischen Automobilen in der Werkstatt. |
| 6960 | Portrait | Close workshop portrait looking aside | Anton Schrank blickt neben einem historischen Automobil zur Seite. |
| 6976 | Portrait | Close smiling workshop portrait | Anton Schrank lächelt neben einem historischen Automobil in der Werkstatt. |
| 3238 | Landscape | Driver, dashboard and complete cockpit | Anton Schrank sitzt am Steuer eines offenen Cabriolets mit hellbrauner Lederausstattung. |
| 3300 | Landscape | Steering wheel and instruments; supporting detail | Blick über Anton Schranks Schulter auf Lenkrad und Instrumente eines historischen Cabriolets. |
| 4279 | Landscape | Outdoor driver portrait; landscape alternative | Anton Schrank lächelt am Lenkrad eines offenen historischen Cabriolets. |
| 4314 | Landscape | Cabriolet exterior and driver | Seitlicher Blick auf ein blaues historisches Cabriolet mit Anton Schrank am Steuer. |
| 5800 | Landscape | Welding; preferred bodywork addition | Ein Mitarbeiter mit Schweißhelm schweißt an der Karosserie eines gelben historischen Automobils. |
| 5959 | Landscape | Full team; preferred group image | Das Team der Oldtimermanufaktur steht zwischen historischen Fahrzeugen in der Werkstatt. |
| 6297 | Landscape | Two people working at engine; preferred working image | Anton Schrank und ein Kollege arbeiten gemeinsam am geöffneten Motorraum eines historischen Automobils. |
| 6384 | Landscape | Two people reviewing an open folder | Anton Schrank und ein Kollege betrachten neben einem historischen Automobil einen geöffneten Ordner. |
| 6583 | Landscape | Two-person workshop portrait; wider alternative | Anton Schrank und ein Kollege stehen zwischen historischen Automobilen in der Werkstatt. |
| 6639 | Landscape | Preferred two-person workshop portrait | Anton Schrank und ein Kollege stehen nebeneinander zwischen historischen Automobilen. |
| 6688 | Landscape | Anton with cars; direct gaze | Anton Schrank steht zwischen historischen Automobilen in der Werkstatt und blickt zur Kamera. |
| 6715 | Landscape | Anton with cars; alternative | Anton Schrank steht neben einem offenen historischen Automobil in der Werkstatt. |
| 6729 | Landscape | Anton looking aside | Anton Schrank blickt zwischen historischen Automobilen in der Werkstatt zur Seite. |
| 6830 | Landscape | Anton with cars; wider context | Anton Schrank steht vor einer Reihe historischer Automobile in der Werkstatt. |

## Integration notes and publication status

Import selected WebP files with Astro's existing `Image` component. Keep current
responsive width sets and `sizes` values, capped at the source width. A single
optimized source per photograph is sufficient; Astro can generate responsive
variants at build time. Preserve full group shots instead of forcing them into
portrait frames. Review actual mobile crops when a selection is integrated.

Before publishing this new photo family, record the photographer/rightsholder,
website and social-preview usage permissions, required credit and applicable
permissions for recognizable people in the existing media-rights workflow.
The folder name alone does not establish a licence. This preparation does not
record a production approval or alter the existing development-preview release gates.

No routes, page content, representative images, metadata or structured data were
changed. The existing robots policy already covers WebP. Sitemap and llms.txt
updates are unnecessary for these unreferenced source assets. When selected photos
are integrated, update affected alt text, Open Graph/JSON-LD images, modification
dates and crawler summaries in that implementation.

## Optimized contact sheets

- [Portraits](portraits.jpg)
- [Landscapes](landscapes.jpg)

## Implemented selection — 25 October 2026

The user approved integration: 5959 remains the dominant Team image, 6384 supports
it, 6639 illustrates Kontakt, 5800 leads Karosseriebau, 6144/6297 illustrate Mechanik,
and 4314 supports the retained spray-booth photograph in Lackierung. Fahrzeugangebote
uses cockpit detail 3300 instead of the previously proposed driver portrait 4176.
Motorenbau retains its engine video and adds only Horch 350 image 027 as a small still;
Horch image 049 is excluded, and image 021 was omitted to keep the section restrained.
This supersedes the earlier proposed placements and integration-status notes above.
