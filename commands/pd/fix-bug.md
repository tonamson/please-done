---
name: pd:fix-bug
description: Tìm và sửa lỗi theo phương pháp khoa học, tìm hiểu, báo cáo, sửa code, commit [LỖI] và xác nhận cho đến khi thành công
---

<objective>
Tìm và sửa lỗi theo phương pháp khoa học: thu thập triệu chứng → phân loại rủi ro → hình thành giả thuyết → kiểm chứng → cổng kiểm tra trước khi sửa → sửa code → xác nhận. Lưu trạng thái điều tra (.planning/debug/) để tiếp tục khi cuộc hội thoại bị mất. Lặp đến khi user xác nhận thành công. Tạo patch version cho milestone đã hoàn tất.
</objective>

<context>
User input: $ARGUMENTS

Đọc:
- `.planning/CONTEXT.md` → công nghệ sử dụng, thư viện
- `.planning/rules/general.md` → quy tắc chung
- `.planning/rules/nestjs.md` hoặc `nextjs.md` hoặc `wordpress.md` hoặc `solidity.md` hoặc `flutter.md` → theo loại lỗi (CHỈ nếu file tồn tại)

Nếu chưa có CONTEXT.md → thông báo chạy `/pd:init` trước.
</context>

<process>

## Bước 1: Kiểm tra phiên điều tra + thu thập triệu chứng

Kiểm tra git: `git rev-parse --git-dir 2>/dev/null` → lưu `HAS_GIT` (dùng ở Bước 9)
Đảm bảo thư mục tồn tại: `mkdir -p .planning/debug`

### 1a. Kiểm tra phiên điều tra đang mở
Glob `.planning/debug/SESSION_*.md` → Grep `> Trạng thái:` → lọc các trạng thái **có thể tiếp tục**:
- `Đang điều tra` — đang giữa chừng phân tích
- `Điểm dừng` — đang chờ user trả lời câu hỏi
- `Chờ quyết định` — đã tìm nguyên nhân gốc, chờ user chọn phương án
- `Tạm dừng` — user chủ động dừng, có thể quay lại

Trạng thái **KHÔNG tự động liệt kê** (không tự tiếp tục; chỉ mở lại khi user nêu rõ phiên điều tra hoặc lỗi cũ):
- `Đã tìm nguyên nhân` — đã xong điều tra, đang ở bước sửa
- `Đã giải quyết` — đã đóng
- `Chưa kết luận` — cần user bổ sung thông tin mới → nếu user nêu lại lỗi này, đọc SESSION → nhảy **Bước 5c** với thông tin mới

- Nếu có phiên có thể tiếp tục VÀ không có $ARGUMENTS:
  - Liệt kê các phiên với trạng thái + giả thuyết hiện tại + việc cần làm tiếp
  - User chọn tiếp tục → đọc SESSION file → nhảy bước phù hợp theo trạng thái:
    - `Đang điều tra` / `Tạm dừng` → **Bước 5c** (tiếp tục giả thuyết)
    - `Điểm dừng` → hiển thị lại câu hỏi điểm dừng, chờ user trả lời → tiếp tục **Bước 5c**
    - `Chờ quyết định` → hiển thị lại các phương án, chờ user chọn → tiếp tục **Bước 6b** rồi **6c**
- Nếu có $ARGUMENTS → tiếp tục thu thập triệu chứng mới

Nếu có báo cáo lỗi đang mở (Glob `.planning/bugs/BUG_*.md` → Grep `> Trạng thái: (Chưa xử lý|Đang sửa)` — pattern phải khớp cả format có `> ` đằng trước):
- Liệt kê lỗi đang mở cho user chọn: "Có [X] lỗi đang mở. Bạn muốn xử lý lỗi nào?"
- Nếu user chọn lỗi có sẵn → đọc báo cáo lỗi, điền sẵn triệu chứng → nhảy Bước 3

### 1b. Thu thập triệu chứng (nếu lỗi mới)
Thu thập đủ 5 thông tin — từ $ARGUMENTS hoặc hỏi user:

