<!-- Translated from docs/skills/complete-milestone.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](complete-milestone.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](complete-milestone.vi.md)

# Skill: complete-milestone

## Mục đích

Hoàn tất milestone hiện tại, lưu trữ ngữ cảnh đã tích lũy, và chuẩn bị chuyển sang milestone hoặc phase dự án tiếp theo.

## Khi nào dùng

- **Milestone completion:** Tất cả các phase trong milestone đã hoàn tất và được xác minh
- **Release ready:** Sẵn sàng ship một phiên bản hoặc release sản phẩm
- **Cleanup:** Cần dọn dẹp thư mục `.planning/`
- **Transition:** Chuyển sang milestone mới và muốn lưu trữ công việc hiện tại
- **Documentation:** Hoàn thiện tài liệu trước khi đóng milestone

## Điều kiện tiên quyết

- [ ] Tất cả các task trong milestone hiện tại được đánh dấu COMPLETED
- [ ] Verification report tồn tại với kết quả Pass
- [ ] Không còn bugs chưa được giải quyết hoặc lỗi nghiêm trọng
- [ ] ROADMAP.md được cập nhật với trạng thái hoàn thành
- [ ] Optional: Tất cả tests đang pass

## Lệnh cơ bản

```
/pd:complete-milestone
```

**Ví dụ:**
```
/pd:complete-milestone
```

**Chức năng:**
1. Xác minh tất cả tasks đã hoàn thành
2. Kiểm tra verification report tồn tại
3. Lưu trữ thư mục phase (tùy chọn)
4. Cập nhật trạng thái ROADMAP.md thành Done
5. Tạo milestone summary
6. Reset STATE.md cho milestone tiếp theo

## Các cờ phổ biến

| Flag | Description | Example |
|------|-------------|---------|
| `--archive` | Archive phase directories | `/pd:complete-milestone --archive` |
| `--skip-verify` | Skip verification checks | `/pd:complete-milestone --skip-verify` |

## Xem thêm

- [new-milestone](new-milestone.md) — Tạo milestone tiếp theo
- [status](status.md) — Kiểm tra trạng thái milestone trước khi hoàn tất
- [test](test.md) — Chạy tests cuối cùng trước khi hoàn tất
