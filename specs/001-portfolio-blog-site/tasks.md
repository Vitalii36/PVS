---
description: "Task list for 001-portfolio-blog-site"
---

# Tasks: Personal Portfolio Site with Markdown Blog

**Input**: Design documents from `/specs/001-portfolio-blog-site/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Not requested. Per [plan.md](./plan.md) Technical Context, v1 has no test framework — `astro check` + `astro build` is the gate. Manual smoke validation lives in Polish phase tasks (mapped to the spec's user-story acceptance scenarios) and references [quickstart.md](./quickstart.md).

**Organization**: Tasks are grouped by user story. Each user story is independently testable per the spec's "Independent Test" criteria.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- File paths are relative to repo root: `/Users/vitaliipravdych/Documents/PVS/mysite/`

## Path Conventions

Single-project Astro app at the repo root. Reference: [plan.md → Project Structure](./plan.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Astro project, install dependencies, configure TypeScript / Tailwind / Markdown pipeline, and pin Node.

- [X] T001 Create `package.json` with name/version/private:true and scripts (`dev`, `build`, `preview`, `astro`) at repo root
- [X] T002 Install runtime/build dependencies: `npm install astro@^5 @astrojs/check@latest typescript@^5 tailwindcss@^4 @tailwindcss/vite@^4 rehype-pretty-code@^0.14`
- [X] T003 [P] Create `.nvmrc` at repo root with `22` (Node 22 LTS)
- [X] T004 [P] Create `tsconfig.json` at repo root extending `astro/tsconfigs/strict` with `compilerOptions.baseUrl: "."` and `paths` only if needed
- [X] T005 [P] Create `astro.config.mjs` at repo root with `output: 'static'`, `site: 'https://<github-user>.github.io'` (placeholder), `base: '/PVS/'`, `trailingSlash: 'always'`, `vite.plugins: [tailwindcss()]`, and `markdown.syntaxHighlight: false` plus `markdown.rehypePlugins: [[rehypePrettyCode, { theme: { light: 'github-light-default', dark: 'github-dark-default' } }]]`
- [X] T006 [P] Create `.gitignore` at repo root with Astro defaults (`dist/`, `.astro/`, `node_modules/`, `.env*`, `.DS_Store`)
- [X] T007 [P] Create `public/favicon.svg` at `public/favicon.svg` — minimal monochrome glyph (e.g. initials in serif), or placeholder SVG
- [X] T008 [P] Create `public/robots.txt` at `public/robots.txt` allowing all crawlers (single `User-agent: *` + `Allow: /`)
- [X] T009 Run `npm install` to materialize `package-lock.json` and verify Astro CLI is invokable (`npx astro --version`)

**Checkpoint**: `npm run dev` should boot the Astro dev server (with no pages yet) without error before proceeding.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schemas, design tokens, base layout, and seed content that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Content schemas and validation

- [X] T010 Create `src/content.config.ts` with the Zod schemas for `posts` and `bio` collections per [data-model.md](./data-model.md) — exact code listed in the data model document
- [X] T011 Create `src/content/posts/.gitkeep` so the empty posts directory exists in version control before seed posts arrive
- [X] T012 Create `src/content/bio/.gitkeep` for the bio collection directory

### Design tokens, fonts, and global styles

- [X] T013 [P] Download Source Serif 4 (Latin subset, regular + italic + bold) `.woff2` files into `src/assets/fonts/source-serif-4/` — source: fontsource.org or upstream Adobe Fonts repo (OFL)
- [X] T014 [P] Download JetBrains Mono (Latin subset, regular + bold) `.woff2` files into `src/assets/fonts/jetbrains-mono/` — source: fontsource.org or upstream JetBrains repo (OFL)
- [X] T015 Create `src/styles/global.css` with: `@import "tailwindcss";`, `@font-face` declarations for Source Serif 4 and JetBrains Mono (importing the woff2 files via Astro asset pipeline / relative URLs), an `@theme { ... }` block declaring grayscale-only color tokens (`--color-bg`, `--color-fg`, `--color-muted`, `--color-rule`), font-family slots (`--font-serif`, `--font-mono`), spacing/type scale, and `prefers-color-scheme` overrides for the dark variant per [research.md → Aesthetic Guardrails](./research.md) and [spec.md FR-019/19a/19b](./spec.md)
- [X] T016 [P] Add Shiki dual-theme CSS overrides to `src/styles/global.css` so `figure[data-rehype-pretty-code-figure]` aligns with the site's monochrome palette in both light and dark modes (covers FR-018 + FR-019)

### Layout and chrome (used by every page)

- [X] T017 Create `src/layouts/BaseLayout.astro` with: `<html lang="en">` (FR-024), `<head>` containing meta charset / viewport / title slot / description slot / favicon link / global stylesheet import, `<body>` with `<SiteHeader />` slot above and `<SiteFooter />` slot below the page `<slot />`
- [X] T018 [P] Create `src/components/SiteHeader.astro` with three nav links — Home (`${import.meta.env.BASE_URL}`), About (`${import.meta.env.BASE_URL}about/`), Blog (`${import.meta.env.BASE_URL}blog/`); links plain `<a>`, no JS (FR-012, Principle III)
- [X] T019 [P] Create `src/components/SiteFooter.astro` with the same three nav links plus optional build year line; no JS

### Single-Author build-time guard

- [X] T020 Add a `getCollection('bio')` length assertion at the top of `src/layouts/BaseLayout.astro` (or extract to `src/lib/getAuthor.ts` if cleaner) that throws an error naming the directory if the count is not exactly 1 (data-model.md "Single-Author check")

### Seed content (sources existing files into the new collections)

- [X] T021 Copy `PVS/src/photo.jpeg` → `src/assets/images/photo.jpeg` (preserve binary; no re-encoding before Astro <Image> processes it)
- [X] T022 Create `src/content/bio/bio.md` from `PVS/src/bio.md` — preserve the existing English narrative as the body; add YAML frontmatter conforming to the bio schema in [data-model.md](./data-model.md): `name: "Vitalii Pravdych"`, `role: "Tech Lead, AI & R&D — BJET"`, `location: "Khmelnytskyi, Ukraine"`, `photo: ../../assets/images/photo.jpeg`, `excerpt:` (≤60 words synthesized from the existing About section reflecting CEE / Tech Lead AI / Odoo + AI infra positioning), `contacts:` (LinkedIn, mailto:, GitHub — replace the existing `[LinkedIn] · [Email] · [GitHub]` placeholders with real URLs from the owner)
- [X] T023 Curate seed post #1 from `~/Documents/tech-lead-library/` — pick the strongest piece for the Tech Lead AI / R&D / Odoo + AI infra positioning (candidates: `notes/sdd-methodology-pilot.md`, `архітектура/hexagonal-architecture-claude-code-strategy.md`, `notes/helpera-ai-support-iteration1.md`); place at `src/content/posts/<slug>.md` with valid frontmatter (title/date/slug/tags/summary; cover optional). If source is Ukrainian, translate to English per FR-023.
- [X] T024 [P] Curate seed post #2 from `~/Documents/tech-lead-library/` — different topic from post #1 to show range; place at `src/content/posts/<slug>.md` with valid frontmatter; translate to English if needed.
- [X] T025 [P] Curate seed post #3 from `~/Documents/tech-lead-library/` — third distinct piece; place at `src/content/posts/<slug>.md` with valid frontmatter; translate to English if needed.

**Checkpoint**: `npm run build` should succeed (no pages yet but schemas validate, content loads, base layout type-checks). User story implementation can now begin.

---

## Phase 3: User Story 1 — Home page (Priority: P1) 🎯 MVP

**Goal**: A first-time visitor lands on `/PVS/` and sees photo + short bio excerpt + the three most-recent published posts, with working links onward.

**Independent Test**: Open `http://localhost:4321/PVS/` in a fresh browser. Within one screen height: see one photo, ≤60-word bio excerpt, and three post entries (title/date/summary). Each entry links to its post.

