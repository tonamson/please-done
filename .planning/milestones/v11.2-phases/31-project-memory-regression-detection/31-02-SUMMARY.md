---
phase: 31-project-memory-regression-detection
plan: 02
subsystem: agent-prompts
tags: [bug-memory, regression-detection, agent-prompt, evidence-chain]
dependency_graph:
  requires: [31-01]
  provides: [janitor-bug-search, architect-regression-check]
  affects: [pd-bug-janitor, pd-fix-architect]
tech_stack:
  added: []
  patterns: [prompt-engineering, evidence-chain-integration]
key_files:
  created: []
  modified:
    - .claude/agents/pd-bug-janitor.md
    - .claude/agents/pd-fix-architect.md
decisions:
  - "Prompt-based approach cho ca 2 agents — agent tu thuc hien scoring va matching theo huong dan chi tiet trong prompt"
  - "Section Bug tuong tu LUON duoc ghi trong evidence_janitor.md — nhat quan voi evidence chain pattern"
metrics:
  duration: 5min
  completed: "2026-03-25T05:09:40Z"
---

# Phase 31 Plan 02: Cap nhat Agent Prompts cho Bug Memory Summary

Tich hop bug memory vao 2 agent prompts — Janitor tim bug tuong tu voi 3-field scoring va rebuild INDEX.md, Architect kiem tra regression conflict voi fix cu.

## Ket qua

### Task 1: Cap nhat pd-bug-janitor.md
- **Commit:** dcf6f99
- Buoc 2 chi tiet hoa: Glob tim `.planning/bugs/BUG-*.md`, parse YAML frontmatter, scoring 3 truong (file path substring, function exact, error_message substring) — tat ca case-insensitive
- Buoc 5 them section `## Bug tuong tu` voi REGRESSION ALERT khi score >= 2, bug lien quan khi score = 1
- Buoc 6 moi: huong dan rebuild `.planning/bugs/INDEX.md` sau khi tao bug record (full rebuild, 5 sections)

### Task 2: Cap nhat pd-fix-architect.md
- **Commit:** f037c92
- Buoc 5 moi: doc section Bug tuong tu tu evidence_janitor.md, kiem tra CONFLICT khi co REGRESSION ALERT
- Buoc 7 them section `## Kiem tra Regression` trong evidence_architect.md output
- Rule moi: PHAI doc BUG file goc va kiem tra conflict truoc khi ra phan quyet cuoi cung

## Deviations from Plan

None — plan duoc thuc thi chinh xac nhu da viet.

## Known Stubs

Khong co stubs. Ca 2 agent prompts da co huong dan day du de thuc thi bug memory workflow.

## Decisions Made

1. **Prompt-based approach:** Agent tu thuc hien scoring va matching theo huong dan chi tiet — khong can goi module bug-memory.js tu prompt (agent dung Glob/Read truc tiep)
2. **Evidence chain nhat quan:** Section Bug tuong tu nam trong evidence_janitor.md, Architect doc tu do — khong tao file rieng

## Self-Check: PASSED
