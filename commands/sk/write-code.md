---
name: sk:write-code
description: Viết code theo task, JSDoc tiếng Việt, lint, build, commit và báo cáo
---

<objective>
Viết code theo task từ PLAN.md/TASKS.md, tuân thủ coding style trong CONTEXT.md, chạy lint + build, commit và tạo báo cáo.
</objective>

<context>
User input: $ARGUMENTS

Đọc `.planning/CONTEXT.md` → tech stack, coding style, quy tắc commit.
Nếu chưa có → thông báo chạy `/sk:init` trước.
</context>

<process>

## Bước 1: Xác định task
- Đọc `.planning/CURRENT_MILESTONE.md` → version
- Đọc `.planning/milestones/[version]/PLAN.md` → thiết kế kỹ thuật
- Đọc `.planning/milestones/[version]/TASKS.md` → danh sách tasks

Chọn task:
- Nếu `$ARGUMENTS` chỉ định task number → dùng task đó
- Nếu không → task tiếp theo ⬜ không bị ❌
- **Nếu TẤT CẢ tasks bị ❌**: thông báo user danh sách blocked + lý do. KHÔNG pick bừa.

Cập nhật trạng thái → 🔄

## Bước 2: Đọc context cho task
- Chi tiết task trong TASKS.md (mô tả, checklist, ghi chú kỹ thuật)
- PLAN.md sections liên quan (thiết kế kỹ thuật, API, database)
- `.planning/docs/*.md` → chỉ đọc **mục lục nhanh**, rồi đọc sections liên quan đến task bằng offset/limit
- CONTEXT.md đã chứa đầy đủ quy tắc code (Controller, Service, DTO, Entity, decorator ordering)

## Bước 3: Research code hiện có
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
1. "Patterns đang dùng cho [loại file cần tạo]."
2. "Functions/services tái sử dụng cho [task]."

Nếu FastCode MCP lỗi khi gọi → DỪNG, thông báo user chạy `/sk:init` kiểm tra lại.

## Bước 4: Viết code
Tuân thủ **quy tắc code trong CONTEXT.md**. Đặc biệt:

- **JSDoc + Logger + Error messages + Comments** → TIẾNG VIỆT CÓ DẤU
- **Tên biến/function/class/file** → tiếng Anh
- **Giới hạn file**: mục tiêu 300 dòng, BẮT BUỘC tách >500
- **Database migration** nếu thay đổi schema:
  - Prisma: `npx prisma migrate dev --name [tên]`
  - MongoDB: migration script hoặc `migrate-mongo`
  - TypeORM: `npx typeorm migration:generate -n [Tên]`

## Bước 5: Lint + Build
```bash
npx eslint src/ --fix 2>&1 | tail -20
npm run build 2>&1 | tail -50
```
Nếu thất bại → sửa code, chạy lại cho đến khi pass.

## Bước 6: Tạo báo cáo
Viết `.planning/milestones/[version]/reports/CODE_REPORT_TASK_[N].md`:

```markdown
# Báo cáo code - Task [N]: [Tên]
> Ngày: [DD_MM_YYYY HH:MM] | Build: Thành công

## Files đã tạo/sửa
| Hành động | File | Mô tả ngắn |

## API Endpoints (nếu có)
| Phương thức | Đường dẫn | Mô tả |

## Database (nếu có)
[Migration + schema thay đổi]

## Ghi chú
[Quyết định kỹ thuật đáng lưu ý, nếu có]
```

## Bước 7: Cập nhật TASKS.md → ✅

## Bước 8: Git commit
```
git add [files đã tạo/sửa]
git commit -m "[TASK-N] [Tóm tắt tiếng Việt]

Mô tả: [Chi tiết task đã hoàn thành]
Files: [danh sách files]"
```

## Bước 9: Thông báo
- Task hoàn thành + files + build status
- Hỏi tiếp tục task tiếp theo không
</process>

<rules>
- Tuân thủ toàn bộ quy tắc code trong CONTEXT.md
- PHẢI đọc PLAN.md + task detail + docs liên quan trước khi code
- PHẢI lint + build sau khi code
- PHẢI commit sau khi pass build, commit message tiếng Việt có dấu
- Docs/: chỉ đọc mục lục + sections liên quan, KHÔNG đọc toàn bộ
- Tái sử dụng code/thư viện có sẵn
- Nếu tasks blocked → THÔNG BÁO user, KHÔNG pick bừa
- Nếu FastCode MCP lỗi → DỪNG, yêu cầu chạy `/sk:init`
</rules>