### Implementation for User Story 1

- [X] T026 [US1] Create `src/components/PostList.astro` accepting a `posts` prop (sorted, already-filtered list) and rendering each entry as `title` / `date` / `tags` / `summary` / link to `/blog/<slug>/`; structurally reusable by US3 — keep presentation neutral
- [X] T027 [US1] Create `src/pages/index.astro` using `BaseLayout`: render Astro `<Image>` for the bio's `photo`, render the bio's `excerpt`, then `<PostList posts={latestThree} />` where `latestThree` is `getCollection('posts')` filtered to `data.date <= new Date()` (FR-004), sorted `date` desc, sliced to 3 (FR-007)
- [X] T028 [US1] Implement empty-posts fallback in `src/pages/index.astro`: if no published posts exist, render a single neutral placeholder line in place of the post list (spec edge case "No posts yet")

**Checkpoint**: User Story 1 fully functional. Home page renders all three home-area requirements. Test independently via the Phase N validation block for US1.

---

## Phase 4: User Story 2 — Post page (Priority: P1)

**Goal**: A reader opens any post directly via its URL and reads the full content with prev/next navigation in date order.

**Independent Test**: Open any post page directly. Verify title/date/tags/summary/cover/body render; verify prev/next links point to correct date-adjacent published posts (and disable/hide at the boundaries).

