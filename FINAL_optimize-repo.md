# Tối ưu Toàn bộ Repo Please-Done

Bản kế hoạch optimize tổng thể — thực hiện trong 1 đợt duy nhất. Bao gồm: tái cấu trúc Agent, phân tầng Model, giảm file trùng lặp, tối ưu token, và DRY hoá runtime code.

> **Hiện trạng repo**: 11 agents trong registry (8 agent files tại `commands/pd/agents/` + 7 agent files tại `.claude/agents/`), 14 commands + 13 workflows (commands là router), 16 reference specs (gồm 2 YAML từ 4_AUDIT), 12 templates (gồm `security-fix-phase.md` từ 4_AUDIT), 7 rules (general + 6 framework), 10 converter+installer files, 29 runtime libs (`bin/lib/` gồm `session-delta.js`, `smart-selection.js`, `gadget-chain.js` từ 4_AUDIT), 5 bin scripts, 34 test files, 4 eval files, 14 docs, FastCode subsystem (Python). Tổng ~100+ markdown, ~70+ JS, ~15 Python.

---

## ⚠️ Audit Review — Rủi ro gãy Workflow

Kết quả kiểm tra cross-reference toàn bộ repo trước khi thực thi plan:

### Phát hiện quan trọng

1. **Commands ĐÃ LÀ router** — Commands (`commands/pd/*.md`) KHÔNG trùng nội dung với workflows. Mỗi command chỉ chứa: YAML frontmatter + guards + 1 dòng `Thực thi @workflows/xxx.md từ đầu đến cuối`. **→ Mục E1 trước đó SAI, đã sửa.**

2. **Guard files mỗi file chỉ 1 dòng** — 4 guard files (`guard-context.md`, `guard-context7.md`, `guard-valid-path.md`, `guard-fastcode.md`) mỗi file chỉ có **1 dòng checklist**. Gộp chúng tiết kiệm KHÔNG ĐÁNG KỂ (~4 dòng) mà **phá vỡ 48 references** trên 12 command files. **→ Mục E2 gộp guards đã BỎ.**

3. **Converter base.js đã là factory** — 4 platform converters đã delegate toàn bộ qua `baseConvert()` với config object. Mỗi converter chỉ override `{ runtime, pathReplace, toolMap, buildFrontmatter }`. **→ Mục F1 không cần factory mới, chỉ cần review.**

4. **Installer KHÁC NHAU thật sự** — Claude installer cài Python/FastCode local, Copilot chỉ copy+convert skills. Không thể gộp base class. **→ Mục F2 đã sửa.**

5. **`getAdaptiveParallelLimit()` đã implement nhưng KHÔNG AI dùng** — `parallel-dispatch.js` hardcode spawn 2 agent, không gọi hàm adaptive. **→ Thêm mục C tích hợp thực tế.**

6. **`fix-bug-v1.5.md` là fallback** khi thiếu 5 agent files (Janitor, Detective, DocSpec, Repro, Architect trong `.claude/agents/`) → KHÔNG được xóa/đổi tên. **→ Ghi rõ trong A4.**

7. **Complete-milestone KHÔNG có security gate** — `workflows/complete-milestone.md` Bước 3 chỉ check bugs chung, KHÔNG bắt buộc security scan. **→ Sẽ được fix bởi milestone `4_AUDIT_MILESTONE.md` (chạy trước FINAL).**

8. **`pd-codebase-mapper` trùng GSD `gsd-map-codebase`** — GSD skill đã có 4 parallel mapper agents viết 7 docs vào `.planning/codebase/`. Tạo thêm PD mapper = duplicate. **→ Bỏ khỏi A2, D1 dùng GSD skill có sẵn.**

9. **`pd-evidence-collector` + `pd-fact-checker` bị bỏ sót** — 2 agents này có trong `AGENT_REGISTRY` (`resource-config.js`) + smoke tests nhưng plan A4 không nhắc. **→ Đã thêm vào A4 migration table.**

