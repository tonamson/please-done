<!-- Translated from docs/workflows/bug-fixing.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](bug-fixing.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](bug-fixing.vi.md)

# Hướng Dẫn Workflow: Sửa Lỗi (Bug Fixing)

> **Độ khó:** 🟡 Trung cấp
> **Thời gian:** Tùy thuộc độ phức tạp của bug
> **Yêu Cầu Tiên Quyết:** Thư mục `.planning/` đã tồn tại, mô tả bug đã sẵn sàng

---

## Yêu Cầu Tiên Quyết

Trước khi bắt đầu, hãy đảm bảo bạn có:

- [ ] Dự án đã khởi tạo thư mục `.planning/`
- [ ] Bạn có thể tái hiện bug một cách nhất quán
- [ ] Mô tả bug đã sẵn sàng (thông báo lỗi, hành vi mong đợi vs thực tế)
- [ ] Hiểu biết về tính năng/khu vực bị ảnh hưởng

---

## Tổng Quan

Hướng dẫn này đưa bạn qua quy trình sửa lỗi có hệ thống sử dụng `/pd:fix-bug`, từ thu thập triệu chứng đến fix đã được xác minh. Cuối cùng, bạn sẽ:

1. Báo cáo và điều tra bug
2. Xác định nguyên nhân gốc rễ
3. Áp dụng fix có mục tiêu
4. Xác minh với tests
5. Xác nhận đã giải quyết

---

## Hướng Dẫn Từng Bước

### Bước 1: Khởi Động Sửa Lỗi

**Lệnh:**
```
/pd:fix-bug "Login fails with 500 error when using OAuth for new users"
```

**Kết Quả Mong Đợi:**
```
Creating BUG_REPORT.md...
Collecting symptoms...
Evidence collected:
- Error logs: TypeError: Cannot read property 'email' of null
- Recent commits: src/auth/oauth.js modified 2 days ago
- Affected files: src/auth/oauth.js, src/routes/login.js
- Test failures: oauth.test.js: 2 failing

Invoking Bug Janitor for analysis...
```

**Việc này làm gì:**
Tạo báo cáo bug có cấu trúc với các bước tái hiện và bắt đầu quá trình điều tra tự động. Bug Janitor và Code Detective phân tích code để xác định nguyên nhân gốc rễ.

**Các Điểm Quyết Định:**
- Nếu lỗi "Insufficient information", thêm chi tiết vào mô tả (thông báo lỗi, đường dẫn file, các bước tái hiện)
- Nếu lỗi "MCP not connected", kiểm tra các dịch vụ Docker đang chạy
- Nếu bug không thể tái hiện, xác minh môi trường khớp với production

---

### Bước 2: Xem Xét Kết Quả Điều Tra

**Lệnh:**
```
(chờ phân tích - không cần lệnh)
```

**Kết Quả Mong Đợi:**
```
========================================
Root Cause Analysis
========================================

File: src/auth/oauth.js:45
Issue: Missing null check for user.profile
Impact: login flow fails for new users without profile data

Fix Plan:
1. Add null check before accessing profile.email
2. Add regression test for null profile case
3. Update error handling

Files to modify:
- src/auth/oauth.js (add null check)
- test/auth/oauth.test.js (add test case)
```

**Việc này làm gì:**
Bug Janitor và Code Detective phân tích code để xác định nguyên nhân gốc rễ, các file bị ảnh hưởng, và đề xuất kế hoạch fix.

**Các Điểm Quyết Định:**
- Nếu nguyên nhân gốc rễ không rõ ràng, cung cấp thêm ngữ cảnh và chạy lại `/pd:fix-bug` với chi tiết bổ sung
- Nếu file sai được xác định, thêm gợi ý đường dẫn file vào mô tả bug
- Nếu kế hoạch fix có vẻ không đúng, xem xét các phát hiện trước khi tiếp tục

---

### Bước 3: Áp Dụng Fix

**Lệnh:**
```
(AI tự động áp dụng fix dựa trên điều tra)
```

**Kết Quả Mong Đợi:**
```
Applying fix...
Modified: src/auth/oauth.js
@@ -42,7 +42,10 @@ async function handleOAuth(user) {
-  const email = user.profile.email;
+  if (!user.profile) {
+    throw new AuthError('Profile data missing');
+  }
+  const email = user.profile.email;

Modified: test/auth/oauth.test.js
+ Added test case: 'should handle null profile'

Running tests...
New regression test: PASS

Committed: fix(auth): add null check for OAuth profile
Hash: a1b2c3d
```

**Việc này làm gì:**
AI áp dụng fix đã xác định, tạo regression test, chạy tests để xác minh, và commit các thay đổi.

