# Phase 0 Research: Personal Portfolio Site with Markdown Blog

**Feature**: 001-portfolio-blog-site
**Date**: 2026-05-10

The user supplied a fully specified stack. This document records the
decisions, the rationale that ties each choice back to the constitution,
and the alternatives considered. It also resolves the one open item the
user flagged (`base: '/PVS/'`) and surfaces a small number of stack-level
defaults that would otherwise leak into Phase 1 as undocumented choices.

---

## Decision: Astro 5.x in static mode with content collections

- **Decision**: Use Astro 5.x with `output: 'static'`. Posts and the bio
  live in content collections (`src/content/posts/` and `src/content/bio/`),
  validated by a Zod schema declared in `src/content.config.ts` (Astro 5
  location).
- **Rationale**:
  - Native, build-time `.md` ingestion satisfies Principle I (content as
    files) without a custom loader.
  - Zod schema makes every required frontmatter field a build-time
    failure if missing or malformed — directly satisfies FR-016 ("build
    MUST fail loudly").
  - Static output is exactly what Principle II demands.
  - Astro's HTML-first model defaults to zero client JS, which lines up
    with Principle III with no extra effort.
- **Alternatives considered**:
  - **Eleventy (11ty)**: Equally good fit for static + Markdown, but no
    first-class TypeScript content schema. Would need a hand-rolled
    validator. Rejected.
  - **Hugo**: Fast, mature, but Go templating is foreign to the
    JavaScript/Python world the site owner already lives in; the
    schema-first content collection ergonomics are weaker. Rejected.
  - **Hand-rolled Node script + remark/rehype**: Maximum control, but
    re-implements solved problems (routing, asset pipeline, image
    optimization) and inflates Phase 2 task count without payoff.
    Rejected.

## Decision: Tailwind CSS v4 with CSS-first `@theme`

- **Decision**: Tailwind v4 via the official `@tailwindcss/vite` plugin.
  No `tailwind.config.js`. A single `src/styles/global.css` does
  `@import "tailwindcss";` and declares an `@theme { … }` block with the
  monochrome design tokens (a small grayscale ramp, font-family slots,
  font-size scale, spacing scale).
- **Rationale**:
  - v4's CSS-first config keeps theming where it belongs (alongside the
    actual styles), which makes Principle IV easier to enforce by
    review — the entire palette is one block of code, not split across
    a JS config file and the CSS.
  - The Vite plugin is officially supported by Astro 5.
  - Tailwind utilities are a tool, not a design — the discipline lives
    in the `@theme` (only grayscale tokens defined) plus a code-review
    rule that flags decorative utilities.
- **Aesthetic Guardrails (operationalising Principle IV)**:
  - `@theme` MUST define grayscale only. No color slots beyond `black`,
    `white`, and a small neutral ramp. If an accent is ever needed, it
    is added as exactly one named token after explicit owner sign-off.
  - Allowed utility families: layout (`flex`, `grid`, `gap-*`,
    `max-w-*`), spacing (`p-*`, `m-*`), typography (`text-*`, `font-*`,
    `leading-*`, `tracking-*`), borders/dividers (single weight,
    grayscale only), and `prose` styles for the post body.
  - Disallowed by review: gradients, shadows-as-decoration, animated
    transitions on non-interactive elements, color utilities outside
    the grayscale ramp, custom rotations/transforms used decoratively.
- **Alternatives considered**:
  - **Vanilla CSS only**: Cleaner, more directly aligned with the
    "quiet" aesthetic, but slower to iterate on layout primitives and
    typography hierarchy. Rejected for ergonomics.
  - **Open Props / Pico CSS / similar**: Less mainstream, would saddle
    the project with a smaller ecosystem. Rejected.
  - **Tailwind v3**: Older config style, no CSS-first `@theme`, no
    Vite plugin. No reason to choose it over v4. Rejected.

## Decision: TypeScript strict mode

- **Decision**: `tsconfig.json` extends `astro/tsconfigs/strict`. All
  components, layouts, and the content config are TypeScript.
- **Rationale**:
  - Type-checks cover content collection schemas (Zod → inferred
    types → consumed by `[slug].astro`), which catches frontmatter-vs-
    template drift at build time.
  - `astro check` runs during the production build — it's effectively
    the project's only test gate in v1, so making it strict is
    high-leverage.
