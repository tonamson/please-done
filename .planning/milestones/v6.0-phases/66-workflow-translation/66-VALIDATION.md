---
phase: 66
slug: workflow-translation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 66 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                      |
| ---------------------- | ------------------------------------------ |
| **Framework**          | Node.js built-in test runner               |
| **Config file**        | None — uses `node --test` directly         |
| **Quick run command**  | `node --test test/smoke-integrity.test.js` |
| **Full suite command** | `node --test test/smoke-*.test.js`         |
| **Estimated runtime**  | ~1 second                                  |

---

## Sampling Rate

- **After every task commit:** Run `grep -c '[àáạảãâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]' workflows/{translated-files}` + `node --test test/smoke-integrity.test.js`
- **After each wave:** Full diacritic sweep across all 13 workflow files + `node --test test/smoke-integrity.test.js`
- **Phase gate (final):** `node --test test/smoke-*.test.js` (full suite)

---

## Phase Requirements → Test Map

| Req ID   | Behavior                                                 | Test Type | Automated Command                              | File Exists? |
| -------- | -------------------------------------------------------- | --------- | ---------------------------------------------- | ------------ |
| TRANS-03 | All 13 workflow files contain zero Vietnamese diacritics | smoke     | `grep -c '[àáạ...ỹ]' workflows/*.md \|\| true` | ✅ (inline)  |
| TRANS-03 | Workflow structure preserved (XML tags, cross-refs)      | smoke     | `node --test test/smoke-integrity.test.js`     | ✅           |
| TRANS-03 | Step numbering uses English convention                   | manual    | Visual review during translation               | N/A          |

---

## Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. No new test files needed.
