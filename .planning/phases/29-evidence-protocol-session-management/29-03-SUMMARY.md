---
phase: 29-evidence-protocol-session-management
plan: 03
status: complete
started: 2025-03-25
completed: 2025-03-25
commits:
  - hash: b8ec77c
    message: "feat(29-03): cập nhật 5 agent files — session-based evidence paths, 3 outcome formats"
key-files:
  modified:
    - .claude/agents/pd-bug-janitor.md
    - .claude/agents/pd-code-detective.md
    - .claude/agents/pd-doc-specialist.md
    - .claude/agents/pd-repro-engineer.md
    - .claude/agents/pd-fix-architect.md
    - commands/pd/agents/pd-bug-janitor.md
    - commands/pd/agents/pd-code-detective.md
    - commands/pd/agents/pd-doc-specialist.md
    - commands/pd/agents/pd-repro-engineer.md
    - commands/pd/agents/pd-fix-architect.md
deviations: none
self-check: PASSED
---

## Tóm tắt

Cập nhật 5 agent files (cả `.claude/agents/` và `commands/pd/agents/`) để bỏ hardcode evidence paths và thay bằng session-based evidence writing với 3 outcome formats chuẩn.

## Thay đổi chính

1. **Bỏ hardcode paths** — Không còn `.planning/debug/evidence_*.md` trong bất kỳ agent file nào
2. **Session-based evidence** — Tất cả agents đọc/ghi evidence từ session dir được Orchestrator truyền qua prompt
3. **3 outcome formats** — Mỗi agent có hướng dẫn ghi YAML frontmatter (agent, outcome, timestamp, session) và body theo:
   - ROOT CAUSE FOUND: Nguyên nhân, Bằng chứng, Đề xuất
   - CHECKPOINT REACHED: Tiến độ điều tra, Câu hỏi cho User, Context cho Agent tiếp
   - INVESTIGATION INCONCLUSIVE: Elimination Log (bảng 3 cột), Hướng điều tra tiếp

## Kiểm tra

- `grep -r '.planning/debug/evidence_' .claude/agents/` → 0 kết quả
- 5/5 files có "session dir", "outcome:", "KHÔNG hardcode paths"
- smoke-agent-files.test.js: 10/10 pass
