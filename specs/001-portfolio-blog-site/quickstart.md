# Quickstart: Personal Portfolio Site

**Feature**: 001-portfolio-blog-site
**Audience**: Site owner (today) or any future contributor.

---

## Prerequisites

- Node.js 22 LTS (`.nvmrc` is the source of truth).
  - With nvm: `nvm install` (reads `.nvmrc`).
- Git.
- A clone of this repository.

---

## First-time local setup

```bash
nvm install                # installs Node version from .nvmrc
nvm use
npm ci                     # exact deps from package-lock.json — required for reproducibility
```

---

## Local development

```bash
npm run dev                # Astro dev server, default http://localhost:4321/PVS/
```

Edit any file under `src/`. The dev server hot-reloads.

---

## Add a new blog post

1. Create a new `.md` file under `src/content/posts/`. The filename
   can be anything; convention: `<slug>.md`.

2. Write the frontmatter, following the contract in
   [contracts/post-frontmatter.md](./contracts/post-frontmatter.md):

   ```yaml
   ---
   title: "Your post title"
   date: 2026-05-10
   slug: your-post-slug
   tags: [tag-one, tag-two]
   summary: One sentence describing the post (20–280 chars).
   # cover: ./your-post-slug-cover.jpg   # optional
   ---

   Your Markdown body here.

   ## A heading

   ```python
   def hello():
       return "world"
   ```
   ```

3. (Optional) Drop a cover image alongside the `.md` file. Reference
   it in `cover:` with a relative path.

4. Save. The dev server reloads. The home page shows your post if it
   is one of the three latest by date; the blog index shows it
   regardless.

5. To draft / postpone: set `date` to a future date. The post will
   not appear anywhere until the build runs on or after that date.

---

## Verify before committing

```bash
npm run build              # runs astro check + astro build
```

This is the only test gate. It catches:

- Missing or malformed frontmatter (per the schema in
  [data-model.md](./data-model.md)).
- Duplicate slugs across two posts.
- Missing cover image files.
- TypeScript / type errors in components.
- Broken Astro asset references.

Build success → safe to commit and push.

---

## Manual smoke test (each release)

After a successful build, run:

```bash
npm run preview            # serves dist/ at http://localhost:4321/PVS/
```

Check the following in a browser (covers the spec's user stories):

- [ ] Home page shows photo, bio excerpt, and the three latest post
      entries (US-1).
- [ ] Each home post entry links to the post page.
- [ ] Blog index lists every published post in newest-first order
      (US-3).
- [ ] Open any post; verify title, date, tags, summary, body
      (with code blocks in monospace) all render. Click prev/next
      and confirm correct neighbors (US-2).
- [ ] About page renders the full bio + contacts (US-4).
- [ ] Visit `/PVS/blog/this-post-does-not-exist/` → 404 page with
      links back home and to /blog/ (US-5).
- [ ] Toggle OS color scheme (Settings → Appearance) → site
      switches between light and dark monochrome variants without
      reload (FR-019).
- [ ] Disable JavaScript in the browser → every page above remains
      readable and navigable (FR-020, SC-005).

---

## Deploy

Pre-flight (one-time):

1. Push the repo to GitHub. The repo MUST be named `PVS` so the
   published URL is `https://<user>.github.io/PVS/`. If you choose a
   different name, edit `base` and `site` in `astro.config.mjs`
   first.
2. In the repo on GitHub: **Settings → Pages → Source = "GitHub
   Actions"**.

After that, every push to `main` triggers
`.github/workflows/deploy.yml`, which builds and deploys
automatically. Watch the Actions tab. The deploy job's URL output is
the live site.

To re-deploy without a code change: **Actions → "deploy" → Run
workflow**.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm ci` fails | `package-lock.json` out of date | Run `npm install`, commit the updated lockfile |
| Build fails with "slug must be lowercase…" | Slug regex breach | Edit frontmatter slug |
| Build fails with "Cover image not found" | `cover:` path wrong | Fix the relative path or remove the field |
| Two posts get the same URL | Duplicate `slug` | Build will refuse — change one slug |
| Site loads but everything is unstyled | `base` mismatch between dev URL and `astro.config.mjs` | Use `http://localhost:4321/PVS/`, not `http://localhost:4321/` |
| Deploy succeeds but page 404s | Repo name ≠ `PVS` and `base` not updated | Update `base` + `site` in `astro.config.mjs` and re-deploy |
| Dark theme doesn't activate | Browser/OS preference not set or not respected | Check OS Appearance settings; verify `prefers-color-scheme: dark` in DevTools rendering pane |

---

## Where to look next

- Architecture and decisions: [plan.md](./plan.md), [research.md](./research.md)
- Schemas and entities: [data-model.md](./data-model.md)
- Contracts (frontmatter, URLs, build/deploy): [contracts/](./contracts/)
- Source spec: [spec.md](./spec.md)
- Project constitution (the hard rules): [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
