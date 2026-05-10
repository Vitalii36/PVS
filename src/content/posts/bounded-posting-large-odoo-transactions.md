---
title: "Bounded Posting for Large Odoo Accounting Transactions"
date: 2026-05-10
slug: bounded-posting-large-odoo-transactions
tags: [odoo, performance, postgres, accounting, memory]
summary: "A production-blocking landed cost on Odoo SH killed the worker at 1.28 GB RSS. The fix wasn't a different algorithm — it was the same algorithm with explicit lifetime management, in pure ORM, with no queue_job and no raw SQL."
---

**Setting:** a manufacturing client running Odoo on the SH Standard tier.
**Module:** a custom `stock_landed_costs` performance overlay (v17.0.2.0.0).
**Trigger:** validating one landed cost with 30,600 adjustment lines (~166,800 AML).

---

## Context

Validating a single landed cost on the customer's Odoo SH instance killed the worker on the memory limit at 1.28 GB RSS, rolled the transaction back, and left the LC stuck in `draft`. Repeatable on every retry. A previous "time-fix" interim release had already shipped — it solved CPU and wall-clock, but exposed a separate memory wall.

## Problem

The interesting part is that there were **two distinct failure modes, not one**:

1. **CPU/wall wall.** The original module built ~300k `stock.valuation.adjustment.lines` via per-record `.create()` calls. ~1–2 ms × 300k ≈ 300–600 s of pure ORM overhead before any `account.move` work begins. Worker killed by `SIGXCPU` at 900 s. The cause was the per-record API call, not the row count.
2. **Memory wall.** The time-fix batched `compute_landed_cost` and split posting into chunks. CPU/wall fit in budget. But 30k single-row `stock.valuation.layer.create()` calls inside the inner loop piled in ORM cache because nothing flushed them; the `moves |= chunk_move` accumulator kept every chunk-move's recordset alive until the loop ended. Peak ≈ 1.0–1.2 GB.

Lock contention and PostgreSQL commit size were ruled out, not assumed — verified via `pg_locks` during the failed run and `psutil` RSS measurements.

## Solution

Bounded chunks driven by one tunable (`lc_perf.aml_per_move`, default 30,000). For the affected LC: 166,800 AML / 30k per chunk = **6 chunks** (last partial at 16,800).

Why 30k specifically — derived from constraints, not chosen arbitrarily:

| `aml_per_move` | Chunks for the 30k LC | Peak RSS | Small-LC UX |
|---|---|---|---|
| 15,000 | ~12 | ~400 MB | small/medium LCs split unnecessarily |
| **30,000** | **6** | **536 MB** (measured) | **<10k adj_line LCs still produce ONE move** |
| 50,000 | ~3 | ~900 MB | borderline against the 1 GB hard cap |
| no split | 1 | 1.28 GB → kill | original failure |

Memory ceiling sets the upper bound; accountant UX (most LCs should produce one journal entry, not many) sets the lower bound. 30k is the largest value where measured peak stays comfortably under the cap *and* sub-30k-AML LCs stay single-move. Tunable via `ir.config_parameter` for ops.

Each chunk posts inline with `flush_all` + `invalidate_all` between chunks, so each chunk's recordset is dropped before the next builds. The chunk-boundary check happens **after** appending the AML bundle (because `_create_accounting_entries` returns 2–6 paired tuples per adj_line — splitting a bundle across moves would break balance).

### Engineering contribution

The cut is not "split into chunks." The cut is six things in combination:

1. **Buffer the per-iteration `.create()` calls** for any model that has an `@api.model_create_multi` definition (here: `stock.valuation.adjustment.lines`, `stock.valuation.layer`). One batched insert per chunk boundary is 5–15× faster *and* has 1/N the cache footprint.
2. **Place chunk boundaries on whole-bundle units, not raw row counts.** A landed-cost adj_line produces 2–6 AML in one logical bundle (debit / credit / already-out / anglo-saxon variants); splitting that bundle across two `account.move` records produces unbalanced moves. The boundary check in `_validate_one` runs **after** the full bundle is appended, so chunks may overflow `chunk_size` by ~5 rows but never split a bundle.
3. **Post each chunk-move inline and drop its reference**, instead of accumulating a recordset and calling `moves._post()` at the end. Memory bound is about object lifetime, not just allocation rate.
4. **`flush_all()` + `invalidate_all()` between chunks.** Pushes pending writes to PostgreSQL inside the same transaction (no COMMIT) and clears the ORM cache so the next chunk starts from a small working set. Atomicity is preserved — one rollback wipes everything.
5. **Suppress mail/tracking/follower noise via `HEAVY_CTX`** (`tracking_disable`, `mail_create_nolog`, `mail_create_nosubscribe`, `mail_notrack`, `mail_auto_subscribe_no_notify`, `mail_activity_automation_skip`). On record-heavy work this silently saves hundreds of ms per batch.
6. **Diagnostic RSS logging at boundaries** via `psutil.Process().memory_info().rss`. This is the artifact that turned the second failure ("OOM at 1.28 GB, why?") into a 30-minute fix instead of a multi-hour bisect.

### Options rejected

