---
name: pd:plan
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
- `.planning/rules/backend.md` và/hoặc `.planning/rules/frontend.md` và/hoặc `.planning/rules/wordpress.md` và/hoặc `.planning/rules/solidity.md` → theo stack có trong project

Nếu chưa có CONTEXT.md → thông báo chạy `/pd:init` trước.
</context>

<process>

## Bước 1: Đọc context
- `.planning/ROADMAP.md`
- `.planning/CURRENT_MILESTONE.md` → lấy version (số thuần) + phase hiện tại
- `.planning/scan/SCAN_REPORT.md` → hiện trạng, thư viện có sẵn, patterns
- `.planning/docs/*.md` → chỉ đọc **mục lục nhanh** của mỗi doc, đọc chi tiết sections liên quan đến deliverable hiện tại (dùng offset/limit)
- Nếu `$ARGUMENTS` chỉ định phase cụ thể → dùng phase đó
- Nếu có phases trước (VD: phase-1.1 tồn tại khi planning phase 1.2) → đọc PLAN.md/TASKS.md phases trước để nắm context đã triển khai

Nếu chưa có roadmap → thông báo chạy `/pd:new-milestone` trước.
Nếu CURRENT_MILESTONE.md không tồn tại → thông báo: "Thiếu CURRENT_MILESTONE.md. Chạy `/pd:new-milestone` để tạo."
Nếu CURRENT_MILESTONE status = `Hoàn tất toàn bộ` → **DỪNG**, thông báo: "Tất cả milestones đã hoàn tất. Chạy `/pd:new-milestone` để thêm milestones mới."
Nếu phase hiện tại trong ROADMAP không có deliverables (mô tả rỗng hoặc chỉ có tiêu đề) → **DỪNG**, thông báo: "Phase [x.x] chưa có deliverables cụ thể trong ROADMAP. Cập nhật ROADMAP hoặc chạy `/pd:new-milestone` để bổ sung."

## Bước 1.5: Kiểm tra phase đã tồn tại
Nếu `.planning/milestones/[version]/phase-[phase]/TASKS.md` đã tồn tại:
- Đọc TASKS.md → kiểm tra có task ✅ hoặc 🔄 không
- Nếu CÓ tasks đã hoàn thành (✅) hoặc đang thực hiện (🔄) → **CẢNH BÁO**:
  > "Phase [x.x] đã có plan với tiến trình ([N1] ✅ hoàn tất, [N2] 🔄 đang làm). Bạn muốn:
  > 1. LÊN KẾ HOẠCH LẠI phase này (ghi đè)
  > 2. CHUYỂN SANG phase chưa có plan: [liệt kê phases chưa plan từ ROADMAP] — Cập nhật biến phase sang phase user chọn, quay lại đầu Bước 1.5 để kiểm tra phase mới.
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

Nếu FastCode MCP lỗi khi gọi → Fallback sang Grep/Read để research code. Ghi warning: "FastCode MCP lỗi — dùng built-in tools. Chạy `/pd:init` kiểm tra lại sau."
Nếu FastCode trả về kết quả rỗng cho tất cả queries → cảnh báo: "FastCode không tìm thấy code liên quan. Nên chạy `/pd:scan` để cập nhật index." Tiếp tục thiết kế với context hạn chế.

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
Sau khi phân tích, Claude xác định các vấn đề cần quyết định và dùng `AskUserQuestion` để user chọn bằng phím mũi tên.

**Nếu KHÔNG có vấn đề nào cần quyết định** (tất cả đã rõ ràng từ ROADMAP/CONTEXT) → thông báo user: "Phase này không có vấn đề nào cần thảo luận thêm — tôi sẽ tự quyết định." → chuyển sang Bước 4 (AUTO).