### Implementation for User Story 2

- [X] T029 [P] [US2] Create `src/components/PrevNextNav.astro` accepting `prev` and `next` props (each either `{ slug, title } | null`); render two links/buttons with semantically correct disabled/hidden state when the prop is null (spec edge cases "newest post" / "single post only")
- [X] T030 [US2] Create `src/lib/posts.ts` exporting `getPublishedPostsSorted()` (returns `Post[]` sorted `date` desc filtered by `data.date <= new Date()`), `getPrevNext(slug)` (returns `{ prev, next }` based on the sorted list); also performs the slug-uniqueness check at module load and throws an Error listing both file paths on collision (data-model.md "Slug-uniqueness check", FR-016)
- [X] T031 [US2] Create `src/pages/blog/[slug].astro` with `getStaticPaths` calling `getPublishedPostsSorted()` (so future-dated posts get no page generated, FR-004), props passing the entry plus `{ prev, next }` from `getPrevNext`; render via `BaseLayout`: title, date, tags, summary, optional `<Image src={post.data.cover} ... />` if defined, the rendered Markdown body, then `<PrevNextNav prev={prev} next={next} />`
- [X] T032 [US2] Verify code blocks in the rendered body inherit the monospace family from `global.css` and the dual-theme Shiki CSS overrides from T016 — adjust selectors in `src/styles/global.css` if needed (FR-018)

**Checkpoint**: User Stories 1 AND 2 both work independently. Reading a post end-to-end with prev/next navigation is fully functional.

---

## Phase 5: User Story 3 — Blog index (Priority: P2)

**Goal**: A returning visitor sees every published post in newest-first order with title/date/tags/summary on `/PVS/blog/`.

**Independent Test**: Open `/PVS/blog/`. Verify exactly N entries for N published posts, newest first; clicking any entry opens its post page.

### Implementation for User Story 3

- [X] T033 [US3] Create `src/pages/blog/index.astro` using `BaseLayout`: call `getPublishedPostsSorted()` (from `src/lib/posts.ts` — already created in T030), pass to `<PostList posts={allPublished} />` (component already exists from T026)
- [X] T034 [US3] Implement empty-posts fallback in `src/pages/blog/index.astro`: if no published posts exist, render a single neutral placeholder line (spec edge case "No posts yet")

**Checkpoint**: User Stories 1, 2, AND 3 all work independently. Full archive visible.

---

## Phase 6: User Story 4 — About page (Priority: P2)

**Goal**: A visitor reads the full bio narrative + experience + contacts on `/PVS/about/`.

**Independent Test**: Open `/PVS/about/`. Verify full bio body renders (existing PVS/src/bio.md sections preserved), contacts are clickable and correct.

### Implementation for User Story 4

- [X] T035 [US4] Create `src/pages/about.astro` using `BaseLayout`: load the single bio entry via `getCollection('bio')`, render the bio's full Markdown body via Astro's `render()` API, render `name` / `role` / `location` in the page header, render `contacts` as a list of links (each link's `href` per the schema's regex)

**Checkpoint**: All P1 + P2 stories work. Site is feature-complete except for 404 and polish.

---

## Phase 7: User Story 5 — 404 page (Priority: P3)

**Goal**: Unknown URLs serve a clear "not found" page with links back to home and blog index.

**Independent Test**: Visit `/PVS/blog/this-does-not-exist/` → 404 page renders with home + blog index links that work.

### Implementation for User Story 5

- [X] T036 [US5] Create `src/pages/404.astro` using `BaseLayout`: short "Page not found" message in serif, two links — Home (`${import.meta.env.BASE_URL}`) and Blog (`${import.meta.env.BASE_URL}blog/`) (FR-011); no decorative imagery (Principle IV)

**Checkpoint**: All five user stories independently functional.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Deploy pipeline, manual acceptance validation against the spec's user-story criteria, performance/contrast/JS-disabled gates, repo hygiene.

