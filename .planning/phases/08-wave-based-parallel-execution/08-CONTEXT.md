# Phase 8: Wave-Based Parallel Execution - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning
**Source:** Auto-generated (--auto mode, recommended defaults)

<domain>
## Phase Boundary

Independent tasks within a plan execute concurrently in waves, with file-conflict detection preventing two agents from modifying the same file. The existing `write-code.md` already has `--parallel` mode (Bước 1.5 + Bước 10) with basic instructions — Phase 8 upgrades this from a loose description to a robust, framework-aware system with proper shared-file detection and smart conflict handling.

</domain>

<decisions>
## Implementation Decisions

### Shared-file detection heuristics (PARA-03)
- **D-01:** Two-layer detection: (1) Static hotspot pattern list for known conflict-prone files, (2) Dynamic cross-reference of `> Files:` fields across all tasks in the same wave.
- **D-02:** Static hotspot patterns — framework-specific:
  - **Chung:** `index.ts`, `index.js` (barrel exports), `package.json`, `tsconfig.json`, `*.config.*` (vite, webpack, next, tailwind)
  - **NestJS:** `app.module.ts`, `main.ts`, `*.module.ts`
  - **Next.js:** `layout.tsx`, `middleware.ts`, `next.config.*`
  - **Flutter:** `pubspec.yaml`, `main.dart`, `routes.dart`
  - **WordPress:** `functions.php`, `style.css`
  - **Solidity:** `hardhat.config.*`, migration files
- **D-03:** Pattern list thêm vào `write-code.md` Bước 1.5 — KHÔNG tạo file mới. Dạng bảng compact trong workflow.
- **D-04:** Dynamic detection: so sánh `> Files:` của tất cả tasks ⬜ trong cùng wave → giao nhau > 0 → serialize. Nếu task thiếu `> Files:` → cảnh báo nhưng vẫn cho chạy song song.

### Conflict handling behavior (PARA-02)
- **D-05:** Pre-wave auto-serialize: khi phát hiện 2+ tasks sửa cùng file → tự động dời task sau sang wave tiếp. KHÔNG hard-stop. Hiển thị: "Task X dời sang wave N+1 (conflict: shared-file.ts)"
- **D-06:** Post-wave conflict check vẫn giữ: sau wave xong, nếu phát hiện 2 agents vô tình sửa cùng file (không dự đoán được) → DỪNG báo user. Đây là safety net, không phải flow chính.
- **D-07:** Build check sau mỗi wave: build fail → DỪNG báo task cụ thể + output lỗi. KHÔNG chạy wave tiếp khi wave trước fail.
- **D-08:** Deadlock detection: nếu tất cả tasks còn lại trong wave đều conflict lẫn nhau → chuyển sang sequential (tuần tự) thay vì dừng.

### Wave plan display UX
- **D-09:** Hiển thị wave plan dạng bảng compact trước khi chạy:
  ```
  Wave 1: Task 1 (simple/haiku), Task 3 (standard/sonnet) — 2 song song
  Wave 2: Task 2 (complex/opus) — phụ thuộc Task 1
  Conflict: Task 4 dời W1→W2 (shared: app.module.ts)
  ```
- **D-10:** Hỏi xác nhận 1 lần trước wave đầu tiên. Sau đó chạy liên tục không hỏi lại.

### Agent context per spawn
- **D-11:** Mỗi agent nhận: task detail từ TASKS.md + relevant PLAN.md sections + applicable rules + CONTEXT.md path. KHÔNG dump toàn bộ PLAN.md — chỉ sections liên quan đến task.
- **D-12:** Agent instructions: Bước 2→3→4→5 (research → code → lint/build → test). KHÔNG report, KHÔNG commit, KHÔNG cập nhật TASKS.md — orchestrator làm sau wave.
- **D-13:** Effort→model routing tái sử dụng Phase 5: `simple→haiku`, `standard→sonnet`, `complex→opus`. Mặc định `sonnet` nếu không có effort field.