10. **D2 `TECHNICAL_STRATEGY.md` guard phụ thuộc milestone 3** — File này do `3_PROJECT_RESEARCHER.md` tạo ra. Nếu milestone 3 chưa ship mà dùng hard-block → gãy tất cả `/pd:plan`. **→ Đổi sang soft-guard (warning).**

---

## A. Tái cấu trúc Agent (Agent Reform)

### A1. Phân tầng Model (Tier Strategy)

Thay tên model cứng bằng 3 cấp bậc, tương thích mọi nền tảng:

| Tier          | Vai trò                     | Đặc điểm                | Ví dụ Model                                  |
| ------------- | --------------------------- | ----------------------- | -------------------------------------------- |
| **Scout**     | Mapper, Security, Feature   | Nhanh, Rẻ, Context rộng | Haiku 4.5, Gemini 3 Flash, GPT-5.3 Small     |
| **Builder**   | Executor, Repro, Regression | Cân bằng, Code giỏi     | Sonnet 4.6, Composer 2, GPT-5.4              |
| **Architect** | Synthesizer, Planner        | Thinking, Suy luận cao  | Opus 4.6, Gemini 3.1 Pro, GPT-5.4 (Thinking) |

### A2. Agent Registry (Thư viện Agent mới)

Vị trí: `commands/pd/agents/`. Phân công rõ ràng theo Tier:

| Agent                        | Tier          | Skill gọi                       | Ghi chú                                                                 |
| ---------------------------- | ------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `pd-security-researcher.md`  | **Scout**     | `research`, `plan`              | Mới — bổ sung khả năng research security chuyên sâu                     |
| `pd-feature-analyst.md`      | **Scout**     | `research`, `plan`              | Mới — phân tích tính năng                                               |
| `pd-research-synthesizer.md` | **Architect** | `research`                      | Mới — tổng hợp research từ nhiều agents                                 |
| `pd-planner.md`              | **Architect** | `plan`                          | Mới — phân biệt rõ với GSD `gsd-planner` (PD planner = plan cho PD phases) |
| `pd-regression-analyzer.md`  | **Builder**   | `fix-bug`                       | Mới — nâng `regression-analyzer.js` thành agent có dispatch             |

> **Đã bỏ khỏi registry mới:**
> - ~~`pd-codebase-mapper`~~ — **Trùng chức năng** với GSD skill `gsd-map-codebase` (đã có 4 parallel mapper agents viết 7 docs vào `.planning/codebase/`). Thay vì tạo agent mới, D1 sẽ tích hợp gọi `gsd-map-codebase` trực tiếp.
> - ~~`pd-repro-generator`~~ — **Đã tồn tại** dưới tên `pd-repro-engineer` (Builder tier), đang hoạt động tốt trong fix-bug flow. Đổi tên không cần thiết.

### A3. Security Agent — ✅ ĐÃ LÀM TRONG 4_AUDIT

> **Đã được xử lý đầy đủ bởi milestone `4_AUDIT_MILESTONE.md`.**
>
> Milestone 4 ship kiến trúc **1 template + dispatch** ngay từ đầu:
>
> - `pd-sec-scanner.md` — 1 template agent nhận `--category` parameter
> - `config/security-rules.yaml` — rules tập trung cho 13 OWASP category
> - `pd-sec-reporter.md` — reporter tổng hợp
> - Tổng: **3 files** (không phải 13 file rồi gộp sau)
> - Pipeline: FastCode MCP discovery → AI analysis → evidence
> - Function-Level Checklist, security gate, smart selection, gadget chain — tất cả đã trong 4_AUDIT
>
> **KHÔNG cần optimize gì thêm ở đây. A3 cũ (gộp 13→3) đã được thực hiện ngay trong 4_AUDIT.**

### A4. Agent Migration (Đối chiếu Cũ → Mới)

Repo có 11 agents trong registry, 8 agent files tại `commands/pd/agents/`, 7 agent files tại `.claude/agents/`. Plan định nghĩa 5 agent mới. Bảng đối chiếu:

