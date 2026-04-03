# Đề xuất cải tiến bộ Skills — please-done

> Ngày đánh giá: 29/03/2026 | Cập nhật: 29/03/2026 (review lần 2 — xác minh lại bằng source code)
> Phạm vi: 14 skills, 13 workflows, 16 agents, 15 references, 12 templates, 6 rules
> Phương pháp: Đọc toàn bộ source, git history, so sánh chéo guards vs workflows, chạy verify thực tế

---

## Tóm tắt nhanh

| Hạng mục          | Số lượng vấn đề | Mức ảnh hưởng                             |
| ----------------- | --------------- | ----------------------------------------- |
| P0 — Cần sửa ngay | 1               | Guard block user khi workflow có fallback |
| P1 — Nên sửa sớm  | 5               | Giảm chất lượng trải nghiệm               |
| P2 — Cải tiến     | 4               | Nâng cao hiệu quả dài hạn                 |
| P3 — Ý tưởng mới  | 3               | Mở rộng khả năng                          |

---

## P0 — CẦN SỬA NGAY

### P0-1: FastCode/Context7 — Guard HARD STOP mâu thuẫn với Workflow FALLBACK (hệ thống, 4 skills)

**Vấn đề:** 4 skills (`scan`, `plan`, `write-code`, `test`) dùng `@references/guard-fastcode.md` / `@references/guard-context7.md` — là **hard guard** (chặn hoàn toàn nếu MCP không kết nối). Nhưng workflow tương ứng của mỗi skill lại có logic **fallback** rõ ràng:

| Skill           | Guard (skill file)          | Workflow fallback                                                                                       |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `scan.md`       | `@guard-fastcode.md` → STOP | `workflows/scan.md` dòng 44+106: "FastCode error → warning, continue with built-in tools. DO NOT STOP." |
| `plan.md`       | `@guard-fastcode.md` → STOP | `workflows/plan.md` dòng 115: "FastCode error → Grep/Read fallback."                                    |
| `write-code.md` | `@guard-fastcode.md` → STOP | `workflows/write-code.md` dòng 208+461: "FastCode error → Grep/Read fallback, log warning."             |
| `test.md`       | `@guard-fastcode.md` → STOP | `workflows/test.md` dòng 94+243: "FastCode error → Grep/Read, DO NOT STOP."                             |

**Hậu quả:** Guard chạy TRƯỚC workflow. Nếu FastCode Docker không chạy → skill dừng ở cổng guard → user KHÔNG BAO GIỜ được đến phần fallback trong workflow. Workflows có fallback nhưng bị guard chặn mất.

**Ghi chú:** `init.md` không bị — vì trong workflow init, FastCode failure chỉ là warning + tiếp tục (guard và workflow đồng nhất soft).

**File:** `references/guard-fastcode.md`, `references/guard-context7.md`, 4 skill files trên

**Cách sửa (chọn 1):**

1. **Tạo `guard-fastcode-soft.md`:** Nội dung: `- [ ] FastCode MCP connected → If not: warn "FastCode unavailable — using Grep/Read fallback (slower)." Continue.` — Dùng file này thay cho `guard-fastcode.md` trong 4 skills trên.
2. **Hoặc sửa trực tiếp:** Xóa `@references/guard-fastcode.md` khỏi guards của scan/plan/write-code/test → di chuyển vào workflow Bước 1 với logic `try MCP → fail → set HAS_FASTCODE=false → continue`.
3. **Hoặc đơn giản nhất:** Sửa `guard-fastcode.md` từ hard stop thành soft warning (nhưng cần verify rằng KHÔNG skill nào thực sự CẦN hard stop FastCode)

**Tương tự cho Context7:** `guard-context7.md` cũng là hard stop, nhưng Context7 chỉ dùng để tra cứu thư viện — không bao giờ cần hard stop.

**Effort:** 1-2 giờ

---

## P1 — NÊN SỬA SỚM

### P1-1: Thiếu skill "tham gia dự án giữa chừng" (`pd:onboard`)

**Vấn đề:** Khi tham gia dự án đã có code nhưng chưa từng dùng please-done, flow hiện tại là:

```
/pd:init → /pd:scan → /pd:new-milestone → /pd:plan → ...
```

`new-milestone` tạo ROADMAP mới từ đầu — không có cách "wrap" code hiện tại vào milestone đã hoàn thành trước đó. Điều này khiến lịch sử dự án bị mất và dev mới không biết đâu là code cũ, đâu là code mới.

**Đề xuất:** Tạo skill `pd:onboard` hoặc flag `--existing` cho `pd:new-milestone`:

1. Quét git history → tự sinh milestone "v0 — Existing codebase" chứa summary code hiện tại
2. Tạo `PROJECT.md` với lịch sử "milestone 0 = code có sẵn"
3. Milestone tiếp bắt đầu từ v1.0 — chỉ chứa features/bugs mới
4. Optional: tag git commit hiện tại là `v0.0`

**Effort:** 1 phase (4-6 giờ)

---

### P1-2: Codebase mapper không tự cập nhật khi code thay đổi nhiều

