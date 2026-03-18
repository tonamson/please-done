---
name: sk:plan
description: Lập kế hoạch kỹ thuật + chia danh sách công việc cho milestone hiện tại
---

<objective>
Research dự án, thiết kế giải pháp kỹ thuật, chia thành danh sách công việc cụ thể. Tạo PLAN.md và TASKS.md trong một bước.
Hỗ trợ 2 chế độ:
- `--auto` (mặc định): Claude tự quyết định toàn bộ thiết kế, tính năng, giải pháp kỹ thuật
- `--discuss`: Thảo luận tương tác — Claude liệt kê các vấn đề cần quyết định, user chọn vấn đề muốn bàn, Claude đưa ra options cho từng vấn đề
</objective>

<context>
User input: $ARGUMENTS

Phân tích tham số:
- Nếu `$ARGUMENTS` chứa `--discuss` → chế độ DISCUSS
- Ngược lại (mặc định, kể cả khi có `--auto` hoặc không có flag) → chế độ AUTO
- Nếu cả `--discuss` lẫn `--auto` xuất hiện → ưu tiên `--discuss`
- Phần còn lại của `$ARGUMENTS` (bỏ flags) = thông tin phase/deliverable

Đọc:
- `.planning/CONTEXT.md` → tech stack, thư viện, milestone
- `.planning/rules/general.md` → quy tắc chung
- `.planning/rules/backend.md` và/hoặc `.planning/rules/frontend.md` → theo stack có trong project

Nếu chưa có CONTEXT.md → thông báo chạy `/sk:init` trước.
</context>

<process>

## Bước 1: Đọc context
- `.planning/ROADMAP.md`
- `.planning/CURRENT_MILESTONE.md` → lấy version (số thuần) + phase hiện tại
- `.planning/scan/SCAN_REPORT.md` → hiện trạng, thư viện có sẵn, patterns
- `.planning/docs/*.md` → chỉ đọc **mục lục nhanh** của mỗi doc, đọc chi tiết sections liên quan đến deliverable hiện tại (dùng offset/limit)
- Nếu `$ARGUMENTS` chỉ định phase cụ thể → dùng phase đó
- Nếu có phases trước (VD: phase-1.1 tồn tại khi planning phase 1.2) → đọc PLAN.md/TASKS.md phases trước để nắm context đã triển khai

Nếu chưa có roadmap → thông báo chạy `/sk:roadmap` trước.
Nếu CURRENT_MILESTONE.md không tồn tại → thông báo: "Thiếu CURRENT_MILESTONE.md. Chạy `/sk:roadmap` để tạo."
Nếu CURRENT_MILESTONE status = `Hoàn tất toàn bộ` → **DỪNG**, thông báo: "Tất cả milestones đã hoàn tất. Chạy `/sk:roadmap` để thêm milestones mới."

## Bước 1.5: Kiểm tra phase đã tồn tại
Nếu `.planning/milestones/[version]/phase-[phase]/TASKS.md` đã tồn tại:
- Đọc TASKS.md → kiểm tra có task ✅ hoặc 🔄 không
- Nếu CÓ tasks đã hoàn thành (✅) hoặc đang thực hiện (🔄) → **CẢNH BÁO**:
  > "Phase [x.x] đã có plan với tiến trình ([N1] ✅ hoàn tất, [N2] 🔄 đang làm). Bạn muốn:
  > 1. LÊN KẾ HOẠCH LẠI phase này (ghi đè)
  > 2. CHUYỂN SANG phase chưa có plan: [liệt kê phases chưa plan từ ROADMAP] — Cập nhật biến phase sang phase user chọn, quay lại đầu Bước 2 với phase mới.
  > 3. HỦY"
  - Nếu không còn phase nào chưa plan → chỉ hiện option 1 và 3
- Nếu KHÔNG có tasks hoàn thành (tất cả ⬜) → cho phép ghi đè không cần hỏi

## Bước 2: Tạo thư mục
- `.planning/milestones/[version]/phase-[phase]/`
- `.planning/milestones/[version]/phase-[phase]/reports/`

## Bước 3: Research dự án
### Nếu project đã có code:
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md) kết hợp Grep/Read để thu thập đủ ngữ cảnh:

1. **Code tái sử dụng**: "Liệt kê utility functions, helpers, shared services có thể tái sử dụng."
2. **Backend patterns** (nếu có): "Patterns controllers, services, DTOs, entities, response format đang dùng."
3. **Database schema** (nếu có): "Database schema hiện tại: entities, fields, relationships."
4. **Frontend patterns** (nếu có): "Patterns components, stores, API calls, pages đang dùng."

