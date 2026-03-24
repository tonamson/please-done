<purpose>
Kiểm tra bugs đã đóng, tạo báo cáo tổng kết, commit, tạo git tag, cập nhật tracking files, chuyển milestone tiếp theo.
</purpose>

<required_reading>
- @references/conventions.md → version filtering, commit prefixes, biểu tượng trạng thái
</required_reading>

<conditional_reading>
Doc CHI KHI can (phan tich mo ta task truoc):
- @references/state-machine.md -> luong trang thai, dieu kien chuyen milestone -- KHI can hieu state transitions
- @references/ui-brand.md -> viet bao cao huong san pham -- KHI milestone co UI deliverables
- @references/verification-patterns.md -> multi-level verification -- KHI can kiem tra phuc tap
- @templates/current-milestone.md -> format CURRENT_MILESTONE.md -- KHI can cap nhat milestone state
- @templates/state.md -> quy tac cap nhat STATE.md -- KHI can cap nhat state
</conditional_reading>

<process>

## Bước 1: Lấy version + kiểm tra git
- `.planning/CURRENT_MILESTONE.md` → `version` + `status`. KHÔNG hỏi user nhập.
- Không tồn tại → **DỪNG**: "Chạy `/pd:new-milestone`."
- status = `Hoàn tất toàn bộ` → **DỪNG**: "Tất cả milestones đã hoàn tất."
- `.planning/milestones/[version]/MILESTONE_COMPLETE.md` đã tồn tại → **DỪNG**: "Milestone v[x.x] đã hoàn tất trước đó."
- `git rev-parse --git-dir 2>/dev/null` → lưu `HAS_GIT`

## Bước 1.5: Phân tích milestone -- quyết định tài liệu tham khảo
Xác định từ milestone context:
- Cần hiểu luồng state? → đọc @references/state-machine.md
- Milestone có UI deliverables? → đọc @references/ui-brand.md
- Cần kiểm tra phức tạp? → đọc @references/verification-patterns.md

Nếu không rõ → BỎ QUA. Nếu phát hiện cần giữa chừng → đọc khi cần.

## Bước 2: Kiểm tra trạng thái
Quét TẤT CẢ `.planning/milestones/[version]/phase-*/`:
- `phase-*/TASKS.md` (BẮT BUỘC — mỗi phase phải có ≥1 task)
- `phase-*/TEST_REPORT.md` (BẮT BUỘC — backend test tự động, frontend-only kiểm thử thủ công)
- `phase-*/reports/CODE_REPORT_TASK_*.md` (BẮT BUỘC)

**Cross-check CODE_REPORT**: mỗi task ✅ trong `phase-X/TASKS.md` PHẢI có `phase-X/reports/CODE_REPORT_TASK_[N].md` trong CÙNG phase. Thiếu → cảnh báo: "Thiếu CODE_REPORT cho task [N] trong phase [X]. Chạy `/pd:write-code [N]`."

Kiểm tra:
- Tất cả tasks mọi phase đều ✅?
- TEST_REPORT mỗi phase?
  - Thiếu + có Backend → cảnh báo: "Phase [X] thiếu TEST_REPORT. Chạy `/pd:test`."
  - Thiếu + frontend-only → hỏi: "(1) Chạy `/pd:test` kiểm thử thủ công (2) Bỏ qua" → bỏ qua → ghi chú MILESTONE_COMPLETE.md
- Có TEST_REPORT → kiểm tra:
  1. Tất cả tests đạt?
  2. **Stale?** So sánh ngày TEST_REPORT vs commit `[LỖI]` cuối (`git log --oneline --grep="\\[LỖI\\]" -1`). Commit `[LỖI]` SAU ngày report → cảnh báo: "TEST_REPORT phase [X] có thể cũ. (1) Chạy lại test (2) Bỏ qua"
- Tasks chưa ✅ (⬜/🔄/❌/🐛) → **CHẶN**: "Còn [X] tasks chưa ✅. Chạy `/pd:write-code` hoặc `/pd:fix-bug`."

**Cross-check ROADMAP**: đọc ROADMAP.md → phases milestone này vs phase directories thực tế. Thiếu phase → "ROADMAP có [N] phases, chỉ [M] triển khai. Phases thiếu: [...]. (1) `/pd:plan [phase]` (2) Bỏ qua (gõ 'bỏ qua')" → bỏ qua → ghi chú MILESTONE_COMPLETE.md

## Bước 3: Kiểm tra bugs
Scan `.planning/bugs/BUG_*.md` → dòng `> Patch version:`.
Quy tắc match: xem @references/conventions.md → "Version filtering"
- Bỏ qua bugs milestone khác
- Còn **Chưa xử lý/Đang sửa** → **CHẶN**: "Còn [X] bug chưa giải quyết v[x.x]. Chạy `/pd:fix-bug`."
- Tất cả **Đã giải quyết** → cho phép

## Bước 3.5: Xác minh goal-backward + liên kết cross-phase

