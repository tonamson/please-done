# Project Research Summary

**Project:** please-done — v2.1 Detective Orchestrator
**Domain:** Điều phối đa Agent cho debug workflow trong CLI AI coding framework
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

v2.1 nâng cấp workflow fix-bug từ mô hình đơn-agent tuần tự (419 dòng, 1 model sonnet) sang hệ thống điều phối 5 agent chuyên biệt theo pattern "hub-and-spoke": orchestrator (main conversation) dispatch các agent theo thứ tự phụ thuộc, mỗi agent chạy độc lập và giao tiếp qua evidence files markdown thay vì IPC trực tiếp. Toàn bộ xây dựng bằng native Claude Code subagent infrastructure — không thêm runtime dependency nào, bảo toàn constraint "No Build Step, pure Node.js" của dự án. Codebase hiện tại có 601 tests và 48 converter snapshots phải tiếp tục pass sau khi triển khai.

Hướng tiếp cận được khuyến nghị: dùng Claude Code native `.claude/agents/pd-*.md` với YAML frontmatter để định nghĩa tier mapping (haiku/sonnet/opus), evidence files `.planning/debug/evidence_*.md` làm communication channel, và tái sử dụng hoàn toàn 5 pure function modules từ v1.5 (repro-test-generator, regression-analyzer, debug-cleanup, logic-sync, truths-parser). Orchestrator là main conversation — không phải một agent nào trong số 5 agent. Agent Teams experimental bị loại bỏ hoàn toàn vì status không ổn định và chi phí token cao hơn không cần thiết.

Rủi ro chính gồm 3 nhóm: (1) context window bùng nổ khi 5 agent trả kết quả về parent — giảm thiểu bằng maxTurns nghiêm ngặt và summary protocol ngắn dưới 200 token; (2) backward compatibility — 601 tests và 48 converter snapshots phải pass, và 4 platform còn lại cần converter pipeline mở rộng để xử lý agent files mới; (3) giới hạn kỹ thuật không thể thay đổi của Claude Code (subagent không thể spawn subagent) phải được quyết định kiến trúc ngay từ Phase 1 trước khi viết bất kỳ code nào.

## Key Findings

### Recommended Stack

v2.1 không thêm bất kỳ runtime dependency nào. Toàn bộ infrastructure tận dụng Claude Code native subagent system. 5 agent definition files (`.claude/agents/pd-*.md`) với YAML frontmatter là điểm cộng thêm duy nhất ở tầng cấu hình. 3 JS module mới (`bug-memory.js`, `evidence-parser.js`, `resource-config.js`) và 2 module mở rộng (`repro-test-generator.js`, `regression-analyzer.js`) theo đúng pattern pure function đã validated từ v1.0–v1.5.

**Core technologies:**
- **Claude Code Subagents (v2.1.33+):** agent spawning, model routing, context isolation — CORE của toàn bộ orchestration, không cần viết logic spawning bằng Node.js
- **YAML frontmatter trong agent files:** tier mapping (haiku/sonnet/opus), maxTurns, memory, background mode — cấu hình khai báo, dễ test
- **Markdown evidence files:** communication channel giữa agents — AI native, git-trackable, regex-parseable, không cần parser riêng
- **JSONL bug history (`.planning/bugs/history.jsonl`):** append-only, O(1) write, grep-able — thay thế cho SQLite (binary dependency) và JSON array (O(n) append)
- **Node.js built-in `node:test`, `fs`, `path`:** test runner và file I/O — không dependency ngoài

**Tier routing (confirmed từ tài liệu chính thức Claude Code):**

| Tier | Model | Agent | Rationale |
|------|-------|-------|-----------|
| Scout | haiku | Janitor, DocSpec | Lọc text + tra cứu docs — không cần suy luận phức tạp, tiết kiệm token |
| Builder | sonnet | Detective, Repro | Phân tích code + viết test — cần khả năng lập trình |
| Architect | opus | Fix Architect | Tổng hợp evidence, thiết kế fix plan — cần suy luận sâu |

### Expected Features

