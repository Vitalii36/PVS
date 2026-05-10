# Contract: Build & Deploy

**Feature**: 001-portfolio-blog-site
**Audience**: Anyone building or deploying the site (today: the owner;
tomorrow: any contributor or CI environment).
**Source spec**: [spec.md](../spec.md) FR-013, FR-014, FR-015, FR-016,
SC-006, SC-007.

---

## Local build contract

**Inputs:**
- A working tree where `npm ci` has been run against `package-lock.json`.
- Node version matching `.nvmrc` (Node 22 LTS).
- No network access required after `npm ci` completes.

**Command:** `npm run build`

**Behavior:**
- Runs `astro check` (TypeScript + content schema validation).
- Runs `astro build` (renders all pages to `dist/`).
- Exits 0 on success, non-zero on any of the failure modes listed in
  [post-frontmatter.md](./post-frontmatter.md) or any TypeScript error.

**Output:** `dist/` directory containing fully self-contained static
files (HTML, CSS, JS bundles where applicable, fonts, images).

**Reproducibility (SC-006):** Running `npm run build` twice in a row
on the same input MUST produce byte-identical output. The build MUST
succeed with the network disconnected.

---

## Deploy contract — GitHub Pages

**Workflow file:** `.github/workflows/deploy.yml`

**Trigger:** Push to `main` branch (and `workflow_dispatch` for
manual re-deploys).

**Required repository settings:**
- Settings → Pages → "Source" set to **GitHub Actions** (not "Deploy
  from a branch").
- Repository named `PVS` (so the published URL is
  `https://<user>.github.io/PVS/`) — OR change `base` and `site` in
  `astro.config.mjs` to match the actual repo name.

**Workflow permissions:**

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

**Workflow structure (single workflow, two jobs):**

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Pinned action versions:** All third-party actions pinned to a major
tag (`@v4`, `@v3`). If supply-chain hygiene becomes a concern, swap
to commit-SHA pins in a follow-up.

---

## astro.config.mjs contract

The single source of truth for `site` and `base`:

```js
// astro.config.mjs (excerpt)
export default defineConfig({
  site: 'https://<github-user>.github.io',  // owner-confirmed before first deploy
  base: '/PVS/',                             // see research.md — Open decision
  output: 'static',
  trailingSlash: 'always',
  // ... markdown, vite, integrations
});
```

If the deploy target changes (custom domain, repo rename, root
domain), update **only** these two values and re-deploy. No other
file references the deploy URL.

---

## Failure-mode contract

| Stage | Failure | What you see |
|---|---|---|
| `npm ci` | Lockfile drift | `npm ci` exits non-zero; CI step fails |
| `astro check` | Type or schema error | Error with file path + line + message |
| `astro check` | Content schema breach | Error names file + offending field (FR-016) |
| `astro build` | Missing cover image | Error names post + image path (FR-016) |
| `astro build` | Duplicate slug | Error names both `.md` files (FR-016) |
| `upload-pages-artifact` | `dist/` empty or missing | Action exits non-zero |
| `deploy-pages` | Pages source not set to "GitHub Actions" | Action error pointing to repo settings |

**No silent failures.** Every condition above produces a CI red mark
and a clearly-named error.

---

## Out of scope for v1

- Preview deployments per pull request.
- Branch deploys (e.g. staging from `develop`).
- Automatic dependency updates (Dependabot/Renovate config).
- Lighthouse / accessibility checks in CI — manual quickstart
  validation only in v1.
- Pinning all GitHub Actions to commit SHA (using major-tag pins for
  ergonomics; revisit if threat model demands tighter control).
