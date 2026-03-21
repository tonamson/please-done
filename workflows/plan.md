<purpose>
Lập kế hoạch kỹ thuật + chia danh sách công việc cho milestone hiện tại.
Research dự án, thiết kế giải pháp kỹ thuật, chia thành danh sách công việc cụ thể. Tạo PLAN.md và TASKS.md trong một bước.
Hỗ trợ 2 chế độ:
- `--auto` (mặc định): Claude tự quyết định toàn bộ thiết kế, tính năng, giải pháp kỹ thuật
- `--discuss`: Thảo luận tương tác — Claude liệt kê các vấn đề cần quyết định, user chọn vấn đề muốn bàn, Claude đưa ra options cho từng vấn đề
</purpose>

<required_reading>
Đọc tất cả files được tham chiếu trong execution_context của command trước khi bắt đầu:
- @templates/plan.md → mẫu PLAN.md
- @templates/tasks.md → mẫu TASKS.md
- @references/questioning.md → cách hỏi user (cho chế độ DISCUSS)
- @references/conventions.md → quy ước chung (icons, version, commit)
- @references/prioritization.md → thứ tự ưu tiên tasks
- @references/ui-brand.md → product framing, design continuity, UX gaps cho feature mới
</required_reading>

<process>

## Bước 1: Đọc context
- `.planning/PROJECT.md` (nếu có) → tầm nhìn dự án, đối tượng người dùng, ràng buộc — dùng để thiết kế phù hợp hướng dài hạn
- `.planning/ROADMAP.md`
- `.planning/CURRENT_MILESTONE.md` → lấy version (số thuần) + phase hiện tại
- `.planning/REQUIREMENTS.md` (nếu có) → danh sách yêu cầu với mã yêu cầu, bảng theo dõi → xác định yêu cầu thuộc phase hiện tại
- `.planning/STATE.md` (nếu có) → trạng thái làm việc, bối cảnh tích lũy, vấn đề chặn
- `.planning/scan/SCAN_REPORT.md` → hiện trạng, thư viện có sẵn, patterns
- `.planning/research/SUMMARY.md` (nếu có) → kết quả nghiên cứu lĩnh vực, thư viện gợi ý, cạm bẫy cần tránh
- `.planning/docs/*.md` → chỉ đọc **mục lục nhanh** của mỗi doc, đọc chi tiết sections liên quan đến deliverable hiện tại (dùng offset/limit)
- Nếu `$ARGUMENTS` chỉ định phase cụ thể → dùng phase đó
- Nếu có phases trước (VD: phase-1.1 tồn tại khi planning phase 1.2) → đọc PLAN.md/TASKS.md phases trước để nắm context đã triển khai

Nếu chưa có roadmap → thông báo chạy `/pd:new-milestone` trước.
Nếu CURRENT_MILESTONE.md không tồn tại → thông báo: "Thiếu CURRENT_MILESTONE.md. Chạy `/pd:new-milestone` để tạo."
Nếu CURRENT_MILESTONE status = `Hoàn tất toàn bộ` → **DỪNG**, thông báo: "Tất cả milestones đã hoàn tất. Chạy `/pd:new-milestone` để thêm milestones mới."
Nếu phase hiện tại trong ROADMAP không có deliverables (mô tả rỗng hoặc chỉ có tiêu đề) → **DỪNG**, thông báo: "Phase [x.x] chưa có deliverables cụ thể trong ROADMAP. Cập nhật ROADMAP hoặc chạy `/pd:new-milestone` để bổ sung."

---

## Bước 1.5: Kiểm tra phase đã tồn tại
Nếu `.planning/milestones/[version]/phase-[phase]/TASKS.md` đã tồn tại:
- Đọc TASKS.md → kiểm tra có task ✅ hoặc 🔄 không
- Nếu CÓ tasks đã hoàn thành (✅) hoặc đang thực hiện (🔄) → **CẢNH BÁO**:
  > "Phase [x.x] đã có plan với tiến trình ([N1] ✅ hoàn tất, [N2] 🔄 đang làm). Bạn muốn:
  > 1. LÊN KẾ HOẠCH LẠI phase này (ghi đè)
  > 2. CHUYỂN SANG phase chưa có plan: [liệt kê phases chưa plan từ ROADMAP] — Cập nhật biến phase sang phase user chọn, quay lại đầu Bước 1.5 để kiểm tra phase mới.
  > 3. HỦY"
  - Nếu không còn phase nào chưa plan → chỉ hiện option 1 và 3
  - Nếu user chọn "Lên kế hoạch lại" → reset ROADMAP.md: tìm phase này, đổi deliverables `- [x]` → `- [ ]` (nếu trước đó đã đánh hoàn tất). Đảm bảo ROADMAP phản ánh đúng trạng thái thực tế sau khi ghi đè plan.
