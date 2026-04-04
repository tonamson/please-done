<!-- Translated from docs/skills/test.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](test.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](test.vi.md)

# Skill: test

## Mục đích

Chạy test suite và generate coverage reports để verify implementation quality và bắt regressions trước khi completion.

## Khi nào dùng

- **Post-implementation:** Sau khi implement code changes
- **Pre-commit:** Trước khi commit changes
- **Pre-completion:** Trước khi hoàn thành milestone
- **Regression check:** Xác minh không có regressions được introduce
- **Quality gate:** Cần coverage report cho approval
- **CI/CD:** Automated testing trong pipeline

## Điều kiện tiên quyết

- [ ] Code đã viết và staged hoặc committed
- [ ] Test files tồn tại cho project
- [ ] Test environment được cấu hình
- [ ] Dependencies đã cài đặt

## Lệnh cơ bản

```
/pd:test
```

**Ví dụ:**
```
/pd:test --coverage
```

**Chức năng:**
1. Chạy project test suite
2. Tạo coverage report (với --coverage)
3. Kiểm tra regressions
4. Báo cáo test results với pass/fail status
5. Cập nhật STATE.md với test status

## Các cờ phổ biến

| Cờ | Mô tả | Ví dụ |
|----|-------|-------|
| `--coverage` | Tạo coverage report | `/pd:test --coverage` |
| `--watch` | Chạy tests trong watch mode | `/pd:test --watch` |
| `--grep <pattern>` | Chạy chỉ tests phù hợp | `/pd:test --grep "auth"` |

## Xem thêm

- [write-code](write-code.vi.md) — Thực thi code changes
- [fix-bug](fix-bug.vi.md) — Debug failing tests
- [complete-milestone](complete-milestone.vi.md) — Finalize sau khi tests pass
