---
phase: "106"
slug: i18n-01-readme-song-ngu
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-04
---

# Phase 106 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual review + file verification |
| **Config file** | none |
| **Quick run command** | `test -f README.vi.md && wc -l README.vi.md` |
| **Full suite command** | `ls -la README.vi.md && head -20 README.vi.md` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Verify file exists and has content
- **After every plan wave:** Manual review of translation quality
- **Before `/gsd:verify-work`:** File exists, language switcher visible
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 106-01-01 | 01 | 1 | I18N-01 | file_exists | `test -f README.vi.md` | N/A | ⬜ pending |
| 106-01-02 | 01 | 1 | I18N-01 | file_contains | `grep -q "Tiếng Việt" README.md` | N/A | ⬜ pending |
| 106-01-03 | 01 | 1 | I18N-01 | file_contains | `grep -q "Translated from README.md" README.vi.md` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 is N/A for this documentation phase — no additional infrastructure needed.

*Existing documentation infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Translation quality | I18N-01 | Requires human judgment for natural language | Review README.vi.md for accurate, natural Vietnamese translation |
| Language switcher visibility | I18N-01 | Visual check | Open README.md and verify badge links appear correctly |
| Section completeness | I18N-01 | Manual count | Verify all 21 sections from original README are present in translation |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-04
