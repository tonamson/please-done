---
name: pd:complete-milestone
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

Nếu chưa có CONTEXT.md → thông báo chạy `/pd:init` trước.
</context>

<process>

## Bước 1: Lấy version + kiểm tra git
Đọc `.planning/CURRENT_MILESTONE.md` → `version` (số thuần) + `status`. KHÔNG hỏi user nhập.
Nếu CURRENT_MILESTONE.md không tồn tại → **DỪNG**, thông báo: "Chạy `/pd:new-milestone` trước."
Nếu status = `Hoàn tất toàn bộ` → **DỪNG**, thông báo: "Tất cả milestones đã hoàn tất. Không có gì để complete."
Nếu `.planning/milestones/[version]/MILESTONE_COMPLETE.md` đã tồn tại → thông báo: "Milestone v[x.x] đã được hoàn tất trước đó." và **DỪNG**.
Kiểm tra git: `git rev-parse --git-dir 2>/dev/null` → lưu `HAS_GIT` (dùng ở Bước 8)

## Bước 2: Kiểm tra trạng thái
Quét TẤT CẢ phase directories trong `.planning/milestones/[version]/phase-*/`:
- `phase-*/TASKS.md` (BẮT BUỘC — mỗi phase phải có VÀ phải có ít nhất 1 task, không chấp nhận phase rỗng)
- `phase-*/TEST_REPORT.md` (CHỈ kiểm tra nếu project có Backend NestJS, WordPress, Solidity, hoặc Flutter trong CONTEXT.md. Các stack khác bỏ qua)
- `phase-*/reports/CODE_REPORT_TASK_*.md` (BẮT BUỘC)

**Cross-check CODE_REPORT**: MỖI task có trạng thái ✅ trong `phase-X/TASKS.md` PHẢI có ít nhất 1 `phase-X/reports/CODE_REPORT_TASK_[N].md` trong CÙNG phase directory. Quét từng phase riêng, KHÔNG quét cross-phase. Nếu thiếu report cho task cụ thể → cảnh báo: "Thiếu CODE_REPORT cho task [N] trong phase [X]. Chạy `/pd:write-code [N]` để bổ sung."

Kiểm tra:
- Tất cả tasks trong MỌI phase đều ✅?
- Nếu project có Backend NestJS, WordPress, Solidity, hoặc Flutter VÀ có TEST_REPORT → tất cả tests đạt?
- Nếu project KHÔNG có Backend NestJS, WordPress, Solidity, hoặc Flutter → bỏ qua kiểm tra TEST_REPORT
- Nếu có tasks CHƯA hoàn tất (⬜, 🔄, ❌, 🐛) → **CHẶN**:
  > "Không thể hoàn tất. Còn [X] tasks chưa ✅ trong milestone v[x.x]. Chạy `/pd:write-code` hoặc `/pd:fix-bug` trước."

**Cross-check với ROADMAP**: Đọc `.planning/ROADMAP.md` → liệt kê TẤT CẢ phases định nghĩa cho milestone này. So sánh với phase directories thực tế tìm được. Nếu ROADMAP có phase chưa được plan (không có thư mục tương ứng):
> "Milestone v[x.x] có [N] phases trong ROADMAP nhưng chỉ [M] phases đã triển khai. Phases thiếu: [danh sách].
> 1. Chạy `/pd:plan [phase]` trước
> 2. Bỏ qua phases thiếu và hoàn tất milestone (xác nhận: gõ 'bỏ qua')"
- Nếu user chọn "bỏ qua" → tiếp tục hoàn tất, ghi chú phases bỏ qua trong MILESTONE_COMPLETE.md

## Bước 3: Kiểm tra bugs (filter theo milestone)
Scan `.planning/bugs/BUG_*.md`, đọc dòng `> Patch version:` trong header mỗi bug:
- **Quy tắc match**: bug thuộc milestone nếu `Patch version` bằng chính xác `[version]` HOẶC bắt đầu bằng chuỗi `[version].` theo sau bởi số (VD: milestone `1.0` → match `1.0`, `1.0.1`, `1.0.2` | KHÔNG match `1.1`, `1.10`, `2.0`, `10.0`)
- Bỏ qua bugs thuộc milestone khác
- Còn bug **Chưa xử lý/Đang sửa** trong milestone này → **CHẶN**:
  > "Không thể hoàn tất. Còn [X] bug chưa giải quyết trong v[x.x]. Chạy `/pd:fix-bug` trước."
- Tất cả bugs milestone này **Đã giải quyết** → cho phép

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

