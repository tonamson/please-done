# Đại kế hoạch Tối ưu & Tách Agent (Agentic Reform & Turbo-Efficiency)

Bản nâng cấp toàn diện: Kết hợp giữa tối ưu hiệu suất (Token/Speed), tái cấu trúc hệ thống (Agent Specialization) và **Hệ thống Phân tầng Model Thích ứng (Adaptive Model Tiering)**.

## Milestone 1: Tách Agent & Chuyên môn hóa (Task Specialization)

### 1. Thư viện Agent (Agent Repository)
- **Vị trí**: `commands/pd/agents/`.
- **Cấu trúc**: Mỗi Agent định nghĩa nhiệm vụ đơn nhất (Scout, Architect, Specialist).
- **Phân công nhiệm vụ (Agent Registry)**:
  - `pd-codebase-mapper.md` -> Quét cấu trúc (`init`, `scan`, `new-milestone`).
  - `pd-security-researcher.md` -> Tìm CVE/Lỗ hổng (`research`, `plan`).
  - `pd-feature-analyst.md` -> Phân tích logic nghiệp vụ (`research`, `plan`).
  - `pd-research-synthesizer.md` -> Tổng hợp báo cáo (`research`).
  - `pd-planner.md` -> Lập kế hoạch chi tiết (`plan`).
  - `pd-repro-generator.md` -> Tạo mã tái hiện lỗi (`fix-bug`).
  - `pd-regression-analyzer.md` -> Phân tích vùng ảnh hưởng (`fix-bug`).

### 2. Model Tiering Strategy (Phân tầng Thợ & Sếp)
Thay vì dùng tên model cứng, PD sử dụng 3 cấp bậc (Tiers) để tương thích với mọi nền tảng (CLI/IDE):

| Tier | Vai trò | Đặc điểm | Model tương ứng (Ví dụ) |
|------|---------|----------|--------------------------|
| **Scout** | Mapper, Security, Feature | Nhanh, Rẻ, Context rộng | Haiku 4.5, Gemini 3 Flash, GPT-5.3 Small |
| **Builder** | Executor, Repro, Regression | Cân bằng, Code giỏi | Sonnet 4.6, Composer 2, GPT-5.4 |
| **Architect** | Synthesizer, Planner | Thinking, Suy luận cao | Opus 4.6, Gemini 3.1 Pro, GPT-5.4 (Thinking) |

## Milestone 2: Cơ chế Mapping Thông minh (Platform-Aware Mapping)

### 1. Tự động nhận diện Nền tảng
Skill `init` sẽ xác định bạn đang dùng công cụ nào để nạp cấu hình Model phù hợp:
- **Nếu là Antigravity (Gemini CLI)**:
  - Scout -> `gemini-3-flash`
  - Architect -> `gemini-3.1-pro`
- **Nếu là Cursor/Windsurf**:
  - Scout -> `cursor-small` / `swe-1-mini`
  - Builder -> `claude-3-5-sonnet` / `composer-2`
- **Nếu là Claude Code (CLI)**:
  - Scout -> `claude-4-5-haiku`
  - Architect -> `claude-4-6-opus`

### 2. Dự phòng (Fallback)
Nếu một nền tảng không hỗ trợ model Architect (ví dụ: Antigravity không có Opus), hệ thống sẽ tự động hạ cấp xuống model cao nhất hiện có của nền tảng đó để đảm bảo workflow không bao giờ bị đứt gãy.

## Milestone 3: Song song Thích ứng & Bàn giao (Handoff)
- [ ] **Parallel Scouts**: Kích hoạt đồng thời N luồng Tier-Scout (Haiku/Flash) để quét dự án.
- [ ] **Unified Handoff**: Mọi kết quả dù từ model nào cũng phải nộp về định dạng Markdown chuẩn trong `.planning/research/raw/`.

## Milestone 4: An toàn, Audit & Feedback Loop
- [ ] **State-First Principle**: Agent luôn đọc `STATE.md` để không bị mất bối cảnh khi chuyển đổi giữa các model khác nhau.
- [ ] **Audit Citations**: Buộc thợ phải dẫn chứng link/file để sếp (Architect) kiểm tra chéo, tránh ảo giác giữa các dòng model khác nhau.

## Milestone 5: Skill-Agent Integration (Tích hợp Workflow)

### 1. Cập nhật `/pd:init` & `/pd:new-milestone`
- **Tự động Mapping**: Khi khởi tạo dự án hoặc bắt đầu Milestone mới, Skill sẽ tự động triệu hồi `pd-codebase-mapper` (Tier-Scout) để cập nhật hồ sơ `.planning/codebase/`.
- **Squad Activation**: Thay thế các bước nghiên cứu thủ công trong `new-milestone` bằng việc kích hoạt đồng thời `Research Squad` (Mapper, Security, Feature, Synthesizer).

### 2. Cập nhật `/pd:plan` (Strategy Guard)
- **Cơ chế Blocking**: Chốt chặn `pd:plan` không cho thực thi nếu chưa có `TECHNICAL_STRATEGY.md`. 
- **Auto-Injection**: Tự động nạp bản nén Strategy vào bối cảnh của `pd-planner`, giúp AI thiết kế task sát với thực tế kỹ thuật nhất.

---
### Bảng phối hợp Model (Tier Mapping Table):

| Giai đoạn | Agent | Tier | Mục tiêu |
|-----------|-------|------|----------|
| **Init** | `codebase-mapper` | **Scout** | Nhanh, quét cấu trúc |
| **Research** | `Scout Squad` | **Scout** | Song song, thu thập thô |
| **Synthesis** | `synthesizer` | **Architect** | Suy luận, nén context |
| **Plan** | `planner` | **Architect** | Thiết kế giải pháp |
| **Coding** | `executor` | **Builder** | Viết code, chạy lint/build |

---
*Ghi chú: Cơ chế Mapping giúp PD linh hoạt trên mọi công cụ (Cursor, Gemini, Claude Code). Bạn không bao giờ phải lo lắng về việc thiếu model AI cho tác vụ.*
