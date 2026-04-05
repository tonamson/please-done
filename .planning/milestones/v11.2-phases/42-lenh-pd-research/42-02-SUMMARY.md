---
phase: 42-lenh-pd-research
plan: 02
subsystem: commands, workflows
tags: [pd-research, skill-file, workflow, pipeline, cross-validate, evidence-collector, fact-checker]
dependency_graph:
  requires: [pd-evidence-collector agent, pd-fact-checker agent]
  provides: [pd:research skill command, research workflow pipeline]
  affects: [commands/pd/ skill registry, workflows/ directory]
tech_stack:
  added: []
  patterns: [skill frontmatter pattern, workflow process pattern, agent spawn pattern]
key_files:
  created:
    - commands/pd/research.md
    - workflows/research.md
  modified: []
decisions:
  - "Skill model: sonnet (nhat quan voi pd:fix-bug va pd:write-code)"
  - "Guard chi kiem tra chu de — guard-context.md bao phu CONTEXT.md check"
metrics:
  duration: 90s
  completed: "2026-03-26T02:29:15Z"
  tasks: 2
  files: 2
---

# Phase 42 Plan 02: Skill file pd:research va Workflow research.md

Tao skill file pd:research va workflow research.md — user-facing command dieu phoi pipeline 3 buoc (route -> collect -> verify) voi Evidence Collector va Fact Checker agents tuan tu, cross-validation tu dong khi co files cung topic o ca internal/ va external/.

## Tong quan

Plan nay tao 2 files cot loi de user co the goi `/pd:research [chu de]`:
- **commands/pd/research.md**: Skill file voi frontmatter chuan, guards, execution_context tro den workflow
- **workflows/research.md**: Pipeline 3 buoc voi agent spawning, error handling, cross-validation, output summary

## Ket qua theo Task

### Task 1: Tao skill file commands/pd/research.md

**Commit:** 4160699

- Frontmatter chuan: name pd:research, model sonnet, allowed-tools voi Agent (de spawn agents)
- Guards: guard-context.md + kiem tra chu de nghien cuu
- Execution context: @workflows/research.md (required) + @references/conventions.md (required)
- Process: delegate hoan toan cho workflow
- Rules: 3 rules — pipeline day du, khong skip Fact Checker, output tieng Viet

### Task 2: Tao workflow file workflows/research.md

**Commit:** b8d3cb3

- Purpose section mo ta pipeline tuan tu: route -> collect -> verify
- Buoc 1: Phan loai query internal/external bang phan tich noi dung (file names, paths, keywords -> internal; con lai -> external)
- Buoc 2: Spawn pd-evidence-collector voi absolute path va topic. Error handling khi Collector fail (WARNING + tiep tuc voi confidence LOW)
- Buoc 3: Spawn pd-fact-checker voi collector output. Cross-validate: scan INDEX.md tim files cung topic o ca 2 phia. Xung dot ghi vao section "## Xung dot phat hien", khong tu resolve
- Output summary format: topic, phan loai, confidence, claims, xung dot, file paths
- Rules: 7 rules bao gom absolute paths, no blocking, seamless execution, cross-validate, xung dot handling

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **Skill model: sonnet** — Nhat quan voi pd:fix-bug va pd:write-code, orchestrator khong can opus tier.
2. **Guard chi kiem tra chu de** — guard-context.md da bao phu CONTEXT.md check, chi can them 1 guard cho chu de nghien cuu.

## Known Stubs

None — ca 2 files la workflow definitions (markdown), khong co code stubs.

## Verification

```
grep "name: pd:research" commands/pd/research.md -> FOUND
grep "@workflows/research.md" commands/pd/research.md -> FOUND (2 occurrences)
grep "pd-evidence-collector" workflows/research.md -> FOUND
grep "pd-fact-checker" workflows/research.md -> FOUND
grep "Xung dot phat hien" workflows/research.md -> FOUND
```

## Self-Check: PASSED