| Agent (giữ/gộp/tạo mới)                                                                                 | Xử lý                                                            |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `pd-bug-janitor` + `pd-code-detective` + `pd-doc-specialist` + `pd-fix-architect` + `pd-repro-engineer` | ✅ Giữ nguyên — đã hoạt động tốt trong flow fix-bug              |
| `pd-evidence-collector` + `pd-fact-checker`                                                              | ✅ Giữ nguyên — có trong registry + smoke tests, dùng trong research flow |
| `pd-sec-scanner` + `pd-sec-reporter` + `pd-sec-fixer`                                                   | ✅ Đã tạo bởi 4_AUDIT (scanner template + reporter + fixer)      |
| 5 agents mới (researcher, analyst, synthesizer, planner, regression)                                    | Tạo bổ sung theo registry A2                                    |

- [ ] Đảm bảo backward compatibility — agent cũ vẫn chạy được trong quá trình chuyển đổi
- [ ] Mỗi agent mới phải có test trong `test/smoke-agent-files.test.js`
- [ ] Thêm `pd-regression-analyzer` vào `AGENT_REGISTRY` trong `resource-config.js`
- **⚠️ KHÔNG XÓA/ĐỔI TÊN `fix-bug-v1.5.md`** — đây là fallback workflow khi thiếu 5 agent files của fix-bug v2.1. Xóa/đổi tên = fix-bug mất fallback → workflow crash nếu thiếu agent.

---

## B. Platform-Aware Mapping (Nhận diện Nền tảng)

### B1. Tự động Mapping Tier → Model

Skill `init` xác định nền tảng đang dùng để nạp cấu hình phù hợp:

| Nền tảng              | Scout              | Builder             | Architect            |
| --------------------- | ------------------ | ------------------- | -------------------- |
| **Claude Code (CLI)** | `claude-4-5-haiku` | `claude-4-6-sonnet` | `claude-4-6-opus`    |
| **Gemini CLI**        | `gemini-3-flash`   | _(fallback Scout)_  | `gemini-3.1-pro`     |
| **Cursor/Windsurf**   | `cursor-small`     | `claude-3-5-sonnet` | _(fallback Builder)_ |
| **Copilot (VS Code)** | _(inherit)_        | _(inherit)_         | _(inherit)_          |

### B2. Fallback

Nếu nền tảng không hỗ trợ Tier cao hơn → tự động hạ cấp xuống model cao nhất hiện có → workflow không bao giờ đứt gãy.

### B3. ⚠️ Bridge GSD `model_profile` vs PD `TIER_MAP`

Hiện tại có **2 hệ thống model config song song, không talk to nhau**:

| Hệ thống | Config | Giá trị | Dùng bởi |
|---|---|---|---|
| GSD | `.planning/config.json` → `model_profile` | `quality` / `balanced` / `budget` / `inherit` | GSD skills (`gsd-set-profile`, `gsd-settings`) |
| PD | `resource-config.js` → `TIER_MAP` | `scout` / `builder` / `architect` | PD agent dispatch (`parallel-dispatch.js`) |

- [ ] **Bridge 2 systems**: `resource-config.js` đọc `.planning/config.json` → map GSD profile sang PD tier behavior:
  - `quality` → TIER_MAP giữ nguyên (haiku/sonnet/opus)
  - `balanced` → TIER_MAP hạ 1 bậc (scout dùng cho cả builder tasks)
  - `budget` → tất cả dùng scout tier
  - `inherit` → giữ nguyên platform default
- [ ] **Hoặc** chọn 1 hệ thống duy nhất (ưu tiên GSD vì đã có UI/CLI)

---

## C. Song song & Bàn giao (Parallel + Handoff)

### C1. Giới hạn Concurrency (Resource Guard)

Song song không phải càng nhiều càng tốt — phải điều tiết theo tài nguyên thực:

| Thông số        | Giá trị | Lý do                                          |
| --------------- | ------- | ---------------------------------------------- |
| **Max workers** | **4**   | Trần cứng — không bao giờ vượt, kể cả máy mạnh |
| **Min workers** | **2**   | Sàn cứng — dưới 2 thì chạy tuần tự cho ổn      |
| **Default**     | **3**   | Cân bằng giữa tốc độ và ổn định                |

