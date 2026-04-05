---
phase: "116"
slug: "osint-intelligence"
status: verified
nyquist_compliant: true
wave_0_complete: true
created: "2026-04-05"
---

# Phase 116 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner |
| **Config file** | none |
| **Quick run command** | `node --test bin/lib/google-dorks.test.js bin/lib/ct-scanner.test.js bin/lib/secret-detector.test.js bin/lib/subdomain-osint.test.js` |
| **Full suite command** | `node --test bin/lib/*.test.js test/integration/*.test.js` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run unit test for that module
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 116-01-01 | 01 | 1 | OSINT-01 | — | Rate limiting, no external calls | unit | `node --test bin/lib/google-dorks.test.js` | ✅ | ✅ green |
| 116-01-02 | 01 | 1 | OSINT-02 | T-116-01 | 10s timeout, exponential backoff | unit | `node --test bin/lib/ct-scanner.test.js` | ✅ | ✅ green |
| 116-01-03 | 01 | 1 | OSINT-03 | — | No hardcoded secrets, false positive filtering | unit | `node --test bin/lib/secret-detector.test.js` | ✅ | ✅ green |
| 116-01-04 | 01 | 1 | OSINT-04 | — | Rate limiting, responsible scanning | unit | `node --test bin/lib/subdomain-osint.test.js` | ✅ | ✅ green |
| 116-02-01 | 02 | 2 | OSINT-03/04 | T-116-01 | External API rate limiting | unit | `node --test bin/lib/osint-aggregator.test.js` | ✅ | ✅ green |
| 116-02-02 | 02 | 2 | OSINT-03/04 | T-116-02 | Path traversal prevention in file output | unit | `node --test bin/lib/osint-aggregator.test.js` | ✅ | ✅ green |
| 116-02-03 | 02 | 2 | OSINT-03/04 | T-116-03 | Cache scoped to .planning/recon-cache/ | unit | `node --test bin/lib/osint-aggregator.test.js` | ✅ | ✅ green |
| 116-02-04 | 02 | 2 | OSINT-03/04 | — | All sources integrated, results aggregated | integration | `node --test test/integration/osint-workflow.test.js` | ✅ | ✅ green |

*Status: ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

- Google Dorks (OSINT-01): 27 tests in `bin/lib/google-dorks.test.js`
- CT Scanner (OSINT-02): 32 tests in `bin/lib/ct-scanner.test.js`
- Secret Detector (OSINT-03): 41 tests in `bin/lib/secret-detector.test.js`
- Subdomain OSINT (OSINT-04): 33 tests in `bin/lib/subdomain-osint.test.js`
- OSINT Aggregator: 20 tests in `bin/lib/osint-aggregator.test.js`
- Integration: 20 tests in `test/integration/osint-workflow.test.js`

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Audit Trail

| Audit Date | Total | Green | Manual-Only | Run By |
|-----------|-------|-------|-------------|--------|
| 2026-04-05 | 8 | 8 | 0 | gsd-validate-phase |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-05