**Cách xác định vấn đề:**
- Phạm vi tính năng (VD: đăng nhập cho trang nào, lấy thông tin gì)
- Cách xác thực người dùng
- Dữ liệu cần lưu trữ
- Luồng thao tác của người dùng (bao nhiêu bước, chuyển trang đi đâu)
- Tích hợp dịch vụ bên ngoài
- Phân quyền truy cập
- Chiến lược hiệu suất / bộ nhớ đệm
- Xử lý lỗi
- Chỉ liệt kê vấn đề THỰC SỰ có nhiều lựa chọn hợp lệ — KHÔNG liệt kê những thứ đã rõ ràng từ ROADMAP/CONTEXT

**Hiển thị bằng `AskUserQuestion`:**

**Trường hợp đúng 1 vấn đề** → dùng single select (vì multiSelect cần tối thiểu 2 options):
```
AskUserQuestion({
  questions: [{
    question: "Tôi xác định 1 vấn đề cần quyết định: [Tên vấn đề]. Bạn muốn thảo luận không?",
    header: "Thảo luận",
    multiSelect: false,
    options: [
      { label: "Thảo luận", description: "[mô tả ngắn vấn đề]" },
      { label: "Bỏ qua", description: "Claude tự quyết định vấn đề này" }
    ]
  }]
})
```

**Trường hợp 2-4 vấn đề** → dùng 1 câu hỏi `multiSelect: true`:
```
AskUserQuestion({
  questions: [{
    question: "Tôi xác định [N] vấn đề cần quyết định. Chọn vấn đề bạn muốn thảo luận (có thể chọn nhiều):",
    header: "Thảo luận",
    multiSelect: true,
    options: [
      { label: "[Tên vấn đề 1]", description: "[mô tả ngắn, dễ hiểu]" },
      { label: "[Tên vấn đề 2]", description: "[mô tả ngắn, dễ hiểu]" },
      ...
    ]
  }]
})
```
- User dùng phím mũi tên + space để chọn nhiều vấn đề, Enter để xác nhận
- Chọn tất cả = thảo luận tất cả, không chọn gì rồi submit = bỏ qua (Claude tự quyết định)

**Trường hợp 5+ vấn đề** → hỏi phạm vi trước, rồi chia nhóm:
1. `AskUserQuestion` đầu tiên (single select):
   - "Thảo luận tất cả [N] vấn đề (Đề xuất)"
   - "Chọn vấn đề cụ thể"
   - "Bỏ qua — Claude tự quyết định"
2. Nếu user chọn "Chọn vấn đề cụ thể" → tiếp tục với `AskUserQuestion` `multiSelect: true`, chia thành các nhóm ≤4 vấn đề theo chủ đề

### 3.5.2: Thảo luận từng vấn đề đã chọn
Với MỖI vấn đề user chọn:
1. In tiêu đề + giải thích ngắn bối cảnh vấn đề bằng text thường
2. Dùng `AskUserQuestion` để user chọn phương án bằng phím mũi tên

**Format:**
```
Trước tiên, in text:
"### Vấn đề [N]: [Tên vấn đề]
[Giải thích ngắn gọn bối cảnh — viết cho người KHÔNG phải dev cũng hiểu]"

Sau đó gọi AskUserQuestion:
AskUserQuestion({
  questions: [{
    question: "[Tên vấn đề] — chọn cách bạn muốn:",
    header: "Vấn đề [N]",
    multiSelect: false,
    options: [
      { label: "[Tên phương án] (Đề xuất)", description: "[Giải thích đơn giản: làm gì, ưu/nhược chính]" },
      { label: "[Tên phương án khác]", description: "[Giải thích đơn giản]" },
      { label: "[Tên phương án khác]", description: "[Giải thích đơn giản]" }
    ]
  }]
})
```

**Quy tắc options:**
- **Option đầu tiên** luôn là recommend — thêm "(Đề xuất)" ở cuối label
- **Options còn lại** (tối đa 3 options nữa): các phương án thay thế, sắp xếp từ đơn giản → phức tạp
- **"Other"** (tự động có sẵn từ AskUserQuestion) = "Bạn có cách riêng" — user tự mô tả
- Nếu user chọn "Other" → chờ user mô tả → xác nhận hiểu đúng trước khi tiếp
- Tổng tối đa 4 options (không tính Other)