- [x] **Adaptive Throttle (Script, không dùng AI)**: Đã implement hàm `getAdaptiveParallelLimit()` trong `bin/lib/resource-config.js`. Dùng `os.cpus()` và `os.freemem()` — chạy tức thì, không tốn token AI. Trả về `{ workers, reason, cpu, freeMemGB }` để orchestrator dùng luôn.
- [ ] **⚠️ Tích hợp thực tế**: `parallel-dispatch.js` hiện HARDCODE spawn 2 agents (Detective + DocSpec), chưa gọi `getAdaptiveParallelLimit()` hay `isHeavyAgent()`. Cần:
  - Sửa `parallel-dispatch.js` gọi `getAdaptiveParallelLimit()` thay vì hardcode
  - Wire `isHeavyAgent()` check trước khi spawn (agent nặng → giảm 1 worker)
  - Đảm bảo `PARALLEL_MIN=2` và `PARALLEL_MAX=4` được enforce
- [ ] **Backpressure**: Nếu 1 worker bị timeout (> 120s) → không spawn thêm, chờ worker hiện tại xong rồi mới tiếp. (Logic `shouldDegrade()` đã có sẵn trong `resource-config.js`)
- [ ] **Graceful Degradation**: Nếu phát hiện hệ thống quá tải (load average > CPU count) → tự động giảm 1 worker, log cảnh báo.

### C2. Handoff & State

- [ ] **Unified Handoff**: Mọi kết quả nộp về định dạng Markdown chuẩn trong `.planning/research/raw/`
- [ ] **State-First**: Agent luôn đọc `STATE.md` trước — không mất bối cảnh khi chuyển model
- [ ] **Audit Citations**: Thợ buộc dẫn chứng link/file → Sếp kiểm tra chéo, tránh ảo giác

---

## D. Skill-Agent Integration (Tích hợp Workflow)

### D1. Cập nhật `init` & `new-milestone`

- [ ] **Tự động Mapping**: Sau khi `init` hoàn tất cho brownfield project → tự động gợi ý/gọi `gsd-map-codebase` (đã có sẵn 4 parallel mapper agents viết 7 docs vào `.planning/codebase/`). **KHÔNG tạo `pd-codebase-mapper` mới** — dùng GSD skill có sẵn.
- [ ] **Squad Activation**: Kích hoạt đồng thời Research Squad (Security + Feature + Synthesizer) thay vì nghiên cứu thủ công. Mapper đã tách riêng qua `gsd-map-codebase`.

### D2. Cập nhật `plan` (Strategy Guard)

- [ ] **Soft-Guard (Warning, không Block)**: `plan` kiểm tra `TECHNICAL_STRATEGY.md` — nếu thiếu → hiển thị warning "Chưa có TECHNICAL_STRATEGY.md. Chạy `/pd:research` trước để có chiến lược kỹ thuật." nhưng **cho phép tiếp tục**. Lý do: `TECHNICAL_STRATEGY.md` do milestone 3 (`3_PROJECT_RESEARCHER.md`) tạo ra — nếu milestone 3 chưa ship mà dùng hard-block sẽ **break tất cả `/pd:plan` calls**.
- [ ] **Auto-Injection**: Nếu `TECHNICAL_STRATEGY.md` tồn tại → nạp bản nén Strategy vào context của `pd-planner`. Nếu không → skip, dùng RESEARCH.md hiện có.

### D3. Security Gate cho Complete-Milestone → ĐÃ CÓ TRONG 4_AUDIT

> **Đã được xử lý đầy đủ bởi milestone `4_AUDIT_MILESTONE.md`.**
>
> File `4_AUDIT` đã định nghĩa:
>
> - **Bước 0.5 Security Gate** trong `workflows/complete-milestone.md` (BLOCKING)
> - Kiểm tra `SECURITY_REPORT.md` tồn tại + không còn CRITICAL
> - Guard trong `commands/pd/complete-milestone.md`
> - Phân loại severity: CRITICAL = block, WARNING = hỏi user fix/accept, PASS = cho qua
> - Tự động tạo fix phases theo gadget chain nếu có CRITICAL (chế độ milestone)
> - Cross-check hàm trong sec-report vs hàm mới/sửa trong milestone
>
> **KHÔNG cần làm lại ở đây. Milestone 4 sẽ ship trước FINAL.**

