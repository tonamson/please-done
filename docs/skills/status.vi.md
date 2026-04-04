<!-- Translated from docs/skills/status.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](status.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](status.vi.md)

# Skill: status

## Mục đích

Hiển thị dashboard trạng thái dự án chỉ đọc cho thấy phase hiện tại, các tasks, và các hành động tiếp theo mà không sửa đổi bất kỳ file nào.

## Khi nào dùng

- **Quick overview:** Kiểm tra trạng thái dự án nhanh mà không có side effects
- **Decision making:** Trước khi quyết định hành động tiếp theo, hiểu ngữ cảnh hiện tại
- **No-op check:** Kiểm tra trạng thái nhanh mà không sửa đổi gì
- **Session start:** Sau khi quay lại từ break để hiểu bạn đã dừng ở đâu
- **Progress tracking:** Theo dõi tiến độ milestone và hoàn thành tasks

## Điều kiện tiên quyết

- [ ] Không có — có thể chạy bất cứ lúc nào, ngay cả khi không có thư mục `.planning/`

## Lệnh cơ bản

```
/pd:status
```

**Ví dụ:**
```
/pd:status --auto-refresh
```

**Nội dung được hiển thị:**
1. Milestone hiện tại và phase đang hoạt động
2. Trạng thái hoàn thành tasks (X/Y đã hoàn thành)
3. Số lượng bugs và lỗi gần đây nếu có
4. Các vấn đề chặn cần chú ý
5. Thông tin commit gần nhất
6. Chỉ báo độ cũ cho độ tươi của dữ liệu

## Các cờ phổ biến

| Cờ | Mô tả | Ví dụ |
|----|-------|-------|
| `--auto-refresh` | Bật phát hiện độ cũ | `/pd:status --auto-refresh` |
| `--refresh-threshold N` | Đặt ngưỡng tính bằng phút | `/pd:status --refresh-threshold 5` |

## Xem thêm

- [what-next](what-next.vi.md) — Nhận hành động tiếp theo được đề xuất
- [onboard](onboard.vi.md) — Định hướng lại với dự án nếu status hiển thị dự án mới
- [plan](plan.vi.md) — Tạo plan mới nếu không có phase đang hoạt động
