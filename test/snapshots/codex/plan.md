---
name: pd-plan
description: Technical planning + task breakdown for the current milestone
---
<codex_skill_adapter>
## Cách gọi skill này
Skill name: `$pd-plan`
Khi user gọi `$pd-plan {{args}}`, thực hiện toàn bộ instructions bên dưới.
## Tool mapping
- `AskUserQuestion` → `request_user_input`: Khi cần hỏi user, dùng request_user_input thay vì AskUserQuestion
- `Task()` → `spawn_agent()`: Khi cần spawn sub-agent, dùng spawn_agent với fork_context
  - Chờ kết quả: `wait(agent_ids)`
  - Kết thúc agent: `close_agent()`
## Fallback tương thích
- Nếu `request_user_input` không khả dụng trong mode hiện tại, hỏi user bằng văn bản thường bằng 1 câu ngắn gọn rồi chờ user trả lời
- Mọi chỗ ghi "PHẢI dùng `request_user_input`" được hiểu là: ưu tiên dùng khi tool khả dụng; nếu không thì fallback sang hỏi văn bản thường, không được tự đoán thay user
## Quy ước
- `$ARGUMENTS` chính là `{{GSD_ARGS}}` — input từ user khi gọi skill
- Tất cả paths config đã được chuyển sang `~/.codex/`
- Các MCP tools (`mcp__*`) hoạt động tự động qua config.toml
- Đọc `~/.codex/.pdconfig` (cat ~/.codex/.pdconfig) → lấy `SKILLS_DIR`
- Các tham chiếu `[SKILLS_DIR]/templates/*`, `[SKILLS_DIR]/references/*` → đọc từ thư mục source tương ứng
</codex_skill_adapter>
<objective>
Research the project, design the technical solution, and break the work into concrete tasks.
`--auto` (default): AI decides everything | `--discuss`: interactive discussion where the user chooses the approach.
</objective>
<guards>
Stop and instruct the user if any of the following conditions fail:
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `$pd-init` truoc."
- [ ] `.planning/ROADMAP.md` exists -> "Run `$pd-new-milestone` first."
- [ ] `.planning/CURRENT_MILESTONE.md` exists -> "CURRENT_MILESTONE.md is missing. Run `$pd-new-milestone` to create it."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
- [ ] Context7 MCP ket noi thanh cong -> "Kiem tra Context7 MCP da duoc cau hinh."
- [ ] Context7 MCP hoat dong (thu resolve-library-id "react") -> "Context7 khong phan hoi. Kiem tra ket noi MCP."
</guards>
<context>
User input: {{GSD_ARGS}}
- `--discuss` -> discussion mode | default/`--auto` -> automatic mode | if both are provided -> discussion takes priority.
- Remaining input = phase/deliverable information.
Additional reads:
- `.planning/PROJECT.md` -> project vision and constraints.
- `.planning/rules/general.md` -> general rules.
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> technology-specific rules (ONLY if they exist).
</context>
<required_reading>
Đọc .pdconfig → lấy SKILLS_DIR, rồi đọc các files sau trước khi bắt đầu:
(Claude Code: cat ~/.codex/.pdconfig — nền tảng khác: converter tự chuyển đổi đường dẫn)
Đọc trước khi bắt đầu:
- [SKILLS_DIR]/templates/plan.md, [SKILLS_DIR]/templates/tasks.md
- [SKILLS_DIR]/references/conventions.md → icons, version, commit
- [SKILLS_DIR]/templates/research.md
</required_reading>
<conditional_reading>
Đọc CHỈ KHI cần (phân tích mô tả task trước):
- [SKILLS_DIR]/references/questioning.md -- KHI DISCUSS mode -- can interactive user questioning
- [SKILLS_DIR]/references/prioritization.md -- KHI task ordering/ranking nhieu tasks hoac triage
- [SKILLS_DIR]/references/ui-brand.md -- KHI task tao/sua UI components hoac man hinh user-facing
- [SKILLS_DIR]/references/verification.md -- KHI task can multi-level verification (khong phai simple pass/fail)
- [SKILLS_DIR]/references/context7-pipeline.md -- KHI task can
</conditional_reading>
<research_injection>
## Tự động tải research context
Trước khi bắt đầu code, kiểm tra research liên quan:
1. Đọc `.planning/research/INDEX.md` — nếu không tồn tại, bỏ qua toàn bộ bước này
2. Tìm entries có topic match với task hiện tại (keyword match tên task, tên file, tên module)
3. Đọc tối đa 2 entries match (ưu tiên HIGH confidence trước)
4. Mỗi file đọc tối đa 2000 ký tự đầu tiên
5. Wrap nội dung trong block:
   <research-context>
   [nội dung research file 1]
   [nội dung research file 2]
   </research-context>