- **Alternatives considered**:
  - **`astro/tsconfigs/strictest`**: Adds `noUncheckedIndexedAccess`
    and friends. Useful long-term, but for a small site with few
    indexed accesses, the friction outweighs the benefit at v1.
    Revisit if the codebase grows.

## Decision: Markdown via standard Astro pipeline + `rehype-pretty-code`

- **Decision**: Use Astro's built-in Markdown handling. Disable
  Astro's default Shiki integration (`syntaxHighlight: false`) and
  configure `rehype-pretty-code` as a rehype plugin in
  `astro.config.mjs`. Pin to a single Shiki version via the lockfile.
- **Rationale**:
  - `rehype-pretty-code` produces server-rendered HTML with inline
    classes — zero client JS for syntax highlighting (Principle III).
  - Supports a `theme: { light, dark }` configuration that emits both
    palettes simultaneously, which is exactly what FR-019 requires
    after the auto-theme clarification.
  - Stays inside Astro's standard pipeline — no custom build step.
- **Theme choice**:
  - Light: `github-light-default` (or equivalent grayscale-friendly
    Shiki theme — final pick made when implementing the global stylesheet).
  - Dark: `github-dark-default`.
  - Both are then post-styled via CSS to align with the site's
    monochrome palette (Shiki themes can be locally overridden by
    selectors targeting `figure[data-rehype-pretty-code-figure]`).
- **Alternatives considered**:
  - **MDX**: Adds component-in-Markdown power but invites client JS
    creep (Principle III risk) and complicates the content authoring
    contract. Explicitly excluded by the user ("Без MDX (поки що)").
    Revisit only if a future feature genuinely needs it.
  - **Astro's built-in Shiki without `rehype-pretty-code`**: Works,
    but `rehype-pretty-code` adds nicer features (line highlighting,
    word highlighting, dual-theme via single config) that authors
    will want as the post library grows.

## Decision: Self-hosted fonts (no Google Fonts CDN)

- **Decision**: Two font families, both self-hosted as `woff2` files
  under `src/assets/fonts/`. One serif for body type, one monospace
  for code blocks. Loaded via `@font-face` in `src/styles/global.css`,
  with `font-display: swap`.
- **Rationale**:
  - User explicitly required this for privacy and speed.
  - Aligns with Principle II (no runtime third-party dependencies)
    and Principle II's reproducibility requirement (CDN-served fonts
    can change underneath you).
- **Family choice (default to be confirmed during implementation)**:
  - **Serif body**: `Source Serif 4` (OFL, available via fontsource
    or directly from Adobe Fonts repo). Quiet, readable at small
    sizes, broad weight range. Subsets to Latin only to keep payload
    small.
  - **Monospace code**: `JetBrains Mono` (OFL, ligatures available
    but disabled by default per Principle IV — no decoration). Strong
    grayscale rendering, good distinction between visually similar
    glyphs (`0` vs `O`, `l` vs `1`).
  - Each family ships exactly two weights for the body (regular,
    italic; bold via the same family if needed) to keep payload near
    the < 100 KB/page budget.
- **Alternatives considered**:
  - **System font stack only**: Smallest payload, but loses the
    distinct typographic identity that Principle IV asks for. Rejected
    for this site.
  - **Google Fonts (CDN)**: Banned by user requirement and by
    Principle II.
  - **CDN-hosted fontsource**: Same problem.

## Decision: Astro `<Image>` for image optimization

- **Decision**: Use Astro's built-in `<Image>` component for the author
  photo and any post cover images. Source images are imported as
  TypeScript modules so Astro can apply width/height/format
  optimization at build.
- **Rationale**:
  - Build-time optimization (resize, modern format) keeps page weight
    under the < 100 KB budget without runtime image services
    (Principle II).
  - Native `loading="lazy"` and `decoding="async"` are emitted in
    HTML — no client JS needed (Principle III).
- **Cover image handling in content collections**:
  - The `cover` frontmatter field uses Astro's `image()` schema helper
    (`z.object({ ..., cover: image().optional() })`), so the path is
    validated at parse time and resolved relative to the `.md` file.
  - Authors place cover images alongside the post `.md` file (e.g.
    `src/content/posts/my-post.md` + `src/content/posts/my-post-cover.jpg`).
- **Alternatives considered**:
  - **Plain `<img>` tags**: No build-time optimization; would blow the
    performance budget on the first cover image. Rejected.
  - **Cloudinary / external image service**: Runtime third-party
    dependency — banned by Principle II.