### Bảng phối hợp tổng thể:

| Giai đoạn     | Agent             | Tier          | Mục tiêu                |
| ------------- | ----------------- | ------------- | ----------------------- |
| **Init**      | `codebase-mapper` | **Scout**     | Quét cấu trúc nhanh     |
| **Research**  | `Scout Squad`     | **Scout**     | Song song, thu thập thô |
| **Synthesis** | `synthesizer`     | **Architect** | Suy luận, nén context   |
| **Plan**      | `planner`         | **Architect** | Thiết kế giải pháp      |
| **Coding**    | `executor`        | **Builder**   | Code, lint/build        |

---

## E. Giảm file trùng lặp (Dedup & Consolidation)

### E1. Commands ↔ Workflows — ✅ ĐÃ ĐÚNG

> **Audit kết luận**: Commands (`commands/pd/*.md`) ĐÃ chỉ chứa YAML frontmatter + guards + 1 dòng pointer `@workflows/xxx.md`. KHÔNG cần thay đổi gì thêm.

- [x] Source of Truth = `workflows/` — ĐÃ đúng
- [x] `commands/pd/*.md` → ĐÃ chỉ chứa metadata + pointer, không lặp nội dung
- **⚠️ CHÚ Ý**: KHÔNG đổi tên file workflows — 12 commands reference bằng filename chính xác (`@workflows/fix-bug.md`). Đổi tên = gãy 12 commands.

### E2. Reference Consolidation (Chỉ gộp nội dung thật sự trùng)

> **Audit kết luận**: Guard files mỗi file chỉ 1 dòng. Gộp chúng tiết kiệm ~4 dòng nhưng phá vỡ 48 inline `@references/guard-*.md` trên 12 command files. **→ BỎ gộp guards.**

- ~~Gộp guard files~~ → **GIỮ NGUYÊN** guard files (1 dòng/file, đã tối ưu)
- [ ] Gộp `verification-patterns.md` + `plan-checker.md` → `verification.md` (2 file này thật sự trùng logic)
- **Giảm thực tế**: 16 → 15 files (chỉ gộp cặp verification, không gộp guards)

**2 reference files mới từ 4_AUDIT (giữ nguyên):**

| Reference                     | Vai trò                                    | Dùng bởi          |
| ----------------------------- | ------------------------------------------ | ------------------ |
| `security-rules.yaml` (51KB)  | Rules tập trung cho 13 OWASP category      | `pd-sec-scanner`   |
| `gadget-chain-templates.yaml` | Templates cho gadget chain analysis        | `gadget-chain.js`  |

**8 reference còn lại — đã tối ưu, giữ nguyên:**

| Reference               | Vai trò                                                 | Dùng bởi                                        |
| ----------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| `conventions.md`        | Version filtering, commit prefix, biểu tượng trạng thái | Mọi command/workflow                            |
| `state-machine.md`      | Luồng trạng thái, điều kiện tiên quyết, auto-advance    | `what-next`, `complete-milestone`, `write-code` |
| `questioning.md`        | Adaptive questioning framework                          | `new-milestone`, `plan`                         |
| `prioritization.md`     | Sắp xếp ưu tiên yêu cầu                                 | `new-milestone`                                 |
| `ui-brand.md`           | UI design system, visual standards                      | `ui-phase`, `complete-milestone` (report)       |
| `context7-pipeline.md`  | Version-aware library lookup pipeline                   | `fetch-doc`, `plan`, `new-milestone`            |
| `mermaid-rules.md`      | Diagramming standard (5-color palette, node shapes)     | `generate-diagrams.js`, `plan`                  |
| `security-checklist.md` | Pre-coding security context per endpoint type           | `write-code`, `plan`                            |

