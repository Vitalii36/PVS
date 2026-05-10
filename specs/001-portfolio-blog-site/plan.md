# Implementation Plan: Personal Portfolio Site with Markdown Blog

**Branch**: `001-portfolio-blog-site` | **Date**: 2026-05-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-portfolio-blog-site/spec.md`

## Summary

Build a static personal portfolio + blog where every piece of content lives in
the repo as a Markdown file. The site has five page types — home, About,
blog index, post page, 404 — with monochrome auto-themed design (light/dark
via `prefers-color-scheme`), serif body type, monospace code, and prev/next
navigation between posts in date order. English only for v1.

**Technical approach**: Astro 5.x in static mode (`output: 'static'`) with
content collections backed by a Zod schema for frontmatter validation,
Tailwind CSS v4 for utility-first styling with CSS-first theming, TypeScript
strict mode, `rehype-pretty-code` for build-time syntax highlighting (no
client JS), self-hosted woff2 fonts, Astro `<Image>` for image optimization,
deployed to GitHub Pages via `actions/upload-pages-artifact` +
`actions/deploy-pages` under base path `/PVS/`. No MDX, no client-side
JavaScript by default, no third-party runtime dependencies.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 22 LTS, Astro 5.x
**Primary Dependencies**: `astro@^5`, `@astrojs/check`, `typescript@^5`, `tailwindcss@^4`, `@tailwindcss/vite@^4`, `rehype-pretty-code@^0.14`, `shiki@^1` (transitive), `zod` (re-exported by Astro for schemas)
**Storage**: Filesystem only — Markdown + frontmatter under `src/content/`. No database, no headless CMS (constitutional Principle I).
**Testing**: `astro check` (type + content schema validation, runs during `npm run build`); manual quickstart validation per [quickstart.md](./quickstart.md). No unit-test framework added in v1 — the build itself is the strongest gate (schema, types, broken-link surface).
**Target Platform**: Evergreen browsers (latest 2 stable versions), JS-disabled clients fully supported (constitutional Principle III).
**Project Type**: Single-project static web app (Astro). No backend.
**Performance Goals**: < 100 KB transferred per page on first load, < 50 ms scripting on commodity hardware, zero render-blocking third-party requests (constitutional performance budget).
**Constraints**: Build must run offline (no network access); reproducible byte-identical output for identical inputs; no runtime API calls; no analytics/comments/login/search.
**Scale/Scope**: 5 page types, ~3 seed posts at launch, expected to grow to dozens (not hundreds) of posts over the site's lifetime; single author.

**Open decision flagged for user confirmation**:
- `base: '/PVS/'` is taken from the user's input ("(підтвердити)"). This implies the GitHub repository will be named `PVS` so that GitHub Pages serves the site at `https://<user>.github.io/PVS/`. The local working directory is `mysite` and no `origin` remote is currently configured. **Action**: Owner to confirm the GitHub repo name before the first deploy; the build config can be adjusted in one place (`astro.config.mjs`) if the path differs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0.

| Principle | Status | Justification |
|---|---|---|
| **I. Content as Files** | ✅ Pass | Astro content collections read `.md` files directly from `src/content/`. Zod schema in `src/content.config.ts` is the single source of truth for frontmatter. No DB, no CMS. |
| **II. Offline-First Static Build** | ✅ Pass | `output: 'static'` produces a `dist/` bundle servable from any host. Fonts are self-hosted (no Google Fonts CDN at runtime). Syntax highlighting is build-time via Shiki/`rehype-pretty-code`. Astro `<Image>` resolves at build, not runtime. CI build runs in a clean container with the lockfile, no network at view time. |
| **III. Markup-Driven JavaScript** | ✅ Pass | Astro ships zero client JS by default. No client islands are introduced in v1 — every interactive control (prev/next links, header nav) is a plain `<a>`. Theme switching is pure CSS via `prefers-color-scheme`. The single accessibility-relevant JS allowance is reserved (none planned). |
| **IV. Quiet Aesthetic Discipline** | ✅ Pass (with discipline note) | The stack itself is design-neutral; discipline is enforced via the small custom Tailwind v4 `@theme` (grayscale-only tokens, exactly one accent slot) and review of every utility class for "decorative vs. structural." See [research.md](./research.md) — Decision: Aesthetic Guardrails. |
| **V. Positioning Coherence** | ✅ Pass | Content concern, not a stack concern — enforced at content-authoring time via the spec's FR-005, FR-007, FR-008 and the existing positioning bio at `PVS/src/bio.md`. |

