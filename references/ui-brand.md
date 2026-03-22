# UI & Brand — Hướng dẫn sản phẩm cho Planning & Design

> Dùng bởi: `/pd:new-milestone`, `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone`
> 3 lớp: (1) product framing, (2) design continuity, (3) UX cho feature mới chưa có UI

---

## Lớp 1: Product Framing

> Áp dụng khi: viết REQUIREMENTS, ROADMAP, PLAN, MILESTONE_COMPLETE

### Nguyên tắc cốt lõi

**Mọi output phải trả lời: "User được gì?"**
Luôn framing từ góc nhìn user cuối. Không mô tả được lợi ích → hỏi: "Tại sao user cần?"

### Viết requirements

Format: `[MÃ]-[SỐ]: Người dùng có thể [hành động] để [mục đích/lợi ích]`

| Xấu (tech-focused) | Tốt (user-focused) |
|-----|-----|
| "Tạo API endpoint login" | "Người dùng có thể đăng nhập bằng email" |
| "Setup Redis caching" | "Trang tải trong dưới 2 giây" |
| "Implement WebSocket" | "Người dùng thấy tin nhắn mới ngay lập tức" |
| "Thêm middleware xác thực JWT" | "Chỉ người đã đăng nhập mới xem được trang quản lý" |
| "Triển khai smart contract ERC20" | "Người dùng có thể chuyển token giữa các ví" |
| "Cấu hình GetX bindings" | "Ứng dụng mở nhanh, chuyển trang mượt mà" |

### Tiêu chí thành công

Format: `[Ai] có thể [hành động] → [kết quả quan sát được]`

| Xấu | Tốt |
|-----|-----|
| "API trả về 200 OK" | "Đăng nhập thành công → chuyển về trang chủ trong 1 giây" |
| "Database có đúng schema" | "Tạo tài khoản mới → thấy ngay trong danh sách quản trị" |
| "Contract deploy thành công" | "Người dùng gửi token → số dư cập nhật đúng trong 15 giây" |

### Phase = Kết quả sản phẩm

| Xấu | Tốt |
|-----|-----|
| "Setup NestJS modules + entities" | "Quản lý tài khoản cơ bản (đăng ký, đăng nhập, hồ sơ)" |
| "Implement auth middleware" | "Bảo mật: chỉ người có quyền truy cập chức năng tương ứng" |

### Tính nhất quán

- Giữ nhất quán tên gọi: REQUIREMENTS → ROADMAP → PLAN → TASKS → MILESTONE_COMPLETE
- Nhóm tính năng theo **luồng người dùng**, KHÔNG theo kiến trúc kỹ thuật
- CHANGELOG viết ngôn ngữ user — "Sửa lỗi: đăng nhập bị chậm", không phải "Fix: connection pool exhaustion"

### Scope control

- Phase 1 = bản tối giản — chỉ chức năng cốt lõi
- Phase >6 deliverables → quá lớn, chia nhỏ
- Deliverable chứa "và" → tách 2
- "Tương lai sẽ cần" → hoãn, ghi "Yêu cầu tương lai"

---

## Lớp 2: Design Continuity — Kế thừa thiết kế có sẵn

> Áp dụng khi: dự án ĐÃ CÓ UI/UX, cần mở rộng/nâng cấp

### Nguyên tắc

**Kế thừa trước, đề xuất mới sau.**
Dự án đã có thiết kế → feature mới PHẢI ưu tiên tái sử dụng pattern hiện tại.

### Trước khi thiết kế feature mới

| # | Câu hỏi | Hành động |
|---|---------|-----------|
| 1 | Feature tương tự đã tồn tại? | Grep/FastCode tìm component/page/flow tương tự → tái sử dụng |
| 2 | Layout nào đang dùng cho loại trang này? | Đọc code UI → giữ nguyên grid/spacing/hierarchy |
| 3 | Navigation pattern hiện tại? | Sidebar? Tab? Breadcrumb? → dùng cùng pattern |
| 4 | Form pattern hiện tại? | Label position, validation display, submit flow → giữ nhất quán |
| 5 | Bảng/danh sách dùng gì? | Pagination? Infinite scroll? Filter? → tái sử dụng |
| 6 | Feedback pattern (toast, modal, inline)? | Tìm pattern success/error → dùng lại |

### Quy tắc

- **KHÔNG tạo component layout mới** nếu đã có tương tự
- **KHÔNG thay đổi navigation structure** trừ khi user yêu cầu
- **KHÔNG đổi design system** (colors, spacing, typography) — dùng token/theme hiện có
- Feature mới BUỘC tạo pattern mới → ghi PLAN.md "Quyết định thiết kế" + giải thích tại sao

### Ghi nhận design patterns vào PLAN.md

Khi plan phase có UI, section "Thiết kế kỹ thuật" PHẢI ghi:

```markdown
### UI — Kế thừa patterns
| Pattern | Tham khảo từ | Áp dụng cho |
|---------|-------------|-------------|
| Form layout | src/pages/users/create.tsx | Trang tạo [X] mới |
| Table + filter | src/components/DataTable.tsx | Danh sách [X] |
| Detail page | src/pages/orders/[id].tsx | Chi tiết [X] |

### UI — Pattern mới (nếu có)
| Pattern | Lý do không tái sử dụng | Mô tả |
|---------|------------------------|-------|
```

---

## Lớp 3: UX Gaps — Feature mới chưa có UI/UX

> Áp dụng khi: feature chưa từng tồn tại, chưa có mockup/wireframe

### Nguyên tắc

**Không có designer → AI phải tự xét đủ trạng thái trước khi code.**

### UX Checklist bắt buộc cho mỗi feature mới