Mỗi file 1 concern riêng, không trùng nhau. KHÔNG cần gộp hay sửa.

### E3. Template DRY (Thận trọng)

**12 template files** (danh sách đầy đủ để survey):

| Template                 | Vai trò                                     | Dùng bởi                      |
| ------------------------ | ------------------------------------------- | ----------------------------- |
| `plan.md`                | Phase plan format (Truths, tasks, tiêu chí) | `pd:plan`                     |
| `tasks.md`               | Task checklist format                       | `pd:plan` → `pd:write-code`   |
| `project.md`             | Tầm nhìn dự án, lịch sử milestones          | `pd:new-milestone`            |
| `requirements.md`        | Yêu cầu có mã định danh                     | `pd:new-milestone`            |
| `roadmap.md`             | Lộ trình phases                             | `pd:new-milestone`            |
| `state.md`               | Trạng thái làm việc hiện tại                | Mọi command (đọc/ghi)         |
| `current-milestone.md`   | Theo dõi milestone đang chạy                | Mọi command (đọc)             |
| `research.md`            | Format kết quả nghiên cứu                   | `pd:research`                 |
| `progress.md`            | Recovery checkpoint (phiên bị ngắt)         | `pd:write-code`               |
| `verification-report.md` | Báo cáo xác minh phase                      | `pd:write-code` (post-verify) |
| `management-report.md`   | Báo cáo quản lý milestone (PDF)             | `pd:complete-milestone`       |
| `security-fix-phase.md`  | Template fix phase cho security findings    | `pd:audit` (từ 4_AUDIT)       |

Kiểm tra thực tế:

- [ ] Khảo sát xem templates nào thật sự share header pattern (`plan.md`, `tasks.md` có header giống)
- [ ] Nếu ≥3 templates share header → tạo `_base-header.md`. Nếu không → **BỎ, không over-engineer**
- **⚠️**: Templates KHÔNG share footer — mỗi file có kết thúc riêng. Không ép gộp footer.

---

## F. Runtime Code DRY (Converter & Installer)

### F1. Converter — ✅ ĐÃ CÓ Factory Pattern

> **Audit kết luận**: `bin/lib/converters/base.js` ĐÃ là factory. 4 platform converters đều delegate qua `baseConvert()` chỉ truyền config object `{ runtime, pathReplace, toolMap, buildFrontmatter }`. Factory pattern ĐÃ hoạt động.

- [x] Factory pattern đã có (`base.js` + 4 platform configs)
- [ ] **Review only**: Kiểm tra 4 converter configs có consistent không (key names, format). Nếu có inconsistency → fix, không cần tạo file mới.
- **Giảm file**: 0 (đã tối ưu). **Giảm chất lượng**: có thể cải thiện consistency.

### F2. Installer — Giữ riêng, chỉ DRY utility

> **Audit kết luận**: Installers KHÁC NHAU thật sự. Claude = cài Python + pip + FastCode local. Copilot = chỉ copy skills + chạy converter. OpenCode/Gemini = copy + symlink. **Không thể gộp base class.**

- ~~Tạo installer-base.js~~ → **GIỮ RIÊNG** mỗi platform installer
- [ ] **DRY phần utility chung**: Trích `ensureDir()`, `validateGitRoot()`, `copyWithBackup()` thành `installer-utils.js`
- [ ] Mỗi installer import utils, giữ logic platform-specific nguyên vẹn
- **Giảm**: 0 files bớt, nhưng ~20-30% code trùng được DRY qua utils

---

## G. Token Budget & Đo lường

Repo đã có `test/baseline-tokens.json` + `scripts/count-tokens.js` nhưng chưa tích hợp vào quy trình.

- [ ] **Token Budget per Tier**: Scout ≤ 4K, Builder ≤ 8K, Architect ≤ 12K prompt tokens
- [ ] **Before/After Benchmark**: Chạy `count-tokens.js` trước và sau optimize, ghi vào `BENCHMARK_RESULTS.md`
- [ ] **Eval Integration**: Dùng `evals/` + `promptfooconfig.yaml` đo chất lượng output sau giảm token
- [ ] **Lazy-Load References**: Agent chỉ nạp reference khi cần, không nạp hết 16 files. Lưu ý: `workflows/plan.md` **ĐÃ implement** `<conditional_reading>` cho 3/8 references text (questioning, prioritization, ui-brand). Mở rộng pattern này sang các workflows khác.