### 3.5a — Tiêu chí thành công từng phase (xác minh 4 cấp)
Với MỖI `phase-*/`:
1. Đọc `PLAN.md` → "Tiêu chí thành công → Sự thật phải đạt"
2. Không có section → bỏ qua, ghi: "Phase [X] không có tiêu chí (plan format cũ)"
3. **Có VERIFICATION_REPORT.md** → `Đạt` → ✅ bỏ qua | `Có gap`/`Cần kiểm tra thủ công` → xác minh lại
4. Chưa có hoặc cần xác minh → 4 cấp (xem @references/verification-patterns.md):
   - Cấp 1 — Tồn tại: Glob kiểm tra artifacts
   - Cấp 2 — Thực chất: quét anti-pattern, kiểm tra "Kiểm tra tự động"
   - Cấp 3 — Kết nối: Grep import/export/gọi hàm
   - Cấp 4 — Truths: kiểm tra logic/test
5. 100% Truths + không 🛑 → ✅ | Có gap → ⚠️

Cong cu xac minh that bai (tool error, timeout) → ghi nhan that bai vao bao cao, tiep tuc voi co xac minh thu cong: "[Level N] -- xac minh thu cong do cong cu that bai."

### 3.5b — Liên kết cross-phase
1. Thu thập "Key Links" tất cả phases
2. Link cross-phase: kiểm tra export ↔ import match
3. Không có Key Links → quét `TASKS.md` → phụ thuộc cross-phase → kiểm tra file output tồn tại + import đúng

### Kết quả Bước 3.5
```
### Xác minh goal-backward:
| Phase | Truths | Đạt | Chưa đạt | Chi tiết |

### Cross-phase integration:
| Từ phase | Đến phase | Liên kết | Trạng thái |
```
- TẤT CẢ đạt → Bước 3.6
- Có vấn đề → **CẢNH BÁO** (không chặn): "(1) Sửa trước (`/pd:fix-bug`/`/pd:write-code`) (2) Bỏ qua (nợ kỹ thuật)" → ghi MILESTONE_COMPLETE.md

---

## Bước 3.6: Tạo báo cáo quản lý (non-blocking)

> QUAN TRỌNG: Toàn bộ bước này là non-blocking.
> Bất kỳ lỗi nào chỉ log warning và ghi chú — KHÔNG BAO GIỜ chặn milestone completion.

Biến lưu kết quả:
- `reportPath` = null
- `reportWarnings` = []

### 3.6a — Thu thập dữ liệu và tạo sơ đồ
Trong try/catch:
1. Đọc tất cả `.planning/phases/*/XX-*-PLAN.md` của milestone hiện tại
2. Gọi `generateBusinessLogicDiagram(planContents)` từ `bin/lib/generate-diagrams.js` -> lưu kết quả
3. Đọc `.planning/codebase/ARCHITECTURE.md`
4. Thu thập `filesModified` từ SUMMARY.md các plans
5. Gọi `generateArchitectureDiagram(codebaseMaps, planMeta)` từ `bin/lib/generate-diagrams.js` -> lưu kết quả
6. NẾU lỗi -> ghi reportWarnings, diagram sẽ dùng placeholder gốc từ template

### 3.6b — Fill template báo cáo
Trong try/catch:
1. Đọc `templates/management-report.md`
2. Đọc `.planning/STATE.md`
3. Đọc tất cả `*-SUMMARY.md` files của milestone
4. Gọi `fillManagementReport()` từ `bin/lib/report-filler.js` với toàn bộ data
5. Ghi filled markdown ra `.planning/reports/management-report-v{version}.md`
6. NẾU lỗi -> ghi reportWarnings, bỏ qua

### 3.6c — Xuất PDF
Trong try/catch:
1. Chạy: `node bin/generate-pdf-report.js .planning/reports/management-report-v{version}.md`
2. Kiểm tra `.planning/reports/management-report-v{version}.pdf` tồn tại
3. `reportPath` = pdf path (hoặc md fallback path)
4. NẾU lỗi -> `reportPath` = md path (fallback), ghi reportWarnings

### 3.6d — Ghi kết quả vào MILESTONE_COMPLETE.md
Thêm vào MILESTONE_COMPLETE.md (Bước 4):
```
## Báo cáo quản lý
- {reportPath ? "Đường dẫn: " + reportPath : "Không tạo được báo cáo (xem cảnh báo)"}
- {reportWarnings.length > 0 ? "Cảnh báo: " + reportWarnings.join(", ") : "Không có cảnh báo"}
```

---

## Bước 4: Báo cáo tổng kết
Đọc TẤT CẢ `phase-*/reports/CODE_REPORT_TASK_*.md` → compile features.

Viết `.planning/milestones/[version]/MILESTONE_COMPLETE.md`:
```markdown
# Hoàn tất Milestone
> Phiên bản: v[x.x] | Tên: [tên] | Ngày: [DD_MM_YYYY]

## Tổng kết
- Tasks: [X] hoàn tất | Lỗi: [Y] phát hiện, [Z] đã sửa

## Chức năng đã triển khai
### [Chức năng 1]
- Mô tả | API | Files

## Tổng hợp API / Smart Contracts / WordPress / Flutter
(CHỈ sections có dữ liệu)

## Lỗi đã sửa
| # | Mô tả | Nguyên nhân | File report |

## Xác minh goal-backward
| Phase | Truths | Đạt | Ghi chú |

## Cross-phase integration
| Liên kết | Trạng thái | Ghi chú |

## Nợ kỹ thuật (nếu có)
```
> Viết hướng sản phẩm — xem @references/ui-brand.md → "Milestone summary"