**Gate result**: PASS. No violations. Complexity Tracking section below remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-portfolio-blog-site/
├── plan.md              # This file
├── spec.md              # Feature specification (already exists)
├── research.md          # Phase 0 output (decisions + rationale)
├── data-model.md        # Phase 1 output (entities + Zod schema)
├── quickstart.md        # Phase 1 output (dev / publish / deploy)
├── contracts/           # Phase 1 output
│   ├── post-frontmatter.md
│   ├── url-routes.md
│   └── build-deploy.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (already exists)
└── tasks.md             # Phase 2 output — created by /speckit-tasks
```

### Source Code (repository root)

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Pages CI: build + upload-pages-artifact + deploy-pages
├── public/
│   ├── favicon.svg
│   └── robots.txt                  # Static passthrough — Astro does not process
├── src/
│   ├── assets/
│   │   ├── fonts/                  # Self-hosted woff2 (one serif family + one mono family)
│   │   └── images/
│   │       └── photo.jpeg          # Author photo (imported by Astro <Image>; sourced from PVS/src/photo.jpeg)
│   ├── components/
│   │   ├── SiteHeader.astro
│   │   ├── SiteFooter.astro
│   │   ├── PostList.astro          # Renders title/date/summary/tags entries (used by home + index)
│   │   └── PrevNextNav.astro       # Post-page neighbour navigation
│   ├── content/
│   │   ├── posts/
│   │   │   ├── *.md                # Blog posts (3 seed posts at launch, curated from ~/Documents/tech-lead-library/)
│   │   └── bio/
│   │       └── bio.md              # Author bio (single entry; sourced from PVS/src/bio.md)
│   ├── content.config.ts           # Zod schemas for `posts` and `bio` collections (Astro 5 location)
│   ├── layouts/
│   │   └── BaseLayout.astro        # <html lang="en">, <head>, header/footer slots
│   ├── pages/
│   │   ├── index.astro             # Home (photo + bio excerpt + 3 latest posts)
│   │   ├── about.astro             # About (full bio)
│   │   ├── 404.astro               # 404 page
│   │   └── blog/
│   │       ├── index.astro         # Blog index (all posts, newest first)
│   │       └── [slug].astro        # Post page (dynamic route from posts collection)
│   └── styles/
│       └── global.css              # @import "tailwindcss"; @theme { ... }; @font-face declarations
├── astro.config.mjs                # site, base, integrations, markdown.rehypePlugins
├── tsconfig.json                   # extends astro/tsconfigs/strict
├── package.json
├── package-lock.json               # Pinned for reproducible offline builds (constitutional Principle II)
├── README.md                       # Existing — left as-is
├── CLAUDE.md                       # Existing stub — updated by this command to point at this plan
├── PVS/                            # LEGACY site directory — left untouched in v1; cleanup is a separate feature
└── .specify/                       # Spec Kit artifacts (existing)
```

**Structure Decision**: Single-project Astro app at the repository root.
The legacy hand-written site under `PVS/` stays in place for now (the
`PVS/src/{bio.md, photo.jpeg}` files are read once by implementation tasks
to seed the new content collections, then the new content lives under
`src/content/` and `src/assets/`). Decommissioning the legacy directory
is intentionally deferred — it does not block this feature and a separate
spec can decide whether to delete or archive it after the new site is
live.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations. Section intentionally empty.*