**Vấn đề:** `init.md` Bước 3b kiểm tra `.planning/codebase/STRUCTURE.md` tồn tại → bỏ qua mapping. Nhưng sau nhiều phases (thêm modules, refactor kiến trúc), codebase map lỗi thời → `plan.md` và `write-code.md` tham chiếu thông tin cũ.

**File:** `workflows/init.md` Bước 3b, `workflows/scan.md`

**Đề xuất:**

1. `scan.md` thêm bước so sánh: đếm modules/files hiện tại vs `STRUCTURE.md` → khác >20% → cảnh báo "Codebase map lỗi thời, re-map?"
2. `STRUCTURE.md` thêm metadata: `> Mapped at commit: [sha]` → `scan.md` so sánh với HEAD
3. Hoặc đơn giản hơn: `scan.md` luôn chạy lại mapper khi quét (vì scan đã đọc toàn bộ codebase rồi)

**Effort:** 2-3 giờ

---

### P1-3: Lint/Build "3-strike rule" thiếu recovery path rõ ràng

**Vấn đề:** `write-code.md` thử lint+build tối đa 3 lần → DỪNG. Sau khi dừng, không có hướng dẫn recovery cụ thể — user phải tự sửa rồi chạy lại `write-code` từ đầu, mất context task đang làm.

**File:** `workflows/write-code.md`

**Đề xuất:**

1. Khi dừng sau 3 lần → lưu trạng thái vào `PROGRESS.md`: `lint_fail_count: 3`, `last_error: [error message]`
2. Gợi ý cụ thể: "Lỗi lint/build liên tục. Chạy `/pd:fix-bug [error]` để điều tra, hoặc sửa thủ công rồi chạy `/pd:write-code [task N]` để tiếp tục."
3. Khi resume → đọc `PROGRESS.md` → skip lại bước viết code → chỉ chạy lint+build

**Effort:** 1-2 giờ

---

### P1-4: `write-code.md` auto-advance mà không tham chiếu `state-machine.md`

**Vấn đề:** File `references/state-machine.md` chứa toàn bộ logic chuyển trạng thái, edge cases, auto-advance rules. Hiện tại 3 skills tham chiếu nó (đều là `optional`):

- `what-next.md` — trong `<conditional_reading>`
- `complete-milestone.md` — trong `<conditional_reading>`
- `new-milestone.md` — trong `<conditional_reading>`

Tuy nhiên, **`write-code.md` Bước 9 thực hiện auto-advance** (chuyển state `write-code → test`) nhưng KHÔNG tham chiếu `state-machine.md`. Agent tự quyết định advance logic mà không có reference chính thức → có thể advance sai state hoặc bỏ qua edge cases.

**File:** `commands/pd/write-code.md`, `references/state-machine.md`

**Đề xuất:**

1. Thêm `@references/state-machine.md (required)` vào `write-code.md` `<execution_context>` — vì đây là nơi state transitions thực sự xảy ra
2. Nâng cấp từ `(optional)` thành `(required)` cho `what-next.md` — vì what-next CẦN hiểu trạng thái để gợi ý đúng
3. Giữ `(optional)` cho complete-milestone và new-milestone (chúng có flow rõ ràng riêng)

**Effort:** 30 phút

---

### P1-5: Thiếu integration test cho chuỗi skill

**Vấn đề:** 40+ smoke tests hiện tại kiểm từng component riêng lẻ (converters, utils, state-machine, agents...) nhưng không có test nào chạy chuỗi: `init → scan → new-milestone → plan → write-code`. Nếu một skill thay đổi output format, skills downstream có thể break mà không phát hiện.

**Đề xuất:**

1. Tạo `test/integration-workflow.test.js` — mock `.planning/` directory, chạy guards sequence
2. Test case cơ bản: verify output file X từ skill A được đọc đúng bởi skill B
3. Ưu tiên test các "contract files": `CONTEXT.md`, `CURRENT_MILESTONE.md`, `TASKS.md` — format có thay đổi không?
4. Có thể bắt đầu đơn giản: regex test frontmatter + required sections của mỗi template output

**Effort:** 1 phase (6-8 giờ)

---

## P2 — CẢI TIẾN

### P2-1: `general.md` tham chiếu `PROJECT.md` trước khi file tồn tại

**Vấn đề:** `commands/pd/rules/general.md` dòng 14 yêu cầu agent "MUST read `.planning/PROJECT.md`" để xác định ngôn ngữ báo lỗi. Nhưng `PROJECT.md` chỉ được tạo bởi `/pd:new-milestone` — KHÔNG tạo bởi `/pd:init`.

Theo state machine: `init → scan → new-milestone → plan → ...`. Trong khoảng giữa `init` và `new-milestone`, nếu `scan` chạy và agent đọc `general.md` → gặp chỉ thị đọc `PROJECT.md` → file chưa tồn tại → confusion.

**File:** `commands/pd/rules/general.md` dòng 14

**Đề xuất:**

