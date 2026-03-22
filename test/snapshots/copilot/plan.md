---
name: pd:plan
description: Lập kế hoạch kỹ thuật + chia danh sách công việc cho milestone hiện tại
---
<objective>
Research dự án, thiết kế giải pháp kỹ thuật, chia tasks cụ thể.
`--auto` (mặc định): Claude tự quyết | `--discuss`: thảo luận tương tác, user chọn
</objective>
<guards>
DUNG va huong dan user neu bat ky dieu kien nao that bai:
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
- [ ] `.planning/ROADMAP.md` ton tai -> "Chay `/pd:new-milestone` truoc."
- [ ] `.planning/CURRENT_MILESTONE.md` ton tai -> "Thieu CURRENT_MILESTONE.md. Chay `/pd:new-milestone` de tao."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
- [ ] Context7 MCP ket noi thanh cong -> "Kiem tra Context7 MCP da duoc cau hinh."
- [ ] Context7 MCP hoat dong (thu resolve-library-id "react") -> "Context7 khong phan hoi. Kiem tra ket noi MCP."
</guards>
<context>
User input: $ARGUMENTS
- `--discuss` -> DISCUSS | mặc định/`--auto` -> AUTO | cả hai -> ưu tiên `--discuss`
- Phần còn lại = thông tin phase/deliverable
Đọc thêm:
- `.planning/PROJECT.md` -> tầm nhìn, ràng buộc
- `.planning/rules/general.md` -> quy tắc chung
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> theo stack (CHỈ nếu tồn tại)
</context>
<required_reading>
Đọc .pdconfig → lấy SKILLS_DIR, rồi đọc các files sau trước khi bắt đầu:
(Claude Code: cat ~/.copilot/.pdconfig — nền tảng khác: converter tự chuyển đổi đường dẫn)
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
</conditional_reading>
<process>
## Bước 1: Đọc context
- `.planning/PROJECT.md` → tầm nhìn, đối tượng, ràng buộc
- `.planning/ROADMAP.md`
- `.planning/CURRENT_MILESTONE.md` → version + phase
- `.planning/REQUIREMENTS.md` → yêu cầu với mã, bảng theo dõi
- `.planning/STATE.md` → trạng thái, bối cảnh tích lũy, vấn đề chặn
- `.planning/scan/SCAN_REPORT.md` → hiện trạng, thư viện, patterns
- `.planning/research/SUMMARY.md` → nghiên cứu lĩnh vực, thư viện, cạm bẫy
- `.planning/docs/*.md` → chỉ đọc mục lục + sections liên quan (offset/limit)
- `$ARGUMENTS` chỉ định phase → dùng phase đó
- Có phases trước → đọc PLAN.md/TASKS.md nắm context đã triển khai
Chưa có roadmap → "Chạy `/pd:new-milestone` trước."
CURRENT_MILESTONE.md không tồn tại → "Thiếu. Chạy `/pd:new-milestone`."
Status = `Hoàn tất toàn bộ` → **DỪNG**: "Tất cả milestones hoàn tất. Chạy `/pd:new-milestone`."
Phase không có deliverables → **DỪNG**: "Phase [x.x] chưa có deliverables. Cập nhật ROADMAP."
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
Dùng `fastcode/code_qa` (repos: đường dẫn dự án từ CONTEXT.md) kết hợp search/read:
1. **Code tái sử dụng**: "Liệt kê utility functions, helpers, shared services có thể tái sử dụng."
2. **Backend patterns** (nếu có): "Patterns controllers, services, DTOs, entities, response format đang dùng."
3. **Database schema** (nếu có): "Database schema hiện tại: entities, fields, relationships."
4. **Frontend patterns** (nếu có): "Patterns components, stores, API calls, pages đang dùng."
Dùng FastCode cho câu hỏi broad, search/read verify chi tiết cụ thể.
FastCode lỗi → search/read fallback. Warning: "FastCode lỗi — chạy `/pd:init` kiểm tra."
FastCode trả rỗng tất cả → cảnh báo: "Nên chạy `/pd:scan`." Tiếp tục với context hạn chế.
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
**Độ tin cậy:** Context7/FastCode/docs = CAO | search_web + verify = TB | Claude chưa verify = THẤP `[cần verify]`
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
- Hiển thị `AskUserQuestion`: 1 vấn đề → single select. 2-4 → multiSelect. 5+ → hỏi phạm vi trước, chia nhóm ≤4
### 3.5.2: Thảo luận từng vấn đề
Với MỖI vấn đề đã chọn:
1. Tiêu đề + bối cảnh (viết cho người KHÔNG phải dev)
2. AskUserQuestion single select: option đầu = recommend "(Đề xuất)", tối đa 4 + Other
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
- Mỗi Truth có cách kiểm chứng cụ thể
- Bao phủ happy path + edge cases. Tối thiểu 2, tối đa 7
### Tầng 2 — Artifacts
Từ mỗi Truth suy ngược: **"File/module nào PHẢI tồn tại?"**
- Cross-check với "Files tạo/sửa" Bước 4 — file không phục vụ Truth → thừa hoặc thiếu Truth
- Cột "Kiểm tra tự động" ([SKILLS_DIR]/references/verification-patterns.md): `exports`, `min_lines`, `contains`, `imports`, `calls`
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
  ⚠️ Review trước khi viết code. Cần thay đổi → `/pd:plan --discuss`.
  ```
</process>
<output>
**Tao/Cap nhat:**
- `.planning/milestones/[version]/phase-[phase]/RESEARCH.md`
- `.planning/milestones/[version]/phase-[phase]/PLAN.md`
- `.planning/milestones/[version]/phase-[phase]/TASKS.md`
**Buoc tiep theo:** `/pd:write-code`
**Thanh cong khi:**
- Plan bao phu tat ca requirements cua phase
- Tasks cu the, co the thuc hien tung cai
- Research du context cho implementation
**Loi thuong gap:**
- FastCode MCP khong ket noi -> kiem tra Docker dang chay
- Thieu ROADMAP.md -> chay `/pd:new-milestone` truoc
- Phase khong ton tai trong ROADMAP -> kiem tra lai so phase
</output>
<rules>
- Moi output PHAI bang tieng Viet co dau
- Ton trong che do --auto/--discuss: auto khong hoi, discuss liet ke options
- KHONG viet code trong buoc plan -- chi thiet ke va chia tasks
- Research PHAI kiem tra thu vien hien co truoc khi de xuat them dependency moi
- Tuân thủ `.planning/rules/` (ngôn ngữ, ngày tháng, version, icon, bảo mật)
- Tái sử dụng code/thư viện có sẵn
- Task backend + frontend TÁCH RIÊNG, ghi Loại + dependency. Frontend-only → độc lập
- Docs/: chỉ mục lục + sections liên quan, KHÔNG toàn bộ
- KHÔNG hỏi FastCode thông tin đã có trong SCAN_REPORT. FastCode lỗi → search/read, warning
- RESEARCH.md LUÔN tạo (dù ngắn). Đã tồn tại + user "Dùng lại" → skip Bước 3
- Hệ sinh thái: BỎ QUA nếu CRUD cơ bản
- Độ tin cậy nguồn: Context7/FastCode/docs = CAO, search_web+verify = TB, Claude = THẤP
- AUTO: KHÔNG hỏi user thiết kế — tự quyết tất cả
- DISCUSS: AskUserQuestion cho mọi lựa chọn. Không khả dụng → văn bản thường (KHÔNG gõ A/B/C)
- DISCUSS: PHẢI chờ user trả lời — KHÔNG tự chọn thay
- DISCUSS: Skip-all → chuyển AUTO. Cancel → GIỮ chốt + Claude quyết phần còn lại → 3.5.3
- DISCUSS: "Other" → luôn cho phép tự mô tả. "back"/"cancel" navigation
- DISCUSS: Thiết kế PHẢI phản ánh đúng quyết định user — vi phạm = lỗi
- DISCUSS: 3.5.3 ↔ 3.5.4 vòng lặp đến khi "Tiếp tục" hoặc hết vấn đề. "Thảo luận thêm" → vấn đề MỚI chỉ
- DISCUSS: Ngôn ngữ options đơn giản — viết cho người không phải dev
**Goal-backward (Bước 4.3):**
- LUÔN thực hiện — KHÔNG bỏ qua
- Truths dạng khẳng định ("User có thể X" — KHÔNG "Triển khai X"). 2-7 Truths/phase
- Mỗi Truth có cách kiểm chứng. Mỗi task ≥1 Truth, mỗi Truth ≥1 task
- "Tiêu chí thành công" BẮT BUỘC trong PLAN.md — nhất quán với ROADMAP
**Khôi phục:**
- PLAN.md + TASKS.md tồn tại (tất cả ⬜) → PHẢI hỏi user giữ/làm lại
- CHỈ PLAN.md → cho phép tạo TASKS.md từ PLAN.md hiện có
- Giữ nguyên → nhảy Bước 8 cập nhật tracking
</rules>
