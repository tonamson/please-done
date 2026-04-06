<!-- Translated from docs/skills/what-next.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](what-next.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](what-next.vi.md)

# Skill: what-next

## Mục đích

Đề xuất hành động tiếp theo dựa trên trạng thái dự án hiện tại, các tasks có sẵn, tiến độ workflow, và công việc đang chờ xử lý. Với `--execute`, tự động gọi lệnh được đề xuất.

## Khi nào dùng

- **Unsure:** Không chắc nên làm gì tiếp theo trong workflow
- **Session start:** Bắt đầu session mới và cần hướng dẫn hành động đầu tiên
- **Stuck:** Giữa các tasks hoặc ở điểm quyết định
- **Workflow:** Cần hướng dẫn về tiến trình workflow
- **New user:** Đang học các pattern lệnh và tùy chọn có sẵn
- **Return after break:** Quay lại dự án sau thời gian nghỉ
- **Auto-advance:** Muốn tự động thực thi bước tiếp theo mà không cần xác nhận thủ công

## Điều kiện tiên quyết

- [ ] Không có — tự động phân tích trạng thái hiện tại và đề xuất tương ứng

## Lệnh cơ bản

```
/pd:what-next
```

**Ví dụ:**
```
/pd:what-next
```

**Nội dung được đề xuất:**
1. Task tiếp theo từ plan hiện tại nếu có sẵn
2. Lệnh thực thi với các tham số
3. Các điều kiện tiên quyết nếu cần
4. Các hành động thay thế khi bị chặn
5. Ngữ cảnh để đưa ra quyết định

## Chế độ Auto-Execute

```
/pd:what-next --execute
```

**Chức năng:**
1. Quét trạng thái dự án (giống chế độ advisory)
2. Hiển thị báo cáo tiến độ để minh bạch
3. Tự động gọi lệnh được đề xuất

**Dùng khi:** Bạn muốn tiến triển workflow không gián đoạn — lệnh tự quyết định và thực thi.

## Các cờ phổ biến

| Cờ | Mô tả | Ví dụ |
|----|-------|-------|
| `--execute` | Tự động thực thi lệnh được đề xuất | `/pd:what-next --execute` |
| `--text` | Đầu ra văn bản thuần không có định dạng | `/pd:what-next --text` |

## Xem thêm

- [status](status.vi.md) — Kiểm tra trạng thái hiện tại trước khi quyết định
- [plan](plan.vi.md) — Lập kế hoạch phase tiếp theo nếu không có tasks
- [write-code](write-code.vi.md) — Thực thi task hiện tại nếu có
- [Getting Started Guide](../workflows/getting-started.vi.md) — Các bước đầu tiên cho người dùng mới