**Quy tắc ngôn ngữ trong options (QUAN TRỌNG):**
- Viết description cho **người không phải dev** cũng hiểu được
- KHÔNG dùng thuật ngữ kỹ thuật trần (VD: "httpOnly cookies", "XSS", "CSRF") mà không giải thích
- Thay vào đó, giải thích bằng **kết quả/hệ quả** người dùng cảm nhận được
- VD tốt: "Lưu thông tin đăng nhập trong cookie bảo mật — hacker không thể đánh cắp qua lỗi website. Cần thêm việc ở phần server."
- VD xấu: "httpOnly cookies — An toàn nhất (không thể đọc từ JS). Nhưng cần sửa backend (set-cookie thay vì trả token trong body), cần Next.js middleware xử lý cookie, và phải handle CSRF."
- Thuật ngữ kỹ thuật chỉ dùng khi KHÔNG có cách diễn đạt đơn giản hơn, và phải kèm giải thích trong ngoặc
- Ưu/nhược viết dạng: "Ưu: ..., Nhược: ..." — ngắn gọn, rõ ràng

**Điều hướng bổ sung** — in text nhỏ sau mỗi AskUserQuestion:
- "💡 Chọn 'Other' và gõ 'back' để quay lại vấn đề trước, hoặc 'cancel' để hủy thảo luận."

**Xử lý keyword từ "Other":**
- Nếu user chọn "Other" và gõ `back` → quay lại vấn đề trước (hiển thị lại AskUserQuestion của vấn đề trước). Nếu đang ở **vấn đề đầu tiên** → quay lại bước 3.5.1 (chọn lại vấn đề muốn thảo luận)
- Nếu user chọn "Other" và gõ `cancel` → GIỮ các quyết định đã chốt trước đó, các vấn đề chưa thảo luận Claude tự quyết định (recommend) → chuyển sang 3.5.3 hiển thị bảng tóm tắt đầy đủ để user xác nhận trước khi tiếp tục
- Nếu user chọn "Other" và gõ nội dung khác → coi đó là mô tả phương án riêng của user → xác nhận hiểu đúng trước khi tiếp

### 3.5.3: Tổng hợp quyết định
Sau khi thảo luận xong TẤT CẢ vấn đề user chọn:
- Hiển thị bảng tóm tắt các quyết định đã chốt (bằng text)
- Các vấn đề user KHÔNG chọn thảo luận → Claude tự quyết định (dùng phương án recommend)
- Dùng `AskUserQuestion` để user chọn bước tiếp theo

**Format:**
```
Trước tiên, in text bảng tóm tắt:
"### Tóm tắt quyết định

| # | Vấn đề | Quyết định | Nguồn |
|---|--------|-----------|-------|
| 1 | [Tên] | [Phương án đã chọn] | User chọn |
| 2 | [Tên] | [Phương án recommend] | Claude quyết định |
| ... | ... | ... | ... |"

Sau đó gọi AskUserQuestion:
AskUserQuestion({
  questions: [{
    question: "Bạn muốn làm gì tiếp theo?",
    header: "Tiếp theo",
    multiSelect: false,
    options: [
      { label: "Tiếp tục thiết kế", description: "Các quyết định đã ổn — bắt đầu thiết kế kỹ thuật chi tiết" },
      { label: "Thảo luận thêm vấn đề khác", description: "Tôi sẽ đưa ra thêm các vấn đề chưa được bàn, hoặc bạn tự đề xuất" },
      { label: "Thay đổi quyết định", description: "Chọn lại phương án cho bất kỳ vấn đề nào trong bảng" }
    ]
  }]
})
```

