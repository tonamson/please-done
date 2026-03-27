# Phase 53: New Agent Files - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 053-new-agent-files
**Areas discussed:** Tool assignments, Agent body depth, Registry fields, Frontmatter format
**Mode:** Auto (--auto)

---

## Tool Assignments

| Option | Description | Selected |
|--------|-------------|----------|
| Dựa theo pattern existing agents cùng tier | Scout: Read/Glob/Grep/Bash + MCP phù hợp, Architect: full toolset, Builder: locked từ Phase 52 | ✓ |
| Minimal tools cho tất cả | Chỉ Read/Glob/Grep | |
| Maximum tools | Tất cả agents có full toolset | |

**User's choice:** [auto] Dựa theo pattern existing agents cùng tier (recommended default)
**Notes:** Scout agents thêm MCP tools theo domain (FastCode cho security, Context7 cho feature analyst). Architect agents cần Write.

---

## Agent Body Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Tương đương existing agents (~30-50 dòng) | 3 XML blocks, 5-7 process steps | ✓ |
| Minimal (~15-20 dòng) | Chỉ objective + rules | |
| Detailed (~80-100 dòng) | Full documentation với examples | |

**User's choice:** [auto] Tương đương existing agents (~30-50 dòng) (recommended default)
**Notes:** Nhất quán với 8 agents hiện có.

---

## Registry Optional Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Chỉ tier + tools | Giữ đơn giản, không categories | ✓ |
| Thêm categories | Phân loại agents theo domain | |

**User's choice:** [auto] Chỉ tier + tools (recommended default)
**Notes:** `categories` chỉ dùng cho security audit agents — không phù hợp cho agents mới.

---

## Frontmatter Format

| Option | Description | Selected |
|--------|-------------|----------|
| Giữ format hiện tại (YAML array) | name, description, tier, allowed-tools | ✓ |
| Thêm model/maxTurns/effort | Explicit config per agent | |

**User's choice:** [auto] Giữ format hiện tại (recommended default)
**Notes:** model/maxTurns/effort resolve từ TIER_MAP — không duplicate vào frontmatter.

---

## Claude's Discretion

- Chi tiết process steps cho mỗi agent
- Description tiếng Việt cụ thể
- Test case naming

## Deferred Ideas

None.