- Nếu KHÔNG có tasks hoàn thành (tất cả ⬜):
  - Kiểm tra thêm: PLAN.md có tồn tại VÀ có đủ nội dung (ít nhất 1 section thiết kế)?
    - **CÓ cả PLAN.md lẫn TASKS.md hoàn chỉnh** (tất cả ⬜, chưa ai đụng vào) → có thể phiên trước bị gián đoạn sau khi tạo xong plan nhưng trước khi cập nhật tracking. Hỏi user:
      > "PLAN.md và TASKS.md đã tồn tại ([N] tasks, tất cả chưa bắt đầu). Có thể phiên trước bị gián đoạn. Bạn muốn:
      > 1. GIỮ NGUYÊN — chỉ cập nhật tracking (CURRENT_MILESTONE, ROADMAP, STATE)
      > 2. LÊN KẾ HOẠCH LẠI từ đầu (ghi đè)
      > 3. HỦY"
      - Nếu "Giữ nguyên" → nhảy thẳng Bước 8 (cập nhật tracking)
      - Nếu "Lên kế hoạch lại" → tiếp tục Bước 2 bình thường
    - **CHỈ có PLAN.md nhưng KHÔNG có TASKS.md** (hoặc TASKS.md rỗng) → phiên trước bị gián đoạn giữa chừng khi tạo files. Thông báo: "Tìm thấy PLAN.md nhưng thiếu TASKS.md — phiên trước có thể bị gián đoạn." Hỏi user:
      > "1. TẠO LẠI TASKS.md từ PLAN.md hiện có (nhanh — không cần research lại)
      > 2. LÊN KẾ HOẠCH LẠI từ đầu"
      - Nếu "Tạo lại TASKS.md" → đọc PLAN.md hiện có → nhảy Bước 7 (tạo TASKS.md) → Bước 8
      - Nếu "Lên kế hoạch lại" → tiếp tục Bước 2 bình thường
    - **Không có cả hai** hoặc **PLAN.md không hoàn chỉnh** → cho phép ghi đè không cần hỏi

---

## Bước 2: Tạo thư mục
- `.planning/milestones/[version]/phase-[phase]/`
- `.planning/milestones/[version]/phase-[phase]/reports/`

---

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

---

## Bước 3.5: Thảo luận tính năng (CHỈ khi chế độ DISCUSS)
> **Bỏ qua bước này nếu chế độ AUTO.**

**Lưu trạng thái thảo luận**: Trước khi bắt đầu thảo luận, tạo file `.planning/milestones/[version]/phase-[phase]/DISCUSS_STATE.md` để lưu tiến trình. Cập nhật file này SAU MỖI quyết định user chốt. Nếu phiên bị ngắt, đọc file này để khôi phục trạng thái thay vì bắt đầu lại từ đầu.

```markdown
# Trạng thái thảo luận
> Phase: [x.x] | Bắt đầu: [DD_MM_YYYY HH:MM] | Trạng thái: Đang thảo luận

## Vấn đề đã chốt
| # | Vấn đề | Quyết định | Nguồn |
|---|--------|-----------|-------|

## Vấn đề chưa thảo luận
- [danh sách vấn đề còn lại]

## Vấn đề đã bỏ qua (Claude tự quyết)
- [danh sách]
```

Khi hoàn tất Bước 3.5 (chuyển sang Bước 4) → cập nhật `> Trạng thái: Hoàn tất` và giữ file làm audit trail.
Khi phiên bị ngắt → `/pd:plan --discuss` đọc DISCUSS_STATE.md → resume từ vấn đề tiếp theo chưa chốt.

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