6. Không có INDEX.md hoặc không match -> bỏ qua, tiếp tục bình thường (KHÔNG báo lỗi)
</research_injection>
<process>
## Bước 1: Đọc context
- `.planning/PROJECT.md` → tầm nhìn, đối tượng, ràng buộc
- `.planning/ROADMAP.md`
- `.planning/CURRENT_MILESTONE.md` → version + phase
- `.planning/REQUIREMENTS.md` → yêu cầu với mã, bảng theo dõi
- `.planning/STATE.md` → trạng thái, bối cảnh tích lũy, vấn đề chặn
- `.planning/scan/SCAN_REPORT.md` → hiện trạng, thư viện, patterns
- `.planning/research/SUMMARY.md` → nghiên cứu lĩnh vực, thư viện, cạm bẫy
- `.planning/research/TECHNICAL_STRATEGY.md` → chiến lược kỹ thuật (nếu có)
- `.planning/docs/*.md` → chỉ đọc mục lục + sections liên quan (offset/limit)
- `{{GSD_ARGS}}` chỉ định phase → dùng phase đó
- Có phases trước → đọc PLAN.md/TASKS.md nắm context đã triển khai
Chưa có roadmap → "Chạy `$pd-new-milestone` trước."
CURRENT_MILESTONE.md không tồn tại → "Thiếu. Chạy `$pd-new-milestone`."
Status = `Hoàn tất toàn bộ` → **DỪNG**: "Tất cả milestones hoàn tất. Chạy `$pd-new-milestone`."
Phase không có deliverables → **DỪNG**: "Phase [x.x] chưa có deliverables. Cập nhật ROADMAP."
**Soft-guard TECHNICAL_STRATEGY.md:**
Kiểm tra `.planning/research/TECHNICAL_STRATEGY.md` tồn tại:
- **CÓ** → đọc và dùng làm context chiến lược kỹ thuật
- **KHÔNG** → hiển thị warning 1 lần: "TECHNICAL_STRATEGY.md không tồn tại. Plan sẽ thiếu chiến lược kỹ thuật. Chạy Research Squad để tạo."
  Tiếp tục planning — KHÔNG block.
---
## Bước 1.4: Phân tích scope -- quyết định tài liệu tham khảo
Xác định từ ROADMAP.md và user input:
- Chế độ DISCUSS? → đọc [SKILLS_DIR]/references/questioning.md
- Phase liên quan đến UI? → đọc [SKILLS_DIR]/references/ui-brand.md
- Nhiều tasks cần sắp xếp ưu tiên? → đọc [SKILLS_DIR]/references/prioritization.md
Nếu không rõ → BỎ QUA. Nếu phát hiện cần giữa chừng → đọc khi cần.
---
## Bước 1.5: Kiểm tra phase đã tồn tại
TASKS.md đã tồn tại:
- CÓ tasks ✅/🔄 → **CẢNH BÁO**: "Phase [x.x] đã có plan với tiến trình ([N1] ✅, [N2] 🔄)."
  Options: (1) Lên kế hoạch lại (ghi đè), (2) Chuyển phase chưa plan [liệt kê], (3) Hủy
  - Không còn phase chưa plan → chỉ option 1 + 3
  - "Lên kế hoạch lại" → reset ROADMAP deliverables `[x]` → `[ ]`
  - "Chuyển" → cập nhật biến phase → quay lại 1.5
- KHÔNG có tasks hoàn thành (tất cả ⬜):
  - **CÓ PLAN.md + TASKS.md hoàn chỉnh**: "Plan đã tồn tại ([N] tasks, chưa bắt đầu)."
    Options: (1) Giữ nguyên — chỉ cập nhật tracking → nhảy Bước 8, (2) Lên kế hoạch lại, (3) Hủy
  - **CHỈ PLAN.md, KHÔNG TASKS.md**: "PLAN.md có nhưng thiếu TASKS.md."
    Options: (1) Tạo TASKS.md từ PLAN.md → nhảy Bước 7 → 8, (2) Lên kế hoạch lại
  - **Không có hoặc PLAN.md chưa hoàn chỉnh** → cho phép ghi đè
