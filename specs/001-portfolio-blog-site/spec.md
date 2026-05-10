# Feature Specification: Personal Portfolio Site with Markdown Blog

**Feature Branch**: `001-portfolio-blog-site`
**Created**: 2026-05-10
**Status**: Draft
**Input**: User description: "Особистий сайт-портфоліо з блогом. Структура: головна (фото + коротке bio + перелік 3 останніх постів), сторінка About (повноцінне bio, досвід, контакти), блог-індекс (всі пости, sortable за датою), сторінка поста (markdown content, метадата, navigation prev/next), 404. Без логіну, без коментарів, без пошуку. Контент пишеться як .md файли в репо. Метадата поста: title, date, slug, tags, summary, optional cover image. Дизайн чорно-білий, monospace для code blocks, serif для тексту або sans — на твій смак. Тема фіксована (без перемикача light/dark) — питання уточнити в clarify. Blog posts can be sourced from /Users/vitaliipravdych/Documents (max 3, choose the best); photo and bio from /Users/vitaliipravdych/Documents/PVS/mysite/PVS/src."

## Clarifications

### Session 2026-05-10

- Q: Fixed theme — light or dark? → A: Auto, follow the visitor's OS `prefers-color-scheme` (no user-facing toggle; both light and dark monochrome variants must be designed and meet contrast requirements).
- Q: Site language(s)? → A: English only. Ukrainian-source candidate posts are either translated to English or excluded from the v1 seed selection.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-time visitor lands and learns who I am (Priority: P1)

A visitor arrives at the home page from a link in someone's email signature, a
conference bio, or a search result. Within seconds they see who the site
belongs to, the active positioning (Tech Lead AI / R&D, Odoo + AI
infrastructure, CEE), and a small selection of recent writing that proves it.
They can either read more on the About page or jump into a recent post.

**Why this priority**: Without this, the site has no purpose. The home page
is the single artifact that turns a referral into a credible first
impression. Everything else is supporting context.

**Independent Test**: Open the home page in a fresh browser, with no prior
context. Within one screen height the visitor must see: a single photo, a
short bio paragraph, and a list of the three most recent posts. Each post
entry must be a working link to its full page.

**Acceptance Scenarios**:

1. **Given** a visitor with no prior context, **When** they load the home
   page, **Then** they see a photo, a short bio (≤ ~60 words), and three
   most-recent post entries (title, date, summary).
2. **Given** the visitor on the home page, **When** they click any of the
   three post entries, **Then** they land on the full post page.
3. **Given** the visitor on the home page, **When** they click the link to
   About, **Then** they land on the About page.
4. **Given** zero published posts exist, **When** the home page renders,
   **Then** the "latest posts" area is replaced with a single neutral
   placeholder line (no broken layout, no error).

---

### User Story 2 - Reader consumes a single post end-to-end (Priority: P1)

Someone arrives directly on a post page (deep link from social, search, or
the home page). They read the full post, see its metadata, and can move to
the previous or next post in the feed without returning to the index.

**Why this priority**: Posts are the core content. If reading a post is
broken or awkward, the site fails its primary distribution channel — direct
links into specific writing.

**Independent Test**: Open any post page directly via its URL. Verify the
title, date, tags, and full Markdown content render correctly (headings,
lists, code blocks). Verify the prev/next navigation links lead to the
adjacent posts in date order.

**Acceptance Scenarios**:

1. **Given** a published post, **When** the reader opens its page, **Then**
   they see title, date, tags, summary, and the full rendered Markdown
   content (with monospace code blocks).
2. **Given** the reader is on a post that has both an older and a newer
   neighbor, **When** they look at the bottom (or designated nav area),
   **Then** they see "previous post" and "next post" links pointing to the
   correct neighbors in date order.
3. **Given** the post is the newest published post, **When** the reader
   views it, **Then** the "next post" link is absent or visibly disabled,
   and "previous post" points to the second-newest.