Dùng FastCode cho câu hỏi broad. Sau đó dùng Grep/Read verify chi tiết cụ thể nếu cần (VD: đọc file entity thực tế, kiểm tra imports).

Nếu FastCode MCP lỗi khi gọi → DỪNG, thông báo user chạy `/sk:init` kiểm tra lại.
Nếu FastCode trả về kết quả rỗng cho tất cả queries → cảnh báo: "FastCode không tìm thấy code liên quan. Nên chạy `/sk:scan` để cập nhật index." Tiếp tục thiết kế với context hạn chế.

### Nếu project mới (chưa có code):
- Skip FastCode (không có gì để index)
- Research qua Context7: tra cứu docs của framework/thư viện dự kiến dùng (từ CONTEXT.md)
- Thiết kế dựa trên yêu cầu từ ROADMAP.md + kiến thức về stack

**Tra cứu API thư viện qua Context7** (nếu deliverable dùng thư viện cần research):
1. `mcp__context7__resolve-library-id` (libraryName: tên thư viện, query: mô tả nhu cầu) → lấy library ID
2. `mcp__context7__query-docs` (libraryId: ID, query: câu hỏi API cụ thể) → lấy docs đúng version
- TỰ ĐỘNG tra cứu khi thiết kế cần dùng API thư viện — KHÔNG cần user yêu cầu
- Nếu Context7 MCP không có → dùng `.planning/docs/` hoặc knowledge sẵn có

**KHÔNG hỏi lại thông tin đã có trong SCAN_REPORT.**

## Bước 3.5: Thảo luận tính năng (CHỈ khi chế độ DISCUSS)
> **Bỏ qua bước này nếu chế độ AUTO.**

Sau khi research xong, Claude phân tích deliverable của phase hiện tại và xác định các **vấn đề cần quyết định** — những điểm có nhiều cách triển khai hợp lệ mà lựa chọn khác nhau sẽ ảnh hưởng đến kết quả.

### 3.5.1: Liệt kê vấn đề cần thảo luận
Hiển thị danh sách các vấn đề dạng **checklist có đánh số**, mỗi vấn đề kèm mô tả ngắn 1 dòng:

```
Tôi đã phân tích phase này và xác định [N] vấn đề cần quyết định.
Chọn số thứ tự các vấn đề bạn muốn thảo luận (VD: 1,3,5), hoặc "all" để thảo luận tất cả, hoặc "skip" để tôi tự quyết định:

1. [Tên vấn đề] — [mô tả ngắn]
2. [Tên vấn đề] — [mô tả ngắn]
3. [Tên vấn đề] — [mô tả ngắn]
...
```

**Nếu KHÔNG có vấn đề nào cần quyết định** (tất cả đã rõ ràng từ ROADMAP/CONTEXT) → thông báo user: "Phase này không có vấn đề nào cần thảo luận thêm — tôi sẽ tự quyết định." → chuyển sang Bước 4 (AUTO).

**Cách xác định vấn đề:**
- Scope tính năng (VD: đăng nhập cho trang nào, lấy thông tin gì)
- Phương pháp xác thực (JWT, session, OAuth, v.v.)
- Cấu trúc dữ liệu (fields nào cần lưu, relations)
- UI/UX flow (bao nhiêu bước, redirect đi đâu)
- Tích hợp bên thứ 3 (dùng service nào)
- Phân quyền (roles, permissions model)
- Caching / performance strategy
- Error handling approach
- Chỉ liệt kê vấn đề THỰC SỰ có nhiều lựa chọn hợp lệ — KHÔNG liệt kê những thứ đã rõ ràng từ ROADMAP/CONTEXT

**Chờ user trả lời** trước khi tiếp tục.
- Nếu user nhập số không hợp lệ (ngoài phạm vi 1-N) → thông báo: "Vui lòng nhập số từ 1-[N], 'all', hoặc 'skip'." → chờ lại
- Nếu user nhập text không rõ ý → hỏi lại 1 lần, nếu vẫn không rõ → coi như "skip"

### 3.5.2: Thảo luận từng vấn đề đã chọn
Với MỖI vấn đề user chọn, hiển thị **danh sách options** theo format:

```
### Vấn đề [N]: [Tên vấn đề]
[Giải thích ngắn gọn bối cảnh vấn đề]

Chọn phương án:
  A. [Phương án — recommend] ← đơn giản, hiệu quả nhất
  B. [Phương án khác]
  C. [Phương án khác]
  ... (thêm nếu cần)
  [Chữ cái cuối]. Bạn có cách riêng — mô tả phương án của bạn

Lựa chọn của bạn:
```

**Quy tắc options:**
- **Option A** luôn là recommend — giải pháp tốt nhất, đơn giản nhất, phổ biến nhất
- **Options B-D**: các phương án thay thế, sắp xếp từ đơn giản → phức tạp. Số lượng B-D linh hoạt (2-3 options), KHÔNG cần ép đủ 4 nếu chỉ có 2-3 phương án hợp lý
- **Option cuối** (luôn là chữ cái cuối trong danh sách) LUÔN là: "Bạn có cách riêng — mô tả phương án của bạn". Option này cho phép user tự mô tả giải pháp khác hoàn toàn
- Mỗi option kèm **1 dòng giải thích** ưu/nhược chính
- Nếu user chọn option cuối (cách riêng) → chờ user mô tả → xác nhận hiểu đúng trước khi tiếp

**Chờ user chọn** trước khi chuyển sang vấn đề tiếp theo.
- Nếu user nhập chữ cái không hợp lệ → thông báo options hợp lệ, chờ lại
- Nếu user muốn quay lại vấn đề trước → cho phép: "Gõ 'back' để quay lại vấn đề trước"
- Nếu user muốn hủy toàn bộ thảo luận → cho phép: "Gõ 'cancel' để hủy — tôi sẽ tự quyết định tất cả (AUTO)"

### 3.5.3: Tổng hợp quyết định
Sau khi thảo luận xong TẤT CẢ vấn đề user chọn:
- Hiển thị bảng tóm tắt các quyết định đã chốt
- Các vấn đề user KHÔNG chọn thảo luận → Claude tự quyết định (dùng phương án recommend)
- Chờ user xác nhận trước khi tiếp tục sang Bước 4
- Nếu user muốn thay đổi quyết định → cho phép chọn lại vấn đề cụ thể: "Gõ số vấn đề muốn thay đổi, hoặc 'ok' để tiếp tục"

```
### Tóm tắt quyết định

| # | Vấn đề | Quyết định | Nguồn |
|---|--------|-----------|-------|
| 1 | [Tên] | [Phương án đã chọn] | User chọn |
| 2 | [Tên] | [Phương án recommend] | Claude quyết định |
| ... | ... | ... | ... |

Xác nhận để tôi tiếp tục thiết kế kỹ thuật?
```

## Bước 4: Thiết kế kỹ thuật
Cho mỗi deliverable, thiết kế theo loại:

- Nếu chế độ **DISCUSS**: thiết kế PHẢI tuân thủ các quyết định đã chốt ở Bước 3.5 — KHÔNG được thay đổi hay bỏ qua quyết định user đã chọn
- Nếu chế độ **AUTO**: Claude tự quyết định toàn bộ, ưu tiên phương án đơn giản, hiệu quả nhất. Mọi quyết định sẽ được ghi nhận ở Bước 4.5 sau khi thiết kế xong.

**Backend (nếu có — đọc CONTEXT.md xác định framework: NestJS, Express, v.v.):**
- API endpoints (method, path, request/response)
- Database entities/relations + **migration strategy**:
  - Prisma: `npx prisma migrate dev --name [tên]`
  - MongoDB/Mongoose: migration script hoặc `migrate-mongo`
  - TypeORM: `npx typeorm migration:generate -n [Tên]`
- DTOs, validators
- Guards, middleware

**Frontend (nếu có — đọc CONTEXT.md xác định framework: NextJS, React, v.v.):**
- Pages/routes cần tạo (app/ structure, Server hay Client Component)
- Components cần tạo/sửa (domain folder nào, props interface)
- Zustand stores (state mới hay mở rộng store có sẵn)
- API integration (thêm function vào lib/api.ts hay lib/admin-api.ts)
- UI: Ant Design components dự kiến dùng

**Stack khác (Chrome extension, CLI, v.v.):**
- Thiết kế theo đặc thù stack (VD: manifest.json, background/content scripts, popup UI...)
- Tham khảo docs qua Context7 hoặc `.planning/docs/`

**Chung:**
- Files cần tạo/sửa
- Thư viện cần thêm

