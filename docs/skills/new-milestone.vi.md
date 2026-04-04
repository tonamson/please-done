<!-- Translated from docs/skills/new-milestone.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](new-milestone.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](new-milestone.vi.md)

# Skill: new-milestone

## Mục đích

Tạo milestone mới với REQUIREMENTS.md và cập nhật ROADMAP.md để track work hướng tới một version hoặc release goal cụ thể.

## Khi nào dùng

- **Version planning:** Bắt đầu version hoặc release cycle mới (ví dụ: v2.0)
- **Feature kickoff:** Bắt đầu feature hoặc epic lớn
- **Milestone transition:** Sau khi hoàn thành milestone hiện tại
- **Scope change:** Khi work chuyển sang set of requirements mới
- **Release prep:** Lập kế hoạch cho upcoming product release

## Điều kiện tiên quyết

- [ ] `.planning/` directory được khởi tạo với `init`
- [ ] ROADMAP.md tồn tại (được tạo bởi init)
- [ ] Hiểu rõ về milestone goals và scope
- [ ] Optional: PRD hoặc requirements document

## Lệnh cơ bản

```
/pd:new-milestone <version>
```

**Ví dụ:**
```
/pd:new-milestone v2.0
```

**Nội dung được tạo:**
- `REQUIREMENTS.md` với milestone template
- Cập nhật `ROADMAP.md` với milestone entry mới
- Cập nhật `CURRENT_MILESTONE.md` với active status
- Khởi tạo phase tracking trong `STATE.md`

## Các cờ phổ biến

| Cờ | Mô tả | Ví dụ |
|----|-------|-------|
| `--template` | Sử dụng template cho requirements | `/pd:new-milestone v2.0 --template feature` |
| `--from-requirements <file>` | Import từ requirements file | `/pd:new-milestone v2.0 --from-requirements prd.md` |

## Xem thêm

- [complete-milestone](complete-milestone.vi.md) — Finalize milestone hiện tại
- [plan](plan.vi.md) — Tạo phase plans cho milestone
- [status](status.vi.md) — Kiểm tra milestone progress
