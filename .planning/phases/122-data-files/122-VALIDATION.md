---
phase: "122"
slug: "data-files"
status: "validated"
nyquist_compliant: true
wave_0_complete: true
created: "2026-04-06"
---

# Phase 122 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.js (project root) |
| **Quick run command** | `npm test -- --testPathPattern="asset-discoverer\|google-dorks\|wordlist\|mitre"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 122-01-01 | 01 | 1 | DATA-01 (common-paths.txt) | — | Wordlist provides comprehensive pentest paths | data | `wc -l references/wordlists/common-paths.txt` | ✅ | ✅ green |
| 122-01-02 | 01 | 1 | DATA-02 (parameters.txt) | — | Wordlist provides comprehensive parameter names | data | `wc -l references/wordlists/parameters.txt` | ✅ | ✅ green |
| 122-01-03 | 01 | 1 | DATA-03 (dorks.txt) | — | Wordlist provides OSINT dorks | data | `wc -l references/wordlists/dorks.txt` | ✅ | ✅ green |
| 122-01-04 | 01 | 1 | DATA-04 (waf-bypass.txt) | — | Wordlist provides WAF bypass patterns | data | `wc -l references/wordlists/waf-bypass.txt` | ✅ | ✅ green |
| 122-01-05 | 01 | 1 | DATA-05 (encodings.txt) | — | Wordlist provides encoding patterns | data | `wc -l references/wordlists/encodings.txt` | ✅ | ✅ green |
| 122-02-01 | 02 | 1 | DATA-06 (techniques.yaml) | — | YAML provides MITRE ATT&CK mappings | data | `wc -l references/mitremap/techniques.yaml && python3 -c "import yaml"` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `test/asset-discoverer.test.js` — tests wordlist loading (DATA-01 through DATA-05)
- [x] `test/google-dorks.test.js` — tests MITRE technique annotations (DATA-03, DATA-06)
- [x] Existing infrastructure covers all phase requirements.

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Content comprehensiveness review | DATA-01 through DATA-05 | Data quality assessment requires human judgment for pentest relevance | Review each wordlist file for coverage completeness |
| MITRE ATT&CK technique accuracy | DATA-06 | Technique annotations require security domain expertise | Verify technique IDs, tactic assignments, and descriptions are accurate |

*If none: "All phase behaviors have automated verification."*

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
| Manual-only | 2 (content quality review) |
