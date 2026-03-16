---
name: sk:plan
description: Lập kế hoạch kỹ thuật + chia danh sách công việc cho milestone hiện tại
---

<objective>
Research dự án, thiết kế giải pháp kỹ thuật, chia thành danh sách công việc cụ thể. Tạo PLAN.md và TASKS.md trong một bước.
</objective>

<context>
User input: $ARGUMENTS

Đọc `.planning/CONTEXT.md` → tech stack, thư viện, coding style, milestone.
Nếu chưa có → thông báo chạy `/sk:init` trước.
</context>

<process>

## Bước 1: Đọc context
- `.planning/ROADMAP.md`
- `.planning/CURRENT_MILESTONE.md` → lấy version (số thuần)
- `.planning/scan/SCAN_REPORT.md` → hiện trạng, thư viện có sẵn, patterns
- `.planning/docs/*.md` → chỉ đọc **mục lục nhanh** của mỗi doc, đọc chi tiết sections liên quan đến deliverable hiện tại (dùng offset/limit)
- Nếu `$ARGUMENTS` chỉ định phase cụ thể → dùng phase đó

Nếu chưa có roadmap → thông báo chạy `/sk:roadmap` trước.

## Bước 2: Tạo thư mục
- `.planning/milestones/[version]/`
- `.planning/milestones/[version]/reports/`

## Bước 3: Research dự án
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md) kết hợp Grep/Read để thu thập đủ ngữ cảnh:

1. **Code tái sử dụng**: "Liệt kê utility functions, helpers, shared services có thể tái sử dụng."
2. **Patterns đang dùng**: "Patterns controllers, services, DTOs, entities, response format đang dùng."
3. **Database schema**: "Database schema hiện tại: entities, fields, relationships."

Dùng FastCode cho câu hỏi broad. Sau đó dùng Grep/Read verify chi tiết cụ thể nếu cần (VD: đọc file entity thực tế, kiểm tra imports).

Nếu FastCode MCP lỗi khi gọi → DỪNG, thông báo user chạy `/sk:init` kiểm tra lại.

**KHÔNG hỏi lại thông tin đã có trong SCAN_REPORT.**

## Bước 4: Thiết kế kỹ thuật
Cho mỗi deliverable:
- Files cần tạo/sửa
- API endpoints (method, path, request/response)
- Database entities/relations + **migration strategy**:
  - Prisma: `npx prisma migrate dev --name [tên]`
  - MongoDB/Mongoose: migration script hoặc `migrate-mongo`
  - TypeORM: `npx typeorm migration:generate -n [Tên]`
- DTOs, validators
- Guards, middleware
- Thư viện cần thêm

## Bước 5: Chia công việc
Nguyên tắc:
1. **Entity/Model trước** → Service → Controller → DTO
2. **Backend trước** → Frontend sau
3. **Core logic trước** → Validation sau
4. **Module mới** = 1 task riêng
5. **Frontend cho API** = task riêng, phụ thuộc backend
6. Mỗi task: atomic, tối đa 5-7 files, tiêu chí chấp nhận rõ ràng

## Bước 6: Tạo PLAN.md
Viết `.planning/milestones/[version]/PLAN.md`:

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
Viết `.planning/milestones/[version]/TASKS.md`:

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

## Bước 8: Thông báo
In tóm tắt plan + danh sách tasks cho user review.
</process>

<rules>
- Tuân thủ quy tắc trong CONTEXT.md (ngôn ngữ, ngày tháng, version, icon, bảo mật)
- Ưu tiên tái sử dụng code/thư viện có sẵn
- Task backend + frontend TÁCH RIÊNG, ghi rõ Loại + dependency
- Docs/: chỉ đọc mục lục + sections liên quan, KHÔNG đọc toàn bộ
- KHÔNG hỏi lại FastCode thông tin đã có trong SCAN_REPORT
- Nếu FastCode MCP lỗi → DỪNG, yêu cầu chạy `/sk:init`
</rules>