---
## Bước 2: Tạo thư mục
- `.planning/milestones/[version]/phase-[phase]/`
- `.planning/milestones/[version]/phase-[phase]/reports/`
---
## Bước 3: Research dự án
> Output: `.planning/milestones/[version]/phase-[phase]/RESEARCH.md` ([SKILLS_DIR]/templates/research.md)
> RESEARCH.md đã tồn tại → deliverables khớp? Khớp → hỏi dùng lại/làm lại. Không khớp → ghi đè.
### 3A: Research code hiện có
#### Nếu project đã có code:
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md) kết hợp Grep/Read:
1. **Code tái sử dụng**: "Liệt kê utility functions, helpers, shared services có thể tái sử dụng."
2. **Backend patterns** (nếu có): "Patterns controllers, services, DTOs, entities, response format đang dùng."
3. **Database schema** (nếu có): "Database schema hiện tại: entities, fields, relationships."
4. **Frontend patterns** (nếu có): "Patterns components, stores, API calls, pages đang dùng."
Dùng FastCode cho câu hỏi broad, Grep/Read verify chi tiết cụ thể.
FastCode lỗi → Grep/Read fallback. Warning: "FastCode lỗi — chạy `$pd-init` kiểm tra."
FastCode trả rỗng tất cả → cảnh báo: "Nên chạy `$pd-scan`." Tiếp tục với context hạn chế.
#### Nếu project mới (chưa có code):
Skip FastCode. RESEARCH.md: "Project mới — chưa có code."
### 3B: Research hệ sinh thái
> LUÔN chạy nếu thư viện mới hoặc domain phức tạp. BỎ QUA nếu CRUD cơ bản → "Phase dùng stack có sẵn."
**Context7** (ưu tiên — CAO): Thực hiện theo [SKILLS_DIR]/references/context7-pipeline.md
**Phân tích hệ sinh thái:**
1. **Thư viện đề xuất**: tên, version, mục đích, lý do, alternatives loại
2. **Không nên tự code**: vấn đề trông đơn giản nhưng có thư viện sẵn, edge cases tự code
3. **Cạm bẫy**: lỗi phổ biến, hậu quả, cách phòng, dấu hiệu sớm
4. **Xu hướng mới**: thư viện lỗi thời, thay thế, ảnh hưởng
**Độ tin cậy:** Context7/FastCode/docs = CAO | WebSearch + verify = TB | Claude chưa verify = THẤP `[cần verify]`
### 3C: Lưu RESEARCH.md
Theo [SKILLS_DIR]/templates/research.md. CHỈ sections có dữ liệu. Ngắn gọn — tham khảo nhanh. KHÔNG hỏi lại thông tin trong SCAN_REPORT.
---
## Bước 3.5: Thảo luận tính năng (CHỈ DISCUSS)
> Bỏ qua nếu AUTO.
**Lưu trạng thái**: tạo DISCUSS_STATE.md trước khi bắt đầu. Cập nhật SAU MỖI quyết định. Phiên bị ngắt → đọc file khôi phục.
### 3.5.1: Liệt kê vấn đề cần thảo luận
Phân tích deliverable → xác định vấn đề có nhiều cách triển khai hợp lệ:
- Phạm vi tính năng, cách xác thực, dữ liệu lưu trữ, luồng thao tác user
- Tích hợp bên ngoài, phân quyền, hiệu suất/bộ nhớ đệm, xử lý lỗi
- Chỉ liệt kê vấn đề THỰC SỰ có nhiều lựa chọn — KHÔNG liệt kê đã rõ từ ROADMAP/CONTEXT
- KHÔNG có vấn đề → "Không cần thảo luận — tự quyết định." → Bước 4
- Hiển thị `request_user_input`: 1 vấn đề → single select. 2-4 → multiSelect. 5+ → hỏi phạm vi trước, chia nhóm ≤4
### 3.5.2: Thảo luận từng vấn đề
Với MỖI vấn đề đã chọn:
1. Tiêu đề + bối cảnh (viết cho người KHÔNG phải dev)
2. request_user_input single select: option đầu = recommend "(Đề xuất)", tối đa 4 + Other
   - Description viết kết quả/hệ quả, KHÔNG thuật ngữ kỹ thuật trần
   - "Other" → chờ mô tả → xác nhận. `back` = vấn đề trước, `cancel` = giữ chốt + Claude quyết phần còn lại → 3.5.3