**Must have (table stakes — MVP v2.1):**
- **A-TS1: Tier-to-Model mapping** — update frontmatter 5 agent files, chi phí thấp nhất, làm đầu tiên, không phụ thuộc gì
- **B-TS2: Evidence Format chuẩn 3 outcomes** — nền tảng của mọi orchestration logic (`ROOT CAUSE FOUND` / `CHECKPOINT REACHED` / `INVESTIGATION INCONCLUSIVE`), thiếu thì orchestrator không parse được kết quả agent
- **B-TS1: Resume UI đánh số** — UX thiết yếu cho Bước 1, scan SESSION files hiện danh sách đánh số để user chọn
- **B-TS3: ROOT CAUSE → 3 lựa chọn** — output chính của orchestrator (Sửa ngay / Lên kế hoạch / Tự sửa)
- **B-TS4: CHECKPOINT → hỏi user** — workflow tương tác, agent ghi `## CHECKPOINT REACHED` + câu hỏi cụ thể
- **C-TS1: Knowledge Recall trong Janitor** — grep bug cũ từ `.planning/bugs/`, ghi vào `evidence_janitor.md` mục `## RELATED HISTORICAL BUGS`
- **A-TS3: Heavy Lock cho FastCode** — tránh 2 FastCode indexing cùng lúc, tracking trong SESSION file
- **D-TS1–5: Workflow Execution Loop 5 bước** — core của milestone
- **D-D2: Backward-compatible single-agent mode** — fallback về v1.5 workflow khi agent không khả dụng hoặc user chọn `--single`

**Should have (differentiators, thêm sau khi core ổn định v2.1.x):**
- **B-TS5: Elimination Log + D-D1: Loop-back thông minh** — khi INCONCLUSIVE, quay Bước 2 với thông tin mới (tối đa 3 vòng)
- **C-TS2: Regression Alert + C-TS3: Double-Check** — cảnh báo khi file lỗi trùng với bug cũ
- **B-D1: Continuation Agent** — khi user báo mất context thường xuyên
- **A-TS4: Hạ cấp thông minh** — fallback sequential khi parallel spawn timeout/lỗi

**Defer (v2.2+):**
- **C-D1: Bug pattern INDEX.md** — khi số lượng bugs > 10
- **C-D2: Persistent agent memory cross-session** — cần kinh nghiệm thực tế + memory schema design cẩn thận
- **A-D1: Auto-detect resource constraint** — phức tạp, lợi ích thấp
- **A-D2: Cost estimation per investigation** — nice-to-have, không urgent

### Architecture Approach

Kiến trúc hub-and-spoke với main conversation là orchestrator duy nhất có quyền spawn subagents — đây là giới hạn kỹ thuật không thể thay đổi của Claude Code (subagent không thể spawn subagent khác). Luồng chính là sequential chaining qua 5 phase, với 1 điểm parallel duy nhất ở Phase 2 (Detective + DocSpec chạy đồng thời vì cả hai chỉ đọc `evidence_janitor.md`, không ghi cùng file). Phase 5 (sửa code, commit, xác nhận) do orchestrator thực hiện trực tiếp, không spawn agent.

**Major components:**
1. **`commands/pd/fix-bug.md` (sửa đổi)** — entry point, cập nhật model: opus, thêm Agent tool, trỏ vào orchestrator workflow mới
2. **`workflows/fix-bug-orchestrator.md` (mới)** — 5-phase orchestration logic, spawn instructions cho từng agent
3. **`.claude/agents/pd-*.md` (di chuyển + cập nhật)** — 5 agent files từ `commands/pd/agents/` sang `.claude/agents/` với YAML frontmatter chuẩn
4. **`.planning/debug/evidence_*.md` (5 files mới)** — communication channel, strict ownership: 1 agent = 1 file riêng, SESSION chỉ do main workflow ghi
5. **`bin/lib/` (modules mới + mở rộng)** — bug-memory.js, evidence-parser.js, resource-config.js (mới); repro-test-generator.js, regression-analyzer.js (mở rộng)
6. **`workflows/fix-bug.md` (v1.5, giữ nguyên)** — fallback khi subagents không khả dụng

