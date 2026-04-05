# Phase 56: Skill-Agent Integration — Research

**Researched:** 2026-03-27
**Phase:** 056-skill-agent-integration
**Requirements:** SKIL-01, SKIL-02, SKIL-03, SKIL-04

## Validation Architecture

### SKIL-01: Verifiable Conditions
- `workflows/init.md` contains `pd-codebase-mapper` reference after Bước 3a
- Init workflow checks `isNewProject === false` before spawning mapper
- Init workflow checks `.planning/codebase/STRUCTURE.md` exists → skip mapper
- Mapper failure produces warning, does not block init

### SKIL-02: Verifiable Conditions
- A GSD workflow (new-project or new-milestone) spawns 3 research agents in parallel
- pd-research-synthesizer runs after 3 agents complete
- Output: `.planning/research/TECHNICAL_STRATEGY.md`

### SKIL-03: Verifiable Conditions
- `workflows/plan.md` contains TECHNICAL_STRATEGY.md check in Bước 1
- Missing file produces warning message, does not block planning

### SKIL-04: Verifiable Conditions
- GSD `plan-phase.md` step 8 planner prompt includes TECHNICAL_STRATEGY.md in `<files_to_read>`
- Injection is conditional — only when file exists

---

## Research Findings

### 1. Init Workflow Integration Points (SKIL-01)

**File:** `workflows/init.md`

**Current flow:**
1. Bước 1: Xác định path
2. Bước 2: Kiểm tra FastCode MCP
3. Bước 2.5: Kiểm tra CONTEXT.md hiện có
4. Bước 3: Kiểm tra project có code → `isNewProject` boolean
5. **Bước 3a: Index FastCode** (chỉ khi `isNewProject = false`) ← INSERT POINT
6. Bước 4: Phát hiện tech stack
7. Bước 5-8: Tạo structure, copy rules, tạo CONTEXT.md, thông báo

**Integration approach:** Thêm **Bước 3b** sau Bước 3a:
- Điều kiện: `isNewProject === false`
- Kiểm tra `.planning/codebase/STRUCTURE.md` tồn tại → skip nếu có
- Spawn pd-codebase-mapper agent (Scout tier, haiku, lightweight)
- Failure → warning + tiếp tục

**Risk:** Mapper cần `.planning/` directory đã tồn tại → Bước 5 tạo directory. Cần đảm bảo Bước 3b chạy SAU Bước 5, hoặc tạo directory trước.

**Resolution:** Đặt mapper spawning SAU Bước 5 (tạo .planning/) thay vì sau Bước 3a. Hoặc thêm `mkdir -p .planning/codebase` trước khi spawn.

### 2. Research Squad in GSD Workflows (SKIL-02)

**Current state in new-project.md:**
- Đã có 4 researcher agents chạy song song (Stack, Features, Architecture, Pitfalls)
- Dùng `gsd-project-researcher` subagent_type
- Sau 4 agents → spawn `gsd-research-synthesizer` → tạo SUMMARY.md

**Current state in new-milestone.md:**
- Tương tự new-project: 4 researchers → synthesizer → SUMMARY.md
- Dùng cùng pattern

**Key insight:** GSD workflows đã có Research Squad pattern — nhưng dùng `gsd-project-researcher` và `gsd-research-synthesizer` (GSD agents), KHÔNG phải `pd-codebase-mapper`, `pd-security-researcher`, `pd-feature-analyst` (PD agents).

**Hai hệ thống research khác nhau:**
1. **GSD Research Squad** (new-project/new-milestone): Focus vào project-level research (stack, features, architecture, pitfalls) → SUMMARY.md
2. **PD Research Squad** (SKIL-02): Focus vào codebase-level analysis (structure, security, features) → TECHNICAL_STRATEGY.md

**Resolution cho SKIL-02:** Wire PD Research Squad vào init workflow (after brownfield detection) hoặc tạo standalone activation. KHÔNG thay thế GSD Research Squad.

