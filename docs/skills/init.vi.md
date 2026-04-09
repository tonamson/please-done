<!-- Translated from docs/skills/init.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](init.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](init.vi.md)

# Skill: init

## Mục đích

Khởi tạo cấu trúc planning PD (thư mục `.planning/`) trong codebase hiện có để enable milestone planning và phase tracking.

## Khi nào dùng

- **Thiết lập dự án mới:** Thiết lập workflow PD trong dự án lần đầu
- **Khởi đầu mới:** Lần đầu sử dụng công cụ planning trong codebase
- **Sau clone:** Sau khi clone repo không có thư mục `.planning/`
- **Trước milestone:** Trước khi tạo milestones hoặc phases
- **Áp dụng tool:** Khi team quyết định áp dụng structured planning workflow

## Điều kiện tiên quyết

- [ ] Git repository đã được khởi tạo với `git init`
- [ ] Thư mục root dự án có thể truy cập
- [ ] Không có thư mục `.planning/` hiện có (hoặc dùng `--force` để ghi đè)
- [ ] Quyền write trong thư mục dự án

## Lệnh cơ bản

```
/pd:init
```

**Ví dụ:**
```
/pd:init
```

**Nội dung được tạo:**
- `.planning/` directory structure
- `PROJECT.md` — Tầm nhìn và phạm vi dự án
- `ROADMAP.md` — Theo dõi milestone
- `STATE.md` — Theo dõi trạng thái hiện tại
- `REQUIREMENTS.md` — Placeholder cho requirements

## Các cờ phổ biến

| Flag | Description | Example |
|------|-------------|---------|
| `--force` | Ghi đè thư mục `.planning/` hiện có | `/pd:init --force` |
| `--skip-verify` | Bỏ qua verification prompts | `/pd:init --skip-verify` |

## Xem thêm

- [onboard](onboard.md) — Định hướng dự án đầy đủ với ngữ cảnh
- [new-milestone](new-milestone.md) — Tạo milestone đầu tiên sau init
- [plan](plan.md) — Tạo phase plans
- [Hướng Dẫn Bắt Đầu](../workflows/getting-started.md) — Workflow onboarding đầy đủ
