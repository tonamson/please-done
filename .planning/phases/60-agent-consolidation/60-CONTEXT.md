# Phase 60: Agent Consolidation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Copy tất cả 14 agent files từ `.claude/agents/` vào `commands/pd/agents/`, đè chồng 6 file trùng tên (bản mới từ `.claude/agents/` ưu tiên), thêm 8 file mới. Giữ nguyên 2 file chỉ có ở `commands/pd/agents/` (`pd-sec-fixer.md`, `pd-sec-reporter.md`). Kết quả: 16 agent files trong `commands/pd/agents/`.

</domain>

<decisions>
## Implementation Decisions

### Copy Strategy

- **D-01:** Copy nguyên bản file từ `.claude/agents/` sang `commands/pd/agents/`. KHÔNG chuyển đổi format — giữ nguyên format mới (tools, model, maxTurns, effort) cho tất cả 14 files.
- **D-02:** 2 file chỉ có ở bản cũ (`pd-sec-fixer.md`, `pd-sec-reporter.md`) vẫn giữ format cũ (tier, allowed-tools) — việc chuyển format thuộc Phase 63.

### Duplicate Handling

- **D-03:** 6 files trùng tên (pd-bug-janitor, pd-code-detective, pd-doc-specialist, pd-repro-engineer, pd-fix-architect, pd-sec-scanner) — bản từ `.claude/agents/` ĐÈ CHỒNG bản cũ ở `commands/pd/agents/`.
- **D-04:** Không cần backup bản cũ — nội dung cũ vẫn có trong git history.

### Verification

- **D-05:** Sau khi copy, verify bằng: (a) đếm đúng 16 files trong `commands/pd/agents/`, (b) mỗi file không rỗng, (c) 14 files mới có YAML frontmatter hợp lệ.

### Agent's Discretion

- Thứ tự copy files (14 files copy cùng lúc hay tuần tự) — không ảnh hưởng kết quả.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST đọc trước khi plan hoặc implement.**

### Agent Inventory

- `fix_agents.md` — Bảng đối chiếu 16 agents, hiện trạng 2 folders, actions cần làm
- `.planning/REQUIREMENTS.md` — AGNT-01, AGNT-02 là requirements cho phase này

### Agent Files (Source)

- `.claude/agents/pd-bug-janitor.md` — Bản mới, có Knowledge Recall + Bug Index (62 dòng)
- `.claude/agents/pd-code-detective.md` — Bản mới, có FastCode integration
- `.claude/agents/pd-doc-specialist.md` — Bản mới, đọc evidence_janitor.md
- `.claude/agents/pd-repro-engineer.md` — Bản mới
- `.claude/agents/pd-fix-architect.md` — Bản mới, có Regression check (46 dòng)
- `.claude/agents/pd-sec-scanner.md` — Bản mới, có Function Checklist + POC
- `.claude/agents/pd-evidence-collector.md` — File mới (không có ở commands/pd/)
- `.claude/agents/pd-fact-checker.md` — File mới
- `.claude/agents/pd-codebase-mapper.md` — File mới
- `.claude/agents/pd-security-researcher.md` — File mới
- `.claude/agents/pd-feature-analyst.md` — File mới
- `.claude/agents/pd-research-synthesizer.md` — File mới
- `.claude/agents/pd-planner.md` — File mới
- `.claude/agents/pd-regression-analyzer.md` — File mới

### Agent Files (Giữ nguyên tại destination)

- `commands/pd/agents/pd-sec-fixer.md` — Chỉ có ở commands, giữ nguyên
- `commands/pd/agents/pd-sec-reporter.md` — Chỉ có ở commands, giữ nguyên

### System References

- `bin/lib/resource-config.js` — AGENT_REGISTRY (16 entries đã có)
- `test/smoke-agent-files.test.js` — Test hiện tại verify 14 agents tại `.claude/agents/`

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `bin/lib/resource-config.js`: AGENT_REGISTRY đã có 16 entries (bao gồm pd-sec-fixer, pd-sec-reporter)
- `test/smoke-agent-files.test.js`: Integration test kiểm tra agent files — cần cập nhật path ở Phase 62

### Established Patterns

- Format mới (Claude Code native): `tools:` comma-separated, `model:` (haiku/sonnet/opus), `maxTurns:`, `effort:`
- Format cũ (commands/pd): `tier:` (scout/builder/architect), `allowed-tools:` YAML list
- Body structure: `<objective>`, `<process>`, `<rules>` — giống nhau cả 2 format

### Integration Points

- `workflows/fix-bug.md` tham chiếu `.claude/agents/pd-*.md` — sẽ cập nhật ở Phase 62
- Installer pipeline đọc từ `commands/pd/*.md` (skills) — KHÔNG đọc agents, không bị ảnh hưởng

</code_context>

<specifics>
## Specific Ideas

- User đã chuẩn bị `fix_agents.md` với bảng đối chiếu chi tiết 16 agents — dùng làm checklist khi implement
- Phase này CHỈ copy files, KHÔNG tạo symlinks (Phase 61), KHÔNG sửa references (Phase 62), KHÔNG đổi format (Phase 63)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 60-agent-consolidation_
_Context gathered: 2026-03-27_
