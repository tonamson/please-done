<!-- Translated from docs/skills/plan.md -->
<!-- Source version: 4.0.0 -->
<!-- Translation date: 2026-04-05 -->

[![English](https://img.shields.io/badge/lang-English-blue.svg)](plan.md)
[![Tiếng Việt](https://img.shields.io/badge/lang-Tiếng%20Việt-red.svg)](plan.vi.md)

# Skill: plan

## Mục đích

Tạo các kế hoạch phase có thể thực thi với tasks, dependencies, và tiêu chí verification để hướng dẫn implementation từ requirements đến completion.

## Khi nào dùng

- **Implementation planning:** Bắt đầu implementation của requirement hoặc feature mới
- **Task breakdown:** Chia nhỏ feature thành các tasks có thể thực hiện và track được
- **Clarification needed:** Cần roadmap rõ ràng cho execution với các bước cụ thể
- **Post-research:** Sau phase research để formalize technical approach
- **Complex features:** Khi requirements cần detailed implementation planning

## Điều kiện tiên quyết

- [ ] Milestone được định nghĩa với REQUIREMENTS.md
- [ ] Context được thu thập qua discuss-phase hoặc --prd
- [ ] Hiểu biết về scope và constraints
- [ ] Research hoàn thành (nếu cần)

## Lệnh cơ bản

```
/pd:plan --auto <phase_number>
```

**Ví dụ:**
```
/pd:plan --auto 1.1
```

**Nội dung được tạo:**
1. RESEARCH.md (nếu sử dụng cờ --research)
2. PLAN.md với tasks và dependencies
3. TASKS.md với executable checklist
4. Plan-check report cho verification

## Các cờ phổ biến

| Cờ | Mô tả | Ví dụ |
|----|-------|-------|
| `--auto` | AI tự quyết định approach | `/pd:plan --auto 1.1` |
| `--discuss` | Chế độ thảo luận tương tác | `/pd:plan --discuss 1.1` |
| `--research` | Bao gồm phase research | `/pd:plan --research 1.1` |
| `--skip-research` | Bỏ qua phase research | `/pd:plan --skip-research 1.1` |

## Xem thêm

- [write-code](write-code.vi.md) — Thực thi các tasks đã lập kế hoạch
- [research](research.vi.md) — Research trước khi lập kế hoạch
- [new-milestone](new-milestone.vi.md) — Tạo milestone trước