**Các Điểm Quyết Định:**
- Nếu fix có vẻ không đúng, xem xét các thay đổi trước khi tiếp tục
- Nếu nhiều file bị ảnh hưởng, đảm bảo tất cả thay đổi đều hợp lý
- Nếu test mới không đạt, fix có thể cần điều chỉnh

---

### Bước 4: Xác Minh Với Tests

**Lệnh:**
```
/pd:test
```

**Kết Quả Mong Đợi:**
```
Running test suite...

Test Suites: 12 passed, 12 total
Tests:       47 passed, 0 failed
Snapshots:   0 updated
Coverage:    +2% (OAuth handling)

New regression test: PASS
No regressions detected
```

**Việc này làm gì:**
Chạy toàn bộ test suite để xác minh fix không phá vỡ chức năng hiện có và regression test mới đạt.

**Các Điểm Quyết Định:**
- Nếu tests không đạt, fix có thể chưa hoàn chỉnh — chạy lại `/pd:fix-bug` với ngữ cảnh cập nhật
- Nếu cần test mới, thêm test case và chạy lại
- Nếu coverage giảm, cân nhắc thêm tests

---

### Bước 5: Kiểm Tra Độ Phân Giải Bug

**Lệnh:**
```
/pd:what-next
```

**Kết Quả Mong Đợi:**
```
Milestone: v1.0
Phase: 1.2 — User Authentication
Tasks: 3/5 completed (2 pending)

Bug Report: OAuth login fix
Status: RESOLVED
Tests: PASSING
Verification: Complete

Next: Continue with regular development
```

**Việc này làm gì:**
Xác nhận bug đã được giải quyết và hiển thị các bước phát triển tiếp theo.

**Các Điểm Quyết Định:**
- Nếu bug vẫn có thể tái hiện trong production, chạy lại `/pd:fix-bug` với mô tả cập nhật
- Nếu tìm thấy các vấn đề liên quan, tạo báo cáo bug mới cho mỗi vấn đề
- Nếu task bị chặn bởi bug này, giờ đây nó sẽ được mở khóa

---

### Bước 6: Xem Xét và Đóng

**Lệnh:**
```
/pd:status
```

**Kết Quả Mong Đợi:**
```
Milestone: v1.0
Phase: 1.2 — User Authentication
Tasks: On track
Bugs: 0 unresolved (1 recently resolved)
Errors: 0 recent
Blockers: None

Recent Activity:
- OAuth login fix committed (a1b2c3d)
- Tests: All passing
```

**Việc này làm gì:**
Hiển thị trạng thái dự án với bug giờ đã được giải quyết. Báo cáo bug được lưu trữ và dự án có thể tiếp tục.

**Các Điểm Quyết Định:**
- Nếu còn bug, ưu tiên theo mức độ nghiêm trọng (critical → high → medium → low)
- Nếu phase bị chặn bởi bugs, giải quyết tất cả trước khi tiếp tục
- Cân nhắc ghi lại mẫu fix trong CLAUDE.md nếu nó tái diễn

---

## Tổng Kết

Bạn đã thành công:

- ✅ Báo cáo và điều tra bug một cách có hệ thống
- ✅ Xác định nguyên nhân gốc rễ thông qua phân tích tự động
- ✅ Áp dụng fix có mục tiêu với regression test
- ✅ Xác minh fix với toàn bộ test suite
- ✅ Xác nhận đã giải quyết và đóng báo cáo bug

Lệnh `/pd:fix-bug` cung cấp:
- Điều tra có cấu trúc với thu thập bằng chứng
- Phân tích nguyên nhân gốc rễ với đề xuất fix
- Tạo regression test tự động
- Tích hợp với test suite hiện có

---

## Các Bước Tiếp Theo

- Quay lại phát triển thường xuyên với `/pd:what-next`
- Ghi lại fix trong CHANGELOG.md của bạn
- Cân nhắc thêm mẫu vào CLAUDE.md của dự án nếu nó có thể tái diễn
- Xem xét các bug mở khác với `/pd:status`

---

## Xem Thêm

- [Hướng Dẫn Bắt Đầu](getting-started.md) — Workflow PD cơ bản
- [Hướng Dẫn Quản Lý Milestone](milestone-management.md) — Hoàn thành các milestone
- [Xử Lý Lỗi](/docs/error-troubleshooting.md) — Các giải pháp lỗi thường gặp
- [Phục Hồi Lỗi](/docs/error-recovery.md) — Các thủ tục phục hồi
- [Bảng Tham Khảo Lệnh](/docs/cheatsheet.md) — Tham khảo lệnh nhanh