| Option | Why rejected |
|---|---|
| Raw SQL `INSERT` for AML / SVL | Bypasses Odoo computes, audit trail, multi-company checks. Customer was explicit that they did not want raw SQL anywhere in the path. |
| `queue_job` async | Pre-existing v17.0.1.0.3 architecture; rejected by customer for operational debt — no real speed win, just hides the bottleneck. Removed entirely. |
| Raise SH worker memory/time limits | Admin action, costs money. The next-largest LC blows the new ceiling. Documented as escape hatch only. |
| Staging table for AML | Couples to PostgreSQL specifics (raw SQL again), bypasses ORM compute fields, adds a recovery path for the "what if post fails after staging" case. |
| `env.norecompute()` | Deprecated/no-op in Odoo 17. |
| One single 166k AML move | What the time-fix shipped; hits the memory wall. |
| `defaultdict` deferral for `linked_layer.remaining_value +=` | Could hide an inter-iteration read dependency in `_prepare_in_landed_costs_svl_values`. Win is small. Correctness > 10ms savings. |

Pure ORM throughout. No raw SQL. No queue_job. No fallback path retained.

## Result

| Metric | Before | After |
|---|---|---|
| Outcome | OOM kill, full rollback | **6 posted moves, completed** |
| Peak RSS | 1.28 GB → kill | **536 MB** (47% of 1 GB cap) |
| Wall time | killed at ~9 min | **713 s** (187 s headroom under 900 s) |
| CPU time | n/a | **554 s** (346 s headroom) |
| Memory warnings in log | dozens | **0** |
| Per-move balance | n/a | **0.00 on all 6 moves** |
| New `stock.valuation.layer` rows | 0 (rollback) | **4,200** |
| Total posted | 0 | **~73 M UAH** (balanced across 6 moves) |
| User-visible UX | queued + manual recovery, or kill | **immediate sync success** |

SQL verification confirmed: 6 `account.move` rows all `state = 'posted'`, `stock_landed_cost.state = 'done'`, debit − credit = 0.00 per chunk × 6, 4,200 SVL rows.

The boundary log from the verified run:

```
START button_validate adj_lines=30600 mem_mb=263
chunk 1  aml=30000 svl=60   mem_mb=536       ← peak
chunk 2  aml=30000 svl=0    mem_mb=479
chunk 3  aml=30000 svl=360  mem_mb=493
chunk 4  aml=30000 svl=1980 mem_mb=492
chunk 5  aml=30000 svl=210  mem_mb=515
chunk 6  aml=16800 svl=1590 mem_mb=490
END    wall=713.16s cpu=553.90s moves=6 mem_mb=470
```

## Atomicity

The whole validation runs in **one DB transaction** (one HTTP request). `flush_all` + `invalidate_all` between chunks only push pending writes to PostgreSQL — they do not COMMIT. If chunk N raises, all prior chunks roll back together. No partial state, no orphan moves, no orphan SVLs. Same all-or-nothing guarantee as upstream's single-move validate.

The only way to get partial state would be a `cr.commit()` mid-loop or a nested savepoint — neither is present.

## What I took from this — as engineer

**Memory is about lifetime, not call count.**

The time-only fix changed the API call (per-record → batched `.create()`) but did not change the **lifetime** of the working set. Many engineers — me included before this incident — assume "switched to batch create" automatically improves memory. It doesn't. Batch create improves CPU. Memory only improves if the recordsets you build also stop being held — by the accumulator, by the prefetch chain, by ORM cache without a flush boundary.

The fix wasn't a different algorithm. It was the same algorithm with explicit lifetime management: post each chunk inline, `invalidate_all` between chunks, drop the accumulator pattern. Total deletion: ~30 lines. Total addition: ~50 lines. The architecture didn't change — what changed was discipline about *when* objects stop existing.

This is a class of bug I'll be watching for in every Odoo write-heavy hot path from now on.

## What's transferable

The pattern, in one sentence:

> Splitting a single large posting transaction in Odoo accounting (`account.move` + `account.move.line` + linked `stock.valuation.layer`) into bounded, atomically-posted chunks so the work fits inside fixed per-worker CPU, wall, and memory limits — while preserving accounting balance, reconciliation, and SVL linkage.

The trigger in this case was landed costs. The same architecture applies to:

- manufacturing back-cost adjustments
- mass invoicing batches
- period-close revaluation
- stock revaluation runs

If a client runs Odoo on Odoo SH (or any container with `limit_time_cpu`, `limit_time_real`, `limit_memory_hard`) and builds journal entries whose `line_ids` contain tens-to-hundreds of thousands of rows in a single sync request, they will eventually meet this class of problem. The fix is not "more memory" or "background it" — both miss the point. The fix is bounded chunks with explicit lifetime management and pure ORM.

## Known limitations

1. **CPU/wall headroom is real but not huge** — 713 s used of 900 s. A hypothetical 50k adj_line LC at the same per-chunk rate would be ~1,200 s. Lever: lower `aml_per_move` further or raise SH worker limits.
2. **`_post()` is the new bottleneck** — ~125 s per 30k AML chunk, dominated by `account.move` recompute work. Additional `_compute_*` short-circuits gated on `lc_perf_in_chunk` are a profiling-driven next step.
3. **Multi-move ledger** — outlier LCs produce N journal entries instead of 1. Books balance, FX/date is consistent across chunks, vendor-bill reconciliation works via the unioned `account_move_ids | account_move_id`, but partner ledger UX shows N rows. Lever: raise `aml_per_move` if the accountant pushes back.