**Xử lý lựa chọn:**
- "Tiếp tục thiết kế" → chuyển sang Bước 4
- "Thảo luận thêm vấn đề khác" → chuyển sang Bước 3.5.4
- "Thay đổi quyết định" → nếu chỉ có 1 vấn đề → thảo luận lại trực tiếp (quay lại 3.5.2, không cần hỏi chọn); nếu 2+ vấn đề → dùng `AskUserQuestion` `multiSelect: true` liệt kê các vấn đề đã chốt để user chọn vấn đề muốn thay đổi → thảo luận lại (quay lại 3.5.2) → quay lại 3.5.3. Nếu tổng vấn đề đã chốt > 4 → chia nhóm giống cách xử lý 5+ ở 3.5.1

### 3.5.4: Thảo luận mở rộng (khi user chọn "Thảo luận thêm vấn đề khác")
Claude phân tích lại deliverable và đưa ra **danh sách vấn đề bổ sung** chưa từng được đề cập (không trùng 3.5.1 VÀ không trùng các vòng 3.5.4 trước đó). Các vấn đề mới có thể bao gồm:
- Vấn đề phát sinh từ các quyết định đã chốt (VD: chọn cookie bảo mật → cần quyết định cách chống giả mạo request)
- Vấn đề ở tầng sâu hơn mà ban đầu chưa liệt kê (VD: ghi log, thử lại khi lỗi, giới hạn tần suất gọi)
- Vấn đề user muốn tự đề xuất

**Hiển thị bằng `AskUserQuestion`:**

**Nếu Claude tìm thêm vấn đề mới (≤4):**
```
In text: "Dựa trên các quyết định đã chốt, tôi xác định thêm [N] vấn đề có thể thảo luận:"

AskUserQuestion({
  questions: [{
    question: "Chọn vấn đề bạn muốn thảo luận thêm (có thể chọn nhiều):",
    header: "Bổ sung",
    multiSelect: true,
    options: [
      { label: "[Vấn đề mới 1]", description: "[mô tả ngắn, dễ hiểu]" },
      { label: "[Vấn đề mới 2]", description: "[mô tả ngắn, dễ hiểu]" },
      ...
    ]
  }]
})
```
- User chọn "Other" → nếu gõ `cancel` → coi như không chọn gì, chuyển thẳng **Bước 4**; nếu gõ `back` → quay lại 3.5.3; nếu gõ nội dung khác → coi đó là vấn đề user đề xuất → Claude phân tích → đưa options bằng AskUserQuestion giống 3.5.2 → sau khi chốt, quay lại 3.5.3 hiển thị bảng tóm tắt đầy đủ
- Nếu user không chọn gì → không còn vấn đề muốn thảo luận → chuyển thẳng sang **Bước 4**

**Nếu Claude KHÔNG tìm thêm vấn đề nào:**
```
AskUserQuestion({
  questions: [{
    question: "Tôi không tìm thêm vấn đề nào cần thảo luận. Bạn có vấn đề riêng muốn đưa ra không?",
    header: "Vấn đề riêng",
    multiSelect: false,
    options: [
      { label: "Không, tiếp tục thiết kế", description: "Đã thảo luận đủ — chuyển sang thiết kế kỹ thuật" },
      { label: "Có, tôi muốn hỏi thêm", description: "Mô tả vấn đề bạn muốn thảo luận" }
    ]
  }]
})
```
- Nếu "Có" → chờ user mô tả (text input) → Claude phân tích vấn đề user đề xuất → đưa options bằng AskUserQuestion giống 3.5.2 → sau khi chốt, quay lại 3.5.3 hiển thị bảng tóm tắt đầy đủ
- Nếu "Không" → chuyển thẳng sang **Bước 4** (KHÔNG quay lại 3.5.3 vì user đã xác nhận "tiếp tục thiết kế")

**Nếu 5+ vấn đề mới** → áp dụng cùng cách xử lý như 3.5.1 (hỏi phạm vi trước, rồi chia nhóm)