**Key patterns:**
- **Evidence-as-Communication:** agents không nói chuyện trực tiếp với nhau, giao tiếp qua file — tránh inter-agent messaging overhead
- **Graceful Degradation:** mọi bước có fallback — agent lỗi thì orchestrator tự làm theo v1.5 logic
- **Pure Function Libraries:** logic phức tạp ở `bin/lib/*.js`, agents gọi qua Bash tool (pattern đã chứng minh từ v1.5)
- **Orchestrator-as-Executor:** Phase 5 (sửa code + commit) do orchestrator thực hiện trực tiếp, không spawn thêm agent

### Critical Pitfalls

1. **Context window bùng nổ — Evidence Flood** — 5 agent trả kết quả về parent có thể chiếm 50K+ tokens. Ngăn bằng: maxTurns nghiêm ngặt (Janitor:5, DocSpec:5, Detective:10, Repro:8, Architect:12), mỗi agent chỉ trả summary < 200 token, chi tiết ghi vào evidence file, Architect đọc evidence files trực tiếp không phụ thuộc summary.

2. **Subagent không thể spawn subagent — No Nesting** — giới hạn kỹ thuật tuyệt đối của Claude Code. Fix Architect KHÔNG được là orchestrator. Main conversation = orchestrator duy nhất. Kiểm tra sớm: không agent nào có `tools: Agent(...)` trong frontmatter.

3. **Race condition ghi file evidence** — khi Detective + DocSpec chạy song song cùng ghi vào `.planning/debug/`. Ngăn bằng: strict file ownership (1 agent = 1 file riêng), spawn Janitor trước → đợi HOÀN THÀNH → mới spawn Detective + DocSpec, SESSION file chỉ do main workflow ghi.

4. **v1.5 pure functions bị bypass** — agents tự viết lại logic thay vì gọi module có sẵn. Ngăn bằng: agent prompts phải explicitly reference `generateReproTest()`, `analyzeFromCallChain()`, `scanDebugMarkers()`, `runLogicSync()`. Thêm integration test kiểm tra các module được gọi.

5. **Platform transpilation thiếu agent files** — converter `base.js` chỉ scan `commands/pd/*.md`, không scan subdirectory `agents/`. Ngăn bằng: mở rộng converter pipeline, thêm 20 snapshot tests mới (5 agents × 4 platforms), tổng snapshot từ 48 → 68.

## Implications for Roadmap

Dựa trên nghiên cứu, đề xuất cấu trúc 4 phase theo thứ tự phụ thuộc kỹ thuật:

### Phase 1: Agent Infrastructure & Resource Orchestration

**Rationale:** Tất cả phases sau phụ thuộc vào agent configs và tier routing. Đây là điều kiện tiên quyết kỹ thuật — không thể test dispatch agent nếu chưa có agent files ở đúng vị trí (`.claude/agents/`). Pitfall 2 (No Nesting) và Pitfall 5 (Tier Routing Sai) phải được quyết định kiến trúc ở đây trước khi viết bất kỳ code nào khác. Nếu sai ở đây sẽ lan truyền đến mọi phase.

**Delivers:** 5 agent files trong `.claude/agents/` với YAML frontmatter đầy đủ, `bin/lib/resource-config.js` với tier mapping và downgrade rules, skill file `commands/pd/fix-bug.md` cập nhật model/tools/workflow reference

**Addresses:** A-TS1 (Tier Mapping), A-TS3 (Heavy Lock), D-D2 (Backward compat check logic)

**Avoids:** Pitfall 2 (Nesting constraint — kiến trúc hub-and-spoke), Pitfall 5 (Model routing sai — explicit `model:` trong frontmatter)

### Phase 2: Detective Protocols & Evidence System

**Rationale:** Evidence format là nền tảng của mọi orchestration logic — nếu agent ghi sai format, Architect không parse được và cả workflow sụp đổ. Phase này phải hoàn thành trước khi viết workflow orchestrator vì workflow phụ thuộc vào evidence protocol để phân loại kết quả agent (ROOT CAUSE / CHECKPOINT / INCONCLUSIVE). Pitfall 3 (Race condition) và Pitfall 6 (Evidence format không nhất quán) được giải quyết ở đây.