4. **Given** the post has a cover image declared in frontmatter, **When**
   the page renders, **Then** the cover image displays at the top of the
   content area; **When** no cover image is declared, **Then** no
   placeholder image is shown.

---

### User Story 3 - Reader browses the full archive (Priority: P2)

A returning visitor wants to see everything published, not just the three
most recent. They open the blog index and see all posts ordered by date,
each with enough metadata to decide whether to click in.

**Why this priority**: The archive matters for credibility (depth of work)
and for return visitors, but the home page already covers first-touch needs.
Index can ship after P1 if needed.

**Independent Test**: Open the blog index page. Verify every published post
appears exactly once, ordered newest-first by date. Each entry shows title,
date, tags, and summary. Clicking an entry opens the corresponding post.

**Acceptance Scenarios**:

1. **Given** N published posts exist, **When** the index loads, **Then**
   exactly N entries are listed, sorted newest-first by date.
2. **Given** the reader is on the index, **When** they click any entry,
   **Then** they land on that post page.
3. **Given** zero published posts exist, **When** the index loads, **Then**
   a single neutral placeholder line is shown (no broken layout).

---

### User Story 4 - Visitor wants to know more about the author (Priority: P2)

A visitor wants the long version: full bio, role, experience, stack, and
how to reach out. They open the About page and find a self-contained
narrative plus contact links.

**Why this priority**: Reinforces credibility and provides the contact
surface that converts interest into outreach. Important but lower-frequency
than home/post.

**Independent Test**: Open the About page directly. Verify the full bio
text, experience summary, stack, and at least one contact channel are
present and that contact links are clickable and correct.

**Acceptance Scenarios**:

1. **Given** the visitor opens the About page, **When** it renders, **Then**
   they see the full bio narrative, selected work / experience, stack
   summary, and contact links.
2. **Given** the visitor clicks a contact link (LinkedIn, email, GitHub),
   **When** the link activates, **Then** it opens the correct external
   destination or `mailto:` action.

---

### User Story 5 - Visitor hits a broken or unknown URL (Priority: P3)

Someone follows a stale link, mistypes a slug, or lands on a removed post.
They get a clear 404 page that confirms the URL doesn't exist and offers
obvious paths back (home, blog index).

**Why this priority**: Prevents dead-end experiences but is rarely the
first impression. Ships after the core flows.

**Independent Test**: Navigate to any obviously invalid URL (e.g.
`/posts/this-does-not-exist`). Verify the 404 page renders, identifies
itself as "not found", and includes navigation links to home and blog
index.

**Acceptance Scenarios**:

1. **Given** an unknown URL, **When** it loads, **Then** the 404 page
   appears with a clear message and links back to home and blog index.
2. **Given** the 404 page, **When** the visitor clicks "home" or "blog",
   **Then** they reach the corresponding page.

---

### Edge Cases

- **No posts yet**: The home page's "latest posts" area and the blog index
  show a single neutral placeholder line — never broken layout, never an
  error.
- **Single post only**: Prev/next navigation hides or disables both links;
  no broken targets.
- **Two posts only**: The newest post has no "next"; the older post has no
  "previous".
- **Duplicate slugs across two `.md` files**: Build MUST fail with a clear
  error pointing to the conflicting files; no silently overwritten output.
- **Missing required frontmatter** (title, date, or slug): Build MUST fail
  with a clear error naming the offending file and missing field.
- **Cover image referenced in frontmatter but file missing**: Build MUST
  fail with a clear error naming the post and missing image path.
- **Post dated in the future**: Treated as a draft and excluded from the
  home list, blog index, and prev/next navigation until its date is
  reached at next build.
- **Very long post titles**: Display gracefully without breaking layout
  (wrap, do not truncate silently in the post header).
- **Post body containing wide code blocks**: Code blocks scroll
  horizontally within their container without breaking page layout.
