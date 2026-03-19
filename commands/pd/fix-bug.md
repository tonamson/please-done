---
name: pd:fix-bug
description: Debug lỗi, research, báo cáo, fix, commit [LỖI] và xác nhận cho đến khi thành công
---

<objective>
Research lỗi, phân tích nguyên nhân, viết báo cáo, fix code, commit [LỖI], xác nhận với user. Lặp đến khi user xác nhận thành công. Tạo patch version cho milestone đã hoàn tất.
</objective>

<context>
User input: $ARGUMENTS

Đọc:
- `.planning/CONTEXT.md` → tech stack, thư viện
- `.planning/rules/general.md` → quy tắc chung
- `.planning/rules/backend.md` hoặc `frontend.md` hoặc `wordpress.md` hoặc `solidity.md` hoặc `flutter.md` → theo loại lỗi (CHỈ nếu file tồn tại)

Nếu chưa có CONTEXT.md → thông báo chạy `/pd:init` trước.
</context>

<process>

## Bước 1: Thu thập ngữ cảnh lỗi + kiểm tra git
Kiểm tra git: `git rev-parse --git-dir 2>/dev/null` → lưu `HAS_GIT` (dùng ở Bước 8)

Nếu có bug reports đang mở (Glob `.planning/bugs/BUG_*.md` → Grep `> Trạng thái: (Chưa xử lý|Đang sửa)` — pattern phải match cả format có `> ` prefix):
- Liệt kê bugs mở cho user chọn: "Có [X] bug đang mở. Bạn muốn xử lý bug nào?"
- Nếu user chọn bug có sẵn → đọc bug report, pre-populate version + mô tả + chức năng → nhảy Bước 3

Từ `$ARGUMENTS`: chức năng bị lỗi, mô tả, error message/log, bước tái hiện.
Nếu thiếu thông tin → hỏi user bổ sung.

## Bước 2: Xác định patch version
- Đọc `.planning/CURRENT_MILESTONE.md` → version hiện tại (VD: `1.1`)
- Nếu CURRENT_MILESTONE.md không tồn tại → hỏi user "Lỗi này thuộc phiên bản nào?", dùng version user cung cấp, bỏ qua logic so sánh version bên dưới
- So sánh version lỗi với version hiện tại:
  - Bug thuộc version CŨ hơn (VD: bug ở v1.0, hiện tại v1.1) → milestone đã hoàn tất → tạo patch:
    - Glob `.planning/bugs/BUG_*.md` → Grep `Patch version: [version-gốc]` (match cả `1.0` chính xác lẫn `1.0.1`, `1.0.2`). Sau đó filter kết quả: chỉ lấy entries có patch version dạng `[version-gốc].N` (3 số) → tìm patch cao nhất hiện có
    - Nếu chưa có patch → dùng `[version-gốc].1` (VD: `1.0.1`)
    - Nếu đã có → tăng: `1.0.1` → `1.0.2`, `1.0.2` → `1.0.3`
  - Bug thuộc version HIỆN TẠI → milestone chưa hoàn tất → Patch version = `[version].0` (VD: `1.1.0`). Nếu đã có bugs trước → tìm patch version cao nhất trong `.planning/bugs/` cho cùng version và increment.
- Nếu user không chỉ rõ version lỗi → hỏi "Lỗi này thuộc phiên bản nào?"
- Kiểm tra thư mục `.planning/milestones/[version-gốc]/` tồn tại. Nếu không → thông báo: "Thư mục milestone v[x.x] không tồn tại. Kiểm tra version." và DỪNG.

## Bước 3: Đọc context kỹ thuật
Dùng **version gốc** (VD: `1.0`) để đọc, KHÔNG dùng patch version (VD: `1.0.1`) — vì PLAN.md nằm ở thư mục version gốc:
- `.planning/milestones/[version-gốc]/phase-*/PLAN.md` → thiết kế kỹ thuật, API design, database schema (quét TẤT CẢ phases)
- `.planning/milestones/[version-gốc]/phase-*/reports/CODE_REPORT_TASK_*.md` → files đã tạo, quyết định kỹ thuật cho chức năng liên quan
- `.planning/rules/` chứa đầy đủ coding conventions

Đọc context giúp hiểu TẠI SAO code được viết như vậy trước khi tìm lỗi.