**Delivers:** Evidence format chuẩn 3 outcomes với validation function (`validateEvidence()` pure function), `bin/lib/evidence-protocol.js`, `bin/lib/session-manager.js`, `bin/lib/bug-history.js`, Resume UI đánh số trong Bước 1 của workflow

**Addresses:** B-TS1 (Resume UI), B-TS2 (Evidence Format), B-TS4 (CHECKPOINT), B-TS5 (Elimination Log), C-TS1 (Knowledge Recall)

**Uses:** JSONL format cho bug history, markdown evidence files, strict file ownership rules

**Implements:** Evidence-as-Communication pattern, 1 file per agent, SESSION chỉ do main workflow ghi

### Phase 3: Project Memory & Regression Detection

**Rationale:** Memory và regression detection phụ thuộc vào Phase 2 (cần evidence format chuẩn và bug history schema). Có thể overlap một phần với Phase 2 vì `bug-memory.js` độc lập với `evidence-protocol.js`, nhưng C-TS2 (Regression Alert) cần C-TS1 (Knowledge Recall) từ Phase 2. Phase này không blocking Phase 4 nhưng nên hoàn thành trước để integration test đầy đủ trước khi wire workflow.

**Delivers:** `bin/lib/bug-memory.js` với 3 pure functions (formatBugEntry, searchBugHistory, detectRegression), regression alert trong evidence_janitor.md, double-check logic trong Fix Architect prompt

**Addresses:** C-TS1 (Knowledge Recall hoàn chỉnh), C-TS2 (Regression Alert), C-TS3 (Double-Check)

**Avoids:** Pitfall 4 (v1.5 modules bị bypass — regression-analyzer.js được tái sử dụng trực tiếp, không viết lại)

### Phase 4: Orchestrator Workflow & Platform Integration

**Rationale:** Phase tích hợp cuối cùng — kết nối tất cả thành phần. Phải làm sau cùng vì workflow cần agent files (Phase 1), evidence protocol (Phase 2), và memory modules (Phase 3). Đây cũng là phase cập nhật converter pipeline — snapshot tests từ 48 → 68 — và verify toàn bộ 601 tests vẫn pass.

**Delivers:** `workflows/fix-bug-orchestrator.md` (5-phase với spawn instructions), fallback logic về v1.5, converter pipeline mở rộng xử lý agent files, 20 snapshot tests mới (5 agents × 4 platforms)

**Addresses:** D-TS1–5 (Workflow Loop đầy đủ), D-D2 (Backward compat), B-TS3 (3 lựa chọn sau ROOT CAUSE)

**Avoids:** Pitfall 1 (Context flood — maxTurns enforcement, summary protocol), Pitfall 4 (v1.5 module calls verification), Pitfall 7 (Platform transpilation)

### Phase Ordering Rationale

- **Phase 1 trước** vì agent files phải tồn tại và test được trước khi có thể verify dispatch — không có điểm khởi đầu nào khác
- **Phase 2 trước Phase 4** vì orchestrator workflow phụ thuộc vào evidence protocol để phân loại kết quả — nếu đảo ngược phải viết lại workflow
- **Phase 3 có thể overlap Phase 2** vì bug-memory.js độc lập với evidence-protocol.js, nhưng nên bắt đầu sau C-TS1 có data
- **Phase 4 luôn cuối** vì là integration phase cần tất cả thành phần từ Phase 1–3 đã ổn định
- **Thứ tự này tránh rework:** làm workflow (Phase 4) trước evidence protocol (Phase 2) sẽ phải viết lại workflow khi format thay đổi

### Research Flags

Phases cần deeper research trong planning:
- **Phase 4 (Platform Integration):** Mỗi platform (Codex, Gemini, OpenCode, Copilot) có cách xử lý agent concept khác nhau — cần research converter mapping strategy trước khi implement 20 snapshot tests mới
- **Phase 1 (Version Guard):** `memory: project` và `effort:` fields yêu cầu Claude Code v2.1.33+ — cần xác minh version constraint và guard logic khi chạy trên version cũ hơn

