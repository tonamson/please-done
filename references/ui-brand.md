# UI & Brand — Hướng dẫn sản phẩm cho Planning & Design

> Dùng bởi: `/pd:new-milestone`, `/pd:plan`, `/pd:write-code`, `/pd:complete-milestone`
> Mục đích: 3 lớp hướng dẫn — (1) product framing, (2) design continuity, (3) UX cho feature mới chưa có UI

---

## Lớp 1: Product Framing

> Áp dụng khi: viết REQUIREMENTS, ROADMAP, PLAN, MILESTONE_COMPLETE

### Nguyên tắc cốt lõi

**Mọi output phải trả lời được: "User được gì?"**

Luôn framing từ góc nhìn người dùng cuối. Nếu không mô tả được lợi ích cho user → hỏi: "Tại sao user cần điều này?"

### Viết requirements

Format: `[MÃ]-[SỐ]: Người dùng có thể [hành động cụ thể] để [mục đích/lợi ích]`

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

### Phase = Kết quả sản phẩm, không phải công việc kỹ thuật

| Xấu | Tốt |
|-----|-----|
| "Setup NestJS modules + entities" | "Quản lý tài khoản cơ bản (đăng ký, đăng nhập, hồ sơ)" |
| "Implement auth middleware" | "Bảo mật: chỉ người có quyền truy cập chức năng tương ứng" |

### Tính nhất quán

- Giữ nhất quán tên gọi xuyên suốt: REQUIREMENTS → ROADMAP → PLAN → TASKS → MILESTONE_COMPLETE
- Nhóm tính năng theo **luồng người dùng**, KHÔNG theo kiến trúc kỹ thuật
- CHANGELOG/báo cáo viết bằng ngôn ngữ user — "Sửa lỗi: đăng nhập bị chậm khi nhiều người dùng cùng lúc", không phải "Fix: connection pool exhaustion"

### Scope control

- Phase 1 luôn là bản tối giản — chỉ chức năng cốt lõi nhất
- Phase có > 6 deliverables → quá lớn, cần chia nhỏ
- Deliverable chứa "và" → tách thành 2
- Tính năng "tương lai sẽ cần" → hoãn lại, ghi vào "Yêu cầu tương lai"

---

## Lớp 2: Design Continuity — Kế thừa thiết kế có sẵn

> Áp dụng khi: dự án ĐÃ CÓ UI/UX hoạt động, cần mở rộng/nâng cấp

### Nguyên tắc

**Kế thừa trước, đề xuất mới sau.**

Khi dự án đã có thiết kế đang chạy, mọi tính năng mới PHẢI ưu tiên tái sử dụng pattern hiện tại trước khi tạo pattern mới.

### Trước khi thiết kế feature mới, kiểm tra

| # | Câu hỏi | Hành động |
|---|---------|-----------|
| 1 | Feature tương tự đã tồn tại trong app chưa? | Grep/FastCode tìm component/page/flow tương tự → tái sử dụng pattern |
| 2 | Layout nào đang được dùng cho loại trang này? | Đọc code UI hiện tại → giữ nguyên grid/spacing/hierarchy |
| 3 | Navigation pattern hiện tại là gì? | Sidebar? Tab? Breadcrumb? → feature mới dùng cùng pattern |
| 4 | Form pattern hiện tại thế nào? | Label position, validation display, submit flow → giữ nhất quán |
| 5 | Bảng/danh sách hiện tại dùng gì? | Pagination? Infinite scroll? Filter kiểu gì? → tái sử dụng |
| 6 | Feedback pattern (toast, modal, inline)? | Tìm pattern success/error hiện có → dùng lại |

### Quy tắc

- **KHÔNG tạo component layout mới** nếu đã có component tương tự trong codebase
- **KHÔNG thay đổi navigation structure** trừ khi user yêu cầu rõ ràng
- **KHÔNG đổi design system** (colors, spacing, typography) — dùng token/theme hiện có
- Nếu feature mới BUỘC phải tạo pattern mới → ghi rõ trong PLAN.md "Quyết định thiết kế" VÀ giải thích tại sao pattern hiện có không phù hợp

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

> Áp dụng khi: roadmap có feature chưa từng tồn tại, chưa có mockup/wireframe

### Nguyên tắc

**Khi không có designer, AI phải tự xét đủ trạng thái trước khi code.**

Feature mới thường chỉ được mô tả ở happy path ("user đăng nhập thành công"). Nhưng một feature hoàn chỉnh cần xử lý nhiều trạng thái hơn.

### UX Checklist bắt buộc cho mỗi feature mới

Khi `/pd:plan` thiết kế feature chưa có UI trước đó, PHẢI xét 7 khía cạnh:

| # | Khía cạnh | Câu hỏi cần trả lời | Ghi vào |
|---|-----------|---------------------|---------|
| 1 | **Entry point** | User vào feature này từ đâu? Menu? Link? Redirect? Push notification? | PLAN.md — Thiết kế kỹ thuật |
| 2 | **Main action (CTA)** | Hành động chính trên trang là gì? Nút nào nổi bật nhất? | PLAN.md — Thiết kế kỹ thuật |
| 3 | **Empty state** | Khi chưa có dữ liệu thì hiện gì? Hướng dẫn user tạo item đầu tiên? | TASKS.md — tiêu chí chấp nhận |
| 4 | **Loading state** | Khi đang tải dữ liệu hiện gì? Skeleton? Spinner? Placeholder? | TASKS.md — tiêu chí chấp nhận |
| 5 | **Error state** | Khi lỗi xảy ra hiện gì? Retry? Thông báo cụ thể? Fallback? | TASKS.md — tiêu chí chấp nhận |
| 6 | **Permission/Role state** | Ai được thấy feature này? Ai không? Khi không có quyền hiện gì? | PLAN.md — Guards/Middleware |
| 7 | **Responsive** | Mobile khác desktop thế nào? Bảng → stack? Menu → hamburger? | PLAN.md — Thiết kế kỹ thuật |

### Câu hỏi nâng cao (xét khi feature phức tạp)

| # | Khía cạnh | Câu hỏi |
|---|-----------|---------|
| 8 | **Cognitive load** | Feature mới có làm trang hiện tại quá tải thông tin không? Cần tách trang? |
| 9 | **Vị trí trong flow** | Nằm ở đâu trong luồng user hiện tại? Trước hay sau bước nào? |
| 10 | **Phá pattern** | Có phá cách hoạt động mà user đã quen không? Nếu có → cần migration path |
| 11 | **Onboarding** | User mới có hiểu feature này không? Cần tooltip/guide? |
| 12 | **Undo/Cancel** | Hành động có thể hoàn tác không? Nếu destructive → cần confirm dialog |

### Cách tích hợp vào workflow

**Trong `/pd:plan`** (Bước 4 — Thiết kế kỹ thuật):
- Với MỖI feature chưa có UI → xét 7 khía cạnh bắt buộc
- Ghi kết quả vào PLAN.md dưới section `### UX States`
- Nếu không thể quyết định (VD: không biết mobile layout) → đánh dấu trong "Lưu ý kỹ thuật" và gợi ý user cung cấp mockup

**Trong `/pd:write-code`** (Bước 2 — Đọc context):
- Đọc section `UX States` trong PLAN.md
- Mỗi state (empty, loading, error) PHẢI có code tương ứng
- Nếu PLAN.md thiếu UX states → cảnh báo và tự bổ sung dựa trên patterns hiện có

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
