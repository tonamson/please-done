---
phase: 123
slug: integration
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-06
---

# Phase 123 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js native test runner (node --test) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `node --test test/workflows/audit.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/workflows/audit.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 123-01-01 | 01 | 1 | INT-01 | — | `pd:audit --recon` triggers ReconAggregator.runFullRecon() | unit | `node --test test/workflows/audit.test.js` | ✅ | ✅ green |
| 123-01-02 | 01 | 1 | INT-01 | — | Cache hit returns cached recon results | unit | `node --test test/workflows/audit.test.js` | ✅ | ✅ green |
| 123-02-01 | 02 | 2 | INT-02 | — | PTES_TIER_MAP redteam includes osint, payloads, post-exploit | unit | `node --test test/workflows/audit.test.js` | N/A | ✅ green |
| 123-02-02 | 02 | 2 | INT-02, INT-03 | — | `--poc` sets poc_enabled flag; `--redteam` triggers OsintAggregator | unit | `grep -n "OsintAggregator\|PostExploitAnalyzer\|poc_enabled" workflows/audit.md` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `test/workflows/audit.test.js` — existing tests for INT-01 (parsePtesFlags, tier mapping, ReconCache)
- [x] `test/integration/recon-workflow.test.js` — existing tests for ReconAggregator tier behavior
- [x] `test/integration/osint-workflow.test.js` — existing tests for OsintAggregator

*Existing infrastructure covers all phase requirements.*

---

## Gap Analysis

| Requirement | Status | Gap Type | Suggested Test Path |
|-------------|--------|----------|---------------------|
| INT-01 | COVERED | — | test/workflows/audit.test.js (t1-t10) |
| INT-02 | COVERED | — | test/workflows/poc-workflow.test.js (INT-02.1 - INT-02.10) |
| INT-03 | COVERED | — | test/workflows/audit.test.js (INT-03.1 - INT-03.7) |

---

## Manual-Only Verifications

*All requirements now have automated coverage.*

---

## Validation Audit 2026-04-06

| Metric | Count |
|--------|-------|
| Gaps found | 2 |
| Resolved | 0 |
| Escalated | 2 (manual-only) |

---

## Validation Audit 2026-04-06 (re-validation after integration tests added)

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 2 (INT-02, INT-03 now covered) |
| Escalated | 0 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-04-06
