---
phase: 113
slug: intelligence-gathering-core
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-06
---

# Phase 113 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner |
| **Config file** | package.json (test script) |
| **Quick run command** | `npm test -- bin/lib/source-mapper.test.js bin/lib/target-enumerator.test.js` |
| **Full suite command** | `npm test -- bin/lib/source-mapper.test.js bin/lib/target-enumerator.test.js bin/lib/service-discovery.test.js bin/lib/recon-aggregator.test.js` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 113-01-01 | 01 | 1 | RECON-01 | T-113-01 | Source mapper identifies all untrusted input sources | unit | `npm test -- bin/lib/source-mapper.test.js` | ✅ | ✅ green |
| 113-01-02 | 01 | 1 | RECON-02 | T-113-02 | Target enumerator discovers all API endpoints | unit | `npm test -- bin/lib/target-enumerator.test.js` | ✅ | ✅ green |
| 113-01-03 | 01 | 1 | RECON-01/02 | T-113-01/02 | Unit tests verify source and target detection with >90% coverage | unit | `npm test -- bin/lib/source-mapper.test.js bin/lib/target-enumerator.test.js` | ✅ | ✅ green |
| 113-02-01 | 02 | 2 | RECON-03 | T-113-03 | Service discovery identifies framework and version | unit | `npm test -- bin/lib/service-discovery.test.js` | ✅ | ✅ green |
| 113-02-02 | 02 | 2 | RECON-03 | T-113-04 | Service discovery flags outdated dependencies with known vulnerabilities | unit | `npm test -- bin/lib/service-discovery.test.js` | ✅ | ✅ green |
| 113-02-03 | 02 | 2 | RECON-03 | T-113-05 | Recon aggregator combines source, target, and service data | unit | `npm test -- bin/lib/recon-aggregator.test.js` | ✅ | ✅ green |
| 113-02-04 | 02 | 2 | RECON-03 | T-113-06 | Integration with pd:audit command | unit | `npm test -- bin/lib/recon-aggregator.test.js` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Test files created: source-mapper.test.js, target-enumerator.test.js, service-discovery.test.js, recon-aggregator.test.js
- [x] All tests use Node.js built-in test runner
- [x] No additional framework installation required

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Integration with actual osv.dev API for vulnerability checking | RECON-03 | Requires live API access; tests use mocked responses | Run `pd:audit --recon --tier deep` on a real project with known vulnerable dependencies |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-06

---

## Validation Audit 2026-04-06

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

---

## Requirements Coverage

| Requirement | Source | Target | ServiceDiscovery | ReconAggregator | Tests |
|-------------|--------|--------|------------------|-----------------|-------|
| RECON-01: Source identification | ✅ | - | - | - | ✅ |
| RECON-02: Target enumeration | - | ✅ | - | - | ✅ |
| RECON-03: Service discovery + aggregation | ✅ | ✅ | ✅ | ✅ | ✅ |