## Decision: GitHub Pages deploy via official Pages actions

- **Decision**: A single GitHub Actions workflow at
  `.github/workflows/deploy.yml`, triggered on push to `main`. Steps:
  1. Checkout.
  2. Setup Node 22 with `actions/setup-node@v4` (cache npm).
  3. `npm ci`.
  4. `npm run build`.
  5. `actions/upload-pages-artifact@v3` from `./dist`.
  6. `actions/deploy-pages@v4` (deploy environment: `github-pages`).
- **Rationale**:
  - Matches the user's stated requirement exactly.
  - Official Pages actions are the path of least resistance and
    minimum supply-chain risk.
  - `npm ci` enforces lockfile use → reproducibility (Principle II).
- **Permissions**: Workflow grants `pages: write` and
  `id-token: write` only on the deploy job; build job needs only
  `contents: read`.
- **Alternatives considered**:
  - **Pushing to `gh-pages` branch via `peaceiris/actions-gh-pages`**:
    Older pattern, more moving parts, no real benefit. Rejected.
  - **Netlify / Cloudflare Pages**: External vendor not requested by
    the user. Out of scope.

## Open decision: `base: '/PVS/'` confirmation

- **Status**: Assumed `base: '/PVS/'` per user input.
- **Implication**: The GitHub repository hosting this site must be
  named `PVS`, so that GitHub Pages serves it at
  `https://<github-user>.github.io/PVS/`. Local working directory is
  `mysite`; no `origin` remote is yet configured.
- **Resolution path**:
  1. Owner confirms repo name before first push.
  2. If the repo is named anything other than `PVS`, change the single
     `base` (and `site`) value in `astro.config.mjs` and re-deploy.
  3. If the site moves to a custom domain (e.g. `pravdych.dev`), set
     `site: 'https://pravdych.dev'` and `base: '/'`, and add a
     `public/CNAME` file.
- **Action**: Implementation tasks ship with `base: '/PVS/'` as the
  default. A README note documents the single-line change required
  for any of the alternatives above.

## Decision: No test framework in v1 (build is the gate)

- **Decision**: Skip Vitest / Playwright / Jest in v1. The build
  itself (`astro check` + `astro build`) is the only gate. Manual
  validation is documented in [quickstart.md](./quickstart.md).
- **Rationale**:
  - The site's surface area is small enough that schema validation +
    type-checking + a manual spot-check on the served pages catches
    everything that matters.
  - Adding a test runner now means writing fixtures and CI plumbing
    for tests that would mostly verify Astro's own behavior.
  - The constitution does not mandate tests for this scope.
- **Trigger to revisit**: If a second feature introduces any client JS,
  or if the post count crosses ~50 and prev/next bugs become hard to
  spot manually, add Playwright for a 2–3 smoke spec set.

## Decision: Reproducible build inputs

- **Decision**: Commit `package-lock.json`. Pin Node version via
  `.nvmrc` (Node 22 LTS) and reference the same version in the GitHub
  Action setup-node step. Bundle Shiki theme JSON via the
  `rehype-pretty-code` config — no runtime fetch.
- **Rationale**: Directly satisfies SC-006 ("byte-identical output for
  identical inputs") and Principle II.

---

## Summary table

| Topic | Decision |
|---|---|
| Framework | Astro 5.x, `output: 'static'` |
| Content | Content collections, Zod schema, `src/content.config.ts` |
| Styles | Tailwind v4, CSS-first `@theme`, grayscale-only tokens |
| Types | TypeScript strict (`astro/tsconfigs/strict`) |
| Markdown / code | Astro Markdown + `rehype-pretty-code` (dual light/dark Shiki theme) |
| Fonts | Self-hosted woff2 — Source Serif 4 (body) + JetBrains Mono (code) |
| Images | Astro `<Image>` with `image()` schema helper |
| Deploy | GitHub Action: `upload-pages-artifact@v3` + `deploy-pages@v4` |
| Base path | `/PVS/` (assumed; awaiting owner confirmation of repo name) |
| Tests | None in v1; build (`astro check`) is the gate |
| Reproducibility | `package-lock.json` + `.nvmrc` (Node 22 LTS) |

All NEEDS CLARIFICATION items from the spec were resolved in
`/speckit-clarify`. No new ones were introduced by this research pass.
The single open item (`base: '/PVS/'`) is a configuration default, not
a blocker — implementation can proceed.
