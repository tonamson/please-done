---
name: sk:plan
description: Lập kế hoạch kỹ thuật + chia danh sách công việc cho milestone hiện tại
---

<objective>
Research dự án, thiết kế giải pháp kỹ thuật, chia thành danh sách công việc cụ thể. Tạo PLAN.md và TASKS.md trong một bước.
</objective>

<context>
User input: $ARGUMENTS

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
Nếu CURRENT_MILESTONE status = `Hoàn tất toàn bộ` → **DỪNG**, thông báo: "Tất cả milestones đã hoàn tất. Chạy `/sk:roadmap` để thêm milestones mới."

## Bước 1.5: Kiểm tra phase đã tồn tại
Nếu `.planning/milestones/[version]/phase-[phase]/TASKS.md` đã tồn tại:
- Đọc TASKS.md → kiểm tra có task ✅ hoặc 🔄 không
- Nếu CÓ tasks đã hoàn thành → **CẢNH BÁO**:
  > "Phase [x.x] đã có plan với [N] task hoàn thành. Bạn muốn:
  > 1. LÊN KẾ HOẠCH LẠI phase này (ghi đè)
  > 2. CHUYỂN SANG phase chưa có plan: [liệt kê phases chưa plan từ ROADMAP]
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

## Bước 4: Thiết kế kỹ thuật
Cho mỗi deliverable, thiết kế theo loại:

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

## Bước 6: Tạo PLAN.md
Viết `.planning/milestones/[version]/phase-[phase]/PLAN.md`:

```markdown
# Kế hoạch triển khai
> Milestone: [tên] (v[x.x])
> Phase: [x.x]
> Ngày tạo: [DD_MM_YYYY]

## Mục tiêu
[Mô tả]

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
- Cập nhật field `phase` thành phase vừa lên kế hoạch
- Cập nhật field `status` → `Đang thực hiện` (nếu đang là `Chưa bắt đầu`)

**ROADMAP.md:**
- Tìm milestone hiện tại → cập nhật `Trạng thái: ⬜` → `Trạng thái: 🔄` (nếu đang là ⬜)

## Bước 9: Thông báo
In tóm tắt plan + danh sách tasks cho user review.
</process>

<rules>
- Tuân thủ quy tắc trong `.planning/rules/` (ngôn ngữ, ngày tháng, version, icon, bảo mật)
- Ưu tiên tái sử dụng code/thư viện có sẵn
- Task backend + frontend TÁCH RIÊNG, ghi rõ Loại (Backend/Frontend/Fullstack) + dependency
- Frontend-only tasks (UI, SEO, layout) được làm độc lập, KHÔNG cần chờ backend
- Docs/: chỉ đọc mục lục + sections liên quan, KHÔNG đọc toàn bộ
- KHÔNG hỏi lại FastCode thông tin đã có trong SCAN_REPORT
- Nếu FastCode MCP lỗi → DỪNG, yêu cầu chạy `/sk:init`
</rules>
