---
name: sk:complete-milestone
description: Hoàn tất milestone, commit, tạo git tag, báo cáo tổng kết
---

<objective>
Kiểm tra bugs đã đóng, tạo báo cáo tổng kết, commit, tạo git tag, chuyển milestone tiếp theo.
</objective>

<context>
User input: $ARGUMENTS (không dùng - version tự động từ CURRENT_MILESTONE.md)

Đọc:
- `.planning/CONTEXT.md`
- `.planning/rules/general.md` → ngôn ngữ, ngày tháng, version format, commit message format

Nếu chưa có CONTEXT.md → thông báo chạy `/sk:init` trước.
</context>

<process>

## Bước 1: Lấy version
Đọc `.planning/CURRENT_MILESTONE.md` → `version` (số thuần) + `status`. KHÔNG hỏi user nhập.
Nếu status = `Hoàn tất toàn bộ` → **DỪNG**, thông báo: "Tất cả milestones đã hoàn tất. Không có gì để complete."

## Bước 2: Kiểm tra trạng thái
Quét TẤT CẢ phase directories trong `.planning/milestones/[version]/phase-*/`:
- `phase-*/TASKS.md` (BẮT BUỘC — mỗi phase phải có)
- `phase-*/TEST_REPORT.md` (nếu có — milestone frontend-only hoặc phase không cần test có thể không có)
- `phase-*/reports/CODE_REPORT_TASK_*.md` (BẮT BUỘC)

Kiểm tra: tất cả tasks trong MỌI phase đều ✅? Nếu có TEST_REPORT → tất cả tests đạt?
- Nếu có tasks CHƯA hoàn tất (⬜, 🔄, ❌, 🐛) → **CHẶN**:
  > "Không thể hoàn tất. Còn [X] tasks chưa ✅ trong milestone v[x.x]. Chạy `/sk:write-code` hoặc `/sk:fix-bug` trước."

**Cross-check với ROADMAP**: Đọc `.planning/ROADMAP.md` → liệt kê TẤT CẢ phases định nghĩa cho milestone này. So sánh với phase directories thực tế tìm được. Nếu ROADMAP có phase chưa được plan (không có thư mục tương ứng) → **CHẶN**:
> "Milestone v[x.x] có [N] phases trong ROADMAP nhưng chỉ [M] phases đã triển khai. Phases thiếu: [danh sách]. Chạy `/sk:plan [phase]` trước hoặc xác nhận bỏ qua."

## Bước 3: Kiểm tra bugs (filter theo milestone)
Scan `.planning/bugs/BUG_*.md`, đọc dòng `> Patch version:` trong header mỗi bug:
- **Quy tắc match**: bug thuộc milestone nếu `Patch version` = version milestone HOẶC bắt đầu bằng `[version].` (VD: milestone `1.0` → match `1.0`, `1.0.1`, `1.0.2` | KHÔNG match `1.1`, `1.10`, `2.0`)
- Bỏ qua bugs thuộc milestone khác
- Còn bug **Chưa xử lý/Đang sửa** trong milestone này → **CHẶN**:
  > "Không thể hoàn tất. Còn [X] bug chưa giải quyết trong v[x.x]. Chạy `/sk:fix-bug` trước."
- Tất cả bugs milestone này **Đã giải quyết** → cho phép
- Tasks chưa done nhưng bugs đã đóng → hỏi user xác nhận

## Bước 4: Báo cáo tổng kết
Đọc TẤT CẢ `phase-*/reports/CODE_REPORT_TASK_*.md` trong `.planning/milestones/[version]/` để compile features.

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
Tìm milestone hiện tại trong ROADMAP → cập nhật `Trạng thái: 🔄` → `Trạng thái: ✅`

## Bước 7: Cập nhật CURRENT_MILESTONE.md
Đọc ROADMAP.md → tìm milestone tiếp theo + phase đầu tiên của milestone đó.

Nếu CÒN milestone tiếp:
```markdown
# Milestone hiện tại
- milestone: [tên milestone tiếp]
- version: [version tiếp]
- phase: [phase đầu tiên từ ROADMAP, VD: 2.1]
- status: Chưa bắt đầu
```

Nếu HẾT milestone:
```markdown
# Milestone hiện tại
- milestone: Tất cả đã hoàn tất
- version: [version cuối]
- phase: -
- status: Hoàn tất toàn bộ
```

## Bước 8: Git commit + tag
```bash
# Commit báo cáo milestone
git add .planning/milestones/[version]/ .planning/ROADMAP.md .planning/CURRENT_MILESTONE.md .planning/CHANGELOG.md .planning/bugs/
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
- Tuân thủ quy tắc trong `.planning/rules/general.md` (ngôn ngữ, ngày tháng, version, bảo mật)
- KHÔNG cho user nhập version - tự lấy từ CURRENT_MILESTONE.md
- PHẢI kiểm tra bugs còn mở → CHẶN nếu có bug chưa đóng
- PHẢI đọc tất cả CODE_REPORT_TASK_*.md
- PHẢI commit + tạo git tag, KHÔNG push tự động
- Commit + tag message tiếng Việt có dấu, liệt kê chức năng + lỗi
- CHANGELOG ghi rõ từng lỗi: mô tả + nguyên nhân + cách sửa
</rules>
