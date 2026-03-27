# Phase 53: New Agent Files - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Tạo 6 agent files mới tại `commands/pd/agents/`, thêm vào `AGENT_REGISTRY` trong `resource-config.js`, và mở rộng smoke tests trong `test/smoke-agent-files.test.js`. Mỗi agent có YAML frontmatter (name, description, tier, allowed-tools) và body (`<objective>`, `<process>`, `<rules>`).

Phase này KHÔNG handle: per-platform model mapping (Phase 54), wiring parallel dispatch (Phase 55), hay integration vào workflows (Phase 56).

</domain>

<decisions>
## Implementation Decisions

### Tool Assignments
- **D-01:** Scout agents dùng tools read-only + search: `Read, Glob, Grep, Bash`
  - `pd-codebase-mapper`: thêm `Write` (cần ghi `.planning/codebase/`)
  - `pd-security-researcher`: thêm `mcp__fastcode__code_qa` (cần trace call chains cho security analysis)
  - `pd-feature-analyst`: thêm `mcp__context7__resolve-library-id, mcp__context7__query-docs` (cần tra cứu thư viện)
- **D-02:** Architect agents dùng full toolset: `Read, Write, Glob, Grep, Bash`
  - `pd-research-synthesizer`: tổng hợp research → cần Write để output
  - `pd-planner`: tạo PLAN.md → cần Write
- **D-03:** `pd-regression-analyzer` (Builder): `Read, Glob, Grep, Bash, mcp__fastcode__code_qa` — locked từ Phase 52 D-07

### Frontmatter Format
- **D-04:** Giữ format YAML hiện tại: `name`, `description` (tiếng Việt có dấu), `tier`, `allowed-tools` (YAML array với dashes)
- **D-05:** KHÔNG thêm `model`, `maxTurns`, `effort` vào frontmatter — những giá trị này resolve từ `TIER_MAP` tại runtime

### Agent Body Structure
- **D-06:** Mỗi agent body gồm 3 XML blocks: `<objective>`, `<process>` (5-7 steps), `<rules>`
- **D-07:** Nội dung process steps viết tiếng Việt, cụ thể theo domain của agent
- **D-08:** Mỗi agent ~30-50 dòng body — tương đương existing agents

### Registry Entries
- **D-09:** Chỉ thêm `tier` + `tools` cho mỗi agent. KHÔNG thêm `categories` (chỉ dùng cho security audit agents)
- **D-10:** Tools trong registry PHẢI khớp chính xác với `allowed-tools` trong frontmatter — tests validate bidirectional

### pd-regression-analyzer Agent Content
- **D-11:** Agent wrap 2 functions từ `bin/lib/regression-analyzer.js`: `analyzeFromCallChain()` và `analyzeFromSourceFiles()`
- **D-12:** Process: nhận target file → gọi FastCode trace → chạy analyzeFromCallChain → fallback BFS nếu FastCode fail → output affected files

### Backward Compatibility
- **D-13:** 8 existing agents KHÔNG bị sửa đổi — chỉ thêm 6 agents mới
- **D-14:** `AGENT_NAMES` array trong test file mở rộng thêm 6 entries, test patterns giữ nguyên

### Claude's Discretion
- Chi tiết process steps cho mỗi agent (miễn tuân thủ 5-7 steps)
- Description tiếng Việt cụ thể cho mỗi agent
- Test case naming conventions (giữ pattern hiện tại)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Code
- `bin/lib/resource-config.js` — TIER_MAP (lines 22-26), AGENT_REGISTRY (lines 32-95), exports (lines 283-297)
- `bin/lib/regression-analyzer.js` — Pure functions cần wrap: `analyzeFromCallChain()` (lines 29-73), `analyzeFromSourceFiles()` (lines 118-200)

### Existing Agents (Templates)
- `commands/pd/agents/pd-bug-janitor.md` — Scout tier template (frontmatter + body pattern)
- `commands/pd/agents/pd-code-detective.md` — Builder tier template
- `commands/pd/agents/pd-fix-architect.md` — Architect tier template

### Tests
- `test/smoke-agent-files.test.js` — AGENT_NAMES array (lines 18-26), frontmatter parser (lines 35-79), validation tests (lines 96-203)

### Requirements
- `.planning/REQUIREMENTS.md` — AGEN-02 tới AGEN-08

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/regression-analyzer.js`: 2 pure functions (`analyzeFromCallChain`, `analyzeFromSourceFiles`) — pd-regression-analyzer agent wraps these
- `bin/lib/resource-config.js`: `getAgentConfig()` tự động merge tier config cho agent mới
- 8 existing agent files: template trực tiếp cho frontmatter + body structure

### Established Patterns
- Frontmatter: `name, description, tier, allowed-tools` — YAML format chuẩn
- Body: `<objective>` + `<process>` (numbered steps) + `<rules>` (bullet list)
- Registry: `{ tier, tools }` object per agent
- Tests: file existence → frontmatter validation → body structure → registry consistency

### Integration Points
- `AGENT_REGISTRY` trong `resource-config.js` — thêm 5 entries mới (pd-regression-analyzer đã có từ Phase 52)
- `AGENT_NAMES` trong `smoke-agent-files.test.js` — mở rộng array
- Individual test cases per agent — follow pattern lines 97-158

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow existing agent patterns consistently.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 053-new-agent-files*
*Context gathered: 2026-03-27*