## Bước 4.5: Ghi nhận quyết định thiết kế (CHỈ khi chế độ AUTO)
> **Bỏ qua nếu chế độ DISCUSS** (đã xử lý ở Bước 3.5).

Sau khi thiết kế xong (Bước 4), Claude PHẢI review lại và ghi nhận:
1. Xác định các vấn đề đã có nhiều cách triển khai hợp lệ
2. Với mỗi vấn đề, ghi: Phương án chọn, Lý do, Alternatives đã loại
3. Lưu vào bảng "Quyết định thiết kế" trong PLAN.md

**Mục đích**: Cho developer review quyết định Claude tự đưa ra, phát hiện sớm lỗi business logic TRƯỚC khi code.

## Bước 5: Chia công việc
Đọc CONTEXT.md → Tech Stack để xác định project có Backend, Frontend, hay cả hai.

Nguyên tắc:
1. **Entity/Model trước** → Service → Controller → DTO (nếu có Backend)
2. **Nếu có cả Backend + Frontend**: Backend API trước → Frontend consume sau (khi frontend cần data từ API mới)
3. **Nếu task frontend-only** (UI, SEO, layout): KHÔNG cần chờ backend, làm độc lập
4. **Core logic trước** → Validation sau
5. **Module mới** = 1 task riêng
6. Mỗi task: atomic, tối đa 5-7 files, tiêu chí chấp nhận rõ ràng
7. Ghi rõ **Loại** mỗi task: `Backend` | `Frontend` | `Fullstack` | `[Stack khác]`
8. **Stack khác** (Chrome extension, CLI, v.v.): thứ tự theo đặc thù stack (VD: config/manifest trước → core logic → UI)
9. **Dependency chính xác** cho parallel execution: cột `Phụ thuộc` PHẢI ghi rõ task number cụ thể (VD: `Task 1`) — KHÔNG ghi "Không" nếu task thực sự cần dùng function/module từ task trước. Phân biệt:
   - **Phụ thuộc code**: task B import/dùng function task A tạo → ghi `Task A`
   - **Phụ thuộc design**: task Frontend dùng response shape từ PLAN.md (không cần code thực) → ghi `Không` (parallel-safe)
   - **Phụ thuộc file**: task B sửa cùng file task A → ghi `Task A (shared file)`

## Bước 6: Tạo PLAN.md
Viết `.planning/milestones/[version]/phase-[phase]/PLAN.md`:

```markdown
# Kế hoạch triển khai
> Milestone: [tên] (v[x.x])
> Phase: [x.x]
> Chế độ: [Auto | Discuss]
> Ngày tạo: [DD_MM_YYYY]

## Mục tiêu
[Mô tả]

## Quyết định thiết kế
<!-- Chế độ DISCUSS → dùng bảng này: -->
| # | Vấn đề | Quyết định | Nguồn |
|---|--------|-----------|-------|
| 1 | [Tên] | [Phương án] | User chọn / Claude quyết định |

<!-- Chế độ AUTO → dùng bảng này thay thế (KHÔNG dùng bảng DISCUSS): -->
| # | Vấn đề | Phương án đã chọn | Lý do | Alternatives đã loại |
|---|--------|-------------------|-------|---------------------|
| 1 | [Tên] | [Phương án] | [Tại sao chọn] | [PA khác → tại sao loại] |

## Research
### Thư viện có sẵn
| Tên | Phiên bản | Sử dụng cho |
### Code tái sử dụng
| Function/Service | File | Mô tả |
### Tài liệu đã fetch
| Tên | Sections liên quan |

## Thiết kế kỹ thuật
### API Endpoints
| Phương thức | Đường dẫn | Mô tả | Xác thực |
### Database
[Schema + migration strategy]
### DTOs & Validation
### Files cần tạo/sửa
| Hành động | Đường dẫn | Mô tả |
### Thư viện cần thêm

## Thứ tự thực hiện
1. [Bước 1]
2. [Bước 2]

## Lưu ý kỹ thuật
```

**CHỈ tạo sections có dữ liệu** — bỏ sections không liên quan đến stack (VD: bỏ API Endpoints nếu không có backend, bỏ Database nếu không có DB).
**Section "Quyết định thiết kế"**: LUÔN tạo ở CẢ HAI chế độ. AUTO dùng bảng mở rộng (có cột Lý do + Alternatives). DISCUSS dùng bảng gốc (có cột Nguồn). Nếu không có quyết định nào (tất cả đã rõ ràng) → ghi "Không có quyết định thiết kế đặc biệt — tất cả đã xác định rõ từ ROADMAP/CONTEXT."