`/pd:plan` thiết kế feature chưa có UI → PHẢI xét 7 khía cạnh:

| # | Khía cạnh | Câu hỏi cần trả lời | Ghi vào |
|---|-----------|---------------------|---------|
| 1 | **Entry point** | User vào feature này từ đâu? Menu? Link? Redirect? Push notification? | PLAN.md — Thiết kế kỹ thuật |
| 2 | **Main action (CTA)** | Hành động chính trên trang là gì? Nút nào nổi bật nhất? | PLAN.md — Thiết kế kỹ thuật |
| 3 | **Empty state** | Khi chưa có dữ liệu thì hiện gì? Hướng dẫn user tạo item đầu tiên? | TASKS.md — tiêu chí chấp nhận |
| 4 | **Loading state** | Khi đang tải dữ liệu hiện gì? Skeleton? Spinner? Placeholder? | TASKS.md — tiêu chí chấp nhận |
| 5 | **Error state** | Khi lỗi xảy ra hiện gì? Retry? Thông báo cụ thể? Fallback? | TASKS.md — tiêu chí chấp nhận |
| 6 | **Permission/Role state** | Ai được thấy feature này? Ai không? Khi không có quyền hiện gì? | PLAN.md — Guards/Middleware |
| 7 | **Responsive** | Mobile khác desktop thế nào? Bảng → stack? Menu → hamburger? | PLAN.md — Thiết kế kỹ thuật |

### Điều chỉnh theo stack

**Backend-only (NestJS API):** Bỏ Lớp 2+3. Lớp 1 vẫn áp dụng.

**Solidity:**

| # | Khía cạnh | Câu hỏi | Ghi vào |
|---|-----------|---------|---------|
| 1 | **Wallet interaction** | User kết nối ví thế nào? MetaMask? WalletConnect? | PLAN.md |
| 2 | **Transaction flow** | Approve → send → confirm → receipt? Gas estimation? | PLAN.md |
| 3 | **Pending state** | Transaction pending hiện gì? Tx hash? Loading? | TASKS.md |
| 4 | **Revert/Error state** | Tx revert hiện gì? Parse revert reason? | TASKS.md |
| 5 | **Permission/Role** | Ai gọi function? onlyOwner? Role-based? Wallet rejected? | PLAN.md |

**Flutter:**
- 7 khía cạnh web áp dụng, điều chỉnh:
  - **Responsive** → **Platform-specific**: iOS vs Android (navigation bar, back gesture, permissions)
  - **Entry point** → bao gồm: deep link, push notification, widget/shortcut
  - Thêm: **Offline state** — mất mạng hiện gì? Cache? Retry?

**WordPress:**
- 7 khía cạnh áp dụng, điều chỉnh:
  - **Entry point** → admin menu position, plugin settings, block inserter
  - **Empty state** → activation state (plugin vừa activate, chưa config)
  - Thêm: **Block editor integration** — block preview? Sidebar inspector? Placeholder?

### Câu hỏi nâng cao (feature phức tạp)

| # | Khía cạnh | Câu hỏi |
|---|-----------|---------|
| 8 | **Cognitive load** | Feature mới làm trang quá tải? Cần tách trang? |
| 9 | **Vị trí trong flow** | Nằm đâu trong luồng user? Trước/sau bước nào? |
| 10 | **Phá pattern** | Phá cách user đã quen? Cần migration path? |
| 11 | **Onboarding** | User mới hiểu không? Cần tooltip/guide? |
| 12 | **Undo/Cancel** | Hoàn tác được không? Destructive → confirm dialog |

### Cách tích hợp vào workflow

**`/pd:plan` (Bước 4):** Feature chưa có UI → xét 7 khía cạnh → ghi PLAN.md `### UX States`. Không quyết định được → "Lưu ý kỹ thuật", gợi ý user cung cấp mockup.

**`/pd:write-code` (Bước 2):** Đọc `UX States` trong PLAN.md → mỗi state PHẢI có code. PLAN.md thiếu → cảnh báo + tự bổ sung.

**Format trong PLAN.md:**

```markdown
### UX States — [Tên feature]
| State | Hiển thị | Hành động user |
|-------|---------|---------------|
| Empty | [mô tả: illustration + CTA "Tạo [X] đầu tiên"] | Bấm CTA → form tạo mới |
| Loading | [mô tả: skeleton/spinner] | Chờ |
| Error | [mô tả: thông báo + nút "Thử lại"] | Bấm retry |
| No permission | [mô tả: thông báo "Bạn không có quyền"] | Quay lại trang trước |
| Success | [mô tả: toast/redirect] | Tiếp tục flow |

Entry point: [Menu sidebar → mục "Quản lý X"]
Main CTA: [Nút "Tạo mới" góc phải trên]
Responsive: [Mobile: bảng → card list, filter → bottom sheet]
```

---

## Checklist tổng hợp

### Trước khi duyệt Roadmap
- [ ] Mỗi requirement hướng user ("Người dùng có thể...")
- [ ] Tiêu chí thành công demo được
- [ ] Tên nhất quán xuyên suốt documents
- [ ] Phase 1 đủ nhỏ

### Trước khi duyệt Plan
- [ ] **Lớp 2**: Patterns UI hiện có đã được liệt kê và tái sử dụng
- [ ] **Lớp 3**: Feature mới có đủ 7 UX states (empty/loading/error/permission/responsive/entry/CTA)
- [ ] Pattern mới (nếu có) giải thích được lý do không tái sử dụng
- [ ] Cognitive load không tăng quá mức cho trang hiện tại

### Trước khi code
- [ ] UX States trong PLAN.md đã có code tương ứng
- [ ] Empty/Loading/Error state không bị bỏ quên
- [ ] Responsive đã xử lý (nếu có frontend)