Phases với standard patterns (có thể skip research-phase):
- **Phase 2 (Evidence Protocol):** Markdown parsing + file ownership là well-documented patterns trong codebase hiện tại, không có ambiguity
- **Phase 3 (Bug Memory):** Pure function design với JSONL là established pattern — tương tự các modules v1.5 đã tested và validated

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Toàn bộ từ tài liệu chính thức Claude Code v2.1.33+ + phân tích codebase thực tế. Zero speculation về dependencies. |
| Features | HIGH | Từ tài liệu chính thức Claude Code + existing v1.5 workflow + dependency diagram đầy đủ. MVP scope rõ ràng với 9 features thiết yếu. |
| Architecture | HIGH | Phân tích toàn bộ codebase v1.5 + tài liệu Claude Code sub-agents. Giới hạn "no nesting" được confirm từ tài liệu chính thức, không phải inferred. Hub-and-spoke là pattern đúng duy nhất. |
| Pitfalls | HIGH | 7 critical pitfalls với warning signs, recovery cost, và phase mapping cụ thể. Dựa trên tài liệu chính thức + nghiên cứu học thuật (42% specification failures, 37% coordination failures) + bug thực tế đã documented. |

**Overall confidence:** HIGH

### Gaps to Address

- **Cross-platform agent model mapping:** Codex, Gemini, OpenCode chưa được verify cụ thể về subagent format. Cần research trước Phase 4 để xác định converter strategy cho 20 snapshot tests mới.
- **Token cost thực tế:** Ước tính $0.50–3.00/session vs $0.05–0.10 hiện tại chưa được test thực tế. Cần monitor sau khi deploy và có thể điều chỉnh maxTurns nếu chi phí quá cao.
- **Background agent permission model:** DocSpec chạy background với `background: true` cần Write permission pre-approved — cần verify behavior cụ thể trên Claude Code v2.1.33 với permission mode.
- **Claude Code version guard:** `memory: project` yêu cầu v2.1.33+ — cần implement graceful fallback khi version constraint không được đáp ứng thay vì crash.

## Sources

### Primary (HIGH confidence)
- [Claude Code Sub-Agents Documentation](https://code.claude.com/docs/en/sub-agents) — frontmatter fields, model routing, tool restriction, memory, hooks, nesting limits
- [Claude Code Model Configuration](https://code.claude.com/docs/en/model-config) — model aliases (haiku/sonnet/opus), effort levels, env vars
- [Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams) — experimental status, limitations (căn cứ quyết định KHÔNG dùng)
- [Claude Code Memory Documentation](https://code.claude.com/docs/en/memory) — agent memory scopes (user/project/local), MEMORY.md auto-curation
- Codebase analysis: `commands/pd/agents/*.md`, `workflows/fix-bug.md`, `bin/lib/*.js`, `bin/lib/converters/base.js`, `commands/pd/fix-bug.md`
- `.planning/PROJECT.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md`, `.planning/codebase/CONVENTIONS.md`

### Secondary (MEDIUM confidence)
- [GitHub Blog: Multi-agent workflows often fail](https://github.blog/ai-and-ml/generative-ai/multi-agent-workflows-often-fail-heres-how-to-engineer-ones-that-dont/) — engineering patterns chống failure
- [arxiv: Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/pdf/2503.13657) — 42% specification failures, 37% coordination failures
- [DoltHub: Multi-Agent Persistence](https://www.dolthub.com/blog/2026-03-13-multi-agent-persistence/) — file-based persistence race conditions
- [DEV.to: Multi-Model Routing Pattern](https://dev.to/askpatrick/the-multi-model-routing-pattern-how-to-cut-ai-agent-costs-by-78-1631) — tier routing chi phí thực tế
- [Claude Code Sub-Agent patterns](https://claudefa.st/blog/guide/agents/sub-agent-best-practices) — best practices

### Tertiary (tham khảo)
- [OpenClaw issue #21382](https://github.com/openclaw/openclaw/issues/21382) — race condition bug thực tế: session memory markdown not flushed
- [Galileo: Why Multi-Agent AI Systems Fail](https://galileo.ai/blog/multi-agent-ai-failures-prevention) — failure taxonomy
- [RocketEdge: AI Agent Cost Control](https://rocketedge.com/2026/03/15/your-ai-agent-bill-is-30x-higher-than-it-needs-to-be-the-6-tier-fix/) — chi phí thực tế

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