**Hiển thị bằng AskUserQuestion** (hoặc văn bản thường nếu không khả dụng):
- **1 vấn đề** → single select: "Thảo luận" / "Bỏ qua"
- **2-4 vấn đề** → multiSelect: liệt kê vấn đề, user chọn nhiều. Không chọn gì = bỏ qua (Claude tự quyết định)
- **5+ vấn đề** → hỏi phạm vi trước (tất cả / chọn cụ thể / bỏ qua), rồi chia nhóm ≤4 vấn đề theo chủ đề

### 3.5.2: Thảo luận từng vấn đề đã chọn
Với MỖI vấn đề user chọn:
1. In tiêu đề + giải thích ngắn bối cảnh (viết cho người KHÔNG phải dev cũng hiểu)
2. Dùng AskUserQuestion (single select) hiển thị phương án:
   - Option đầu = recommend, thêm "(Đề xuất)". Tối đa 4 options + Other
   - Description viết bằng kết quả/hệ quả, KHÔNG dùng thuật ngữ kỹ thuật trần
   - User chọn "Other" → chờ mô tả → xác nhận hiểu đúng
**Điều hướng Other:** `back` = quay vấn đề trước (hoặc 3.5.1 nếu đang vấn đề đầu), `cancel` = giữ quyết định đã chốt + Claude quyết phần còn lại → hiện 3.5.3, text khác = phương án riêng user.

### 3.5.3: Tổng hợp quyết định
Hiển thị bảng tóm tắt (Vấn đề | Quyết định | Nguồn: User/Claude). Hỏi user 3 lựa chọn:
- **Tiếp tục thiết kế** → Bước 4
- **Thảo luận thêm** → 3.5.4
- **Thay đổi quyết định** → chọn vấn đề muốn đổi (multiSelect nếu 2+) → quay 3.5.2 → quay 3.5.3

### 3.5.4: Thảo luận mở rộng
Claude đưa vấn đề bổ sung MỚI (không trùng 3.5.1 và các vòng trước): vấn đề phát sinh từ quyết định đã chốt, tầng sâu hơn, hoặc user tự đề xuất.
- Có vấn đề mới → multiSelect cho user chọn → thảo luận theo 3.5.2 → quay 3.5.3
- Không có vấn đề mới → hỏi user có muốn tự đề xuất. Nếu không → Bước 4
- **Vòng lặp 3.5.3 ↔ 3.5.4** tiếp tục đến khi user chọn "Tiếp tục thiết kế" hoặc không còn vấn đề

---

## Bước 4: Thiết kế kỹ thuật
Cho mỗi deliverable, thiết kế theo loại:

- Nếu chế độ **DISCUSS**: thiết kế PHẢI tuân thủ các quyết định đã chốt ở Bước 3.5 — KHÔNG được thay đổi hay bỏ qua quyết định user đã chọn
- Nếu chế độ **AUTO**: Claude tự quyết định toàn bộ, ưu tiên phương án đơn giản, hiệu quả nhất. Mọi quyết định sẽ được ghi nhận ở Bước 4.5 sau khi thiết kế xong.

**Thiết kế theo stack** (đọc `.planning/rules/[stack].md`, tra Context7 cho patterns chi tiết):
- **Backend**: API endpoints (method, path, request/response), database entities/relations + migration strategy, DTOs, guards
- **Frontend**: pages/routes, components, stores, API integration, UI components
- **WordPress**: plugin/theme architecture, hooks, custom tables, REST API
- **Solidity**: contract architecture, functions + modifiers, events, token interactions, signature patterns
- **Flutter**: modules (Logic+State+View+Binding), navigation, design tokens, data layer
- **Stack khác**: thiết kế theo đặc thù stack, tham khảo Context7

**Chung:** files cần tạo/sửa, thư viện cần thêm

**UI/UX — Áp dụng @references/ui-brand.md:**

**Lớp 2 — Design Continuity** (nếu dự án ĐÃ CÓ UI):
- Trước khi thiết kế UI mới → kiểm tra 6 câu hỏi kế thừa (xem ui-brand.md → Lớp 2)
- Tìm component/page/flow tương tự trong codebase bằng FastCode/Grep → tái sử dụng pattern
- Ghi vào PLAN.md section `### UI — Kế thừa patterns` + `### UI — Pattern mới` (nếu có)

