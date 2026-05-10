# Contract: Post Frontmatter Schema

**Feature**: 001-portfolio-blog-site
**Audience**: Anyone authoring a `.md` file under `src/content/posts/`.
**Authoritative implementation**: [src/content.config.ts](../../../src/content.config.ts) (after Phase 2 implementation).
**Source spec**: [spec.md](../spec.md) FR-001, FR-002, FR-003, FR-016.

This is the contract between the Markdown author and the build pipeline.
Any post that violates it MUST cause `npm run build` to exit non-zero
with a message that names the offending file and the specific problem
(SC-007).

---

## File location

```
src/content/posts/<anything>.md
```

The filename can be anything (Astro uses the file path as the entry id),
but the **`slug` frontmatter field** is what determines the URL. Filename
and slug do not need to match. By convention, the filename mirrors the
slug for findability:

```
src/content/posts/my-first-post.md   →  /PVS/blog/my-first-post/
```

Cover images live alongside the post `.md`:

```
src/content/posts/my-first-post.md
src/content/posts/my-first-post-cover.jpg
```

---

## Frontmatter shape

```yaml
---
title: "How I learned to stop worrying and love rehype-pretty-code"
date: 2026-05-10
slug: how-i-learned-to-stop-worrying
tags: [astro, markdown, build-tooling]
summary: A short description of what the post is about, between 20 and 280 characters. This is rendered on the home page, the blog index, and the post page itself.
cover: ./how-i-learned-to-stop-worrying-cover.jpg
---
```

### Field reference

| Field | Type | Required | Constraint | Used by |
|---|---|---|---|---|
| `title` | string | **yes** | 1–120 chars | Post `<h1>`, listings, `<title>` |
| `date` | ISO date `YYYY-MM-DD` | **yes** | Valid date | Sort order, draft check, displayed |
| `slug` | string | **yes** | `^[a-z0-9]+(-[a-z0-9]+)*$`, unique across collection | URL `/blog/<slug>/` |
| `tags` | list of strings | no (default `[]`) | each `^[a-z0-9-]+$`, max 32 chars | Displayed only |
| `summary` | string | **yes** | 20–280 chars | Listings + post page |
| `cover` | path | no | Path relative to `.md`; file must exist; supported image format | Optional cover image |

---

## Failure modes (what the build will refuse)

Each row below MUST produce a non-zero exit code from `npm run build`
and a human-readable error that names the file and the field.

| Violation | Build error mentions |
|---|---|
| Missing `title` | "title: Required" + file path |
| Missing `date` | "date: Required" + file path |
| Missing `slug` | "slug: Required" + file path |
| Missing `summary` | "summary: Required" + file path |
| `slug` doesn't match the regex | "slug must be lowercase, hyphen-separated…" + file path |
| `slug` duplicated across two posts | Both file paths listed in the build error |
| `summary` shorter than 20 or longer than 280 chars | Length error + file path |
| `tags` contains a value that doesn't match the regex | Tag value + file path |
| `date` not a valid date | Parse error + file path |
| `cover` references a missing file | Astro `image()` helper error + file path |
| Frontmatter YAML is unparseable | YAML parser error + file path |

Posts dated in the future do **not** fail the build — they are silently
treated as drafts (excluded from listings and from page generation)
until the date arrives.

---

## Slug → URL contract

```
slug = "my-first-post"
URL  = "/PVS/blog/my-first-post/"
```

(or whatever `base` is set to in `astro.config.mjs` — see
[contracts/build-deploy.md](./build-deploy.md).)

This is a stable contract: once a post is published with a given slug,
**changing the slug is a breaking change** for any external link to the
post. Slug renames in v1 are out of scope (no redirect mechanism).
Authors should choose slugs they can live with for a long time.

---

## Out of scope for v1

- `draft: true` flag (future-date a post instead).
- Tag pages or tag filtering (tags display but are not links).
- Multi-language posts (`lang: uk` etc.) — site is English only per
  [spec.md FR-023](../spec.md). Revisit when adding a localization
  feature.
- Author/co-author fields — single Author site (spec Assumption).
- Series / part-of fields — defer until needed.