**Parallel dispatch:** `buildParallelPlan()` trong `parallel-dispatch.js` hiện HARDCODE cho Detective + DocSpec (2 agents cố định). Cần tạo hàm mới `buildResearchSquadPlan()` hoặc generic hơn.

### 3. Plan Workflow Soft-Guard (SKIL-03)

**File:** `workflows/plan.md`

**Current Bước 1:** Đọc 8 context files:
- PROJECT.md, ROADMAP.md, CURRENT_MILESTONE.md, REQUIREMENTS.md, STATE.md
- scan/SCAN_REPORT.md, research/SUMMARY.md, docs/*.md

**Integration:** Thêm TECHNICAL_STRATEGY.md vào danh sách Bước 1:
```
- `.planning/research/TECHNICAL_STRATEGY.md` → chiến lược kỹ thuật (nếu có)
```

**Soft-guard logic:**
- File tồn tại → đọc và inject vào context
- File KHÔNG tồn tại → warning: "TECHNICAL_STRATEGY.md không tồn tại. Plan sẽ thiếu chiến lược kỹ thuật."
- KHÔNG block planning

### 4. Auto-Injection into GSD Plan-Phase (SKIL-04)

**File:** `$HOME/.claude/get-shit-done/workflows/plan-phase.md` step 8

**Current planner prompt `<files_to_read>`:**
```
- {state_path} (Project State)
- {roadmap_path} (Roadmap)
- {requirements_path} (Requirements)
- {context_path} (USER DECISIONS)
- {research_path} (Technical Research)
- {verification_path} (Verification Gaps)
- {uat_path} (UAT Gaps)
- {reviews_path} (Cross-AI Review Feedback)
- {UI_SPEC_PATH} (UI Design Contract)
```

**Integration:** Thêm:
```
- {strategy_path} (Technical Strategy — if exists)
```

**strategy_path** cần được resolve trong init JSON hoặc hardcode `.planning/research/TECHNICAL_STRATEGY.md`.

### 5. Existing Code Patterns

**Agent spawning pattern (từ fix-bug.md, new-project.md):**
- Dùng `Task()` với `subagent_type` parameter
- Parallel: multiple `Task()` calls trong cùng message
- Sequential: chờ result rồi spawn tiếp

**pd-codebase-mapper output:**
- `.planning/codebase/STRUCTURE.md` — directory tree
- `.planning/codebase/TECH_STACK.md` — tech stack
- `.planning/codebase/ENTRY_POINTS.md` — entry points
- `.planning/codebase/DEPENDENCIES.md` — dependency graph

**pd-research-synthesizer input/output:**
- Input: Đọc `.planning/codebase/` files + evidence files từ security/feature agents
- Output: `.planning/research/TECHNICAL_STRATEGY.md`

### 6. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mapper chạy trước .planning/ tồn tại | Mapper fail vì thiếu output dir | Tạo `mkdir -p .planning/codebase` trước spawn |
| buildParallelPlan() hardcoded 2 agents | Không dùng được cho Research Squad | Tạo hàm mới hoặc generic dispatch |
| plan-phase.md là GSD file (read-only?) | Không sửa được trực tiếp | Kiểm tra — nếu thuộc GSD framework thì cần approach khác |
| Research Squad chạy quá lâu trong init | Init bị chậm | Spawn background, không block init completion |

### 7. File Modification Summary

| File | Type | Change |
|------|------|--------|
| `workflows/init.md` | PD workflow | Thêm Bước 3b: mapper auto-run |
| `workflows/plan.md` | PD workflow | Thêm TECHNICAL_STRATEGY.md soft-guard |
| `bin/lib/parallel-dispatch.js` | Runtime | Thêm `buildResearchSquadPlan()` |
| GSD `plan-phase.md` | GSD workflow | Thêm strategy_path vào planner prompt |
| GSD `init` tool output | GSD init | Thêm `strategy_path` field |

---

*Research completed: 2026-03-27*
