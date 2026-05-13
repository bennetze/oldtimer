# Repository Guidelines

## Project Structure & Module Organization

This is a small Astro site. Source lives in `src/`: route files go in `src/pages/`, shared page shells in `src/layouts/`, reusable UI in `src/components/`, and imported media in `src/assets/`. Static files served from the site root belong in `public/`, such as `public/favicon.ico`. Build output is generated in `dist/` and should not be edited by hand.

## Build, Test, and Development Commands

Run commands from the repository root.

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Astro development server, usually at `http://localhost:4321`.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: serve the production build locally for final checks.
- `npm run astro -- --help`: inspect available Astro CLI commands.

The project requires Node `>=22.12.0`, as declared in `package.json`.

## Coding Style & Naming Conventions

Use Astro single-file components with frontmatter imports at the top, followed by markup and scoped `<style>` blocks. Existing files use tabs for indentation in `.astro` markup and CSS, semicolons in JavaScript/TypeScript frontmatter, and single quotes for imports. Name components and layouts in PascalCase, for example `Welcome.astro` or `Layout.astro`. Route files under `src/pages/` should use Astro routing conventions, such as `index.astro` for the home page.

## Testing Guidelines

No automated test framework is configured yet. For now, use `npm run build` as the required validation step before handing off changes. For UI changes, also run `npm run dev` and verify the affected page in a browser. If tests are added later, place them near the code they cover or in a dedicated `tests/` directory, and add the corresponding `npm test` script to `package.json`.

## Commit & Pull Request Guidelines

This checkout does not include Git history, so no repository-specific commit convention can be inferred. Use short, imperative commit subjects such as `Add home page layout` or `Update Astro welcome component`. Pull requests should include a concise summary, validation performed (`npm run build`, browser checks), linked issues when applicable, and screenshots for visible UI changes.

## Agent-Specific Instructions

Keep changes scoped to the Astro app structure above. Do not commit generated `dist/` output unless explicitly requested. Prefer existing Astro patterns before adding new frameworks or tooling.