### 3.5.3: Tổng hợp quyết định
Bảng (Vấn đề | Quyết định | Nguồn: User/Claude). 3 lựa chọn:
- **Tiếp tục thiết kế** → Bước 4
- **Thảo luận thêm** → 3.5.4
- **Thay đổi quyết định** → multiSelect vấn đề muốn đổi → 3.5.2 → 3.5.3
### 3.5.4: Thảo luận mở rộng
Vấn đề MỚI (không trùng 3.5.1 + các vòng trước): phát sinh từ quyết định, tầng sâu hơn, user tự đề xuất.
- Có → multiSelect → 3.5.2 → 3.5.3
- Không → hỏi user tự đề xuất. Không → Bước 4
- **Vòng lặp 3.5.3 ↔ 3.5.4** đến khi "Tiếp tục thiết kế" hoặc hết vấn đề
---
## Bước 4: Thiết kế kỹ thuật
Cho mỗi deliverable, thiết kế theo loại:
- Đọc RESEARCH.md vừa tạo Bước 3 → dùng làm nền tảng:
  - **Thư viện đề xuất** → chọn thư viện
  - **Không nên tự code** → tránh implement lại cái đã có
  - **Cạm bẫy** → thiết kế phòng ngừa, ghi "Lưu ý kỹ thuật"
  - **Code tái sử dụng** → tham chiếu thay vì viết mới
- **DISCUSS**: PHẢI tuân thủ quyết định đã chốt Bước 3.5 — KHÔNG thay đổi/bỏ qua
- **AUTO**: tự quyết định, ưu tiên phương án đơn giản, hiệu quả nhất
**Thiết kế theo stack** (đọc rules, tra Context7):
- **Backend**: API endpoints, database entities/relations + migration, DTOs, guards
- **Frontend**: pages/routes, components, stores, API integration
- **WordPress**: plugin/theme, hooks, custom tables, REST API
- **Solidity**: contracts, functions + modifiers, events, token interactions, signatures
- **Flutter**: modules (Logic+State+View+Binding), navigation, design tokens, data layer
- **Chung**: files tạo/sửa, thư viện cần thêm
**UI/UX ([SKILLS_DIR]/references/ui-brand.md):**
- **Lớp 2 — Design Continuity** (đã có UI): kiểm tra 6 câu hỏi kế thừa → tìm component/flow tương tự → tái sử dụng → PLAN.md `### UI — Kế thừa patterns` + `### UI — Pattern mới`
- **Lớp 3 — UX Gaps** (feature mới): 7 khía cạnh bắt buộc (Entry point, Main CTA, Empty/Loading/Error/Permission state, Responsive) + phức tạp (Cognitive load, Flow, Phá pattern, Onboarding, Undo) → PLAN.md `### UX States`
---
## Bước 4.3: Suy luận Goal-backward — Tiêu chí thành công
> LUÔN thực hiện (AUTO + DISCUSS). Suy luận NGƯỢC từ mục tiêu phase.
### Tầng 1 — Truths
Đọc mục tiêu (ROADMAP deliverables) + thiết kế (Bước 4). Hỏi: **"Khi phase hoàn tất, điều gì phải TRUE?"**
- Viết khẳng định kiểm chứng được ("User có thể X" — KHÔNG "Triển khai X")
- Mỗi Truth có **5 cột**: `| # | Sự thật | Giá trị nghiệp vụ | Trường hợp biên | Cách kiểm chứng |`
  - **Giá trị nghiệp vụ**: tại sao logic tồn tại từ góc nhìn business (VD: "Đảm bảo bảo mật tài khoản")
  - **Trường hợp biên**: danh sách ngắn edge cases, cách nhau bằng dấu phẩy (VD: "Password sai 5 lần, email trống")