## Bước 7: Tạo TASKS.md
Viết `.planning/milestones/[version]/phase-[phase]/TASKS.md`:

```markdown
# Danh sách công việc
> Milestone: [tên] (v[x.x]) | Phase: [x.x]
> Ngày tạo: [DD_MM_YYYY] | Tổng: [N]

## Tổng quan
| # | Công việc | Trạng thái | Ưu tiên | Phụ thuộc | Loại |
|---|----------|-----------|---------|-----------|------|

---
## Task 1: [Tên]
> Trạng thái: ⬜ | Ưu tiên: Cao | Phụ thuộc: Không | Loại: Backend
> Files: [...]

### Mô tả
### Tiêu chí chấp nhận
- [ ] ...
### Ghi chú kỹ thuật
```

## Bước 8: Cập nhật tracking
**CURRENT_MILESTONE.md:**
- Đọc field `phase` hiện tại trong CURRENT_MILESTONE.md
- CHỈ cập nhật field `phase` nếu:
  - Phase hiện tại chưa có TASKS.md (chưa được plan) → cập nhật sang phase vừa plan
  - Phase hiện tại đã hoàn tất (tất cả tasks ✅) → cập nhật sang phase vừa plan
  - **KHÔNG cập nhật** nếu phase hiện tại đang thực hiện (có tasks ⬜/🔄) → user đang plan trước cho phase sau
- Cập nhật field `status` → `Đang thực hiện` (nếu đang là `Chưa bắt đầu`)

**ROADMAP.md:**
- Tìm milestone hiện tại → cập nhật `Trạng thái: ⬜` → `Trạng thái: 🔄` (nếu đang là ⬜)

## Bước 9: Thông báo
In tóm tắt plan + danh sách tasks cho user review.
- Nếu phase vừa plan KHÁC phase hiện tại trong CURRENT_MILESTONE → ghi rõ: "Lưu ý: Phase hiện tại vẫn là [x.x]. Plan này cho phase [y.y] (chưa active)."
- Nếu chế độ DISCUSS: ghi nhận số vấn đề đã thảo luận vs tự quyết định
- Nếu chế độ AUTO: in bảng tóm tắt các quyết định Claude đã tự đưa ra (từ Bước 4.5) để user review TRƯỚC khi chạy `/sk:write-code`. Format:
  ```
  ### Claude đã tự quyết định [N] vấn đề thiết kế:
  | # | Vấn đề | Phương án | Lý do tóm tắt |
  |---|--------|----------|---------------|
  Xem chi tiết đầy đủ (bao gồm alternatives đã loại) trong PLAN.md → Section "Quyết định thiết kế".
  ⚠️ Hãy review các quyết định trên trước khi viết code. Nếu cần thay đổi, chạy `/sk:plan --discuss` để thảo luận lại.
  ```
</process>

<rules>
- Tuân thủ quy tắc trong `.planning/rules/` (ngôn ngữ, ngày tháng, version, icon, bảo mật)
- Ưu tiên tái sử dụng code/thư viện có sẵn
- Task backend + frontend TÁCH RIÊNG, ghi rõ Loại (Backend/Frontend/Fullstack) + dependency
- Frontend-only tasks (UI, SEO, layout) được làm độc lập, KHÔNG cần chờ backend
- Docs/: chỉ đọc mục lục + sections liên quan, KHÔNG đọc toàn bộ
- KHÔNG hỏi lại FastCode thông tin đã có trong SCAN_REPORT
- Nếu FastCode MCP lỗi → DỪNG, yêu cầu chạy `/sk:init`
- Chế độ AUTO (mặc định): KHÔNG hỏi user bất kỳ câu hỏi thiết kế nào — tự quyết định tất cả
- Chế độ DISCUSS: PHẢI chờ user trả lời sau mỗi lần hiển thị danh sách/options — KHÔNG tự chọn thay user
- Chế độ DISCUSS: Nếu user chọn "skip" ở bước 3.5.1 → chuyển sang AUTO cho phần còn lại
- Chế độ DISCUSS: Option cuối trong danh sách LUÔN là "Bạn có cách riêng" — KHÔNG được bỏ
- Chế độ DISCUSS: Thiết kế kỹ thuật PHẢI phản ánh đúng quyết định user đã chốt — vi phạm = lỗi
</rules>