### Plan.md enhancements for parallel quality
- **D-14:** Thêm hướng dẫn vào `plan.md` workflow: planner PHẢI ghi đầy đủ `> Files:` field cho mọi task khi plan có >= 3 tasks. Thiếu `> Files:` → parallel mode không thể phân tích conflict → kém hiệu quả.
- **D-15:** Planner ghi `> Files:` dựa trên Ghi chú kỹ thuật + mô tả task. Không cần chính xác 100% — heuristic đủ cho conflict detection.

### Claude's Discretion
- Exact topological sort implementation (đã có hướng dẫn trong Bước 1.5)
- Cách Grep kiểm tra import chung (bổ sung cho `> Files:` cross-reference)
- Format chính xác wave summary report sau khi hết waves
- Cách handle monorepo với multiple packages
- Agent timeout/retry strategy
- Testing approach cho parallel scenarios

</decisions>

<specifics>
## Specific Ideas

- Bước 1.5 đã có skeleton: dependency graph + wave grouping + "Grep kiểm tra import chung" → mở rộng với hotspot patterns + `> Files:` cross-reference
- Bước 10 đã có parallel execution flow → cải thiện conflict handling (auto-serialize thay DỪNG)
- `templates/tasks.md` đã có `> Files:` field và dependency types (code/design/file) → parallel mode exploit thông tin này
- `plan.md` Nguyên tắc 10 đã phân biệt code/design/file dependency → đủ info cho topological sort
- Phase 5 effort→model routing đã hoạt động → parallel mode tái sử dụng trực tiếp

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Parallel execution (sẽ mở rộng)
- `workflows/write-code.md` §Bước 1.5 — Wave analysis instructions hiện tại, sẽ enhance
- `workflows/write-code.md` §Bước 10 — Parallel execution flow hiện tại, sẽ improve conflict handling
- `commands/pd/write-code.md` — Skill command definition, `--parallel` flag

### Dependency and file tracking
- `templates/tasks.md` — TASKS.md template với `> Files:`, `Phụ thuộc`, dependency types table
- `workflows/plan.md` §Nguyên tắc 10 — Dependency classification rules (code/design/file)
- `references/conventions.md` — Task metadata conventions

### Effort routing (tái sử dụng)
- `workflows/write-code.md` §Bước 10 — Agent model selection per effort level
- `05-CONTEXT.md` — Phase 5 effort routing decisions

### Test infrastructure
- `test/smoke-integrity.test.js` — Existing smoke tests, sẽ thêm parallel-related tests
- `test/smoke-utils.test.js` — Utils tests (nếu cần utility functions)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `write-code.md` Bước 1.5: Wave analysis skeleton — dependency graph, topological sort, basic shared-file check
- `write-code.md` Bước 10: Parallel agent spawning flow — Agent tool usage, wave iteration, result collection
- `templates/tasks.md` `> Files:` field: Task-level file listing — key input for conflict detection
- `plan.md` dependency classification: code/design/file types — drives topological sort

### Established Patterns
- AI-driven analysis (không utility code): project philosophy — instructions trong workflow, không tạo scripts
- `> Files:` metadata field: planner ghi dự kiến, write-code đọc — cầu nối plan→execute
- Effort→model mapping: `simple→haiku`, `standard→sonnet`, `complex→opus` — Phase 5
- Agent tool spawning: `model: {resolved_model}` parameter — existing pattern

### Integration Points
- `workflows/write-code.md` §Bước 1.5 — Mở rộng shared-file detection + auto-serialize logic
- `workflows/write-code.md` §Bước 10 — Cải thiện conflict handling, wave summary report
- `workflows/plan.md` — Thêm hướng dẫn `> Files:` bắt buộc cho plans >= 3 tasks
- `test/smoke-integrity.test.js` — Thêm tests kiểm tra hotspot patterns + parallel instructions presence

</code_context>

<deferred>
## Deferred Ideas

- Agent Teams API integration (PARA-04 v2) — evaluate nếu API ổn định hơn
- Optimistic parallel execution with rollback (PARA-05 v2) — phức tạp, cần conflict resolution engine
- Wave execution metrics/telemetry — đếm thời gian tiết kiệm per wave
- Cross-plan parallelism — chạy nhiều plans song song (không chỉ tasks trong 1 plan)

</deferred>

---

*Phase: 08-wave-based-parallel-execution*
*Context gathered: 2026-03-22 via --auto mode*
