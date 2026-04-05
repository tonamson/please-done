---
phase: 51-tich-hop-ecosystem
plan: 01
subsystem: ecosystem-wiring
tags: [security-audit, wire, non-blocking, snapshots]
dependency_graph:
  requires: []
  provides: [security-gate-complete-milestone, priority-7.5-what-next, pd-audit-state-machine]
  affects: [workflows/complete-milestone.md, workflows/what-next.md, references/state-machine.md]
tech_stack:
  added: []
  patterns: [non-blocking-gate, numbered-choices, side-branch-command]
key_files:
  created:
    - test/smoke-security-wire.test.js
  modified:
    - workflows/complete-milestone.md
    - workflows/what-next.md
    - references/state-machine.md
    - test/snapshots/codex/complete-milestone.md
    - test/snapshots/codex/what-next.md
    - test/snapshots/copilot/complete-milestone.md
    - test/snapshots/copilot/what-next.md
    - test/snapshots/gemini/complete-milestone.md
    - test/snapshots/gemini/what-next.md
    - test/snapshots/opencode/complete-milestone.md
    - test/snapshots/opencode/what-next.md
decisions:
  - "Security gate non-blocking voi 2 lua chon numbered, ghi chu vao MILESTONE_COMPLETE.md khi bypass"
  - "Uu tien 7.5 dieu kien: tat ca phases done + chua co SECURITY_REPORT.md"
  - "pd:audit la nhanh phu + co row trong bang dieu kien tien quyet (yeu cau CONTEXT.md)"
metrics:
  duration: 131s
  completed: "2026-03-27"
  tasks: 2
  files: 12
---

# Phase 51 Plan 01: Wire Pipeline Security Audit vao Ecosystem Summary

Wire 3 diem ket noi pipeline security audit: security gate non-blocking trong complete-milestone Buoc 2 voi 2 lua chon (chay pd:audit / bo qua), uu tien 7.5 trong what-next goi y pd:audit khi tat ca phases done + chua co SECURITY_REPORT, va nhanh phu pd:audit trong state-machine voi dieu kien tien quyet CONTEXT.md.

## Changes Made

### Task 1: Chinh sua 3 source files + tao test file
**Commit:** `40b8516`

**WIRE-01 (complete-milestone.md):** Chen section "Kiem tra bao mat" (non-blocking) sau Cross-check ROADMAP, truoc Buoc 3. Glob check SECURITY_REPORT.md — ton tai thi tiep tuc, khong ton tai thi canh bao voi 2 lua chon: (1) chay pd:audit ngay, (2) bo qua va ghi chu MILESTONE_COMPLETE.md.

**WIRE-02 (what-next.md):** Chen row uu tien 7.5 giua row 7 va row 8 trong bang Buoc 4. Dieu kien: tat ca phases done + chua co SECURITY_REPORT.md. Goi y: chay pd:audit truoc khi dong milestone.

**WIRE-03 (state-machine.md):** Them bullet pd:audit vao danh sach nhanh phu (sau pd:update). Them row pd:audit vao bang dieu kien tien quyet (yeu cau CONTEXT.md, goi y "Chay pd:init truoc").

**Test file (smoke-security-wire.test.js):** 5 test cases dung node:test + node:assert/strict — WIRE-01 (SECURITY_REPORT + pd:audit + non-blocking), WIRE-02 (7.5 + pd:audit + SECURITY_REPORT), WIRE-03 (nhanh phu), WIRE-03b (bang dieu kien), snapshot sync (4 platforms x 2 files).

### Task 2: Regenerate snapshots + chay full test suite
**Commit:** `209459f`

Chay `node test/generate-snapshots.js` — 56 snapshots generated (4 platforms x 14 skills). 8 snapshot files lien quan da cap nhat tu dong (codex/copilot/gemini/opencode x complete-milestone + what-next).

**Ket qua test:**
- smoke-security-wire.test.js: 5/5 PASS
- Full smoke suite: 1023/1023 PASS, 0 failures, khong co regression

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - tat ca wire points da ket noi day du, khong co placeholder hay TODO.

## Verification Results

| Check | Result |
|-------|--------|
| WIRE-01: SECURITY_REPORT trong complete-milestone | PASS |
| WIRE-02: 7.5 trong what-next | PASS |
| WIRE-03: pd:audit trong state-machine (>= 2 lan) | PASS |
| Non-blocking: khong co **CHAN** | PASS |
| Snapshots dong bo | PASS |
| Full smoke suite | 1023/1023 PASS |

## Self-Check: PASSED

All created/modified files verified on disk. Both commit hashes (40b8516, 209459f) confirmed in git log.
