---
phase: 053-new-agent-files
verified: 2026-03-27T00:00:00Z
status: gaps_found
score: 5/8 must-haves verified
gaps:
  - truth: "pd-codebase-mapper có Write tool trong frontmatter và registry (CONTEXT D-01)"
    status: failed
    reason: "Agent file frontmatter chỉ có tools: Read, Glob, Grep, Bash — thiếu Write. Registry cũng thiếu Write. CONTEXT D-01 và PLAN task 1 đều yêu cầu Write vì agent cần ghi .planning/codebase/."
    artifacts:
      - path: ".claude/agents/pd-codebase-mapper.md"
        issue: "tools: Read, Glob, Grep, Bash — thiếu Write"
      - path: "bin/lib/resource-config.js"
        issue: "AGENT_REGISTRY['pd-codebase-mapper'].tools = ['Read','Glob','Grep','Bash'] — thiếu Write"
    missing:
      - "Thêm Write vào tools trong .claude/agents/pd-codebase-mapper.md"
      - "Thêm 'Write' vào AGENT_REGISTRY['pd-codebase-mapper'].tools trong bin/lib/resource-config.js"
      - "Cập nhật smoke test cho pd-codebase-mapper để expect Write tool"

  - truth: "pd-feature-analyst có Bash + Context7 tools (mcp__context7__resolve-library-id, mcp__context7__query-docs) trong frontmatter và registry (AGEN-04, CONTEXT D-01)"
    status: failed
    reason: "File frontmatter chỉ có tools: Read, Glob, Grep — thiếu Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs. Registry cũng chỉ có 3 tools này. AGEN-04 yêu cầu phân tích thư viện qua Context7."
    artifacts:
      - path: ".claude/agents/pd-feature-analyst.md"
        issue: "tools: Read, Glob, Grep — thiếu Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs"
      - path: "bin/lib/resource-config.js"
        issue: "AGENT_REGISTRY['pd-feature-analyst'].tools = ['Read','Glob','Grep'] — thiếu 3 tools"
    missing:
      - "Thêm Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs vào tools trong .claude/agents/pd-feature-analyst.md"
      - "Thêm 3 tools đó vào AGENT_REGISTRY['pd-feature-analyst'].tools trong bin/lib/resource-config.js"
      - "Cập nhật process trong agent file: dùng Context7 để tra cứu thư viện"
      - "Cập nhật smoke test cho pd-feature-analyst để expect 6 tools"

  - truth: "pd-regression-analyzer wrap analyzeFromCallChain và analyzeFromSourceFiles từ bin/lib/regression-analyzer.js (AGEN-07, CONTEXT D-11, D-12)"
    status: failed
    reason: "Agent file body không đề cập analyzeFromCallChain, analyzeFromSourceFiles, hay regression-analyzer.js. AGEN-07 yêu cầu 'nâng từ regression-analyzer.js thành agent có dispatch'. CONTEXT D-11 yêu cầu wrap 2 functions cụ thể. Thực tế agent là generic regression tester dùng git diff."
    artifacts:
      - path: ".claude/agents/pd-regression-analyzer.md"
        issue: "Body không reference analyzeFromCallChain, analyzeFromSourceFiles, hay regression-analyzer.js — dùng git diff approach thay thế"
    missing:
      - "Cập nhật process trong pd-regression-analyzer.md: bước 'Gọi analyzeFromCallChain() từ regression-analyzer.js bằng Bash node -e'"
      - "Cập nhật process: fallback BFS với analyzeFromSourceFiles() nếu FastCode fail"
      - "Đảm bảo agent file có ít nhất 1 reference đến bin/lib/regression-analyzer.js"
---

# Phase 53: New Agent Files — Verification Report