- Bao phủ happy path + edge cases. Tối thiểu 2, tối đa 7
### Tầng 2 — Artifacts
Từ mỗi Truth suy ngược: **"File/module nào PHẢI tồn tại?"**
- Cross-check với "Files tạo/sửa" Bước 4 — file không phục vụ Truth → thừa hoặc thiếu Truth
- Cột "Kiểm tra tự động" ([SKILLS_DIR]/references/verification.md): `exports`, `min_lines`, `contains`, `imports`, `calls`
### Tầng 3 — Key Links
**"Artifacts kết nối thế nào? Link đứt → Truth nào fail?"**
Controller → Service → Repository → Database | Component → API → Endpoint | Hook → Filter → Action | Contract → Interface → Event
### Phân tích gap (bắt buộc)
1. Truth → Task coverage: mỗi Truth ≥1 task?
2. Artifact → Thiết kế coverage: mỗi artifact trong thiết kế?
3. Key Link → Dependency coverage: liên kết phản ánh đúng dependency?
Gap → bổ sung thiết kế/files/task.
Ghi vào PLAN.md "Tiêu chí thành công" ([SKILLS_DIR]/templates/plan.md).
---
## Bước 4.5: Ghi nhận quyết định thiết kế
> **Thực hiện khi** Claude tự đưa ra ≥1 quyết định mà user KHÔNG thảo luận:
> - AUTO → LUÔN thực hiện
> - DISCUSS skip-all → thực hiện
> - DISCUSS cancel → thực hiện cho vấn đề CHƯA thảo luận
> - DISCUSS chọn một số (skip phần còn lại) → thực hiện cho vấn đề KHÔNG chọn
> - DISCUSS thảo luận TẤT CẢ → **bỏ qua**
> - DISCUSS 0 vấn đề cần quyết định → **bỏ qua**
Sau thiết kế (Bước 4), Claude PHẢI review lại:
1. Xác định vấn đề có nhiều cách triển khai hợp lệ
2. Mỗi vấn đề ghi: Phương án chọn, Lý do, Alternatives đã loại
3. Lưu bảng "Quyết định thiết kế" trong PLAN.md
**Mục đích**: developer review quyết định Claude tự đưa ra, phát hiện sớm lỗi business logic TRƯỚC khi code.
---
## Bước 5: Chia công việc
CONTEXT.md → Tech Stack → Backend, Frontend, hoặc cả hai. Xem [SKILLS_DIR]/references/prioritization.md.
Nguyên tắc:
1. **Entity/Model trước** → Service → Controller → DTO (Backend)
2. **Backend + Frontend**: Backend API trước → Frontend consume sau (khi frontend cần data từ API mới)
3. **Frontend-only** (UI, SEO, layout): KHÔNG cần chờ backend, làm độc lập
4. **Core logic trước** → Validation sau
5. **Module mới** = 1 task riêng
6. Mỗi task: atomic, tối đa 5-7 files, tiêu chí chấp nhận rõ ràng
7. Ghi rõ **Loại**: `Backend` | `Frontend` | `Fullstack` | `[Stack khác]`
8. **Truths truy vết** (goal-backward): mỗi task PHẢI ghi Truth phục vụ (`T1, T2`). Cross-check: mỗi Truth ≥1 task phủ. Thiếu → thêm task hoặc mở rộng task hiện có
9. **Stack khác** (Chrome extension, CLI...): thứ tự theo đặc thù (config/manifest → core logic → UI)
10. **Dependency chính xác** cho parallel execution: ghi task number cụ thể (`Task A`). Phân biệt:
   - **Phụ thuộc code**: task B import/dùng function task A → ghi `Task A`
   - **Phụ thuộc design**: dùng response shape từ PLAN.md (không cần code thực) → ghi `Không` (parallel-safe)
   - **Phụ thuộc file**: sửa chung file → ghi `Task A (shared file)`
11. **Effort level** (TOKN-04): mỗi task PHẢI có `Effort:` trong metadata. Mặc định: `standard`.
12. **`> Files:` bắt buộc** (PARA-03): plan có >= 3 tasks → planner PHẢI ghi đầy đủ `> Files:` field cho mỗi task. Dựa trên Ghi chú kỹ thuật + mô tả task. Không cần chính xác 100% — heuristic đủ cho conflict detection. Thiếu `> Files:` → parallel mode không thể phân tích conflict → kém hiệu quả. Ghi CẢ files tạo mới VÀ files sửa
### Phân loại effort cho task
| Tín hiệu | simple | standard | complex |
|----------|--------|----------|---------|
| Files sửa/tạo | 1-2 | 3-4 | 5+ |
| Số Truths | 1 | 2-3 | 4+ |
| Phụ thuộc | 0 | 1-2 | 3+ |
| Đa domain | không | không | có |
Ví dụ:
- simple: đổi tên biến, thêm import, sửa typo, cập nhật config
- standard: tạo component mới, API endpoint, bộ unit test
- complex: refactor nhiều file, quyết định kiến trúc, tích hợp
Planner CÓ THỂ override guidelines dựa trên hiểu biết context.
---
## Bước 6: Tạo PLAN.md
Viết PLAN.md theo mẫu [SKILLS_DIR]/templates/plan.md tại `.planning/milestones/[version]/phase-[phase]/PLAN.md`.
**Lưu ý:**
- **CHỈ tạo sections có dữ liệu** — bỏ sections không liên quan stack (VD: bỏ API Endpoints nếu không có backend, bỏ Database nếu không có DB)
- **Section "Quyết định thiết kế"**: LUÔN tạo ở CẢ HAI chế độ:
  - **AUTO thuần** (hoặc DISCUSS skip-all) → bảng mở rộng (Lý do + Alternatives)
  - **DISCUSS thuần** (user thảo luận TẤT CẢ) → bảng gốc (cột Nguồn)
  - **DISCUSS hybrid** → bảng gốc + ghi chú Lý do/Alternatives cho vấn đề Claude quyết
  - Không có quyết định → "Tất cả đã xác định rõ từ ROADMAP/CONTEXT."
