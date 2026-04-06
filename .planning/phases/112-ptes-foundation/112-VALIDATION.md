---
phase: 112
slug: ptes-foundation
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-05
validated: 2026-04-06
---

# Phase 112 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (node:test) |
| **Config file** | `package.json` test script |
| **Quick run command** | `npm test -- --test-name-pattern="recon-cache\|flag-parser\|resource-config"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --test-name-pattern="<relevant-pattern>"`
- **After every plan wave:** Run full test suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|------|--------|
| 112-01-01 | 01 | 1 | PTES-01 | T-112-01 | Cache keys deterministic | unit | `node bin/lib/recon-cache.test.js` | ✅ exists | ✅ green |
| 112-01-02 | 01 | 1 | PTES-01 | T-112-02 | Cache auto-invalidates | unit | `node bin/lib/recon-cache.test.js` | ✅ exists | ✅ green |
| 112-01-03 | 01 | 1 | PTES-02 | T-112-03 | `--recon` flag parsed | unit | `node bin/lib/flag-parser.test.js` | ✅ exists | ✅ green |
| 112-02-01 | 02 | 2 | PTES-03 | T-112-04 | Tier token budgets | unit | `node bin/lib/resource-config.test.js` | ✅ exists | ✅ green |
| 112-02-02 | 02 | 2 | PTES-04 | T-112-05 | Default audit unchanged | integration | `node test/workflows/audit.test.js` | ✅ exists | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Gap Analysis

| Requirement | Gap Type | File | Status |
|-------------|----------|------|--------|
| PTES-01 (Cache) | COVERED | bin/lib/recon-cache.test.js | ✅ All 6 tests pass |
| PTES-02 (Flags) | COVERED | bin/lib/flag-parser.test.js | ✅ All 8 tests pass |
| PTES-03 (Tier) | COVERED | bin/lib/resource-config.test.js | ✅ All 11 tests pass |
| PTES-04 (Integration) | COVERED | test/workflows/audit.test.js | ✅ All 15 tests pass |

**Summary:** 4 COVERED, 0 MISSING

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Token budget display | PTES-04 | Requires LLM API call | Run `/pd:audit --recon` and verify "[Token Budget]" appears in output |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** granted

---

## Validation Audit 2026-04-06

| Metric | Count |
|--------|-------|
| Gaps found | 2 |
| Resolved | 2 |
| Escalated | 0 |

**Findings:**
- Tasks 112-01-01 through 112-01-03: Tests exist and pass (recon-cache.test.js, flag-parser.test.js)
- Task 112-02-01: Created `bin/lib/resource-config.test.js` to test `PTES_TIER_MAP` and `getPtesTier` — 11 tests pass
- Task 112-02-02: Created `test/workflows/audit.test.js` for integration testing — 15 tests pass

**Resolution:**
1. ✅ Created `bin/lib/resource-config.test.js` testing PTES_TIER_MAP and getPtesTier (all 11 tests pass)
2. ✅ Created `test/workflows/audit.test.js` testing parsePtesFlags + ReconCache + PTES_TIER_MAP integration (all 15 tests pass)

**Phase 112 IS NYQUIST-COMPLIANT**
All requirements have automated verification.
