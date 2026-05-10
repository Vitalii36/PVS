# Contract: URL Routes

**Feature**: 001-portfolio-blog-site
**Audience**: External linkers (anyone embedding URLs to this site in
emails, conference programs, social posts, search-engine submissions).
**Source spec**: [spec.md](../spec.md) FR-006 through FR-012.

The URL structure is a public contract. Once a path is published it
SHOULD remain stable; changes are breaking for every external link.

---

## Production URL space

All paths are served under the `base` configured in
`astro.config.mjs`. The default for v1 is `/PVS/` (see
[research.md](../research.md) — Open decision: `base: '/PVS/'`).

| Page | Path (with default `base: '/PVS/'`) | Source file |
|---|---|---|
| Home | `/PVS/` | `src/pages/index.astro` |
| About | `/PVS/about/` | `src/pages/about.astro` |
| Blog index | `/PVS/blog/` | `src/pages/blog/index.astro` |
| Post | `/PVS/blog/<slug>/` | `src/pages/blog/[slug].astro` (dynamic) |
| 404 | served for anything else | `src/pages/404.astro` |

If `base` changes (custom domain, repo rename), every path above
shifts uniformly. The path **suffix** (everything after `base`) is
the stable part of the contract.

---

## Trailing slashes

Astro's default `trailingSlash: 'always'` is in effect. Every routed
URL ends in `/`. GitHub Pages serves `<path>/index.html` for
`<path>/`, which matches Astro's static output layout.

Authors and external linkers SHOULD use the trailing-slash form. The
non-slash form may 404 on certain hosts.

---

## 404 contract

- Any URL not matched by the routes above MUST return the 404 page.
- The 404 page MUST include working links back to home (`/`) and the
  blog index (`/blog/`) (FR-011).
- GitHub Pages serves `404.html` automatically for unknown paths
  under the deployed base. No special config beyond producing
  `dist/404.html` is needed.

---

## What the contract does NOT promise

- Tag pages (`/blog/tags/<tag>/`): not in v1.
- RSS / Atom feed paths: not in v1.
- Per-language paths (`/en/`, `/uk/`): not in v1 (English only).
- Pagination on the blog index: not in v1 (all posts on one page).
- Direct asset URLs (e.g. `/PVS/_astro/<hash>.css`): treated as
  build artifacts, not stable contracts. External links to them
  are unsupported.
