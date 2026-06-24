# Repository Guidelines

## Project Structure & Module Organization

This is a small Astro site for the German classic car restoration company
“Die Oldtimermanufaktur”. Source lives in `src/`:

- `src/pages/` contains route entry points, currently the German homepage in `index.astro`.
- `src/layouts/` contains shared page shells such as `Layout.astro`.
- `src/components/` contains reusable Astro components such as `Welcome.astro`.
- `src/assets/` contains source-controlled assets imported by pages and components.
- `src/assets/oldtimer/` contains generated homepage imagery. Keep project-referenced
  generated assets in this folder or another source-controlled asset folder, not only
  under `$CODEX_HOME/generated_images/`.
- `public/` contains static files served from the site root, including favicons.

Root configuration includes `astro.config.mjs`, `tsconfig.json`, `package.json`, and `package-lock.json`.

When adding subpages, prefer German, lowercase, URL-oriented routes that match the
homepage navigation: `src/pages/ueber-uns.astro`, `src/pages/projekte.astro`,
`src/pages/oldtimer-kaufen.astro`, `src/pages/hochzeitsfahrten.astro`,
`src/pages/restaurierung.astro`, and `src/pages/kontakt.astro`. Legal pages should use
`src/pages/impressum.astro` and `src/pages/datenschutz.astro`.

Before creating several subpages, extract repeated homepage structure from
`src/pages/index.astro` into shared components instead of duplicating it. Likely
components include a fixed blurred site header, full-screen menu overlay, footer,
media hero/panel, and editorial content sections. Keep page-specific copy and data in
the route file or a small local data module, and keep shared interaction code with the
component that owns the markup.

## Build, Test, and Development Commands

Run commands from the repository root.

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the Astro dev server, usually at `http://localhost:4321`.
- `npm run build` creates a production build in `dist/` and is the main verification command.
- `npm run preview` serves the production build locally for final checks.
- `npm run astro -- --help` shows available Astro CLI commands.

Use Node `>=22.12.0`, as declared in `package.json`.

## Coding Style & Naming Conventions

Follow the existing Astro style. Use `.astro` files for pages, layouts, and components. Name components and layouts with `PascalCase` filenames, for example `Welcome.astro`. Keep route files in `src/pages/` lowercase and URL-oriented, for example `about.astro`.

Current files use tabs for indentation in Astro markup and CSS. Keep imports at the top of the frontmatter block. Prefer relative imports for local modules and scoped CSS in the same `.astro` file unless styles need sharing.

All public-facing copy for this site should be in German. The current visual direction is
restrained luxury editorial with a very dark grey background (`#111111`), `#eeeeee` as the
main color, and neutral grey lines/interactions. Avoid accent-heavy treatments and avoid
gold, brown, beige, tan, sepia, and retro nostalgia palettes unless explicitly requested.
Use free commercial fonts only. The current homepage uses `Jost` for all typography,
including display, body, and UI text.

The current design uses immersive, image-led sections, sparse uppercase typography,
generous spacing, thin borders, and quiet grayscale image treatment. Subpages should
feel like part of the same editorial system, not like separate marketing templates.
Prefer:

- Dark full-width sections over floating cards or boxed page sections.
- Large photographic first-viewport signals with restrained overlays for top-level
  service pages.
- Short German headings with uppercase letter spacing, balanced line lengths, and
  concise supporting copy.
- Neutral borders and hover states using translucent `#eeeeee`, not colored accents.
- Imported local images from `src/assets/oldtimer/` with meaningful `alt` text when
  informative and empty `alt` text only for decorative imagery.

Avoid:

- Beige, gold, brown, sepia, cream, or nostalgic retro palettes.
- Decorative gradients, bokeh/orb backgrounds, heavy shadows, rounded card-heavy SaaS
  layouts, or generic stock-photo compositions.
- Mixing fonts or introducing external assets that are not free for commercial use.
- English public-facing labels, placeholder links, or placeholder legal/contact copy
  on production-intended pages.

For subpage layout, keep the fixed blurred header and menu overlay consistent across
the site. Navigation links should point to real routes once those pages exist instead
of homepage `#explore` anchors. Preserve keyboard access, Escape-to-close behavior,
focus-visible styles, and the custom cursor being enabled only for fine pointers.
Use `100svh` handling for mobile full-height panels where appropriate.

Keep content protection behavior site-wide in the shared layout: disable text/image
selection across the website with `user-select: none`, prevent image dragging, and
block the browser context menu everywhere so right-click saving is not directly
available on current or future subpages.

## Testing Guidelines

No dedicated test framework is configured yet. Run `npm run build` before submitting changes. For visual or behavior changes, also run `npm run dev` and verify the affected page in a browser.

For homepage UI changes, verify desktop and mobile widths. Check that the fixed blurred
header, menu overlay, scroll buttons, custom desktop cursor, generated images, and footer
links render without overlap. The custom cursor should stay disabled on touch/mobile
viewports.

For subpage work, verify both the new route and the homepage after changes to shared
navigation, layout, or footer components. Check at minimum a desktop viewport around
1440px wide and a mobile viewport around 390px wide. Confirm that page titles,
descriptions, nav active/current states if added, image crops, header blur, menu
overlay, footer links, and focus states remain coherent without text overlap.

If tests are added later, place them near the code they cover or in a clearly named test directory, and add an `npm test` script.

## Commit & Pull Request Guidelines

The current history uses short commit messages such as `Astro Setup` and `first commit`. Keep commits brief and focused, using an imperative summary when possible, for example `Add homepage layout`.

Pull requests should include a short description, the commands run for verification, and screenshots for visible UI changes. Link related issues when applicable. Avoid mixing unrelated refactors with feature or content changes.

## Agent-Specific Instructions

Keep changes scoped to the requested task. Do not edit generated dependency folders such as `node_modules/` or build output such as `dist/`. Prefer updating existing Astro components and layouts before introducing new structure.

Do not copy code, imagery, logos, or protected trade dress from reference sites. It is fine
to use reference sites for structure, interaction notes, and factual content when requested,
but final visuals and assets should be original and project-local.