- **JavaScript disabled in browser**: Every page remains fully readable and
  navigable (per constitutional Principle II/III).

## Requirements *(mandatory)*

### Functional Requirements

**Content model**

- **FR-001**: Each post MUST be authored as a single Markdown file
  containing YAML frontmatter and Markdown body.
- **FR-002**: Frontmatter MUST support the following metadata fields:
  `title` (string, required), `date` (ISO YYYY-MM-DD, required), `slug`
  (URL-safe string, required), `tags` (list of strings, optional),
  `summary` (short string, required), `cover` (path to image, optional).
- **FR-003**: The `slug` value MUST determine the post's URL path; two
  posts MUST NOT share a slug.
- **FR-004**: A post with a `date` later than the build date MUST be
  excluded from all listings and navigation until that date is reached.
- **FR-005**: Author bio content MUST be sourced from a single Markdown
  file under version control; the same file feeds the home page short bio
  and the About page full bio (with the home page rendering only an
  introductory excerpt, not a duplicated copy).

**Pages and navigation**

- **FR-006**: The site MUST provide exactly five page types: home, About,
  blog index, post page, and 404.
- **FR-007**: The home page MUST display: author photo, short bio
  excerpt, and the three most recently dated published posts (title,
  date, summary, link).
- **FR-008**: The About page MUST display: full bio narrative, selected
  work / experience, stack summary, and at least one contact channel.
- **FR-009**: The blog index MUST list every published post in
  newest-first date order with title, date, tags, summary, and a working
  link to the post page.
- **FR-010**: Each post page MUST render the post's title, date, tags,
  summary, optional cover image, full Markdown body, and prev/next
  navigation links to the adjacent posts in date order.
- **FR-011**: The 404 page MUST be served for unknown URLs and MUST
  include working links back to the home page and the blog index.
- **FR-012**: A persistent header or footer MUST expose links to home,
  About, and blog index from every page.

**Build & content lifecycle**

- **FR-013**: The site MUST be generated as static output that can be
  served from any commodity static host without a runtime backend
  (constitutional Principle II).
- **FR-014**: The build MUST run with no network access required and MUST
  produce identical output for identical inputs.
- **FR-015**: Adding a new post MUST require only adding one `.md` file
  in the configured posts directory and rebuilding; no database, no
  admin UI, no manual index editing.
- **FR-016**: The build MUST fail loudly (non-zero exit, clear error
  message) on: duplicate slugs, missing required frontmatter fields,
  unparseable frontmatter, or missing cover image files.

**Design & accessibility**

- **FR-017**: Visual design MUST be black-and-white (grayscale only) per
  constitutional Principle IV; color is reserved for image content.
- **FR-018**: Code blocks within Markdown MUST render in a monospace
  typeface; body text MUST render in a single chosen serif typeface (see
  Assumptions).
- **FR-019**: The site MUST adapt its palette to the visitor's operating-
  system preference via the CSS `prefers-color-scheme` media query, with
  no user-facing toggle. Both a light variant (near-white background,
  near-black text, grayscale accents) and a dark variant (near-black
  background, near-white text, grayscale accents) MUST be designed,
  shipped, and tested.
- **FR-019a**: The `prefers-color-scheme` adaptation MUST be implemented
  in CSS only (no JavaScript), to preserve constitutional Principles II
  and III.
- **FR-019b**: When the visitor expresses no preference (`no-preference`
  / unsupported browser), the site MUST default to the light variant.
- **FR-020**: Every page MUST remain readable and navigable with
  JavaScript disabled (constitutional Principle III).
- **FR-021**: Both the light and dark variants MUST meet WCAG 2.1 AA
  contrast within their respective monochrome palettes (body text,
  links, code blocks, and prev/next nav controls all included).
- **FR-022**: The site MUST exclude the following features from v1: user
  login, comments, full-text search, analytics SDKs, and any third-party
  embedded widgets.

**Internationalization**

