---
name: sk:write-code
description: Viết code theo task, JSDoc tiếng Việt, lint, build, commit và báo cáo
---

<objective>
Viết code theo task từ PLAN.md/TASKS.md, tuân thủ coding style trong `.planning/rules/`, chạy lint + build, commit và tạo báo cáo.
</objective>

<context>
User input: $ARGUMENTS

Đọc:
- `.planning/CONTEXT.md` → tech stack, thư viện, milestone
- `.planning/rules/general.md` → quy tắc chung (luôn đọc)
- `.planning/rules/backend.md` → quy tắc NestJS (đọc khi task Backend/Fullstack)
- `.planning/rules/frontend.md` → quy tắc NextJS (đọc khi task Frontend/Fullstack)

Nếu chưa có CONTEXT.md → thông báo chạy `/sk:init` trước.
</context>

<process>

## Bước 1: Xác định task
- Đọc `.planning/CURRENT_MILESTONE.md` → version + phase + status
- Nếu status = `Hoàn tất toàn bộ` → **DỪNG**, thông báo: "Tất cả milestones đã hoàn tất. Không còn task để thực hiện."
- Kiểm tra `.planning/milestones/[version]/phase-[phase]/TASKS.md` tồn tại:
  - KHÔNG → **DỪNG**, thông báo: "Phase [phase] chưa có plan. Chạy `/sk:plan` trước."
- Đọc `.planning/milestones/[version]/phase-[phase]/PLAN.md` → thiết kế kỹ thuật
- Đọc `.planning/milestones/[version]/phase-[phase]/TASKS.md` → danh sách tasks

Chọn task:
- Nếu `$ARGUMENTS` chỉ định task number → đọc trạng thái task đó:
  - ⬜ hoặc 🔄 → tiếp tục (🔄 = resume task đang làm dở)
  - ✅ → hỏi user: "Task [N] đã hoàn tất. Bạn muốn thực hiện lại?"
  - ❌ → hỏi user: "Task [N] đang bị chặn. Xác nhận vẫn muốn tiếp tục?"
  - 🐛 → thông báo: "Task [N] có lỗi. Nên chạy `/sk:fix-bug` thay vì viết lại code."
- Nếu không → task tiếp theo ⬜ không bị ❌ hoặc 🐛
- **Nếu TẤT CẢ tasks còn lại bị ❌ hoặc 🐛**: thông báo user danh sách blocked/lỗi + lý do. KHÔNG pick bừa. Đề xuất `/sk:fix-bug` cho tasks 🐛.

Cập nhật trạng thái → 🔄

## Bước 2: Đọc context cho task
- Chi tiết task trong TASKS.md (mô tả, checklist, ghi chú kỹ thuật)
- PLAN.md sections liên quan (thiết kế kỹ thuật, API, database)
- `.planning/docs/*.md` → chỉ đọc **mục lục nhanh**, rồi đọc sections liên quan đến task bằng offset/limit
- `.planning/rules/` chứa đầy đủ quy tắc code — đọc file rules phù hợp với Loại task

## Bước 3: Research code hiện có + tra cứu thư viện
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
1. "Patterns đang dùng cho [loại file cần tạo]."
2. "Functions/services tái sử dụng cho [task]."

Nếu FastCode MCP lỗi khi gọi → DỪNG, thông báo user chạy `/sk:init` kiểm tra lại.

**Tra cứu API thư viện qua Context7** (nếu task dùng thư viện bên ngoài):
1. `mcp__context7__resolve-library-id` (libraryName: "nestjs", query: "mô tả ngắn task") → lấy Context7 library ID
2. `mcp__context7__query-docs` (libraryId: ID từ bước 1, query: "câu hỏi cụ thể về API cần dùng") → lấy docs đúng version
- **TỰ ĐỘNG tra cứu** khi task cần dùng API của thư viện — KHÔNG cần user yêu cầu
- Ưu tiên Context7 hơn đoán API từ memory — đảm bảo đúng version + đúng cú pháp
- Nếu Context7 MCP không có → dùng `.planning/docs/` (từ `/sk:fetch-doc`) hoặc knowledge sẵn có

## Bước 4: Viết code
Tuân thủ **quy tắc code trong `.planning/rules/`**. Đặc biệt:

- **JSDoc + Logger + Error messages + Comments** → TIẾNG VIỆT CÓ DẤU
- **Tên biến/function/class/file** → tiếng Anh
- **Giới hạn file**: mục tiêu 300 dòng, BẮT BUỘC tách >500

**Nếu task Backend:**
- **Database migration** nếu thay đổi schema:
  - Prisma: `npx prisma migrate dev --name [tên]`
  - MongoDB: migration script hoặc `migrate-mongo`
  - TypeORM: `npx typeorm migration:generate -n [Tên]`

**Nếu task Frontend:**
- Tuân thủ cấu trúc thư mục frontend trong `.planning/rules/frontend.md`
- Inline styles `style={{}}` — KHÔNG CSS modules, KHÔNG Tailwind
- Ant Design v6 components + `theme.useToken()` cho dynamic values
- `'use client'` CHỈ khi cần — Server Components mặc định
- Zustand stores theo pattern `create<State>()(persist(...))`
- API calls: native `fetch`, KHÔNG axios

## Bước 5: Lint + Build
Đọc CONTEXT.md → Tech Stack → xác định thư mục backend/frontend.
Đọc `.planning/rules/backend.md` hoặc `.planning/rules/frontend.md` → mục **Build & Lint** → lấy lệnh lint + build + cách detect thư mục.
Chạy lệnh trong đúng thư mục của task. Output pipe qua `| tail -50` để gọn.

Nếu thất bại → sửa code, chạy lại cho đến khi pass.

## Bước 6: Tạo báo cáo
Viết `.planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_[N].md`:

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
git add [source code files đã tạo/sửa ở Bước 4]
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_[N].md
git commit -m "[TASK-N] [Tóm tắt tiếng Việt]

Mô tả: [Chi tiết task đã hoàn thành]
Files: [danh sách files]"
```

## Bước 9: Cập nhật ROADMAP (khi phase hoàn tất)
Nếu phase hiện tại KHÔNG còn task ⬜ (tất cả ✅):
- Đọc `.planning/ROADMAP.md` → tìm phase hiện tại (VD: `#### Phase 1.1:`)
- Đánh dấu tất cả deliverables: `- [ ]` → `- [x]`

## Bước 10: Thông báo
- Task hoàn thành + files + build status
- Nếu còn task ⬜ trong phase → hỏi tiếp tục task tiếp theo không
- Nếu phase hiện tại hết task ⬜ → đề xuất:
  - `/sk:test` → chạy kiểm thử (nếu có backend)
  - `/sk:plan [phase tiếp]` → lên kế hoạch phase tiếp theo
  - `/sk:complete-milestone` → hoàn tất milestone (nếu đây là phase cuối)
</process>

<rules>
- Tuân thủ toàn bộ quy tắc trong `.planning/rules/` (general + backend/frontend theo Loại task)
- PHẢI đọc PLAN.md + task detail + docs liên quan trước khi code
- PHẢI lint + build sau khi code
- PHẢI commit sau khi pass build, commit message tiếng Việt có dấu
- Docs/: chỉ đọc mục lục + sections liên quan, KHÔNG đọc toàn bộ
- Tái sử dụng code/thư viện có sẵn
- Nếu tasks blocked → THÔNG BÁO user, KHÔNG pick bừa
- Nếu FastCode MCP lỗi → DỪNG, yêu cầu chạy `/sk:init`
</rules>
