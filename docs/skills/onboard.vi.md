<!-- Translated from docs/skills/onboard.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](onboard.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](onboard.vi.md)

# Skill: onboard

## Mục đích

Định hướng AI vào codebase mới trong một lệnh duy nhất bằng cách phân tích cấu trúc dự án, tech stack, và các file chính để tạo ngữ cảnh toàn diện.

## Khi nào dùng

- **Codebase mới:** Bắt đầu làm việc trên dự án bạn vừa clone hoặc tải xuống
- **Làm mới ngữ cảnh:** Quay lại dự án sau thời gian dài và cần nhớ lại cấu trúc
- **Chuyển đổi đa dự án:** Chuyển đổi giữa nhiều dự án và cần định hướng nhanh
- **Trước khi lập kế hoạch:** Trước khi tạo plans khi bạn không chắc về kiến trúc dự án
- **Bàn giao team:** Hiểu dự án được maintain bởi team khác

## Điều kiện tiên quyết

- [ ] Git repository đã được khởi tạo (phát hiện thư mục `.git/`)
- [ ] Codebase có các file nhận dạng được (package.json, README, Cargo.toml, v.v.)
- [ ] Dự án có source files để phân tích

## Lệnh cơ bản

```
/pd:onboard
```

**Ví dụ:**
```
/pd:onboard /path/to/project
```

**Chức năng:**
1. Phân tích cấu trúc thư mục (tối đa 3 cấp độ)
2. Phát hiện tech stack từ các file config
3. Xác định các entry points (main, bin, exports)
4. Tạo `.planning/CONTEXT.md` với các phát hiện
5. Hiển thị summary định dạng với các bước tiếp theo

## Các cờ phổ biến

| Flag | Description | Example |
|------|-------------|---------|
| (path) | Đường dẫn tùy chọn đến thư mục dự án | `/pd:onboard ./my-project` |

## Xem thêm

- [init](init.md) — Khởi tạo cấu trúc dự án mới
- [scan](scan.md) — Phân tích codebase thủ công
- [status](../CLAUDE.md#pdstatus) — Kiểm tra trạng thái dự án
- [Hướng Dẫn Bắt Đầu](../workflows/getting-started.md) — Workflow cho người dùng mới