## Bước 5: CHANGELOG.md
Tạo/cập nhật `.planning/CHANGELOG.md` (mới nhất ở trên — prepend sau `# Nhật ký thay đổi`):
```markdown
## [x.x] - DD_MM_YYYY
### Thêm mới
### Thay đổi
### Sửa lỗi
- [Lỗi]: [nguyên nhân] → [cách sửa]
```
> CHANGELOG viết hướng sản phẩm — xem @references/ui-brand.md

## Bước 6: Cập nhật ROADMAP.md
Milestone hiện tại: `Trạng thái: 🔄` → `Trạng thái: ✅`

## Bước 6.5: Cập nhật REQUIREMENTS.md + STATE.md + PROJECT.md

**REQUIREMENTS.md** (nếu tồn tại): `Chờ triển khai`/`Đang triển khai` → `Hoàn tất` cho yêu cầu milestone này. Cập nhật thống kê.

**STATE.md** (nếu tồn tại): xem @templates/state.md → "Quy tắc cập nhật" — đóng milestone
- Trạng thái → `Milestone v[X.Y] hoàn tất`
- Hoạt động cuối → `[DD_MM_YYYY] — Hoàn tất milestone v[X.Y]`

**PROJECT.md** (nếu tồn tại):
- Thêm dòng bảng "Lịch sử Milestones": `| v[X.Y] | [Tên] | [DD_MM_YYYY] | [Tóm tắt] |`
- Hỏi: "Có bài học kinh nghiệm?" → thêm nếu có
- Cập nhật `> Cập nhật: [DD_MM_YYYY]`

## Bước 7: Cập nhật CURRENT_MILESTONE.md
Xem @templates/current-milestone.md → "Quy tắc cập nhật" — đóng milestone

Đọc ROADMAP.md → milestone tiếp (⬜/🔄, version nhỏ nhất chưa hoàn tất). So sánh semver (tách major.minor thành số). Phase ĐẦU TIÊN.

Còn milestone tiếp:
```markdown
# Milestone hiện tại
- milestone: [tên tiếp]
- version: [version tiếp]
- phase: [phase đầu tiên]
- status: Chưa bắt đầu
```

Hết milestone:
```markdown
# Milestone hiện tại
- milestone: Tất cả đã hoàn tất
- version: [version cuối]
- phase: -
- status: Hoàn tất toàn bộ
```

## Bước 8: Cập nhật version dự án
- `VERSION` ở root → `[x.y]`
- `package.json` → `"version": "[x.y].0"`
- Không có file → bỏ qua

## Bước 9: Git commit + tag (CHỈ nếu HAS_GIT = true)
Xem @references/conventions.md → commit prefix `[PHIÊN BẢN]`

```bash
git add .planning/milestones/[version]/ .planning/ROADMAP.md .planning/CURRENT_MILESTONE.md .planning/CHANGELOG.md
git add .planning/REQUIREMENTS.md .planning/STATE.md .planning/PROJECT.md 2>/dev/null
git add VERSION package.json 2>/dev/null
git add .planning/bugs/BUG_[matching files thuộc version].md
git commit -m "[PHIÊN BẢN] v[x.x] - [Tên milestone]

Chức năng: [features]
Lỗi đã sửa: [bugs]
Tổng: [X] tasks, [Y] lỗi đã sửa"

# Tag: git tag -l v[x.x] → đã tồn tại → hỏi ghi đè/bỏ qua
git tag -a v[x.x] -m "Phiên bản v[x.x] - [Tên milestone]
Chức năng: [...]
Lỗi đã sửa: [...]"
```

## Bước 10: Thông báo
- Tóm tắt milestone + chức năng + lỗi đã sửa
- Git tag đã tạo
- Hỏi push: `git push origin v[x.x]`
- Gợi ý: "Nên chạy `/pd:scan` để cập nhật báo cáo kiến trúc."
- Next milestone (nếu có)

</process>

<rules>
- Tuân thủ `.planning/rules/general.md` (ngôn ngữ, ngày tháng, version, bảo mật)
- KHÔNG cho user nhập version — tự lấy từ CURRENT_MILESTONE.md
- PHẢI kiểm tra bugs còn mở → CHẶN nếu có
- PHẢI đọc tất cả CODE_REPORT_TASK_*.md
- PHẢI kiểm tra HAS_GIT trước commit/tag — bỏ qua git nếu không có
- HAS_GIT: PHẢI commit + tạo git tag, KHÔNG push tự động
- Tag đã tồn tại → hỏi ghi đè/bỏ qua
- Commit + tag message tiếng Việt có dấu
- CHANGELOG ghi rõ từng lỗi: mô tả + nguyên nhân + cách sửa
- Báo cáo + CHANGELOG viết hướng sản phẩm (xem @references/ui-brand.md)
</rules>