**Lớp 3 — UX Gaps** (nếu feature CHƯA CÓ UI/UX trước đó):
- Với MỖI feature mới → xét 7 khía cạnh bắt buộc: Entry point, Main CTA, Empty state, Loading state, Error state, Permission/Role state, Responsive
- Với feature phức tạp → xét thêm: Cognitive load, Vị trí trong flow, Phá pattern, Onboarding, Undo/Cancel
- Ghi kết quả vào PLAN.md section `### UX States — [Tên feature]` theo format trong ui-brand.md → Lớp 3
- Nếu không thể quyết định (VD: không biết mobile layout) → đánh dấu trong "Lưu ý kỹ thuật", gợi ý user cung cấp mockup

---

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

---

## Bước 5: Chia công việc
Đọc CONTEXT.md → Tech Stack để xác định project có Backend, Frontend, hay cả hai.

Xem @references/prioritization.md cho thứ tự ưu tiên.

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

---

## Bước 6: Tạo PLAN.md
Viết PLAN.md theo mẫu @templates/plan.md tại đường dẫn `.planning/milestones/[version]/phase-[phase]/PLAN.md`.

**Lưu ý theo context:**
- **CHỈ tạo sections có dữ liệu** — bỏ sections không liên quan đến stack (VD: bỏ API Endpoints nếu không có backend, bỏ Database nếu không có DB).
- **Section "Quyết định thiết kế"**: LUÔN tạo ở CẢ HAI chế độ. Chọn bảng dựa trên thực tế diễn ra:
  - **AUTO thuần** (hoặc DISCUSS skip-all) → bảng mở rộng (Lý do + Alternatives)
  - **DISCUSS thuần** (user thảo luận TẤT CẢ vấn đề) → bảng gốc (cột Nguồn)
  - **DISCUSS hybrid** (user thảo luận một số, skip/cancel phần còn lại) → dùng bảng gốc (cột Nguồn), nhưng các vấn đề "Claude quyết định" PHẢI kèm thêm dòng ghi chú bên dưới bảng giải thích Lý do + Alternatives cho từng vấn đề Claude tự quyết
  - Nếu không có quyết định nào (tất cả đã rõ ràng) → ghi "Không có quyết định thiết kế đặc biệt — tất cả đã xác định rõ từ ROADMAP/CONTEXT."

---

## Bước 7: Tạo TASKS.md
Viết TASKS.md theo mẫu @templates/tasks.md tại đường dẫn `.planning/milestones/[version]/phase-[phase]/TASKS.md`.

**Quy tắc sắp xếp tasks:**
- Áp dụng thứ tự ưu tiên từ @references/prioritization.md
- Entity/Model trước → Service → Controller → DTO (nếu có Backend)
- Backend API trước → Frontend consume sau (khi frontend cần data từ API mới)
- Frontend-only tasks (UI, SEO, layout) độc lập, không cần chờ backend
- Core logic trước → Validation sau
- Dependency chính xác cho parallel execution (xem Bước 5)

---

## Bước 8: Cập nhật tracking

**CURRENT_MILESTONE.md:** Xem @templates/current-milestone.md cho quy tắc cập nhật.
- Đọc field `phase` hiện tại trong CURRENT_MILESTONE.md
- CHỈ cập nhật field `phase` nếu:
  - Phase hiện tại chưa có TASKS.md (chưa được plan) → cập nhật sang phase vừa plan
  - Phase hiện tại đã hoàn tất (tất cả tasks ✅) → cập nhật sang phase vừa plan
  - **KHÔNG cập nhật** nếu phase hiện tại đang thực hiện (có tasks ⬜/🔄) → user đang plan trước cho phase sau
- Cập nhật field `status` → `Đang thực hiện` (nếu đang là `Chưa bắt đầu`)

**STATE.md (nếu có):** Xem @templates/state.md cho quy tắc cập nhật.
- Cập nhật "Hoạt động cuối": `[DD_MM_YYYY] — Lên kế hoạch phase [x.x] hoàn tất`
- Cập nhật "Vị trí hiện tại" → Phase: CHỈ cập nhật nếu CURRENT_MILESTONE.md `phase` cũng được cập nhật ở trên (phase hiện tại chưa plan hoặc đã hoàn tất). Nếu CURRENT_MILESTONE KHÔNG đổi (user pre-plan phase sau) → giữ nguyên STATE.md Phase (tránh desync)
- Cập nhật "Kế hoạch" → `Kế hoạch hoàn tất, sẵn sàng code` (CHỈ khi Phase cũng được cập nhật)

