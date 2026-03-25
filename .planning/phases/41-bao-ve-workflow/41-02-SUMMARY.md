---
phase: 41-bao-ve-workflow
plan: "02"
subsystem: workflow-guards
tags: [research-injection, strategy-injection, workflow, snapshots]
dependency_graph:
  requires: [index-generator, research-store]
  provides: [research-context-injection]
  affects: [workflows/write-code.md, workflows/plan.md, bin/lib/utils.js]
tech_stack:
  added: []
  patterns: [xml-section-extraction, conditional-context-loading]
key_files:
  created: []
  modified:
    - workflows/write-code.md
    - workflows/plan.md
    - bin/lib/utils.js
    - test/snapshots/codex/write-code.md
    - test/snapshots/codex/plan.md
    - test/snapshots/copilot/write-code.md
    - test/snapshots/copilot/plan.md
    - test/snapshots/gemini/write-code.md
    - test/snapshots/gemini/plan.md
    - test/snapshots/opencode/write-code.md
    - test/snapshots/opencode/plan.md
decisions:
  - "research_injection block dat giua conditional_reading va process trong workflow"
  - "inlineWorkflow() extract va inject research_injection section tu workflow vao converted output"
metrics:
  duration: 244s
  completed: "2026-03-25T23:39:23Z"
  tasks: 2
  files: 11
---

# Phase 41 Plan 02: Strategy Injection Guard Summary

Research context injection guard trong 2 workflow files voi converter pipeline support va 48 snapshot sync.

## Ket qua

### Task 1: Them research_injection block vao write-code.md va plan.md
- **Commit:** 905014d
- Them block `<research_injection>` vao `workflows/write-code.md` (sau line 17 `</conditional_reading>`)
- Them cung block vao `workflows/plan.md` (sau line 20 `</conditional_reading>`)
- Block huong dan: doc INDEX.md, keyword match topic, inject max 2 files, max 2000 ky tu, fallback silent

### Task 2: Regenerate snapshots va verify tests pass
- **Commit:** c077b6d
- Cap nhat `inlineWorkflow()` trong `bin/lib/utils.js` de extract va inject `<research_injection>` section
- Regenerate 48 snapshots (4 platforms x 12 skills)
- 8 snapshot files deu co research_injection content
- Full test suite pass: 896/896 tests, 0 failures

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] inlineWorkflow() khong extract research_injection section**
- **Found during:** Task 2
- **Issue:** Converter chi extract `<process>`, `<rules>`, `<required_reading>` tu workflow — `<research_injection>` bi bo qua, snapshots khong cap nhat
- **Fix:** Them extractXmlSection cho `research_injection` va inject sau `</conditional_reading>` trong converted output
- **Files modified:** bin/lib/utils.js
- **Commit:** c077b6d

## Verification

- `grep "research_injection" workflows/write-code.md workflows/plan.md` — co trong ca 2 files
- `grep "research_injection" test/snapshots/*/write-code.md test/snapshots/*/plan.md` — co trong 8 snapshot files
- `node --test 'test/*.test.js'` — 896 pass, 0 fail

## Known Stubs

None — tat ca noi dung la production-ready instructions, khong co placeholder.

## Self-Check: PASSED