---
## Bước 7: Tạo TASKS.md
Theo [SKILLS_DIR]/templates/tasks.md. Sắp xếp theo [SKILLS_DIR]/references/prioritization.md + quy tắc Bước 5.
---
## Bước 8: Cập nhật tracking
**CURRENT_MILESTONE.md** ([SKILLS_DIR]/templates/current-milestone.md):
- CHỈ cập nhật `phase` nếu: phase hiện tại chưa plan, hoặc đã hoàn tất
- KHÔNG cập nhật nếu phase đang thực hiện (user pre-plan phase sau)
- Cập nhật `status` → `Đang thực hiện` (nếu `Chưa bắt đầu`)
**STATE.md** ([SKILLS_DIR]/templates/state.md):
- `Hoạt động cuối: [DD_MM_YYYY] — Lên kế hoạch phase [x.x] hoàn tất`
- CHỈ cập nhật Phase + Kế hoạch nếu CURRENT_MILESTONE phase cũng đổi (tránh desync)
**ROADMAP.md:** milestone `⬜` → `🔄`
---
## Bước 8.1: Kiểm tra plan
> Plan checker tự động — chạy sau tracking update (Bước 8), trước git commit (Bước 8.5).
> CLI: `bin/plan-check.js` (Phase 16). Step này KHÔNG tạo code mới — chỉ chạy CLI và xử lý kết quả.
### A. Chạy plan checker
Chạy plan checker từ terminal:
```
node bin/plan-check.js <plan-dir>
```
Trong đó `<plan-dir>` = `.planning/milestones/[version]/phase-[phase]/` (thư mục chứa PLAN.md + TASKS.md đã tạo Bước 6-7).
Đọc JSON output. Nếu overall = "block" → sửa trước khi tiếp tục. Nếu "warn" → xem xét, có thể chấp nhận.
### B. Kết quả PASS (D-01)
Khi `result.overall === 'pass'` — hiển thị summary table rồi tiếp tục Bước 8.5:
```markdown
### Kiểm tra plan
| Check | Kết quả |
|-------|---------|
<!-- Iterate qua result.checks array, mỗi check 1 dòng: -->
| {check.checkId}: {tên mô tả} | PASS |
**Kết quả: PASS** — Plan đạt chất lượng, tiếp tục commit.
```
Check name mapping (dùng cho PASS table và ISSUES FOUND headers):
- CHECK-01 = Requirement Coverage
- CHECK-02 = Task Completeness
- CHECK-03 = Dependency Correctness
- CHECK-04 = Truth-Task Coverage
- CHECK-05 = Logic Coverage
- ADV-01 = Key Links
- ADV-02 = Scope Thresholds
- ADV-03 = Effort Classification
**Quan trọng:** Iterate qua `result.checks` array — KHÔNG hardcode tên check. Khi có check mới, chỉ cần thêm vào mapping trên.
### C. Kết quả ISSUES FOUND (D-02, D-03, D-04)
Khi `result.overall === 'block'` hoặc `result.overall === 'warn'` — hiển thị report:
```markdown
### Kiểm tra plan
**Kết quả: ISSUES FOUND**
#### CHECK-01: Requirement Coverage — BLOCK
- [issue.message cho từng issue]
#### CHECK-02: Task Completeness — PASS
#### ADV-02: Scope Thresholds — WARN
- [issue.message cho từng issue]
```
Quy tắc:
- **Nhóm theo check**: mỗi check có issues → header + danh sách issues. Check PASS → hiển thị 1 dòng: `#### {checkId}: {Tên} — PASS` (D-02)
- **Chỉ hiển thị `issue.message`** — KHÔNG hiển thị `issue.fixHint` (fixHint dùng nội bộ khi Claude auto-fix) (D-03)
- **Tối đa 10 issues** hiển thị. Nếu tổng issues > 10, hiển thị 10 đầu tiên rồi ghi `+ [N] issues khác` ở cuối (D-04)
### D. Lựa chọn của user (D-07, D-08)
**Trước khi hiển thị lựa chọn**, kiểm tra cảnh báo tích lũy (D-13):
- Đọc STATE.md section "Bối cảnh tích lũy", đếm entries khớp pattern `[Phase * Plan Check]: Plan * proceed with * warnings` trong milestone hiện tại
- Nếu >= 3 entries:
  ```markdown
  > Lưu ý: [N] plans gần đây đều có warnings được proceed. Review lại chất lượng plan nếu cần.
  ```
  Đây là thông tin — KHÔNG block hoặc thay đổi options.