1. Sửa general.md: "If `.planning/PROJECT.md` exists → read for error language. Otherwise → default English."
2. Hoặc tạo `PROJECT.md` sớm hơn — trong `init` Bước 4 tạo skeleton `PROJECT.md` với default language

**Effort:** 30 phút

---

### P2-2: Thiếu skill `pd:status` (dashboard nhanh)

**Vấn đề:** `what-next.md` vừa hiển thị tiến trình VÀ gợi ý bước tiếp — hai mục đích khác nhau gộp trong một skill. Khi user chỉ muốn xem nhanh "đang ở đâu" mà không cần gợi ý, output quá dài.

**Đề xuất:** Tách thành 2 skills:

- `pd:status` (Haiku) → chỉ hiển thị: milestone, phase, task counts, bugs, version → 5-10 dòng
- `pd:what-next` (Haiku) → giữ nguyên: phân tích + gợi ý

Hoặc đơn giản hơn: thêm flag `--brief` cho `what-next` → chỉ hiển thị status block, bỏ phân tích.

**Effort:** 1-2 giờ

---

### P2-3: Research index không được dọn dẹp

**Vấn đề:** `.planning/research/INDEX.md` tích lũy entries theo thời gian nhưng không có cơ chế archive/cleanup. Khi dự án chạy qua nhiều milestones, index phình to → AI đọc tốn context → chậm.

**Đề xuất:**

1. `complete-milestone` thêm bước: move research entries milestone cũ vào `research/archive/v[X.Y]/`
2. INDEX.md chỉ giữ entries milestone hiện tại
3. `research.md` tìm kiếm cả archive khi cross-validate

**Effort:** 2 giờ

---

### P2-4: Agent error không có structured logging

**Vấn đề:** Khi agent fail (janitor timeout, detective không tìm root cause), error chỉ ghi dạng text tự do vào evidence files. Không có structured format → khó aggregate/analyze failure patterns.

**Đề xuất:**

1. Thêm error section chuẩn cho mỗi agent output:

```yaml
## Agent Result
- agent: pd-code-detective
- status: success | partial | failed
- duration: ~45s
- confidence: HIGH | MEDIUM | LOW
- error: null | "mô tả ngắn"
```

2. `fix-architect.md` aggregate từ format chuẩn này thay vì parse text tự do
3. Cho phép `what-next` scan agent results → cảnh báo nếu pattern fail lặp lại

**Effort:** 3-4 giờ

---

## P3 — Ý TƯỞNG MỚI

### P3-1: `pd:replay` — Xem lại quyết định cũ

**Ý tưởng:** Skill cho phép duyệt lại lịch sử quyết định thiết kế qua các milestones. Đọc `PLAN.md` → "Design Decisions" section, `PROJECT.md` → "Lessons Learned", `MILESTONE_COMPLETE.md` → "Technical Debt". Hiển thị timeline quyết định + lý do + hậu quả.

**Giá trị:** Đặc biệt hữu ích khi:

- Dev mới tham gia dự án (tại sao chọn Zustand thay vì Redux?)
- Refactor muốn hiểu context cũ
- Sprint retrospective

---

### P3-2: `pd:diff-milestone` — So sánh plan vs reality

**Ý tưởng:** So sánh ROADMAP ban đầu vs thực tế triển khai:

- Phases nào thêm/bỏ/trì hoãn?
- Effort estimate vs actual (thời gian commit)?
- Requirements nào bị drop?

**Giá trị:** Calibrate ước lượng cho milestone tiếp theo, phát hiện pattern overcommit.

---

### P3-3: Hot-reload skill files khi update

**Ý tưởng:** Hiện tại `pd:update` pull code mới rồi yêu cầu user restart. Nếu skill files là text-based (đọc runtime), có thể hot-reload mà không cần restart — chỉ reset internal cache.

**Giá trị:** Giảm friction khi update, đặc biệt giữa session dài.

---

## Thứ tự ưu tiên thực hiện

```
Đợt 1 (ngay):    P0-1                     → Sửa guard mâu thuẫn (hệ thống, 4 skills)
Đợt 2 (sớm):     P1-4, P1-3, P2-1         → State-machine ref + recovery + general.md
Đợt 3 (planned):  P1-2, P2-2, P2-3        → UX improvements
Đợt 4 (phase):    P1-1, P1-5              → Onboarding + integration tests
Đợt 5 (backlog):  P2-4, P3-1, P3-2, P3-3  → Advanced features
```

---

## Changelog

| Ngày       | Thay đổi                                                                                                                                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 29/03/2026 | v1 — 15 đề xuất ban đầu (P0×3, P1×5, P2×4, P3×3)                                                                                                                                                                                                                                             |
| 29/03/2026 | v2 — Review lần 2: Xóa P0-1 (conventions.md clean), xóa P0-2 (Agent đã có trong frontmatter), gộp P0-3 + P2-1 cũ thành P0-1 mới (systemic guard mismatch), sửa P1-4 (state-machine.md IS referenced), thay P2-1 bằng finding mới (general.md → PROJECT.md gap). Tổng: P0×1, P1×5, P2×4, P3×3 |