1. **Hành vi mong đợi** — Lẽ ra phải thế nào?
2. **Hành vi thực tế** — Thực tế xảy ra gì?
3. **Thông báo lỗi** — Log/thông báo lỗi cụ thể? (dán hoặc mô tả)
4. **Dòng thời gian** — Khi nào bắt đầu lỗi? Trước đó có hoạt động bình thường không? Có thay đổi gì gần đây?
5. **Bước tái hiện** — Làm gì để lỗi xảy ra lại?

Nếu $ARGUMENTS đã chứa đủ thông tin → KHÔNG hỏi thêm, tự trích xuất.
Nếu thiếu thông tin quan trọng (đặc biệt #2 và #5) → hỏi user bổ sung.

**Cách hỏi:** Khi hỏi, ĐƯA RA gợi ý đáp án phổ biến dựa trên ngữ cảnh để user chọn nhanh, ĐỒNG THỜI cho phép user tự nhập nếu không có đáp án nào đúng ý.
VD: "Lỗi cụ thể là gì? (1) Số tiền sai (2) Thu hồi nhầm người (3) Không thu hồi — hoặc mô tả khác?"
Nếu sau 5 triệu chứng mà vẫn chưa đủ ngữ cảnh để hình thành giả thuyết → TỰ linh hoạt hỏi thêm (route nào, payload gì, dữ liệu mẫu, log console...). Không giới hạn số câu hỏi.

## Bước 2: Xác định patch version
- Đọc `.planning/CURRENT_MILESTONE.md` → version hiện tại (VD: `1.1`)
- Nếu CURRENT_MILESTONE.md không tồn tại → hỏi user "Lỗi này thuộc phiên bản nào?", dùng version user cung cấp, bỏ qua logic so sánh version bên dưới
- So sánh version lỗi với version hiện tại:
  - Lỗi thuộc version CŨ hơn (VD: lỗi ở v1.0, hiện tại v1.1) → milestone đã hoàn tất → tạo patch:
    - Glob `.planning/bugs/BUG_*.md` → Grep `Patch version: [version-gốc]` (khớp cả `1.0` chính xác lẫn `1.0.1`, `1.0.2`). Sau đó lọc kết quả: chỉ lấy entries có patch version dạng `[version-gốc].N` (3 số) → tìm patch cao nhất hiện có
    - Nếu chưa có patch → dùng `[version-gốc].1` (VD: `1.0.1`)
    - Nếu đã có → tăng: `1.0.1` → `1.0.2`, `1.0.2` → `1.0.3`
  - Lỗi thuộc version HIỆN TẠI → milestone chưa hoàn tất → Patch version = `[version].0` (VD: `1.1.0`). Nếu đã có lỗi trước → tìm patch version cao nhất trong `.planning/bugs/` cho cùng version và tăng thêm 1.
- Nếu user không chỉ rõ version lỗi → hỏi "Lỗi này thuộc phiên bản nào?"
- Kiểm tra thư mục `.planning/milestones/[version-gốc]/` tồn tại. Nếu không → thông báo: "Thư mục milestone v[x.x] không tồn tại. Kiểm tra version." và DỪNG.

## Bước 3: Đọc tài liệu kỹ thuật (CHỈ PHẦN LIÊN QUAN)
Dùng **version gốc** (VD: `1.0`) để đọc, KHÔNG dùng patch version (VD: `1.0.1`):

**Tìm phase liên quan TRƯỚC — KHÔNG đọc tất cả phases:**
1. Grep chức năng bị lỗi trong `.planning/milestones/[version-gốc]/phase-*/PLAN.md` → xác định phase(s) liên quan
2. CHỈ đọc PLAN.md + CODE_REPORT của phase(s) liên quan
3. Nếu Grep không khớp → mở rộng tìm trong tất cả PLAN.md (dự phòng)

- `.planning/milestones/[version-gốc]/phase-[N]/PLAN.md` → thiết kế kỹ thuật, API, cấu trúc database
- `.planning/milestones/[version-gốc]/phase-[N]/reports/CODE_REPORT_TASK_*.md` → files đã tạo, quyết định kỹ thuật
- `.planning/rules/` chứa đầy đủ quy ước viết code

Đọc tài liệu giúp hiểu TẠI SAO code được viết như vậy trước khi tìm lỗi.

## Bước 4: Tìm hiểu files liên quan
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
1. "Files liên quan đến [chức năng bị lỗi]?"
2. Backend: "Luồng xử lý từ controller → service → database cho [chức năng]?"
3. Frontend: "Components, stores, API calls liên quan đến [chức năng]?"

Nếu FastCode MCP lỗi khi gọi → chuyển sang Grep/Read để tìm hiểu. Cảnh báo: "FastCode không khả dụng, tìm hiểu bằng Grep/Read (độ chính xác có thể thấp hơn)."

**Nếu lỗi liên quan đến thư viện** → tra cứu tài liệu qua Context7:
1. `mcp__context7__resolve-library-id` (libraryName: tên thư viện, query: mô tả lỗi) → lấy library ID
2. `mcp__context7__query-docs` (libraryId: ID, query: "cách sử dụng đúng [API/function]") → xác nhận cú pháp
- TỰ ĐỘNG tra cứu khi nghi ngờ sai cú pháp/cấu hình thư viện — KHÔNG cần user yêu cầu
- Nếu Context7 MCP không có → dùng `.planning/docs/` hoặc kiến thức sẵn có

## Bước 5: Phân tích theo phương pháp khoa học

### 5a. Tạo/cập nhật phiên điều tra
Viết `.planning/debug/SESSION_[tên-tắt].md` (tên-tắt = tên ngắn gọn chức năng lỗi, VD: `login-timeout`, `cart-empty`):

```markdown
# Phiên điều tra: [tên-tắt]
> Bắt đầu: [DD_MM_YYYY HH:MM] | Trạng thái: Đang điều tra
> Phân loại: [🟢/🟡/🟠/🔴/🔵 — xem Bước 6a]
> Báo cáo lỗi: BUG_[timestamp].md (liên kết sau Bước 7)

## Triệu chứng
- **Mong đợi:** [lẽ ra phải thế nào]
- **Thực tế:** [thực tế xảy ra gì]
- **Thông báo lỗi:** [log/error cụ thể]
- **Dòng thời gian:** [khi nào, trước đó có hoạt động?]
- **Tái hiện:** [các bước]

## Tái hiện tối giản (nếu cần)
[Mô tả bước ít nhất để lỗi xảy ra lại]

## Giả thuyết
### GT1: [mô tả giả thuyết]
- **Kiểm tra bằng:** [cách kiểm tra cụ thể]
- **Bằng chứng:** [bằng chứng thu thập được]
- **Kết quả:** ✅ Đúng / ❌ Sai / ⏳ Chưa kiểm tra

### GT2: ...

## Files đã kiểm tra
- `[file:dòng]`: [phát hiện gì]

## Kết luận
[Cập nhật khi tìm được nguyên nhân gốc]
```

### 5b. Tái hiện tối giản (cho lỗi khó)
**Khi nào cần:** lỗi không rõ bước tái hiện, lỗi lúc có lúc không, hoặc đường tái hiện phức tạp (5+ bước).
**Cách làm:**
1. Từ triệu chứng, tìm đường ngắn nhất để lỗi xảy ra lại
2. Loại bỏ yếu tố gây nhiễu: dữ liệu thừa, bước không liên quan, trạng thái phụ
3. Ghi lại vào SESSION file `## Tái hiện tối giản`
4. Dùng kết quả tái hiện tối giản làm cơ sở cho giả thuyết

Nếu lỗi rõ ràng (đường tái hiện đơn giản, thông báo lỗi chỉ thẳng vào file/dòng) → bỏ qua bước này.

### 5c. Hình thành + kiểm chứng giả thuyết

Xác định lỗi thuộc Backend hay Frontend (từ CONTEXT.md → công nghệ sử dụng).
Đọc `.planning/rules/nestjs.md` hoặc `.planning/rules/nextjs.md` hoặc `.planning/rules/wordpress.md` hoặc `.planning/rules/solidity.md` hoặc `.planning/rules/flutter.md` tương ứng:

**Nếu lỗi Backend (NestJS):**
- Truy vết luồng: request → controller → service → database → response
- Kiểm tra: DTO validation, guard/middleware, logic xử lý, xử lý lỗi

**Nếu lỗi Frontend (NextJS):**
- Truy vết luồng: page/component → store (Zustand) → gọi API (`lib/api.ts`) → hiển thị
- Kiểm tra: `'use client'` thiếu/thừa, lỗi không đồng bộ server-client, state không đồng bộ, xử lý API response, antd component props sai, logic style

**Nếu lỗi WordPress (Plugin/Theme):**
- Truy vết luồng: hook/action → callback → database ($wpdb) → output
- Kiểm tra: sanitize/escape thiếu, nonce verify, kiểm tra quyền, prepared statements, `defined('ABSPATH')` check
- Tra cứu `.planning/docs/wordpress/` cho các mẫu phức tạp

**Nếu lỗi Solidity (Smart Contract):**
- Truy vết luồng: function call → require checks → thay đổi state → tương tác bên ngoài → events
- Kiểm tra: reentrancy (nonReentrant thiếu, checks-effects-interactions sai thứ tự), kiểm soát quyền truy cập (modifier thiếu), SafeERC20 (dùng transfer thay vì safeTransfer), tràn số (unchecked block), xác minh chữ ký (hash thiếu params, deadline check, hashUsed order), phát sự kiện (thiếu emit sau thay đổi state, sai params), hàm cứu token (clearUnknownToken/rescueETH kiểm tra số dư, address(0) check), flash loan (logic phụ thuộc số dư bị thao túng)
- Tra cứu `.planning/docs/solidity/audit-checklist.md` cho danh sách kiểm tra bảo mật
- Tra cứu `.planning/docs/solidity/templates.md` cho mẫu tham khảo

**Nếu lỗi Flutter (Dart + GetX):**
- Truy vết luồng: View (Obx/GetBuilder) → Logic (GetxController) → Repository → API (Dio) → Response
- Kiểm tra: vòng đời GetX (onInit/onClose thiếu dispose), trạng thái reactive (.obs không cập nhật giao diện, Obx phạm vi quá rộng), điều hướng (route sai, arguments null), design tokens (viết cứng thay vì dùng AppColors/AppSpacing), Dio interceptors (auth header thiếu, logic thử lại), xác thực form (formKey state)
- Tra cứu `.planning/docs/flutter/` cho quản lý trạng thái, mẫu điều hướng

**Quy trình giả thuyết (ÁP DỤNG CHO TẤT CẢ nền tảng):**
1. Từ triệu chứng + truy vết luồng → hình thành 1-3 giả thuyết ban đầu
2. Với MỖI giả thuyết:
   - Xác định cách kiểm tra (đọc code, chạy test, kiểm tra DB/log...)
   - Thu thập bằng chứng
   - Đánh giá: ✅ Đúng → nguyên nhân gốc / ❌ Sai → loại bỏ, ghi lại lý do
3. Cập nhật SESSION file sau mỗi giả thuyết được kiểm tra
4. Nếu TẤT CẢ giả thuyết ban đầu sai → mở rộng phạm vi tìm kiếm, hình thành giả thuyết mới

**Nếu cần user xác minh giữa chừng (ĐIỂM DỪNG):**
- Cập nhật SESSION: `> Trạng thái: Điểm dừng`
- Thêm section trong SESSION file:
```markdown
## Điểm dừng [N]
> Loại: [người-dùng-xác-minh / cần-thêm-thông-tin / kiểm-tra-môi-trường]
> Câu hỏi: [câu hỏi cụ thể cho user]
> Trả lời: [cập nhật sau khi user phản hồi]
```
- Hỏi user (VD: "Bạn có thể xác nhận dữ liệu trong table X?", "Lỗi có xảy ra trên production không?", "Version thư viện Y đang dùng là gì?")
- Sau khi user trả lời → cập nhật SESSION → `> Trạng thái: Đang điều tra` → tiếp tục

**Chung:**
- Tìm điểm gây lỗi: file + dòng code
- Giải thích tại sao gây lỗi
- Đánh giá ảnh hưởng đến chức năng khác

## Bước 6: Đánh giá kết quả điều tra

### 6a. Phân loại rủi ro
Ngay khi xác định được bản chất lỗi (dù chưa tìm đầy đủ nguyên nhân gốc), phân loại:

| Loại | Ký hiệu | Ví dụ | Chiến lược kiểm thử | Chiến lược commit |
|---|---|---|---|---|
| **Sửa nhanh** | 🟢 | Lỗi chính tả, CSS, giá trị cấu hình sai, thiếu import | Lint + build qua là đủ | Commit trực tiếp |
| **Lỗi logic** | 🟡 | Logic code sai, thiếu trường hợp ngoại lệ, sai lệch 1 đơn vị | Unit test + integration test bắt buộc | Commit + test trong cùng commit |
| **Lỗi dữ liệu** | 🟠 | Dữ liệu hỏng, migration sai, cấu trúc DB lệch | Sao lưu dữ liệu TRƯỚC khi sửa, kiểm tra dữ liệu SAU khi sửa | Commit riêng cho migration/sửa |
| **Nhạy cảm bảo mật** | 🔴 | Vượt quyền xác thực, injection, kiểm soát truy cập, lộ khóa bí mật | PHẢI có user đồng ý trước khi sửa, rà soát bảo mật | Commit riêng, KHÔNG gộp với thay đổi khác |
| **Hạ tầng/cấu hình** | 🔵 | Biến môi trường, cấu hình triển khai, dịch vụ bên thứ ba, docker | Kiểm tra cấu hình đúng môi trường | Tóm tắt thay đổi thay vì code TRƯỚC/SAU |

Cập nhật SESSION: `> Phân loại: [ký hiệu + tên]`
Phân loại ảnh hưởng đến: định dạng báo cáo lỗi (Bước 7), mức kiểm thử (Bước 8), chiến lược commit (Bước 9).

### 6b. Đánh giá kết quả

#### ✅ TÌM ĐƯỢC NGUYÊN NHÂN GỐC, CÁCH SỬA RÕ RÀNG → tiếp tục Bước 6c
Cập nhật SESSION: `> Trạng thái: Đã tìm nguyên nhân`
Điền `## Kết luận` trong SESSION file.

#### ⚠️ TÌM ĐƯỢC NGUYÊN NHÂN GỐC, NHƯNG CẦN USER QUYẾT ĐỊNH
Áp dụng khi cách sửa có đánh đổi hoặc đụng vùng nhạy cảm:
- Sửa ảnh hưởng di chuyển dữ liệu (cần kế hoạch quay lại?)
- Sửa đụng logic xác thực/thanh toán/smart contract (cần rà soát kỹ hơn?)
- Sửa làm thay đổi giao tiếp API cũ (phá vỡ tương thích?)
- Có nhiều cách sửa với ưu/nhược khác nhau

Thao tác:
- Cập nhật SESSION: `> Trạng thái: Chờ quyết định`
- Trình bày cho user:
  > "Đã tìm được nguyên nhân: [nguyên nhân gốc]. Tuy nhiên, cách sửa này [lý do cần quyết định]."
  > **Phương án A:** [mô tả] — Ưu điểm: [...] / Nhược điểm: [...]
  > **Phương án B:** [mô tả] — Ưu điểm: [...] / Nhược điểm: [...]
- Sau khi user chọn → cập nhật SESSION → tiếp tục **Bước 6c**

#### ❌ KHÔNG TÌM ĐƯỢC NGUYÊN NHÂN GỐC
Cập nhật SESSION: `> Trạng thái: Chưa kết luận`
Thông báo user:
> "Đã kiểm tra [N] giả thuyết nhưng chưa xác định được nguyên nhân gốc."
> Liệt kê: giả thuyết đã loại bỏ + bằng chứng thu thập
> Gợi ý:
> 1. **Bổ sung thông tin** — thêm log/thông báo lỗi chi tiết hơn, tái hiện chính xác hơn
> 2. **Mở rộng phạm vi** — kiểm tra hạ tầng, dịch vụ bên thứ ba, dữ liệu hỏng
> 3. **Thêm log tạm** — chèn log vào code để bắt lỗi khi chạy thật, rồi thử lại

Nếu user bổ sung thông tin → cập nhật SESSION triệu chứng + bằng chứng → quay lại **Bước 5c**.
Nếu user muốn dừng → cập nhật SESSION: `> Trạng thái: Tạm dừng` → kết thúc (có thể tiếp tục sau).

**QUAN TRỌNG:** Khi chưa tìm được nguyên nhân gốc → KHÔNG tạo BUG_*.md. Chỉ giữ SESSION file. Báo cáo lỗi chỉ được tạo ở Bước 7 sau khi đã qua cổng kiểm tra trước khi sửa.

### 6c. Cổng kiểm tra trước khi sửa
**KHÔNG được sang Bước 7 nếu chưa đạt đủ 3 điều kiện:**

1. **Đã tái hiện được lỗi HOẶC có bằng chứng thay thế đủ mạnh**
   - Tái hiện trực tiếp (chạy lại → thấy lỗi) ✅
   - HOẶC bằng chứng gián tiếp: log rõ ràng, đọc code thấy lỗi logic hiển nhiên, dấu vết lỗi chỉ thẳng dòng code ✅
   - Chỉ có "user nói lỗi" mà không xác minh được → ❌ quay lại Bước 5b/5c

2. **Đã xác định file + logic gây lỗi cụ thể**
   - Biết chính xác file nào, dòng nào, logic nào sai ✅
   - Chỉ biết "lỗi ở module X" mà không biết điểm chính xác → ❌ quay lại Bước 5c

3. **Đã có kế hoạch kiểm tra sau khi sửa**
   - Biết cách kiểm tra bản sửa hoạt động: chạy test, tái hiện lại → hết lỗi, kiểm tra trên giao diện/DB ✅
   - Không biết kiểm tra bằng cách nào → ❌ xác định kế hoạch kiểm tra trước

Nếu cả 3 đạt → tiếp tục Bước 7.

## Bước 7: Viết báo cáo lỗi
Viết `.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md`:

```markdown
# Báo cáo lỗi
> Ngày: [DD_MM_YYYY HH:MM:SS] | Mức độ: Nghiêm trọng/Cao/Trung bình/Nhẹ
> Trạng thái: Đang sửa | Chức năng: [Tên] | Task: [N] (nếu biết)
> Patch version: [x.x.x] | Lần sửa: 1
> Phân loại: [🟢/🟡/🟠/🔴/🔵 tên loại]
> Phiên điều tra: SESSION_[tên-tắt].md

## Mô tả lỗi
[Nguyên văn từ user]

## Triệu chứng
- **Mong đợi:** [lẽ ra phải thế nào]
- **Thực tế:** [thực tế xảy ra gì]
- **Dòng thời gian:** [khi nào bắt đầu]

## Bước tái hiện
1. → 2. → Lỗi xảy ra

## Phân tích nguyên nhân
### Giả thuyết đã kiểm tra:
- GT1: [mô tả] → ❌ Loại bỏ vì [lý do]
- GT2: [mô tả] → ✅ **Nguyên nhân gốc**

### [Phần code/thay đổi — TÙY phân loại]:

**🟢🟡🟠🔴 Lỗi code → Code TRƯỚC/SAU:**
File: `[đường dẫn]`
```
[code gây lỗi]
```
→ Nguyên nhân: [giải thích]

File: `[đường dẫn]`
```
[code đã sửa]
```

**🔵 Lỗi hạ tầng/cấu hình → Tóm tắt thay đổi:**
File: `[đường dẫn]`
- Thay đổi: [giá trị cũ] → [giá trị mới]
- Lý do: [giải thích]

## Ảnh hưởng
- [Chức năng A]: Không ảnh hưởng / Có ảnh hưởng → [chi tiết]

## Kế hoạch kiểm tra
[Cách kiểm tra bản sửa hoạt động — từ cổng kiểm tra điều kiện #3]

## Xác nhận
- [ ] Đã áp dụng bản sửa
- [ ] User xác nhận đúng
- [ ] Không phát sinh lỗi mới
```

Cập nhật liên kết báo cáo lỗi trong SESSION file: `> Báo cáo lỗi: BUG_[timestamp].md`

## Bước 8: Sửa code
- Áp dụng bản sửa, tuân thủ quy tắc trong `.planning/rules/`
- Cập nhật JSDoc nếu logic thay đổi (tiếng Việt)
- Chạy lint + build đúng thư mục (xem `.planning/rules/nestjs.md` hoặc `nextjs.md` hoặc `wordpress.md` hoặc `solidity.md` hoặc `flutter.md` → mục **Build & Lint**)

**Chiến lược kiểm thử theo phân loại:**
- 🟢 Sửa nhanh: lint + build qua là đủ
- 🟡 Lỗi logic: PHẢI thêm/cập nhật test — `.spec.ts` (NestJS) hoặc `test-*.php` (WordPress) hoặc `test/*.ts`/`test/*.t.sol` (Solidity) hoặc `test/**/*_test.dart` (Flutter)
- 🟠 Lỗi dữ liệu: sao lưu dữ liệu trước, kiểm tra tính toàn vẹn dữ liệu sau khi sửa
- 🔴 Nhạy cảm bảo mật: test BẮT BUỘC + xác nhận với user trước khi áp dụng
- 🔵 Hạ tầng/cấu hình: kiểm tra cấu hình đúng môi trường (dev/staging/prod)

## Bước 9: Git commit (CHỈ nếu HAS_GIT = true, xem Bước 1)

**Chiến lược commit theo phân loại:**
- 🟢🟡🔵: commit sửa code + báo cáo lỗi + phiên điều tra trong 1 commit
- 🟠: commit riêng cho migration/sửa dữ liệu (nếu có), commit riêng cho sửa code
- 🔴: commit riêng, KHÔNG gộp với thay đổi không liên quan

```
git add [files đã sửa]
git add .planning/bugs/BUG_[timestamp].md
git add .planning/debug/SESSION_[tên-tắt].md
git commit -m "[LỖI] Khắc phục [tóm tắt lỗi ngắn gọn]

Phân loại: [🟢/🟡/🟠/🔴/🔵 tên loại]
Nguyên nhân: [nguyên nhân gốc]
Lỗi phát sinh: [mô tả cách lỗi xảy ra]
Files đã sửa:
- [file]: [thay đổi gì]"
```

## Bước 10: Yêu cầu xác nhận
> "Đã sửa lỗi [mô tả]. Vui lòng kiểm tra lại trên giao diện/database và xác nhận."

### User xác nhận ĐÃ SỬA ĐƯỢC:
- Báo cáo lỗi: Trạng thái → Đã giải quyết, tick checklist
- Phiên điều tra: `> Trạng thái: Đã giải quyết`
- Tìm TASKS.md chứa task bị 🐛: dùng version GỐC của lỗi (VD: `1.0` từ patch version `1.0.2`) để tìm TASKS.md, KHÔNG dùng version hiện tại từ CURRENT_MILESTONE. (Glob `.planning/milestones/[version-gốc]/phase-*/TASKS.md` → Grep task liên quan) → xóa 🐛, đổi ✅
- Cập nhật trạng thái CẢ HAI nơi: (1) bảng Tổng quan, (2) task detail block `> Trạng thái:`.
- Nếu HAS_GIT:
```
git add .planning/bugs/BUG_[...].md
git add .planning/debug/SESSION_[tên-tắt].md
git add .planning/milestones/[version-gốc]/phase-*/TASKS.md
git commit -m '[LỖI] Xác nhận đã khắc phục [tóm tắt lỗi]'
```

### User báo CHƯA SỬA ĐƯỢC:
- Thu thập thêm thông tin (triệu chứng mới? bằng chứng mới?)
- Báo cáo lỗi: tăng "Lần sửa" (2, 3, 4...), thêm section "Lần sửa [N]"
- Phiên điều tra: thêm giả thuyết mới, cập nhật bằng chứng
- Quay lại **Bước 5c** phân tích lại — hình thành giả thuyết mới dựa trên bằng chứng mới
- Commit mỗi lần sửa với prefix [LỖI]
- Nếu đã thử sửa 3+ lần → gợi ý: "Đã thử [N] lần. Cân nhắc: (1) phân tích lại từ đầu với góc nhìn mới, (2) thay đổi cách tiếp cận hoàn toàn, (3) thêm log tạm để bắt lỗi khi chạy thật."
- **TIẾP TỤC cho đến khi user xác nhận thành công**
</process>

<rules>
- Tuân thủ quy tắc trong `.planning/rules/` (general + nestjs/nextjs/wordpress/solidity/flutter theo loại lỗi)
- CẤM đọc/hiển thị nội dung file nhạy cảm (`.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- PHẢI đọc PLAN.md + CODE_REPORT trước khi sửa (CHỈ phase liên quan, không tất cả)
- PHẢI tìm hiểu trước khi sửa, KHÔNG đoán mò
- PHẢI hình thành giả thuyết trước khi sửa — KHÔNG sửa mò
- PHẢI qua cổng kiểm tra (tái hiện được HOẶC bằng chứng thay thế đủ mạnh + xác định file/logic cụ thể + kế hoạch kiểm tra sau sửa) trước khi sửa
- PHẢI phân loại rủi ro để quyết định chiến lược kiểm thử + chiến lược commit
- PHẢI viết báo cáo lỗi — code TRƯỚC/SAU cho lỗi code, tóm tắt thay đổi cho lỗi hạ tầng/cấu hình
- PHẢI duy trì phiên điều tra (.planning/debug/) suốt quá trình — cập nhật sau mỗi bước quan trọng
- KHÔNG tạo BUG_*.md khi chưa qua cổng kiểm tra — chưa có nguyên nhân gốc thì chỉ giữ SESSION
- KHÔNG tự đóng lỗi - PHẢI chờ user xác nhận
- KHÔNG giới hạn số lần sửa - lặp đến khi user xác nhận
- Mỗi lần sửa: commit riêng với prefix [LỖI]
- Patch version tăng dần: 1.0 → 1.0.1 → 1.0.2
- Nếu sửa ảnh hưởng chức năng khác → THÔNG BÁO user
- Lỗi 🔴 nhạy cảm bảo mật: PHẢI có user đồng ý trước khi áp dụng bản sửa
- Lỗi ⚠️ có đánh đổi: PHẢI trình bày các phương án + ưu/nhược, chờ user chọn trước khi sửa
- Nếu FastCode MCP lỗi → chuyển sang Grep/Read, KHÔNG DỪNG hoàn toàn
- Khi tiếp tục phiên điều tra → đọc SESSION file TRƯỚC, không bắt đầu lại từ đầu
</rules>

<success_criteria>
- [ ] Triệu chứng thu thập đủ 5 thông tin (mong đợi/thực tế/thông báo lỗi/dòng thời gian/tái hiện)
- [ ] Tài liệu kỹ thuật đã đọc (PLAN.md + CODE_REPORT của phase liên quan)
- [ ] Tìm hiểu xong trước khi sửa (FastCode/Context7/Grep)
- [ ] Phân loại rủi ro đã xác định (🟢/🟡/🟠/🔴/🔵)
- [ ] Giả thuyết được hình thành và kiểm chứng có hệ thống
- [ ] Cổng kiểm tra đạt đủ 3 điều kiện
- [ ] Phiên điều tra (.planning/debug/) được tạo và cập nhật xuyên suốt
- [ ] Báo cáo lỗi đúng định dạng theo phân loại (code TRƯỚC/SAU hoặc tóm tắt thay đổi)
- [ ] Kiểm thử + build qua theo chiến lược kiểm thử của phân loại
- [ ] User xác nhận sửa thành công
</success_criteria>