Sau khi hiển thị ISSUES FOUND report, **LUÔN hỏi user** — kể cả khi chỉ có WARN (D-07):
```
request_user_input({
  questions: [{
    question: "Plan có issues. Bạn muốn xử lý thế nào?",
    header: "Kiểm tra plan",
    multiSelect: false,
    options: [
      { label: "Fix (Đề xuất)", description: "Claude tự động sửa issues và kiểm tra lại" },
      { label: "Proceed with warnings", description: "Bỏ qua issues, tiếp tục commit" },
      { label: "Cancel", description: "Giữ plan trên disk, ghi note vào STATE.md" }
    ]
  }]
})
```
### E. Fix path (D-05, D-06)
Khi user chọn "Fix":
1. Claude đọc tất cả issues (bao gồm `fixHint` từ result) và tự sửa trực tiếp vào PLAN.md và/hoặc TASKS.md (D-05)
2. Sau khi sửa, re-run `node bin/plan-check.js <plan-dir>` với nội dung đã cập nhật (D-06)
3. Nếu pass → hiển thị PASS report (mục B) → tiếp tục Bước 8.5
4. Nếu vẫn có issues → hiển thị ISSUES FOUND report (mục C) → hỏi user lại (mục D)
5. **Tối đa 3 lần re-run**. Sau lần fix thứ 3 vẫn fail → gợi ý Cancel (Claude discretion)
### F. Proceed path — chỉ WARN (D-12)
Khi user chọn "Proceed with warnings" và `result.overall === 'warn'` (không có BLOCK):
1. Ghi acknowledged warnings vào STATE.md section "Bối cảnh tích lũy" > Quyết định:
   `- [Phase [N] Plan Check]: Plan [phase]-[plan] proceed with [count] warnings acknowledged: [danh sách check + tóm tắt issue]`
2. Tiếp tục Bước 8.5
### G. Proceed path — có BLOCK (D-09, D-10)
Khi user chọn "Proceed with warnings" và result chứa BLOCK issues:
1. Hiển thị xác nhận riêng (D-09):
```
request_user_input({
  questions: [{
    question: "Plan có BLOCK issues. Xác nhận force proceed?",
    header: "Cảnh báo: BLOCK issues",
    multiSelect: false,
    options: [
      { label: "Force proceed", description: "Bỏ qua BLOCK issues — sẽ ghi audit vào STATE.md" },
      { label: "Quay lại (Đề xuất)", description: "Chọn lại: Fix hoặc Cancel" }
    ]
  }]
})
```
2. "Quay lại" → quay về lựa chọn mục D
3. "Force proceed" → ghi BLOCK audit vào STATE.md "Bối cảnh tích lũy" > Quyết định (D-10):
   `- [Phase [N] Plan Check]: Plan [phase]-[plan] proceed with [count] BLOCK overrides: [danh sách check + tóm tắt issue]`
4. Nếu có cả WARN → ghi thêm WARN acknowledgments (D-12)
5. Tiếp tục Bước 8.5
### H. Cancel path (D-11)
Khi user chọn "Cancel":
1. Giữ PLAN.md + TASKS.md trên disk — KHÔNG xóa (D-11)
2. Ghi cancel note vào STATE.md "Bối cảnh tích lũy" > Quyết định:
   `- [Phase [N] Plan Check]: Plan [phase]-[plan] cancelled — [count] BLOCK issues, [count] WARN issues found`
