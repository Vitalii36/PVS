---
title: "A Two-Server On-Prem Topology for Odoo Test Environments"
date: 2026-05-01
slug: two-server-on-prem-test-topology
tags: [infrastructure, odoo, postgres, hetzner, ci]
summary: "Why we run six Odoo test instances and a Jenkins CI fleet across two identical Hetzner boxes with two PostgreSQL clusters — the blast-radius reasoning, the rejected alternatives, and what the architecture buys."
---

We support four test environments (QA, BA, Staging) across two Odoo versions (17 and 19), which gives **six concurrent instances** plus a CI pipeline (Jenkins controller and agents). The workloads come in two distinct shapes:

- **QA / BA** — light read-write traffic, many parallel HTTP sessions, short transactions.
- **Staging** — heavy migrations during release validation: `-u all`-style operations, blocking locks, long-running transactions.

The previous model was Odoo SH per environment. The drivers for moving off it were straightforward.

---

## Drivers

- **Failure isolation.** A kernel update, an OOM-kill, or a heavy migration on one environment must not knock the others down. On a single-server topology you cannot guarantee that.
- **CI / test isolation.** Jenkins should not share CPU or RAM with test Odoo instances, or the nightly `e2e-nightly` job will starve the staging instance and vice versa.
- **Cost.** A cloud equivalent (AWS / GCP) for six Odoo + Jenkins + two Postgres + 5 TB of backup is roughly €600+/month.
- **Control over update windows.** We want to schedule kernel and Postgres patching ourselves, without depending on a SaaS provider's calendar.

---

## The decision

A two-server topology on identical commodity hardware (Hetzner AX42-U), connected over a private L2 link via Hetzner vSwitch, with off-server backups on a Storage Box.

| Component | Server #1 (`tests.bjet.internal`) | Server #2 (`ci.bjet.internal`) |
|---|---|---|
| HW | AX42-U, Ryzen 7 PRO 8700GE (8c / 16t), 64 GB DDR5, 2× 512 GB NVMe RAID 1 | identical |
| Role | 6 Odoo instances + 2 PG clusters + Nginx + observability exporters | Jenkins controller + 2–4 agents + Git mirror cache |
| Public exposure | :80 / :443 (Nginx, Let's Encrypt) | none — vSwitch only |
| Cost | ~€54/mo | ~€54/mo |

Network: a private 1 GbE Hetzner vSwitch in `10.0.0.0/24`. The CI server has no publicly routable ports.

Backup: a Hetzner Storage Box BX21 (5 TB, ~€13/mo), restic-encrypted, retention `7d + 4w + 3m`, healthcheck.io ping. Total monthly spend around €121.

---

## Supporting decisions

**Two PostgreSQL clusters on Server #1.** `:5432` carries QA and BA (4 DBs); `:5433` carries Staging only (2 DBs). Same `pg_hba.conf`, two data directories, two systemd units. The reason: a heavy migration on `staging19` should never block the connection pool for `qa17 / ba17 / qa19 / ba19`.

**Release folders + symlink switch (replaces `git reset --hard` on the live tree).** Pattern: `/opt/odoo/instances/{env}-{ver}/releases/{ts}-{sha}/` plus `current → releases/{latest}`. Atomic via `ln -sfn`. The last five releases stay on disk for hot rollback.

**Targeted `-u {changed}` via `git diff` (replaces `-u all`).** Each deploy diffs current against the new release, computes the changed-modules list, and passes it to `odoo -u mod1,mod2,...`. Deploy time drops a lot for typical releases.

**systemd cgroup limits per Odoo service.** QA / BA: `CPUQuota=150%`, `MemoryMax=3G`. Staging: `CPUQuota=300%`, `MemoryMax=4G`. A runaway process can't eat its neighbour.

**Restic encrypted backups → off-server Storage Box.** `pg_dump` → local staging area → `restic backup` → Storage Box. Healthcheck.io pings make silent backup failures visible.

**Observability: exporters → Grafana Cloud Free tier.** `node_exporter`, `postgres_exporter` (×2 for the two PG clusters), `nginx_exporter`, `promtail` → Loki. Free tier is enough for two servers and six instances.

---

## Alternatives that lost

**One bigger server (AX102-U or AX162).** A single failure domain — one kernel update, one OOM, one disk corruption takes everything down at once. The €20–30/month savings do not justify the risk in an environment where the dev team depends on test instances daily.

**Stay on Odoo SH.** Per-environment temporary Odoo SH projects with two staging branches each became an awkward fit for our workload patterns.

**Cloud (AWS / GCP equivalent).** Around €600–800/month for the equivalent setup. For *test* environments — not production — the ROI is not there. Hetzner bare-metal gives 5–7× better price per CPU / RAM for this workload.

**A single PG cluster on Server #1.** QA / BA and Staging have fundamentally different workload patterns: sustained light load vs periodic heavy migrations with long transactions and blocking locks. On a shared cluster the heavy migrations risk blocking the connection pool for QA / BA, and tuning parameters (`shared_buffers`, `max_connections`, `work_mem`) diverge. Two data directories on one server is the compromise — separate tuning, separate deployment lifecycle, no second host to pay for.

**ECC RAM (Hetzner AX162+ tier).** AX162 is €229/mo against €54/mo for AX42-U. Test environments don't require production-grade data integrity.

**Docker / Kubernetes from day one.** Release folders + systemd give 80% of the benefits (atomic switch, rollback, isolation) without the operational tax of a k8s or docker-compose stack. A local Docker registry slot is reserved on Server #2 for phase 2.

---

## What it buys

- **Failure isolation between tests and CI.** A kernel update on the test server doesn't take Jenkins down. An OOM on `staging19` doesn't block `qa17`.
- **Bounded blast radius on bad deploys.** Atomic symlink switch plus the previous five releases on disk means hot rollback in seconds.
- **Predictable cost.** €121/month, flat. No surprise bills from cloud autoscaling.
- **Identical hardware across both hosts.** One benchmark, one tuning baseline, one runbook. Troubleshooting stays cheap.
- **Private CI surface.** The CI server has no public ports — eliminates an entire class of attacks.
- **Encrypted off-server backups.** Disaster recovery is satisfied — losing a physical server still recovers from the Storage Box.

---

## Tradeoffs we accepted

- **~0.5 TB usable disk per server.** Odoo's `attachment` table will need a disciplined retention policy. If it grows past comfort, the migration path is to NFS or S3-compatible object storage (Hetzner Object Storage is the natural step).
- **No ECC RAM.** Acceptable for test environments. Daily `pg_dump` plus restic catch corruption at the backup stage.
- **Operational overhead of two servers.** Patch management, monitoring, SSL certs all live on two hosts instead of one. Mitigated by keeping configuration mechanically identical across both.
- **vSwitch as a single point of failure between CI and tests.** A Hetzner FSN1 vSwitch outage means CI can't deploy. Mitigated with a `deploy.sh` fallback over the public IP, gated by a firewall whitelist.
- **No Docker in phase one.** If the team moves to a Docker workflow before phase two, the release-folders pattern needs refactoring.

---

## How we'll know it worked

After 30 / 90 days, the validation criteria are:

- **Deploy time:** P50 < 15 minutes, P95 < 60 minutes across all six envs.
- **Cross-env interference:** zero incidents over 90 days where heavy load on one env affected another.
- **MTTR after a failed deploy:** < 5 minutes via symlink rollback plus dump restore.
- **Backup recoverability:** quarterly restore test from the Storage Box into a separate environment, < 5 minutes to a working Odoo with data.
- **Cost:** actual spend ≤ €130/month including a 5% buffer.