**Sau khi thảo luận xong vấn đề bổ sung** (user đã chọn và thảo luận ít nhất 1 vấn đề mới):
- Mỗi vấn đề mới thảo luận theo đúng format 3.5.2 (AskUserQuestion chọn phương án)
- Quay lại bước 3.5.3 — hiển thị lại bảng tóm tắt ĐẦY ĐỦ (cả vấn đề cũ + mới) + AskUserQuestion 3 lựa chọn
- **Vòng lặp 3.5.3 ↔ 3.5.4** tiếp tục cho đến khi user chọn "Tiếp tục thiết kế" ở 3.5.3, hoặc không chọn/chọn "Không" ở 3.5.4

**Lưu ý phân biệt 2 lối thoát khỏi 3.5.4:**
- User không chọn vấn đề nào (multiSelect empty), hoặc chọn "Không, tiếp tục thiết kế" → đi thẳng Bước 4
- User thảo luận xong ít nhất 1 vấn đề mới → quay 3.5.3 để xác nhận tổng thể (vì bảng tóm tắt đã thay đổi)

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

**WordPress (nếu có — đọc CONTEXT.md xác định):**
- Plugin/Theme architecture (main file, hooks, class structure)
- Custom post types, taxonomies
- Database: custom tables (dbDelta schema), options API
- REST API endpoints (register_rest_route)
- Admin pages, settings

**Solidity (nếu có — đọc CONTEXT.md xác định framework: Hardhat, Foundry):**
- Contract architecture (inheritance chain, base contracts: Ownable/AccessControl)
- Functions: visibility, modifiers (whenNotPaused, nonReentrant, onlyOwner)
- State variables, structs, mappings, events
- Token interactions (SafeERC20, IERC20)
- Security: signature verification pattern (nếu cần off-chain authorization)
- Tham khảo `.planning/docs/solidity/templates.md` cho base patterns

**Stack khác (Chrome extension, CLI, v.v.):**
- Thiết kế theo đặc thù stack (VD: manifest.json, background/content scripts, popup UI...)
- Tham khảo docs qua Context7 hoặc `.planning/docs/`

**Chung:**
- Files cần tạo/sửa
- Thư viện cần thêm

## Bước 4.5: Ghi nhận quyết định thiết kế
> **THỰC HIỆN khi** Claude tự đưa ra ít nhất 1 quyết định mà user KHÔNG thảo luận. Cụ thể:
> - Chế độ AUTO → LUÔN thực hiện
> - Chế độ DISCUSS skip-all (user bỏ qua tất cả ở 3.5.1) → thực hiện
> - Chế độ DISCUSS cancel (user hủy giữa chừng) → thực hiện cho các vấn đề CHƯA thảo luận
> - Chế độ DISCUSS user chọn một số vấn đề (skip phần còn lại) → thực hiện cho các vấn đề user KHÔNG chọn
> - Chế độ DISCUSS user thảo luận TẤT CẢ vấn đề → **bỏ qua** (không có quyết định tự đưa ra)
> - Chế độ DISCUSS nhưng KHÔNG có vấn đề nào cần quyết định (0 issues ở 3.5.1) → **bỏ qua** (không có quyết định nào để ghi)

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
**Section "Quyết định thiết kế"**: LUÔN tạo ở CẢ HAI chế độ. Chọn bảng dựa trên thực tế diễn ra:
- **AUTO thuần** (hoặc DISCUSS skip-all) → bảng mở rộng (Lý do + Alternatives)
- **DISCUSS thuần** (user thảo luận TẤT CẢ vấn đề) → bảng gốc (cột Nguồn)
- **DISCUSS hybrid** (user thảo luận một số, skip/cancel phần còn lại) → dùng bảng gốc (cột Nguồn), nhưng các vấn đề "Claude quyết định" PHẢI kèm thêm dòng ghi chú bên dưới bảng giải thích Lý do + Alternatives cho từng vấn đề Claude tự quyết
- Nếu không có quyết định nào (tất cả đã rõ ràng) → ghi "Không có quyết định thiết kế đặc biệt — tất cả đã xác định rõ từ ROADMAP/CONTEXT."

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
- Nếu chế độ DISCUSS và không có vấn đề Claude tự quyết (user thảo luận tất cả, hoặc không có vấn đề nào cần quyết định): ghi nhận số vấn đề đã thảo luận (có thể = 0)
- Nếu chế độ AUTO, DISCUSS skip-all, hoặc DISCUSS hybrid (có vấn đề Claude tự quyết): in bảng tóm tắt các quyết định Claude đã tự đưa ra (từ Bước 4.5) để user review TRƯỚC khi chạy `/pd:write-code`. Format:
  ```
  ### Claude đã tự quyết định [N] vấn đề thiết kế:
  | # | Vấn đề | Phương án | Lý do tóm tắt |
  |---|--------|----------|---------------|
  Xem chi tiết đầy đủ (bao gồm alternatives đã loại) trong PLAN.md → Section "Quyết định thiết kế".
  ⚠️ Hãy review các quyết định trên trước khi viết code. Nếu cần thay đổi, chạy `/pd:plan --discuss` để thảo luận lại.
  ```