### Deploy

- [X] T037 Create `.github/workflows/deploy.yml` matching the workflow in [contracts/build-deploy.md](./contracts/build-deploy.md): triggers `push` to `main` + `workflow_dispatch`, two jobs (`build` and `deploy`), uses `actions/checkout@v4`, `actions/setup-node@v4` (with `node-version-file: .nvmrc` and `cache: npm`), runs `npm ci` + `npm run build`, uploads `./dist` via `actions/upload-pages-artifact@v3`, deploys via `actions/deploy-pages@v4`; permissions block: `contents: read`, `pages: write`, `id-token: write`

### Build-fail-loud verification (SC-007)

- [X] T038 [P] Verify build fails on missing required frontmatter: temporarily delete the `summary` field from any seed post, run `npm run build`, confirm non-zero exit + error names file + missing field; restore the field
- [X] T039 [P] Verify build fails on duplicate slug: temporarily set two seed posts to the same `slug`, run `npm run build`, confirm error lists both file paths; restore
- [X] T040 [P] Verify build fails on missing cover image: add a `cover: ./does-not-exist.jpg` to any seed post, run `npm run build`, confirm error names the missing path; revert
- [X] T041 [P] Verify future-dated posts are silently excluded (NOT a build failure): set one seed post's `date` to a future date, run `npm run build`, confirm build succeeds and the dynamic page for that post is NOT in `dist/` and the post does not appear on home or blog index; revert

### User-story acceptance validation (mapped to spec.md)

- [ ] T042 [P] [US1] Manual: open `http://localhost:4321/PVS/` after `npm run preview`; confirm photo + bio excerpt (≤60 words) + 3 latest post entries visible without scrolling; click each post entry → lands on post page; click About in nav → lands on About page (spec US1 acceptance scenarios 1–3)
- [ ] T043 [P] [US2] Manual: open any post page directly; verify title/date/tags/summary/body all render; verify code blocks in monospace; click `previous` and `next` to confirm correct date-adjacent neighbors; verify `next` is absent/disabled on the newest post; verify cover image displays only when frontmatter declares it (spec US2 acceptance scenarios 1–4)
- [ ] T044 [P] [US3] Manual: open `/PVS/blog/`; confirm exactly N entries for N published posts in newest-first order; click an entry → correct post (spec US3 acceptance scenarios 1–2); also verify empty-state placeholder renders by temporarily moving all posts out and reloading (US3 scenario 3)
- [ ] T045 [P] [US4] Manual: open `/PVS/about/`; confirm full bio narrative + selected work + stack + contact links visible; click each contact link, confirm correct external destination or `mailto:` action (spec US4 acceptance scenarios 1–2)
- [ ] T046 [P] [US5] Manual: navigate to `/PVS/blog/this-does-not-exist/`; confirm 404 page renders with clear "not found" message and working home + blog links (spec US5 acceptance scenarios 1–2)

### Cross-cutting acceptance validation

- [ ] T047 [P] Manual: with OS appearance set to Light, then Dark, then auto, reload the home page; confirm site palette switches between light and dark monochrome variants without page reload and without JS (FR-019, FR-019a)
- [ ] T048 [P] Manual: disable JavaScript in the browser; navigate Home → About → Blog index → a post page → 404 → back; confirm every page is fully readable and every link works (FR-020, SC-005)
- [ ] T049 [P] Manual: open DevTools → Network → "Disable cache"; reload each page type once; confirm transferred bytes < 100 KB per page (SC-004)
- [ ] T050 [P] Manual: run an axe-core or browser accessibility tool against home, post, blog index, about, 404 in BOTH light and dark themes; resolve any AA contrast failures (FR-021, both variants)
- [X] T051 Verify reproducible build (SC-006): run `npm run build` twice in a row, then `diff -r dist1/ dist2/`; confirm no differences. Recursive diff command: `cp -R dist dist1 && rm -rf dist && npm run build && cp -R dist dist2 && diff -r dist1 dist2 && rm -rf dist1 dist2`
- [X] T052 Verify offline build (SC-006): disable network, run `npm run build`; confirm success with no errors

### Repo hygiene and documentation