**Phase Goal:** Create 6 new agent files at `.claude/agents/` (executor chose `.claude/agents/` over `commands/pd/agents/` — acknowledged, consistent with codebase), each with YAML frontmatter (tier, tools, model) consistent with registry. Add smoke tests for all 6 agents.
**Verified:** 2026-03-27
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 6 agent files tồn tại tại `.claude/agents/` với frontmatter hợp lệ | ✓ VERIFIED | 6 files đều tồn tại, có name/description/model/tools/maxTurns/effort |
| 2 | model trong mỗi file khớp với TIER_MAP[tier] từ registry | ✓ VERIFIED | scout→haiku, builder→sonnet, architect→opus — tất cả đúng |
| 3 | Mỗi agent có body gồm 3 XML blocks: objective, process, rules | ✓ VERIFIED | 6/6 files có đủ `<objective>`, `<process>`, `<rules>` |
| 4 | 5 entries mới trong AGENT_REGISTRY (pd-regression-analyzer đã có từ Phase 52) | ✓ VERIFIED | 5 entries tồn tại trong resource-config.js tại lines 95-114 |
| 5 | Smoke tests cover 6 agents mới với bidirectional tools validation | ✓ VERIFIED | 6 test cases mới trong describe 'New agent files (parseFrontmatter validation)', 26/26 pass |
| 6 | pd-codebase-mapper có Write tool (CONTEXT D-01, PLAN task 1) | ✗ FAILED | File: tools: Read, Glob, Grep, Bash — thiếu Write; Registry cũng thiếu |
| 7 | pd-feature-analyst có Bash + Context7 tools (AGEN-04, CONTEXT D-01) | ✗ FAILED | File: tools: Read, Glob, Grep — thiếu Bash, mcp__context7__*, registry cũng thiếu |
| 8 | pd-regression-analyzer wrap analyzeFromCallChain/analyzeFromSourceFiles (AGEN-07, D-11, D-12) | ✗ FAILED | Không có reference đến regression-analyzer.js hay 2 functions đó trong agent body |

