<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized template) → 1.0.0
Bump rationale: First ratification — replaces unfilled template with concrete
project principles for the PVS personal/portfolio site.

Principles defined (initial set):
  I.   Content as Files
  II.  Offline-First Static Build
  III. Markup-Driven JavaScript
  IV.  Quiet Aesthetic Discipline
  V.   Positioning Coherence

Added sections:
  - Core Principles (5 principles)
  - Technical Constraints
  - Development Workflow
  - Governance

Removed sections: none (template placeholders replaced)

Templates / docs requiring updates:
  ✅ .specify/memory/constitution.md (this file)
  ✅ .specify/templates/plan-template.md (generic Constitution Check slot — no
       hard-coded principle names; will be populated per-feature against
       Principles I–V)
  ✅ .specify/templates/spec-template.md (generic — no change required)
  ✅ .specify/templates/tasks-template.md (generic — no change required)
  ⚠ CLAUDE.md (currently a stub; consider expanding with a brief principle
       summary in a future amendment — not blocking)
  ⚠ PVS/index.html and PVS/css/* (existing site uses Material Design Lite
       blue-indigo theme and "developer" framing; conflicts with Principles
       IV and V — track redesign as a separate feature, not a constitution
       change)

Follow-up TODOs: none deferred in the constitution itself.
-->

# PVS Constitution

## Core Principles

### I. Content as Files

All site content MUST live in the repository as Markdown files; databases and
external content stores are prohibited. One conceptual unit (post, page,
project entry) MUST map to exactly one `.md` file. Per-file YAML frontmatter
is the single source of truth for metadata (title, date, tags, summary, etc.);
the same metadata MUST NOT be duplicated or overridden elsewhere.

**Rationale**: Files in Git give versioning, review-ability, atomic changes,
and zero infrastructure. Frontmatter as the canonical metadata layer
prevents drift between rendered output and authoritative data.

### II. Offline-First Static Build

The site MUST be fully buildable and deployable without runtime API calls.
All data required to render a page MUST be resolved at build time. Third-
party network dependencies at view time (analytics SDKs, embedded widgets,
remotely-loaded fonts or scripts) require explicit justification in the
relevant feature plan; the default is local/self-hosted assets and a static
output bundle that any commodity static host can serve.

**Rationale**: Predictable performance, deterministic builds, zero outage
surface, and durable archival behavior. A site that can be `git clone`d and
served from any static host is the baseline.

### III. Markup-Driven JavaScript

JavaScript MUST be introduced only when the underlying HTML semantics
require it (form behavior, genuinely interactive widgets, accessibility-
critical state). JS for purely decorative purposes (typewriter effects,
scroll animations, parallax, hover sparkle) is prohibited. Every script
that ships MUST cite, in code comments or the feature plan, the markup
feature it enables.

**Rationale**: Keeps the site fast, accessible, and resilient when JS
fails. Forces designers to reach for HTML/CSS first, which is almost always
sufficient for a content-driven portfolio.

### IV. Quiet Aesthetic Discipline

Visual design MUST be monochrome (grayscale + at most one restrained
accent), prioritize typography hierarchy over chrome, and convey quiet
confidence rather than grab attention. Patterns to avoid: high-saturation
brand badges, animated highlights, oversized hero treatments, color used
purely for decoration. Patterns to prefer: scale-driven hierarchy,
generous whitespace, restrained or no motion.

**Rationale**: The site represents senior technical positioning; visual
restraint signals authority more credibly than novelty.

### V. Positioning Coherence

All domain-facing copy (headings, bios, project descriptions, meta tags,
social cards) MUST reflect the active positioning: Tech Lead AI / R&D,
Odoo + AI infrastructure, CEE market focus. New content MUST be reviewed
against this positioning before merge; off-positioning content (legacy
roles unrelated to this focus, generic "developer" framing, unrelated
side-projects) MUST be either reframed or clearly archived.

**Rationale**: A portfolio site loses signal when it scatters across
unrelated identities. Coherent positioning is the product.

## Technical Constraints

- **Source of truth**: Markdown + frontmatter under version control. No
  CMS, no database, no headless content service.
- **Output**: Static HTML/CSS and minimal JS, deployable to any static
  host (GitHub Pages, Netlify, S3+CDN, etc.).
- **Build pipeline**: MUST run offline (no network required for a
  reproducible build) and produce byte-identical output for identical
  inputs.
- **Assets**: Fonts, icons, and media MUST be self-hosted unless an
  external dependency is explicitly justified in the relevant plan and
  degrades gracefully when unavailable.
- **Accessibility**: All pages MUST remain navigable and readable with
  JavaScript disabled, and MUST meet WCAG 2.1 AA contrast within the
  chosen monochrome palette.
- **Browser baseline**: Latest two stable versions of evergreen browsers.
  Polyfills for older runtimes require justification.
- **Performance budget (per page, target)**: < 100 KB transferred over
  the wire, < 50 ms scripting on commodity hardware, no render-blocking
  third-party requests.

## Development Workflow

- **Spec → Plan → Tasks → Implement**: All non-trivial changes flow
  through the Spec Kit workflow. Trivial copy fixes and one-line CSS
  tweaks MAY skip specification but MUST still pass the principle gate
  on review.
- **Constitution Check**: Every plan MUST include a Constitution Check
  section confirming alignment with Principles I–V (or flagging
  justified deviations in a Complexity Tracking entry).
- **Review gate**: Every PR description MUST cite which principles the
  change advances or interacts with. Reviewers MUST block on visible
  violations: DB-backed content (I), runtime API calls (II), decorative
  JS (III), attention-grabbing visuals (IV), off-positioning copy (V).
- **Performance budget enforcement**: Budget overruns MUST be called out
  in the plan. Sustained overrun across more than one feature triggers a
  governance review of the budget itself.

## Governance

This Constitution supersedes ad-hoc preferences and prior conventions in
this repository. Amendments follow this procedure:

1. Open a PR modifying `.specify/memory/constitution.md` with: the
   proposed change, the version bump (per policy below), and a Sync
   Impact Report listing affected templates and docs.
2. Update dependent artifacts (`.specify/templates/*.md`, runtime
   guidance docs) in the same PR or in a tracked follow-up PR
   referenced from the Sync Impact Report.
3. Merge requires explicit acknowledgement from the project owner.

Versioning policy (semantic):

- **MAJOR**: Removal or backward-incompatible redefinition of a
  principle or governance rule.
- **MINOR**: New principle, new mandatory section, or material
  expansion of guidance.
- **PATCH**: Clarifications, wording, typo fixes, non-semantic
  refinements.

Compliance review: Any plan, spec, or task generated by Spec Kit MUST be
checked against this constitution at creation and again before merge.
For runtime/agent-specific guidance, refer to `CLAUDE.md` and the
current feature plan under `specs/<feature>/plan.md`.

**Version**: 1.0.0 | **Ratified**: 2026-05-10 | **Last Amended**: 2026-05-10