## Smart Contracts
| Tên | Base Contract | Chức năng chính | Security |

## WordPress
| Plugin/Theme | Chức năng chính | Hooks | Custom Tables |

## Flutter
| Module | Screens | Logic Controllers | Packages |

## Lỗi đã sửa
| # | Mô tả | Nguyên nhân | File report |

## Nợ kỹ thuật (nếu có)
```

> CHỈ tạo sections có dữ liệu. Bỏ 'Tổng hợp API' nếu không có backend. Bỏ 'Smart Contracts' nếu không có Solidity. Bỏ 'WordPress' nếu không có WordPress. Bỏ 'Flutter' nếu không có Flutter.

## Bước 5: CHANGELOG.md
Tạo/cập nhật `.planning/CHANGELOG.md` (CHANGELOG mới nhất ở trên — prepend). Đọc CHANGELOG hiện tại, chèn entry mới SAU dòng heading `# Nhật ký thay đổi` và TRƯỚC entry đầu tiên hiện có (mới nhất hiện tại):

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
Đọc ROADMAP.md → tìm milestone tiếp theo (status ⬜ hoặc 🔄, version nhỏ nhất chưa hoàn tất). So sánh version bằng semver (tách major.minor thành số), KHÔNG dùng string comparison. Lấy phase ĐẦU TIÊN (số nhỏ nhất) của milestone đó.

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

## Bước 8: Cập nhật version dự án
Cập nhật version milestone vào các file version nếu tồn tại:
- `VERSION` ở root → ghi `[x.y]` (2 số, khớp milestone version)
- `package.json` ở root → cập nhật field `"version"` thành `"[x.y].0"` (semver 3 số)

Nếu KHÔNG có file nào → bỏ qua bước này.

## Bước 9: Git commit + tag (CHỈ nếu HAS_GIT = true, xem Bước 1)
```bash
# Commit báo cáo milestone
# CHỈ git add bug reports thuộc milestone hiện tại (filter theo version), KHÔNG add toàn bộ .planning/bugs/
git add .planning/milestones/[version]/ .planning/ROADMAP.md .planning/CURRENT_MILESTONE.md .planning/CHANGELOG.md
# Add VERSION/package.json nếu đã cập nhật ở Bước 8:
git add VERSION package.json 2>/dev/null
# Add từng bug report thuộc milestone (đã filter ở Bước 3):
git add .planning/bugs/BUG_[matching files thuộc version hiện tại].md
git commit -m "[PHIÊN BẢN] v[x.x] - [Tên milestone]

Chức năng đã triển khai:
- [feature 1]
- [feature 2]

Lỗi đã sửa:
- [lỗi 1]: [nguyên nhân ngắn gọn]

Tổng: [X] tasks hoàn tất, [Y] lỗi đã sửa"

# Kiểm tra tag đã tồn tại: git tag -l v[x.x]
# Nếu tag đã tồn tại → hỏi user: "Tag v[x.x] đã tồn tại. Ghi đè hay bỏ qua?"
git tag -a v[x.x] -m "Phiên bản v[x.x] - [Tên milestone]

Chức năng:
- [feature 1]

Lỗi đã sửa:
- [lỗi 1]"
```

## Bước 10: Thông báo
- Tóm tắt milestone + chức năng + lỗi đã sửa
- Git tag đã tạo
- Hỏi user push tag: `git push origin v[x.x]`
- Gợi ý: "Nên chạy `/pd:scan` để cập nhật báo cáo kiến trúc dự án sau khi hoàn tất milestone."
- Next milestone (nếu có)
</process>

<rules>
- Tuân thủ quy tắc trong `.planning/rules/general.md` (ngôn ngữ, ngày tháng, version, bảo mật)
- KHÔNG cho user nhập version - tự lấy từ CURRENT_MILESTONE.md
- PHẢI kiểm tra bugs còn mở → CHẶN nếu có bug chưa đóng
- PHẢI đọc tất cả CODE_REPORT_TASK_*.md
- PHẢI kiểm tra HAS_GIT trước khi commit/tag — bỏ qua git nếu project không có git
- Nếu HAS_GIT: PHẢI commit + tạo git tag, KHÔNG push tự động
- Nếu tag đã tồn tại (`git tag -l v[x.x]`) → hỏi user muốn ghi đè hay bỏ qua
- Commit + tag message tiếng Việt có dấu, liệt kê chức năng + lỗi
- CHANGELOG ghi rõ từng lỗi: mô tả + nguyên nhân + cách sửa
</rules>