- [X] T053 [P] Update `README.md` at repo root: replace the empty content with one short project description, link to [specs/001-portfolio-blog-site/quickstart.md](./quickstart.md), and call out the `base: '/PVS/'` assumption pointing to [research.md](./research.md) (a single line is fine — Principle IV: do not over-decorate the README)
- [X] T054 [P] Add a single-line comment in `astro.config.mjs` next to the `base:` value pointing to [contracts/build-deploy.md](./contracts/build-deploy.md) and the open-decision section in [research.md](./research.md)
- [X] T055 Final: run `npm run build` one last time on a clean working tree; confirm clean exit; commit `package-lock.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories.
  - Inside Phase 2: T010 must come before T023–T025 (schemas validate the seed content); T015 must come before T016 (global stylesheet must exist before Shiki overrides are appended); T017 must come before T020 (the layout file is the assertion site).
- **User Stories (Phase 3+)**: All depend on Foundational. Each story is independently completable.
  - US1 → uses `BaseLayout` (T017), `PostList` (T026 — created in US1).
  - US2 → uses `BaseLayout` (T017), `PrevNextNav` (T029), `posts.ts` lib (T030).
  - US3 → uses `BaseLayout` (T017), `PostList` (T026 from US1) and `posts.ts` lib (T030 from US2). **Soft dependency**: T033 reuses T026 and T030. If implemented strictly in priority order (US1 → US2 → US3), this dependency is satisfied naturally.
  - US4 → uses `BaseLayout` (T017) and the bio collection (T022). Otherwise independent.
  - US5 → uses `BaseLayout` (T017). Otherwise independent.
- **Polish (Phase N)**: Validation tasks T042–T046 each depend on their respective user story being implemented. Build-fail tasks T038–T041 depend on Foundational seed content existing. Deploy task T037 is independent (can be authored at any point after Setup).

### Within Each User Story

- US3 reuses `PostList` from US1 and `getPublishedPostsSorted` from US2. If you implement strictly in priority order, no extra coordination needed. If you parallelize US1+US3, hoist T026 and T030 forward.

### Parallel Opportunities

- All Setup tasks marked **[P]** (T003, T004, T005, T006, T007, T008) can run in parallel after T001+T002.
- In Phase 2: T013 + T014 (font downloads) are parallel; T024 + T025 (seed posts 2 and 3) are parallel.
- In Phase 7: build-fail verification tasks T038–T041 are parallel (each manipulates a different field/file independently — but DO NOT run simultaneously without separate working trees, since they all touch `src/content/posts/`; mark **[P]** as "logically independent," coordinate sequencing in practice).
- Manual validation tasks T042–T050 are parallel — each opens a different page or runs a different check.

---

## Parallel Example: Phase 2 foundational

```bash
# Once T010 (schema) and T015 (global.css) exist, the following can run in parallel:
Task: "T013 Download Source Serif 4 woff2 → src/assets/fonts/source-serif-4/"
Task: "T014 Download JetBrains Mono woff2 → src/assets/fonts/jetbrains-mono/"
Task: "T024 Curate seed post #2 → src/content/posts/<slug>.md"
Task: "T025 Curate seed post #3 → src/content/posts/<slug>.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 (Setup).
2. Phase 2 (Foundational).
3. Phase 3 (US1 — Home page).
4. **STOP and validate**: Run T042 (US1 manual acceptance). Home page works → MVP shippable.

### Incremental Delivery (recommended order)

1. Setup + Foundational → site shell exists, schemas validate, three seed posts loaded.
2. US1 → Home page → ship MVP.
3. US2 → Post page → reading experience complete.
4. US3 → Blog index → archive visible.
5. US4 → About page → full bio surface.
6. US5 → 404 page → no dead-ends.
7. Polish → deploy + cross-cutting acceptance.

Each step adds value without breaking the previous step.

---

## Notes

- **[P]** = different files / no incomplete-task dependency; safe to run in parallel.
- **[Story]** label maps a task to a single user story for traceability against the spec.
- Setup, Foundational, and Polish phases are unlabeled (cross-cutting).
- Tests are intentionally absent — `astro check` + `astro build` is the v1 gate per [plan.md](./plan.md).
- Avoid: vague tasks ("polish things"), same-file conflicts (none of the [P] tasks touch the same file in a way that conflicts), cross-story dependencies that would break independence (US3's reuse of US1's `PostList` is the only soft coupling — accepted).
- **Open item from plan.md (not blocking task execution)**: `base: '/PVS/'` assumes the GitHub repo will be named `PVS`. T053 + T054 ensure this assumption is documented at the source files. Confirm with owner before T037 (deploy) goes live.