---

## Tổng kết Impact

| Nhóm  | Công việc                   | Hiệu quả ước tính                                                 |
| ----- | --------------------------- | ----------------------------------------------------------------- |
| **A** | Agent Reform                | 11 agents giữ nguyên + 5 agent mới. Sec: ✅ đã DRY bởi 4_AUDIT    |
| **B** | Platform Mapping + Bridge   | Config-driven + bridge GSD model_profile ↔ PD TIER_MAP            |
| **C** | Parallel + Resource Guard   | 2-4 workers adaptive, backpressure, không chiếm hết tài nguyên    |
| **D** | Skill Integration           | Tích hợp `gsd-map-codebase`, soft-guard strategy, workflow tự động |
| **E** | Dedup files                 | 16 → 15 references (gộp verification), giữ nguyên phần còn lại    |
| **F** | Runtime DRY                 | 0 file giảm, nhưng DRY ~20-30% code trùng qua utils               |
| **G** | Token Budget                | Đo lường + mở rộng conditional_reading pattern                    |

**Tổng impact thực tế**:

- **Agent count**: 11 agents hiện có (giữ nguyên) + 5 agents mới = 16 agents tổng. Không tạo `pd-codebase-mapper` (dùng GSD skill), không đổi tên `pd-repro-engineer`.
- **Giảm code trùng**: ~20-30% code trùng trong installers được DRY qua `installer-utils.js`.
- **Giảm token/run**: Mỗi lần chạy security chỉ nạp ~3-4KB thay vì 30KB+. Adaptive throttle tự điều tiết workers. Conditional reading mở rộng.
- **Không gãy workflow**: Mọi filename reference giữ nguyên. Fallback v1.5 được bảo vệ. Guards 1-dòng giữ nguyên. D2 dùng soft-guard (warning) thay vì hard-block.

---

## Ngoài scope optimize (giữ nguyên)

| Nhóm                    | Files                                                                                                                                                                                                                                                                                                                                                                      | Lý do không cần optimize                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **FastCode/**           | ~15 files Python (MCP server, tree-sitter, embeddings)                                                                                                                                                                                                                                                                                                                     | Subsystem độc lập — Python stack riêng, không ảnh hưởng JS/MD repo          |
| **docs/**               | 14 files (COMMAND_REFERENCE + 12 command docs + WORKFLOW_OVERVIEW)                                                                                                                                                                                                                                                                                                         | Tài liệu cho user, không ảnh hưởng runtime                                  |
| **rules/**              | 7 files (`general.md` + 6 framework: flutter, nestjs, nextjs, solidity, wordpress)                                                                                                                                                                                                                                                                                         | Copy theo dự án user, platform-specific — không trùng nhau                  |
| **bin/lib/** (29 files) | Runtime utilities (audit-logger, bug-memory, checkpoint-handler, confidence-scorer, debug-cleanup, evidence-protocol, session-manager, research-store, logic-sync, manifest, platforms, truths-parser, utils, index-generator, generate-diagrams, report-filler, mermaid-validator, pdf-renderer, plan-checker, outcome-router, repro-test-generator, regression-analyzer, session-delta, smart-selection, gadget-chain) + 2 subdirs (converters/, installers/) | Utility thuần, mỗi file 1 concern, không trùng — đã covered bởi smoke tests |
| **bin/\*.js**           | 5 entry points (install, plan-check, generate-pdf-report, route-query, update-research-index)                                                                                                                                                                                                                                                                              | CLI scripts, không trùng                                                    |
| **evals/**              | 4 files (prompt-wrapper, run, trigger-config, trigger-wrapper)                                                                                                                                                                                                                                                                                                             | Eval infra — G nhắc tích hợp nhưng không cần sửa code                       |