**ROADMAP.md:**
- Tìm milestone hiện tại → cập nhật `Trạng thái: ⬜` → `Trạng thái: 🔄` (nếu đang là ⬜)

---

## Bước 8.5: Git commit kế hoạch (CHỈ nếu project có git)

Kiểm tra git: `git rev-parse --git-dir 2>/dev/null`. Nếu KHÔNG có git → bỏ qua bước này.

```bash
git add .planning/milestones/[version]/phase-[phase]/PLAN.md
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
# Nếu có DISCUSS_STATE.md (chế độ --discuss):
git add .planning/milestones/[version]/phase-[phase]/DISCUSS_STATE.md 2>/dev/null
# Tracking files đã cập nhật ở Bước 8:
git add .planning/CURRENT_MILESTONE.md .planning/ROADMAP.md
git add .planning/STATE.md 2>/dev/null
git commit -m "docs: kế hoạch phase [x.x] — [mục tiêu phase ngắn gọn]

Tasks: [N] tasks | Loại: [Backend/Frontend/Fullstack]"
```

Mục đích: bảo vệ công sức lập kế hoạch khỏi mất mát nếu phiên bị ngắt trước khi `/pd:write-code` chạy.

---

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
- Chế độ DISCUSS: Ưu tiên dùng `AskUserQuestion` cho mọi lựa chọn — user chọn bằng phím mũi tên. Nếu `AskUserQuestion` không khả dụng → hỏi bằng văn bản thường (liệt kê options dạng danh sách, chờ user trả lời bằng text), KHÔNG yêu cầu gõ A/B/C hoặc số
- Chế độ DISCUSS: PHẢI chờ user trả lời sau mỗi câu hỏi — KHÔNG tự chọn thay user
- Chế độ DISCUSS: Nếu user bỏ qua tất cả ở 3.5.1 → chuyển sang AUTO cho phần còn lại (Bước 4 + 4.5 + bảng AUTO)
- Chế độ DISCUSS: Nếu user cancel giữa 3.5.2 → GIỮ quyết định đã chốt + Claude quyết định phần còn lại → hiển thị 3.5.3 tóm tắt → user xác nhận
- Chế độ DISCUSS: "Other" (tự động từ AskUserQuestion, hoặc ghi rõ "hoặc mô tả cách riêng" trong văn bản thường) — user luôn có thể tự mô tả
- Chế độ DISCUSS: Thiết kế kỹ thuật PHẢI phản ánh đúng quyết định user đã chốt — vi phạm = lỗi
- Chế độ DISCUSS: Bước 3.5.3 ↔ 3.5.4 tạo vòng lặp — user có thể chọn "Thảo luận thêm" bao nhiêu lần tùy thích. Vòng lặp kết thúc khi user chọn "Tiếp tục thiết kế" ở 3.5.3, HOẶC không chọn/chọn "Không" ở 3.5.4 → đi thẳng Bước 4
- Chế độ DISCUSS: Khi user chọn "Thảo luận thêm", Claude PHẢI đưa ra vấn đề MỚI — KHÔNG lặp lại vấn đề đã chốt VÀ KHÔNG hiện lại vấn đề đã từng đưa ra nhưng user bỏ qua
- Chế độ DISCUSS: Ngôn ngữ trong options PHẢI đơn giản, dễ hiểu — viết cho người KHÔNG phải developer. Giải thích bằng kết quả/hệ quả thay vì thuật ngữ kỹ thuật. Thuật ngữ kỹ thuật chỉ dùng khi không có cách diễn đạt đơn giản hơn, và phải kèm giải thích ngắn

**Quy tắc khôi phục (gián đoạn):**
- Nếu PLAN.md + TASKS.md đã tồn tại (tất cả ⬜) → PHẢI hỏi user muốn giữ hay làm lại — KHÔNG ghi đè tự động
- Nếu CHỈ có PLAN.md mà thiếu TASKS.md → cho phép tạo TASKS.md từ PLAN.md hiện có mà không cần research lại
- Nhảy Bước 8 khi giữ nguyên plan → đảm bảo tracking files (CURRENT_MILESTONE, ROADMAP, STATE) được cập nhật đúng
</rules>
