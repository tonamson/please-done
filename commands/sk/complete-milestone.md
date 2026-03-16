---
name: sk:complete-milestone
description: Hoàn tất milestone, commit, tạo git tag, báo cáo tổng kết
---

<objective>
Kiểm tra bugs đã đóng, tạo báo cáo tổng kết, commit, tạo git tag, chuyển milestone tiếp theo.
</objective>

<context>
User input: $ARGUMENTS (không dùng - version tự động từ CURRENT_MILESTONE.md)

Đọc `.planning/CONTEXT.md`.
Nếu chưa có → thông báo chạy `/sk:init` trước.
</context>

<process>

## Bước 1: Lấy version
Đọc `.planning/CURRENT_MILESTONE.md` → `version` (số thuần). KHÔNG hỏi user nhập.

## Bước 2: Kiểm tra trạng thái
Đọc:
- `.planning/milestones/[version]/TASKS.md`
- `.planning/milestones/[version]/TEST_REPORT.md`
- `.planning/milestones/[version]/reports/CODE_REPORT_TASK_*.md`

Kiểm tra: tất cả tasks ✅? Tất cả tests đạt?

## Bước 3: Kiểm tra bugs (filter theo milestone)
Scan `.planning/bugs/BUG_*.md`, đọc dòng `> Patch version:` trong header mỗi bug:
- **Quy tắc match**: bug thuộc milestone nếu `Patch version` bắt đầu bằng version milestone (VD: milestone `1.0` → match `1.0`, `1.0.1`, `1.0.2` | KHÔNG match `1.1`, `2.0`)
- Bỏ qua bugs thuộc milestone khác
- Còn bug **Chưa xử lý/Đang sửa** trong milestone này → **CHẶN**:
  > "Không thể hoàn tất. Còn [X] bug chưa giải quyết trong v[x.x]. Chạy `/sk:fix-bug` trước."
- Tất cả bugs milestone này **Đã giải quyết** → cho phép
- Tasks chưa done nhưng bugs đã đóng → hỏi user xác nhận

## Bước 4: Báo cáo tổng kết
Đọc TẤT CẢ `CODE_REPORT_TASK_*.md` để compile features.

Viết `.planning/milestones/[version]/MILESTONE_COMPLETE.md`:

```markdown
# Hoàn tất Milestone
> Phiên bản: v[x.x] | Tên: [tên milestone] | Ngày: [DD_MM_YYYY]

## Tổng kết
- Tasks: [X] hoàn tất | Lỗi: [Y] phát hiện, [Z] đã sửa

## Chức năng đã triển khai
### [Chức năng 1]
- Mô tả: [...]
- API: [...]
- Files: [...]

## Tổng hợp API
| Phương thức | Đường dẫn | Mô tả | Xác thực |

## Lỗi đã sửa
| # | Mô tả | Nguyên nhân | File report |

## Nợ kỹ thuật (nếu có)
```

## Bước 5: CHANGELOG.md
Tạo/cập nhật `.planning/CHANGELOG.md`:

```markdown
# Nhật ký thay đổi

## [x.x] - DD_MM_YYYY
### Thêm mới
- [Chức năng mới]
### Thay đổi
- [Thay đổi]
### Sửa lỗi
- [Lỗi]: [nguyên nhân] → [cách sửa]
```

## Bước 6: Cập nhật ROADMAP.md
Đánh dấu milestone: Hoàn tất

## Bước 7: Cập nhật CURRENT_MILESTONE.md
Chuyển sang milestone tiếp theo. Nếu hết:
```markdown
# Milestone hiện tại
- milestone: Tất cả đã hoàn tất
- version: [version cuối]
- status: Hoàn tất toàn bộ
```

## Bước 8: Git commit + tag
```bash
# Commit báo cáo milestone
git add .planning/
git commit -m "[PHIÊN BẢN] v[x.x] - [Tên milestone]

Chức năng đã triển khai:
- [feature 1]
- [feature 2]

Lỗi đã sửa:
- [lỗi 1]: [nguyên nhân ngắn gọn]

Tổng: [X] tasks hoàn tất, [Y] lỗi đã sửa"

# Tạo git tag
git tag -a v[x.x] -m "Phiên bản v[x.x] - [Tên milestone]

Chức năng:
- [feature 1]

Lỗi đã sửa:
- [lỗi 1]"
```

## Bước 9: Thông báo
- Tóm tắt milestone + chức năng + lỗi đã sửa
- Git tag đã tạo
- Hỏi user push tag: `git push origin v[x.x]`
- Next milestone (nếu có)
</process>

<rules>
- Tuân thủ quy tắc trong CONTEXT.md (ngôn ngữ, ngày tháng, version, bảo mật)
- KHÔNG cho user nhập version - tự lấy từ CURRENT_MILESTONE.md
- PHẢI kiểm tra bugs còn mở → CHẶN nếu có bug chưa đóng
- PHẢI đọc tất cả CODE_REPORT_TASK_*.md
- PHẢI commit + tạo git tag, KHÔNG push tự động
- Commit + tag message tiếng Việt có dấu, liệt kê chức năng + lỗi
- CHANGELOG ghi rõ từng lỗi: mô tả + nguyên nhân + cách sửa
</rules>