3. **DỪNG workflow** — KHÔNG tiếp tục Bước 8.5 hoặc Bước 9
### I. Re-plan (Claude discretion)
Bước 8.1 chạy giống nhau bất kể plan được tạo mới hay load từ disk qua Bước 1.5 "Giữ nguyên". Checker là idempotent. Nếu plan giữ nguyên và đã kiểm tra trước đó, kết quả sẽ giống. Không cần xử lý đặc biệt.
---
## Bước 8.5: Git commit (CHỈ nếu có git)
```bash
git add .planning/milestones/[version]/phase-[phase]/RESEARCH.md 2>/dev/null
git add .planning/milestones/[version]/phase-[phase]/PLAN.md
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/milestones/[version]/phase-[phase]/DISCUSS_STATE.md 2>/dev/null
git add .planning/CURRENT_MILESTONE.md .planning/ROADMAP.md
git add .planning/STATE.md 2>/dev/null
git commit -m "docs: kế hoạch phase [x.x] — [mục tiêu ngắn gọn]
Tasks: [N] tasks | Loại: [Backend/Frontend/Fullstack]"
```
---
## Bước 9: Thông báo
In tóm tắt plan + tasks.
- **Goal-backward**: bảng Truths + coverage. Truth chưa phủ → cảnh báo
- Phase vừa plan KHÁC phase hiện tại → ghi rõ: "Plan cho phase [y.y] (chưa active)."
- AUTO/DISCUSS skip/hybrid (có quyết định Claude tự đưa ra):
  ```
  ### Claude đã tự quyết định [N] vấn đề:
  | # | Vấn đề | Phương án | Lý do tóm tắt |
  Chi tiết trong PLAN.md → "Quyết định thiết kế".
  ⚠️ Review trước khi viết code. Cần thay đổi → `$pd-plan --discuss`.
  ```
</process>
<output>
**Create/Update:**
- `.planning/milestones/[version]/phase-[phase]/RESEARCH.md`
- `.planning/milestones/[version]/phase-[phase]/PLAN.md`
- `.planning/milestones/[version]/phase-[phase]/TASKS.md`
**Next step:** `$pd-write-code`
**Success when:**
- The plan covers all requirements for the phase.
- The tasks are specific enough to execute.
- The research section provides enough context for implementation.
**Common errors:**
- FastCode MCP is not connected -> check that the service is running.
- Missing `ROADMAP.md` -> run `$pd-new-milestone` first.
- The phase does not exist in `ROADMAP` -> check the phase number.
</output>
<rules>
- All output MUST be in English.
- Follow the `--auto`/`--discuss` mode strictly: `auto` does not ask questions, `discuss` lists options for the user.
- DO NOT write source code during the planning step, only design and task breakdown.
- The research section MUST check existing libraries before proposing any new dependency.
- Tuân thủ `.planning/rules/` (ngôn ngữ, ngày tháng, version, icon, bảo mật)
- Tái sử dụng code/thư viện có sẵn
- Task backend + frontend TÁCH RIÊNG, ghi Loại + dependency. Frontend-only → độc lập
- Docs/: chỉ mục lục + sections liên quan, KHÔNG toàn bộ
- KHÔNG hỏi FastCode thông tin đã có trong SCAN_REPORT. FastCode lỗi → Grep/Read, warning
- RESEARCH.md LUÔN tạo (dù ngắn). Đã tồn tại + user "Dùng lại" → skip Bước 3
- Hệ sinh thái: BỎ QUA nếu CRUD cơ bản
- Độ tin cậy nguồn: Context7/FastCode/docs = CAO, WebSearch+verify = TB, Claude = THẤP
- AUTO: KHÔNG hỏi user thiết kế — tự quyết tất cả
- DISCUSS: request_user_input cho mọi lựa chọn. Không khả dụng → văn bản thường (KHÔNG gõ A/B/C)
- DISCUSS: PHẢI chờ user trả lời — KHÔNG tự chọn thay
- DISCUSS: Skip-all → chuyển AUTO. Cancel → GIỮ chốt + Claude quyết phần còn lại → 3.5.3
- DISCUSS: "Other" → luôn cho phép tự mô tả. "back"/"cancel" navigation
- DISCUSS: Thiết kế PHẢI phản ánh đúng quyết định user — vi phạm = lỗi
- DISCUSS: 3.5.3 ↔ 3.5.4 vòng lặp đến khi "Tiếp tục" hoặc hết vấn đề. "Thảo luận thêm" → vấn đề MỚI chỉ
- DISCUSS: Ngôn ngữ options đơn giản — viết cho người không phải dev
**Goal-backward (Bước 4.3):**
- LUÔN thực hiện — KHÔNG bỏ qua
- Truths 5 cột (Sự thật + Giá trị nghiệp vụ + Trường hợp biên + Cách kiểm chứng). 2-7 Truths/phase
- Mỗi Truth có cách kiểm chứng. Mỗi task ≥1 Truth, mỗi Truth ≥1 task
- "Tiêu chí thành công" BẮT BUỘC trong PLAN.md — nhất quán với ROADMAP
**Khôi phục:**
- PLAN.md + TASKS.md tồn tại (tất cả ⬜) → PHẢI hỏi user giữ/làm lại
- CHỈ PLAN.md → cho phép tạo TASKS.md từ PLAN.md hiện có
- Giữ nguyên → nhảy Bước 8 cập nhật tracking
</rules>