## Bước 4: Research files liên quan
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
1. "Files liên quan đến [chức năng bị lỗi]?"
2. Backend: "Luồng xử lý từ controller → service → database cho [chức năng]?"
3. Frontend: "Components, stores, API calls liên quan đến [chức năng]?"

Nếu FastCode MCP lỗi khi gọi → Fallback sang Grep/Read để research. Cảnh báo: "FastCode không khả dụng, research bằng Grep/Read (độ chính xác có thể thấp hơn)."

**Nếu lỗi liên quan đến thư viện** → tra cứu API qua Context7:
1. `mcp__context7__resolve-library-id` (libraryName: tên thư viện, query: mô tả lỗi) → lấy library ID
2. `mcp__context7__query-docs` (libraryId: ID, query: "cách sử dụng đúng [API/function]") → verify cú pháp
- TỰ ĐỘNG tra cứu khi nghi ngờ sai cú pháp/config thư viện — KHÔNG cần user yêu cầu
- Nếu Context7 MCP không có → dùng `.planning/docs/` hoặc knowledge sẵn có

## Bước 5: Phân tích + xác định nguyên nhân
Xác định lỗi thuộc Backend hay Frontend (từ CONTEXT.md → Tech Stack).
Đọc `.planning/rules/backend.md` hoặc `.planning/rules/frontend.md` hoặc `.planning/rules/wordpress.md` hoặc `.planning/rules/solidity.md` hoặc `.planning/rules/flutter.md` tương ứng:

**Nếu lỗi Backend (NestJS):**
- Trace luồng: request → controller → service → database → response
- Kiểm tra: DTO validation, guard/middleware, query/mutation logic, error handling

**Nếu lỗi Frontend (NextJS):**
- Trace luồng: page/component → store (Zustand) → API call (`lib/api.ts`) → render
- Kiểm tra: `'use client'` thiếu/thừa, hydration mismatch (server vs client render), state không sync, API response handling, antd component props sai, inline style logic

**Nếu lỗi WordPress (Plugin/Theme):**
- Trace luồng: hook/action → callback → database ($wpdb) → output
- Kiểm tra: sanitize/escape thiếu, nonce verify, capability check, prepared statements, `defined('ABSPATH')` check
- Tra cứu `.planning/docs/wordpress/` cho patterns phức tạp

**Nếu lỗi Solidity (Smart Contract):**
- Trace luồng: function call → require checks → state changes → external interactions → events
- Kiểm tra: reentrancy (nonReentrant thiếu, checks-effects-interactions sai thứ tự), access control (modifier thiếu), SafeERC20 (dùng transfer thay vì safeTransfer), overflow/underflow (unchecked block), signature verification (hash thiếu params, deadline check, hashUsed order), event emission (thiếu emit sau state change, sai params), rescue functions (clearUnknownToken/rescueETH balance check, address(0) check), flash loan (balance-dependent logic bị manipulate)
- Tra cứu `.planning/docs/solidity/audit-checklist.md` cho security checklist
- Tra cứu `.planning/docs/solidity/templates.md` cho pattern reference

**Nếu lỗi Flutter (Dart + GetX):**
- Trace luồng: View (Obx/GetBuilder) → Logic (GetxController) → Repository → API (Dio) → Response
- Kiểm tra: GetX lifecycle (onInit/onClose thiếu dispose), reactive state (.obs không update UI, Obx scope quá rộng), navigation (route sai, arguments null), design tokens (hardcode thay vì dùng AppColors/AppSpacing), Dio interceptors (auth header thiếu, retry logic), form validation (formKey state)
- Tra cứu `.planning/docs/flutter/` cho state management, navigation patterns

**Chung:**
- Tìm điểm gây lỗi: file + dòng code
- Giải thích tại sao gây lỗi
- Đánh giá ảnh hưởng đến chức năng khác

## Bước 6: Viết Bug Report
Viết `.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md`:

```markdown
# Báo cáo lỗi
> Ngày: [DD_MM_YYYY HH:MM:SS] | Mức độ: Nghiêm trọng/Cao/Trung bình/Nhẹ
> Trạng thái: Đang sửa | Chức năng: [Tên] | Task: [N] (nếu biết)
> Patch version: [x.x.x] | Lần sửa: 1

## Mô tả lỗi
[Nguyên văn từ user]

## Bước tái hiện
1. → 2. → Lỗi xảy ra

## Phân tích nguyên nhân
### Code TRƯỚC khi sửa:
File: `[path]`
```
[code gây lỗi]
```
### Nguyên nhân: [giải thích]

## Giải pháp
### Code SAU khi sửa:
File: `[path]`
```
[code đã sửa]
```

## Ảnh hưởng
- [Chức năng A]: Không ảnh hưởng / Có ảnh hưởng → [chi tiết]

## Xác nhận
- [ ] Đã áp dụng bản sửa
- [ ] User xác nhận đúng
- [ ] Không phát sinh lỗi mới
```

## Bước 7: Fix code
- Áp dụng fix, tuân thủ quy tắc trong `.planning/rules/`
- Cập nhật JSDoc nếu logic thay đổi (tiếng Việt)
- Chạy lint + build đúng thư mục (xem `.planning/rules/backend.md` hoặc `frontend.md` hoặc `wordpress.md` hoặc `solidity.md` hoặc `flutter.md` → mục **Build & Lint**)
- Thêm/cập nhật test case cho bug: `.spec.ts` (NestJS) hoặc `test-*.php` (WordPress) hoặc `test/*.ts`/`test/*.t.sol` (Solidity) hoặc `test/**/*_test.dart` (Flutter)

## Bước 8: Git commit (CHỈ nếu HAS_GIT = true, xem Bước 1)
```
git add [source code files đã sửa]
git add .planning/bugs/BUG_[timestamp].md
git commit -m "[LỖI] Khắc phục [tóm tắt lỗi ngắn gọn]

Nguyên nhân: [nguyên nhân gốc]
Lỗi phát sinh: [mô tả cách lỗi xảy ra]
Files đã sửa:
- [file]: [thay đổi gì]"
```

## Bước 9: Yêu cầu xác nhận
> "Đã sửa lỗi [mô tả]. Vui lòng kiểm tra lại trên giao diện/database và xác nhận."

### User xác nhận ĐÃ FIX:
- Bug report: Trạng thái → Đã giải quyết, tick checklist
- Tìm TASKS.md chứa task bị 🐛: dùng version GỐC của bug (VD: `1.0` từ patch version `1.0.2`) để tìm TASKS.md, KHÔNG dùng version hiện tại từ CURRENT_MILESTONE. (Glob `.planning/milestones/[version-gốc]/phase-*/TASKS.md` → Grep task liên quan) → xóa 🐛, đổi ✅
- Cập nhật trạng thái CẢ HAI nơi: (1) bảng Tổng quan, (2) task detail block `> Trạng thái:`.
- Nếu HAS_GIT:
```
git add .planning/bugs/BUG_[...].md
git add .planning/milestones/[version-gốc]/phase-*/TASKS.md
git commit -m '[LỖI] Xác nhận đã khắc phục [tóm tắt lỗi]'
```

### User báo CHƯA FIX:
- Thu thập thêm thông tin
- Bug report: tăng "Lần sửa" (2, 3, 4...), thêm section "Lần sửa [N]"
- Quay lại **Bước 5** phân tích lại
- Commit mỗi lần sửa với prefix [LỖI]
- Nếu đã thử fix 3+ lần → gợi ý: "Đã thử [N] lần. Cân nhắc phân tích lại từ đầu hoặc thay đổi approach."
- **TIẾP TỤC cho đến khi user xác nhận thành công**
</process>

<rules>
- Tuân thủ quy tắc trong `.planning/rules/` (general + backend/frontend/wordpress/solidity/flutter theo loại lỗi)
- CẤM đọc/hiển thị nội dung file nhạy cảm (`.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- PHẢI đọc PLAN.md + CODE_REPORT trước khi fix
- PHẢI research trước khi fix, KHÔNG đoán mò
- PHẢI viết bug report với code TRƯỚC/SAU
- KHÔNG tự đóng bug - PHẢI chờ user xác nhận
- KHÔNG giới hạn số lần fix - lặp đến khi user confirm
- Mỗi lần fix: commit riêng với prefix [LỖI]
- Patch version tăng dần: 1.0 → 1.0.1 → 1.0.2
- Nếu fix ảnh hưởng chức năng khác → THÔNG BÁO user
- Nếu FastCode MCP lỗi → fallback sang Grep/Read, KHÔNG DỪNG hoàn toàn
</rules>