**Score:** 5/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.claude/agents/pd-codebase-mapper.md` | Scout agent, tier: scout, tools bao gồm Write | ⚠️ PARTIAL | Tồn tại, tier=scout, nhưng thiếu Write tool |
| `.claude/agents/pd-security-researcher.md` | Scout agent, tier: scout, mcp__fastcode__code_qa | ✓ VERIFIED | Tồn tại, tier=scout, tools=[Read,Glob,Grep,mcp__fastcode__code_qa] |
| `.claude/agents/pd-feature-analyst.md` | Scout agent, tier: scout, Context7 tools | ✗ STUB | Tồn tại nhưng thiếu Bash+Context7 tools — body không dùng Context7 |
| `.claude/agents/pd-research-synthesizer.md` | Architect agent, tier: architect | ✓ VERIFIED | Tồn tại, tier=architect, tools=[Read,Write,Glob,Grep,Bash] |
| `.claude/agents/pd-planner.md` | Architect agent, tier: architect | ✓ VERIFIED | Tồn tại, tier=architect, tools=[Read,Write,Glob,Grep,Bash] |
| `.claude/agents/pd-regression-analyzer.md` | Builder agent wrapping regression-analyzer.js | ✗ PARTIAL | Tồn tại, tier=builder, tools đúng, nhưng body không wrap analyzeFromCallChain/analyzeFromSourceFiles |
| `bin/lib/resource-config.js` | 5 entries mới trong AGENT_REGISTRY | ⚠️ PARTIAL | 5 entries tồn tại nhưng pd-codebase-mapper thiếu Write, pd-feature-analyst thiếu 3 tools |
| `test/smoke-agent-files.test.js` | 6 test cases cho 6 agents mới | ✓ VERIFIED | 6 test cases, 26/26 pass — nhưng tests validate thực tế (không phải spec), nên KHÔNG phát hiện tools gaps |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `.claude/agents/*.md` (tools field) | `bin/lib/resource-config.js` (AGENT_REGISTRY.tools) | bidirectional test trong smoke-agent-files.test.js | ✓ WIRED | Tests verify 2 chiều — nhưng cả 2 phía đều thiếu tools nên tests pass với sai spec |
| `test/smoke-agent-files.test.js` | `.claude/agents/*.md` | readFileSync + parseAgentFrontmatter | ✓ WIRED | Tests đọc files trực tiếp |
| `test/smoke-agent-files.test.js` | `bin/lib/resource-config.js` | require AGENT_REGISTRY | ✓ WIRED | Import trực tiếp |

### Data-Flow Trace (Level 4)

Không áp dụng — phase này tạo agent files và tests, không có component render dynamic data.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 26 agent smoke tests pass | `node --test test/smoke-agent-files.test.js` | 26/26 pass | ✓ PASS |
| 38 resource-config tests pass | `node --test test/smoke-resource-config.test.js` | 38/38 pass | ✓ PASS |
| Full smoke suite pass | `node --test test/smoke-*.test.js` | 1038/1038 pass | ✓ PASS |
| AGENT_REGISTRY có 16 agents | Constants test trong smoke-resource-config | Pass (line "AGENT_REGISTRY co 16 agents") | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AGEN-02 | 053-01-PLAN | `pd-codebase-mapper` agent (Scout tier) quét cấu trúc codebase | ⚠️ PARTIAL | File tồn tại, tier đúng, nhưng thiếu Write tool — agent không thể ghi `.planning/codebase/` nếu không có Write |
| AGEN-03 | 053-01-PLAN | `pd-security-researcher` agent (Scout tier) research security | ✓ SATISFIED | File tồn tại, tier=scout, có mcp__fastcode__code_qa |
| AGEN-04 | 053-01-PLAN | `pd-feature-analyst` agent (Scout tier) phân tích tính năng | ✗ BLOCKED | File tồn tại nhưng thiếu Context7 tools — không thể tra cứu thư viện như AGEN-04 yêu cầu |
| AGEN-05 | 053-01-PLAN | `pd-research-synthesizer` agent (Architect tier) tổng hợp research | ✓ SATISFIED | File tồn tại, tier=architect, tools=[Read,Write,Glob,Grep,Bash] |
| AGEN-06 | 053-01-PLAN | `pd-planner` agent (Architect tier) lập kế hoạch phases | ✓ SATISFIED | File tồn tại, tier=architect, tools=[Read,Write,Glob,Grep,Bash] |
| AGEN-07 | 053-01-PLAN | `pd-regression-analyzer` agent "nâng từ regression-analyzer.js thành agent có dispatch" | ✗ BLOCKED | Agent tồn tại nhưng là generic regression tester, không wrap analyzeFromCallChain/analyzeFromSourceFiles từ regression-analyzer.js |
| AGEN-08 | 053-02-PLAN | Mỗi agent mới có smoke test trong `test/smoke-agent-files.test.js` | ✓ SATISFIED | 6 test cases mới, 26/26 pass |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.claude/agents/pd-feature-analyst.md` | 5 | `tools: Read, Glob, Grep` — thiếu Bash và Context7 tools | ⚠️ Warning | Agent không thể thực hiện chức năng Context7 mà AGEN-04 yêu cầu |
| `.claude/agents/pd-codebase-mapper.md` | 4 | `tools: Read, Glob, Grep, Bash` — thiếu Write | ⚠️ Warning | Agent không thể ghi `.planning/codebase/` (objective nói "Ghi kết quả") |
| `.claude/agents/pd-regression-analyzer.md` | 1-52 | Body không mention `regression-analyzer.js`, `analyzeFromCallChain`, `analyzeFromSourceFiles` | 🛑 Blocker | AGEN-07 yêu cầu "nâng từ regression-analyzer.js" — agent hiện tại là generic git diff approach |

**Ghi chú về smoke tests:** Smoke tests pass vì chúng validate file↔registry consistency (bidirectional). Khi cả file và registry đều thiếu cùng tools, tests vẫn pass nhưng bỏ sót gap so với spec. Đây là limitation của test design.

### Human Verification Required

Không có items cần human verification — tất cả gaps có thể verify programmatically.

### Gaps Summary

**3 gaps blocking full goal achievement:**

**Gap 1 — pd-codebase-mapper thiếu Write tool (AGEN-02 partial)**
CONTEXT D-01 quy định `pd-codebase-mapper` cần Write vì agent phải ghi kết quả vào `.planning/codebase/`. Body của agent (step 5) mô tả tạo STRUCTURE.md, TECH_STACK.md, ENTRY_POINTS.md, DEPENDENCIES.md nhưng tool Write bị bỏ sót trong cả frontmatter lẫn registry.

**Gap 2 — pd-feature-analyst thiếu Bash + Context7 tools (AGEN-04 blocked)**
CONTEXT D-01 chỉ định rõ `pd-feature-analyst` cần `mcp__context7__resolve-library-id, mcp__context7__query-docs` để tra cứu thư viện. Thực tế agent chỉ có Read, Glob, Grep. Body cũng không có bước nào dùng Context7. AGEN-04 yêu cầu "phân tích tính năng" nhưng không thể tra cứu docs thư viện với tools hiện tại.

**Gap 3 — pd-regression-analyzer không wrap regression-analyzer.js (AGEN-07 blocked)**
AGEN-07 yêu cầu "nâng từ regression-analyzer.js thành agent có dispatch". CONTEXT D-11 và D-12 quy định rõ agent phải wrap `analyzeFromCallChain()` và `analyzeFromSourceFiles()` bằng Bash `node -e`. Thực tế executor tạo một generic agent dùng git diff approach, không có connection đến thư viện đã tồn tại.

**Root cause chung:** Executor đã đọc PLAN nhưng adapt format sang `tools: comma-separated string` + `model/maxTurns/effort` (thay vì `tier + allowed-tools YAML array` như D-04/D-05). Trong quá trình adapt này, một số tools bị rút gọn và pd-regression-analyzer bị viết lại từ đầu thay vì wrap library có sẵn.

---

_Verified: 2026-03-27_
_Verifier: Claude (gsd-verifier)_
