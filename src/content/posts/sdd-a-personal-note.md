---
title: "Spec-Driven Development — A Personal Note"
date: 2026-04-22
slug: sdd-a-personal-note
tags: [sdd, methodology, claude-code, ai, odoo]
summary: "Three maturity levels of Spec-Driven Development, the Memory-Bank vs Spec distinction, where Kiro / spec-kit / Tessl actually fit, and what honestly transfers to a mature ERP product."
---

**Topic:** Spec-Driven Development — taking the approach apart, the tools that exist, and where it actually applies.
**Date:** April 2026.
**Context:** A proposal to optimize the BA / QA team on Oblik ERP, plus Birgitta Böckeler's article on martinfowler.com.

---

## What SDD is

Spec-Driven Development is an approach where the specification is the primary artifact and code is its expression. Traditionally code is treated as the source of truth; SDD inverts that hierarchy.

Three maturity levels:

**Spec-first** — the spec is written before the code and used for one specific task. Once the task is done, it can be deleted. The most common level today.

**Spec-anchored** — the spec lives on after the task as the source of truth. When something changes, the spec is edited first, then the code.

**Spec-as-source** — only the spec is human-edited; code is generated automatically. So far this is theory for mature products.

---

## A critical distinction: Memory Bank vs Spec

**Memory Bank** (`AGENTS.md`, `constitution.md`, `architecture.md`) — files relevant to *all* AI sessions in the codebase. Persistent context that Claude reads every time.

**Spec** — an artifact relevant to *one* task or feature. It lives as long as that task or feature lives.

This distinction matters. `constitution.md` is Memory Bank, not a specification.

---

## The tools that exist

**Kiro** — the simplest. Workflow: Requirements → Design → Tasks. Three Markdown files per task. Spec-first. Good for non-trivial tasks, overkill for small bugs.

**Spec-kit (GitHub)** — a CLI that creates a workspace structure. Workflow via slash commands: Constitution → Specify → Plan → Tasks. More moving parts, more files to review. Aspires to spec-anchored but is in practice spec-first.

**Tessl** — the most ambitious, private beta. The only one explicitly aiming at spec-as-source. One spec file → one code file. The code is even marked with a comment: "GENERATED FROM SPEC — DO NOT EDIT".

---

## Real risks of SDD (from practice)

**False sense of control.** Even with a detailed spec, AI often does not follow every instruction. A bigger context window doesn't guarantee that Claude correctly picks up everything in it.

**One workflow for every size doesn't work.** For a small bug, spec-kit is a sledgehammer to crack a nut. You need flexibility against task size.

**Review overload.** Spec-kit produces many Markdown files to review. The author honestly admits: it can be easier to review code than to review a stack of documents.

**The MDD parallel.** Model-Driven Development never took off for business applications because the level of abstraction was awkward. SDD risks combining the worst of both: the inflexibility of MDD with the non-determinism of LLMs.

**Brownfield is harder.** Every tutorial and demo runs on greenfield. For a mature product with an existing codebase, adoption is significantly heavier.

---

## How this applies to Oblik ERP

**What we take:**

- A Business Requirement template for BA — spec-first, low barrier to entry.
- `oblik-constitution.md` as Memory Bank — architectural rules, antipatterns, regulatory constraints.
- AI generates the Technical Spec from the Business Requirement — realistic with the right prompt.
- Gherkin scenarios as part of the spec — a structured format for QA and AQA.

**What we don't take:**

- Spec-kit as a toolkit — greenfield-shaped, overkill for Oblik ERP.
- Spec-as-source — still theoretical for mature ERP products.
- Auto-generated Playwright tests in CI/CD — the realistic model is AI-assisted testing where a human waits for the result.

**The right level for us:** spec-first, with elements of spec-anchored via `constitution.md`. No more, no less.

---

## The key insight

The most valuable part of SDD for the Oblik team isn't the tools — it's the change in responsibility. BA focuses on **what** (the business logic), AI transforms it into **how** (the technical specification), TL reviews instead of writing. `constitution.md` as Memory Bank guarantees that AI generates inside the architectural rules of the product regardless of which BA wrote the requirement.

---

## Sources

- Birgitta Böckeler, "Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl", martinfowler.com, October 2025.
- Proposal "Optimizing BA & QA: a Spec-Driven approach with AI tools", Mariana Zelinska, April 2026.
- Audit of the Oblik ERP team's processes, April 2025 — March 2026.
