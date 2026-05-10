# Phase 1 Data Model: Personal Portfolio Site with Markdown Blog

**Feature**: 001-portfolio-blog-site
**Date**: 2026-05-10
**Implements**: spec.md → "Key Entities" section, FR-001 through FR-005,
FR-016.

This document is the canonical schema for what lives in `src/content/`.
The Zod definitions below are copied into `src/content.config.ts`
verbatim during implementation; no other code may define a competing
shape.

---

## Entities

### Post

A single blog post. One Markdown file under `src/content/posts/` per
Post. `slug` is the only identity attribute and the URL determinant.

**Attributes**:

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | yes | 1–120 chars. Rendered verbatim as the post `<h1>` and in index entries. |
| `date` | `Date` (ISO `YYYY-MM-DD`) | yes | Used for sort order and the future-date "draft" check. |
| `slug` | `string` | yes | URL-safe (`^[a-z0-9]+(-[a-z0-9]+)*$`). Determines `/blog/<slug>`. Must be unique across the collection. |
| `tags` | `string[]` | no (default `[]`) | Each tag matches `^[a-z0-9-]+$`, max 32 chars. Displayed but not interactive in v1. |
| `summary` | `string` | yes | 20–280 chars. Rendered on home, blog index, and post page. |
| `cover` | `image()` (Astro helper) | no | Path relative to the post `.md` file. Resolved + optimized at build. |

**Validation rules (enforced by Zod schema → build failure on any breach):**

1. All required fields present — missing field fails build with file path + field name (FR-016, edge case "Missing required frontmatter").
2. `slug` matches `^[a-z0-9]+(-[a-z0-9]+)*$`.
3. `slug` is unique across the collection. Duplicate slugs across two `.md` files fail the build with both file paths (FR-016, edge case "Duplicate slugs").
4. `date` parses as a valid ISO `YYYY-MM-DD`.
5. If `cover` is present, the referenced file exists and is a supported image format. Astro's `image()` helper handles both checks (FR-016, edge case "Cover image referenced but missing").
6. `summary` length is within 20–280 chars (cheap signal that the author wrote a real summary, not a placeholder).

**Lifecycle / state**:

- A Post is **published** when `date <= build date`.
- A Post is **draft (deferred)** when `date > build date`. Drafts are
  excluded from all listings (`/blog`, home "latest 3"), excluded
  from prev/next neighbors, and their dynamic page is **not generated**
  at build (so a deep link returns 404). On the next build after the
  date is reached, the Post becomes published automatically.
- There is no `draft: true` flag in v1 — future-dating is the single
  draft mechanism. (Revisit if authoring patterns demand a richer
  draft state.)

**Derived attributes** (computed at build, not stored in frontmatter):

| Derived | How |
|---|---|
| `prev` | The published Post with the next-older `date` (or `null` if this is the oldest). |
| `next` | The published Post with the next-newer `date` (or `null` if this is the newest). |
| `url` | `${import.meta.env.BASE_URL}blog/${slug}/` |
| `body` | The rendered HTML of the Markdown body (Astro's `render()` API). |

---

### Author

The site owner. Exactly one Author. Stored as a single Markdown file
in a `bio` collection so the same Zod-validated content seeds both the
home page excerpt and the About page narrative (FR-005).

**Attributes**:

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | yes | Rendered in the home header, About header, and `<title>` template. |
| `role` | `string` | yes | E.g. "Tech Lead, AI & R&D — BJET". One line. |
| `location` | `string` | no | E.g. "Khmelnytskyi, Ukraine". |
| `photo` | `image()` (Astro helper) | yes | Author photo. Sourced from the existing `PVS/src/photo.jpeg` during implementation; final location is `src/assets/images/photo.jpeg`. |
| `excerpt` | `string` | yes | 1–60 words. Rendered on the home page; intentionally distinct from the body so the home page does not duplicate the About page narrative. |
| `contacts` | `array of { label: string; href: string }` | yes (≥ 1 entry) | E.g. LinkedIn, Email (`mailto:`), GitHub. Each `href` validated as a URL or `mailto:`. |

**Body**: The Markdown body of `bio.md` is the **full bio narrative**
rendered on the About page. Sections (`## About`, `## Selected Work`,
`## Stack`, `## Beyond the Keyboard`) follow the structure already
present in `PVS/src/bio.md` and need no schema enforcement.

**Validation rules**:

1. Exactly one entry exists in the `bio` collection at build time. Two
   or more entries → build failure ("Author identity is single",
   spec Assumptions).
2. `excerpt` word count ≤ 60.
3. Each `contacts[].href` matches `^(https?://|mailto:)`.

---

### Site (derived)

Not authored — derived at build time from the Posts and the Author.

**Attributes**:

| Derived | How |
|---|---|
| `posts` | The Post collection filtered to published, sorted `date` desc. |
| `latestThree` | `posts.slice(0, 3)`. Drives home page. |
| `author` | The single Author entry. |
| `nav` | Static map: home (`/`), About (`/about/`), Blog (`/blog/`). |
| `buildTimestamp` | UTC instant when the build ran. Optionally rendered in the footer. |

---

## Zod schema (copy into `src/content.config.ts`)

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(120),
      date: z.coerce.date(),
      slug: z
        .string()
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
          message: 'slug must be lowercase, hyphen-separated, no leading/trailing hyphen',
        }),
      tags: z
        .array(z.string().regex(/^[a-z0-9-]+$/).max(32))
        .default([]),
      summary: z.string().min(20).max(280),
      cover: image().optional(),
    }),
});

const bio = defineCollection({
  loader: glob({ pattern: 'bio.md', base: './src/content/bio' }),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      role: z.string().min(1),
      location: z.string().optional(),
      photo: image(),
      excerpt: z
        .string()
        .refine((s) => s.trim().split(/\s+/).length <= 60, {
          message: 'excerpt must be 60 words or fewer',
        }),
      contacts: z
        .array(
          z.object({
            label: z.string().min(1),
            href: z.string().regex(/^(https?:\/\/|mailto:)/),
          }),
        )
        .min(1),
    }),
});

export const collections = { posts, bio };
```

**Slug-uniqueness check**: Astro's content layer uses the file path
as the entry id, but the spec requires the *frontmatter* `slug` to be
unique because it determines URLs. Add a runtime uniqueness check at
the top of `src/pages/blog/[slug].astro` (or in a small build-time
script) that throws an explicit error listing the conflicting file
paths. The Zod schema alone cannot enforce cross-entry uniqueness.

**Single-Author check**: Implement as a `getCollection('bio')` length
assertion in `BaseLayout.astro` (or wherever the bio is first
consumed). Throwing during the page build is sufficient — Astro
reports the error with file location.

---

## Mapping back to the spec

| Spec requirement | Schema element |
|---|---|
| FR-001 (one .md per post) | `posts` collection loader pattern |
| FR-002 (frontmatter fields) | `posts` schema attributes |
| FR-003 (unique slug) | Slug regex + runtime uniqueness check |
| FR-004 (future date = draft) | Filter in page templates: `date <= now` |
| FR-005 (single bio file) | `bio` collection loader pattern (single file) + single-Author runtime check |
| FR-016 (build fails loudly) | Zod throws on schema breach; runtime checks throw with file paths |
| Edge: missing required frontmatter | `z.string().min(1)` and required fields |
| Edge: future-dated post | Filter excludes from listings + skips dynamic page generation |
| Edge: cover image missing | `image()` helper validates file existence |
