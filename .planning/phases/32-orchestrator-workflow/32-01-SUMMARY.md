---
phase: 32-orchestrator-workflow
plan: 01
subsystem: workflows
tags: [orchestrator, fix-bug, agents, workflow-rewrite]
dependency_graph:
  requires: [session-manager, evidence-protocol, parallel-dispatch]
  provides: [fix-bug-orchestrator-part1, fix-bug-v1.5-backup]
  affects: [workflows/fix-bug.md, workflows/fix-bug-v1.5.md]
tech_stack:
  added: []
  patterns: [agent-spawn, evidence-chain, progressive-disclosure]
key_files:
  created:
    - workflows/fix-bug-v1.5.md
  modified:
    - workflows/fix-bug.md
decisions:
  - "Backup nguyen van v1.5 (438 dong) truoc khi rewrite — dam bao Phase 33 co fallback"
  - "Purpose cap nhat tu 'phuong phap khoa hoc' sang 'dieu phoi 5 agents' — phan anh kien truc moi"
  - "Snapshot tests se fail do workflow thay doi — snapshot update la out of scope (converters xu ly rieng)"
metrics:
  duration: 3min
  completed: 2026-03-25
---

# Phase 32 Plan 01: Backup v1.5 va rewrite fix-bug.md phan dau Summary

Backup workflow v1.5 va rewrite fix-bug.md thanh orchestrator moi — Buoc 0 (Resume UI voi listSessions), Buoc 0.5 (phan tich bug + createSession), Buoc 1 (Janitor spawn + evidence validation), Buoc 2 (Detective + DocSpec song song + mergeParallelResults) voi progressive disclosure banners.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Backup v1.5 va rewrite phan dau (Buoc 0, 0.5) | c793f3a | workflows/fix-bug-v1.5.md, workflows/fix-bug.md |
| 2 | Viet Buoc 1 (Janitor) va Buoc 2 (Detective + DocSpec) | e3dfb4c | workflows/fix-bug.md |

## Key Outcomes

- **Backup hoan tat:** workflows/fix-bug-v1.5.md (438 dong, nguyen van v1.5)
- **Orchestrator phan dau:** workflows/fix-bug.md (160 dong) gom Buoc 0-2
- **Module integration:** listSessions, createSession, validateEvidence, buildParallelPlan, mergeParallelResults, updateSession
- **Agent spawn:** pd-bug-janitor (Buoc 1), pd-code-detective + pd-doc-specialist (Buoc 2)
- **Progressive disclosure:** 5 banners "--- Buoc N/5: ... ---"
- **Fail-forward logic:** DocSpec fail -> WARNING tiep tuc; Janitor fail khong trieu chung -> STOP

## Decisions Made

1. Backup nguyen van v1.5 (438 dong) truoc khi rewrite — dam bao Phase 33 co fallback cho --single mode
2. Purpose cap nhat phan anh kien truc orchestrator 5 agents thay vi single-agent
3. Snapshot tests se fail do workflow thay doi — la ket qua mong doi, snapshot update se theo sau converter pipeline

## Deviations from Plan

None — plan thuc hien dung nhu thiet ke.

## Known Stubs

Workflow chua day du — Buoc 3 (Repro), Buoc 4 (Architect), Buoc 5 (Fix+Commit) se duoc viet trong Plan 02. Day la thiet ke co chu dich (Plan 01 chi bao gom nua dau workflow).

## Verification

- workflows/fix-bug-v1.5.md ton tai, 438 dong (>= 430)
- workflows/fix-bug.md chua: purpose, required_reading, Buoc 0 Resume UI, Buoc 0.5, Buoc 1, Buoc 2
- Tat ca pure function modules goi dung ten: listSessions, createSession, validateEvidence, buildParallelPlan, mergeParallelResults, updateSession
- Agent names dung: pd-bug-janitor, pd-code-detective, pd-doc-specialist
- Progressive disclosure banners co mat: Buoc 1/5, Buoc 2/5
- JS module smoke tests pass (non-snapshot)
