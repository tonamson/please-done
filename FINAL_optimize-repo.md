# Tối ưu Toàn bộ Repo Please-Done

Bản kế hoạch optimize tổng thể — thực hiện trong 1 đợt duy nhất. Bao gồm: tái cấu trúc Agent, phân tầng Model, giảm file trùng lặp, tối ưu token, và DRY hoá runtime code.

> **Hiện trạng repo**: 20 agent files, 13 command/workflow files (trùng nhau), 14 reference specs, 10 converter+installer files, 30+ test files. Tổng ~80+ markdown, ~50+ JS.

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

| Agent                        | Tier          | Skill gọi                       |
| ---------------------------- | ------------- | ------------------------------- |
| `pd-codebase-mapper.md`      | **Scout**     | `init`, `scan`, `new-milestone` |
| `pd-security-researcher.md`  | **Scout**     | `research`, `plan`              |
| `pd-feature-analyst.md`      | **Scout**     | `research`, `plan`              |
| `pd-research-synthesizer.md` | **Architect** | `research`                      |
| `pd-planner.md`              | **Architect** | `plan`                          |
| `pd-repro-generator.md`      | **Builder**   | `fix-bug`                       |
| `pd-regression-analyzer.md`  | **Builder**   | `fix-bug`                       |

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

Repo có 20 agent, plan định nghĩa 7 agent mới. Bảng đối chiếu:

| Agent cũ (giữ/gộp/xóa)                                                                                  | Xử lý                                            |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `pd-bug-janitor` + `pd-code-detective` + `pd-doc-specialist` + `pd-fix-architect` + `pd-repro-engineer` | Giữ nguyên — đã hoạt động tốt trong flow fix-bug |
| `pd-sec-scanner` + `pd-sec-reporter`                                                                    | ✅ Đã tạo bởi 4_AUDIT (1 template + 1 reporter)  |
| 7 agents mới (mapper, analyst, synthesizer, planner...)                                                 | Tạo bổ sung theo registry A2                     |

- [ ] Đảm bảo backward compatibility — agent cũ vẫn chạy được trong quá trình chuyển đổi
- [ ] Mỗi agent mới phải có test trong `test/smoke-agent-files.test.js`
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

- [ ] **Tự động Mapping**: Triệu hồi `pd-codebase-mapper` (Scout) để cập nhật `.planning/codebase/`
- [ ] **Squad Activation**: Kích hoạt đồng thời Research Squad (Mapper + Security + Feature + Synthesizer) thay vì nghiên cứu thủ công

### D2. Cập nhật `plan` (Strategy Guard)

- [ ] **Blocking**: `plan` không thực thi nếu chưa có `TECHNICAL_STRATEGY.md`
- [ ] **Auto-Injection**: Nạp bản nén Strategy vào context của `pd-planner`

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
- **Giảm thực tế**: 14 → 13 files (chỉ gộp cặp verification, không gộp guards)

### E3. Template DRY (Thận trọng)

10 template files. Kiểm tra thực tế:

- [ ] Khảo sát xem templates nào thật sự share header pattern (plan.md, tasks.md có header giống)
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
- [ ] **Lazy-Load References**: Agent chỉ nạp reference khi cần, không nạp hết 14 files

---

## Tổng kết Impact

| Nhóm  | Công việc                   | Hiệu quả ước tính                                                 |
| ----- | --------------------------- | ----------------------------------------------------------------- |
| **A** | Agent Reform + Sec Dispatch | 20 agents → ~10 (+7 mới). Sec: ✅ đã DRY bởi 4_AUDIT (3 files)    |
| **B** | Platform Mapping            | Config-driven, không hardcode model                               |
| **C** | Parallel + Resource Guard   | 2-4 workers adaptive, backpressure, không chiếm hết tài nguyên    |
| **D** | Skill Integration           | Workflow tự động, bớt bước thủ công                               |
| **E** | Dedup files                 | 1 file gộp (verification), commands/guards giữ nguyên (đã tối ưu) |
| **F** | Runtime DRY                 | 0 file giảm, nhưng DRY ~20-30% code trùng qua utils               |
| **G** | Token Budget                | Đo lường + kiểm soát chi phí                                      |

**Tổng impact thực tế**:

- **Giảm files**: ~13 files (✅ sec agents đã DRY bởi 4_AUDIT: 1 template + 1 config + 1 reporter). Commands, guards, converters, installers giữ nguyên (đã tối ưu).
- **Giảm code trùng**: ~20-30% code trùng trong installers được DRY qua utils.
- **Giảm token/run**: Mỗi lần chạy security chỉ nạp ~3-4KB thay vì 30KB+. Adaptive throttle tự điều tiết workers.
- **Không gãy workflow**: Mọi filename reference giữ nguyên. Fallback v1.5 được bảo vệ. Guards 1-dòng giữ nguyên.