</process>

<rules>
- Tuân thủ quy tắc trong `.planning/rules/` (ngôn ngữ, ngày tháng, version, icon, bảo mật)
- Ưu tiên tái sử dụng code/thư viện có sẵn
- Task backend + frontend TÁCH RIÊNG, ghi rõ Loại (Backend/Frontend/Fullstack) + dependency
- Frontend-only tasks (UI, SEO, layout) được làm độc lập, KHÔNG cần chờ backend
- Docs/: chỉ đọc mục lục + sections liên quan, KHÔNG đọc toàn bộ
- KHÔNG hỏi lại FastCode thông tin đã có trong SCAN_REPORT
- Nếu FastCode MCP lỗi → fallback Grep/Read, ghi warning gợi ý `/pd:init`
- Chế độ AUTO (mặc định): KHÔNG hỏi user bất kỳ câu hỏi thiết kế nào — tự quyết định tất cả
- Chế độ DISCUSS: PHẢI dùng `AskUserQuestion` cho mọi lựa chọn — user chọn bằng phím mũi tên, KHÔNG yêu cầu gõ A/B/C hoặc số
- Chế độ DISCUSS: PHẢI chờ user trả lời sau mỗi `AskUserQuestion` — KHÔNG tự chọn thay user
- Chế độ DISCUSS: Nếu user bỏ qua tất cả ở 3.5.1 → chuyển sang AUTO cho phần còn lại (Bước 4 + 4.5 + bảng AUTO)
- Chế độ DISCUSS: Nếu user cancel giữa 3.5.2 → GIỮ quyết định đã chốt + Claude quyết định phần còn lại → hiển thị 3.5.3 tóm tắt → user xác nhận
- Chế độ DISCUSS: "Other" (tự động từ AskUserQuestion) thay thế cho "Bạn có cách riêng" — user luôn có thể tự mô tả
- Chế độ DISCUSS: Thiết kế kỹ thuật PHẢI phản ánh đúng quyết định user đã chốt — vi phạm = lỗi
- Chế độ DISCUSS: Bước 3.5.3 ↔ 3.5.4 tạo vòng lặp — user có thể chọn "Thảo luận thêm" bao nhiêu lần tùy thích. Vòng lặp kết thúc khi user chọn "Tiếp tục thiết kế" ở 3.5.3, HOẶC không chọn/chọn "Không" ở 3.5.4 → đi thẳng Bước 4
- Chế độ DISCUSS: Khi user chọn "Thảo luận thêm", Claude PHẢI đưa ra vấn đề MỚI — KHÔNG lặp lại vấn đề đã chốt VÀ KHÔNG hiện lại vấn đề đã từng đưa ra nhưng user bỏ qua
- Chế độ DISCUSS: Ngôn ngữ trong options PHẢI đơn giản, dễ hiểu — viết cho người KHÔNG phải developer. Giải thích bằng kết quả/hệ quả thay vì thuật ngữ kỹ thuật. Thuật ngữ kỹ thuật chỉ dùng khi không có cách diễn đạt đơn giản hơn, và phải kèm giải thích ngắn
</rules>