- **FR-023**: The site MUST publish all content (site shell, bio, posts)
  in English only for v1. Ukrainian-source candidate posts are either
  translated to English before inclusion or excluded from the v1 seed
  selection.
- **FR-024**: Every rendered HTML page MUST declare `<html lang="en">`
  for assistive-technology and search-engine correctness.

### Key Entities

- **Post**: A piece of writing authored as one Markdown file. Attributes:
  title, date, slug, tags, summary, optional cover image, body. Has at
  most one previous and one next sibling determined by date order among
  published posts.
- **Author**: The site owner. Attributes: name, photo, short bio,
  full bio narrative, selected work / experience, stack, contact
  channels. There is exactly one Author.
- **Site**: The aggregate. Attributes: ordered list of published posts,
  the Author, navigation map (home, About, blog index, 404), build
  timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can identify the site owner, their
  role, and the topic of their writing within 10 seconds of landing on
  the home page (verified via cold-read usability check on at least 3
  unfamiliar readers).
- **SC-002**: From any post page, a reader can reach the previous post,
  next post, home, About, or blog index in a single click.
- **SC-003**: Adding a new post takes one file change (`git add` of one
  `.md` file) and one rebuild; total author time from "draft ready" to
  "live" is under 2 minutes excluding writing.
- **SC-004**: Each page transfers under 100 KB over the wire on first
  load (constitutional performance budget).
- **SC-005**: 100% of pages remain fully readable and navigable with
  JavaScript disabled.
- **SC-006**: The site builds reproducibly offline: running the build
  twice in a row produces byte-identical output, and the build succeeds
  with the network disconnected.
- **SC-007**: Any malformed post (missing required frontmatter,
  duplicate slug, missing cover image) causes the build to fail with an
  error message that names the offending file and the specific problem
  — no silent skips.
- **SC-008**: At launch, the site contains exactly one Author bio
  (sourced from the existing bio file) and at least 3 seed posts
  (curated from the candidate library), so that the home page's "3
  latest posts" area is full from day one.

## Assumptions

- **Source content for v1 launch**: The author bio and photo are sourced
  from the existing files at `PVS/src/bio.md` and `PVS/src/photo.jpeg`
  respectively. The 3 seed blog posts will be curated from the
  Markdown library at `~/Documents/tech-lead-library/` during
  implementation, selected to reinforce the active positioning (Tech
  Lead AI / R&D, Odoo + AI infrastructure, CEE) **and to be in English**
  per FR-023 (Ukrainian-only candidates are either translated or set
  aside for a future feature). Selection itself is a task in the
  implementation phase, not a spec requirement.
- **Body typography**: A serif typeface is assumed for body text
  (classic, quiet, supports the typographic-hierarchy aesthetic of
  constitutional Principle IV); a single monospace typeface is assumed
  for code blocks. Both will be self-hosted per constitutional
  Principle II. The user delegated this choice ("на твій смак"), so it
  is treated as a default rather than a clarification.
- **Cover images**: Optional per post. Posts without a cover image
  render a clean text-only header — no placeholder image is generated.
- **Tag pages / tag filtering**: Out of scope for v1. Tags display on
  the post page and on index entries but are not interactive links.
- **RSS / Atom feed**: Out of scope for v1. Can be added in a later
  feature without breaking changes.
- **Sitemap and robots.txt**: Standard static files included by the
  build; no special handling required at spec level.
- **Deployment target**: Any commodity static host (e.g. GitHub Pages,
  Netlify, S3 + CDN). The spec does not bind a specific host.
- **Build reproducibility**: Achieved by pinning all build inputs
  (typeface files, syntax-highlight assets, build-tool version) under
  version control or a lockfile.
- **Posts directory location**: A single canonical directory under the
  repo root holds all post `.md` files (exact path chosen during
  planning).
- **Author identity is single**: Exactly one Author entity; no
  multi-author support in v1.
