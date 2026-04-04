<!-- Translated from docs/skills/write-code.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](write-code.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](write-code.vi.md)

# Skill: write-code

## Mục đích

Thực thi tất cả tasks trong phase plan với atomic commits, verification loops, và deviation handling để implement các thay đổi đã lập kế hoạch.

## Khi nào dùng

- **Plan ready:** PLAN.md đã sẵn sàng và tasks cần implementation
- **Tasks defined:** Tasks được định nghĩa rõ ràng trong TASKS.md với acceptance criteria
- **Implementation phase:** Sẵn sàng viết code theo specifications
- **Specific wave:** Cần thực thi chỉ một wave cụ thể của tasks
- **Staged execution:** Chia phase lớn thành các execution chunks có thể quản lý được

## Điều kiện tiên quyết

- [ ] PLAN.md tồn tại cho phase
- [ ] TASKS.md với các tasks được định nghĩa và acceptance criteria
- [ ] Context.md hoặc research hoàn thành
- [ ] Git working tree clean (hoặc đã committed)

## Lệnh cơ bản

```
/pd:write-code
```

**Ví dụ:**
```
/pd:write-code --wave 2
```

**Chức năng:**
1. Loads PLAN.md và TASKS.md
2. Groups tasks thành waves theo dependencies
3. Thực thi tasks với atomic commits
4. Xử lý deviations với user confirmation
5. Cập nhật task status khi completed
6. Chạy verification sau mỗi task

## Các cờ phổ biến

| Cờ | Mô tả | Ví dụ |
|----|-------|-------|
| `--wave N` | Thực thi chỉ wave N | `/pd:write-code --wave 1` |
| `--skip-verify` | Bỏ qua verification step | `/pd:write-code --skip-verify` |
| `--task <id>` | Thực thi task cụ thể | `/pd:write-code --task 3` |

## Xem thêm

- [plan](plan.vi.md) — Tạo plan trước
- [test](test.vi.md) — Verify implementation
- [fix-bug](fix-bug.vi.md) — Fix issues sau khi viết code
