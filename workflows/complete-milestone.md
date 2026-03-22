<purpose>
Kiểm tra bugs đã đóng, tạo báo cáo tổng kết, commit, tạo git tag, cập nhật tracking files, chuyển milestone tiếp theo.
Đảm bảo milestone chỉ được đóng khi tất cả tasks ✅ và bugs đã giải quyết.
</purpose>

<required_reading>
Đọc tất cả files được tham chiếu trước khi bắt đầu:
- @references/conventions.md → version filtering (match bugs thuộc milestone), commit prefixes, biểu tượng trạng thái
- @references/state-machine.md → luồng trạng thái, điều kiện chuyển milestone
- @references/ui-brand.md → viết báo cáo tổng kết hướng sản phẩm
- @templates/current-milestone.md → format + quy tắc cập nhật CURRENT_MILESTONE.md
- @templates/state.md → quy tắc cập nhật STATE.md
</required_reading>

<process>

## Bước 1: Lấy version + kiểm tra git
Đọc `.planning/CURRENT_MILESTONE.md` → `version` (số thuần) + `status`. KHÔNG hỏi user nhập.
Nếu CURRENT_MILESTONE.md không tồn tại → **DỪNG**, thông báo: "Chạy `/pd:new-milestone` trước."
Nếu status = `Hoàn tất toàn bộ` → **DỪNG**, thông báo: "Tất cả milestones đã hoàn tất. Không có gì để complete."
Nếu `.planning/milestones/[version]/MILESTONE_COMPLETE.md` đã tồn tại → thông báo: "Milestone v[x.x] đã được hoàn tất trước đó." và **DỪNG**.
Kiểm tra git: `git rev-parse --git-dir 2>/dev/null` → lưu `HAS_GIT` (dùng ở Bước 9)

## Bước 2: Kiểm tra trạng thái
Quét TẤT CẢ phase directories trong `.planning/milestones/[version]/phase-*/`:
- `phase-*/TASKS.md` (BẮT BUỘC — mỗi phase phải có VÀ phải có ít nhất 1 task, không chấp nhận phase rỗng)
- `phase-*/TEST_REPORT.md` (BẮT BUỘC cho mọi project — backend dùng test tự động, frontend-only dùng kiểm thử thủ công)
- `phase-*/reports/CODE_REPORT_TASK_*.md` (BẮT BUỘC)

**Cross-check CODE_REPORT**: MỖI task có trạng thái ✅ trong `phase-X/TASKS.md` PHẢI có ít nhất 1 `phase-X/reports/CODE_REPORT_TASK_[N].md` trong CÙNG phase directory. Quét từng phase riêng, KHÔNG quét cross-phase. Nếu thiếu report cho task cụ thể → cảnh báo: "Thiếu CODE_REPORT cho task [N] trong phase [X]. Chạy `/pd:write-code [N]` để bổ sung."

Kiểm tra:
- Tất cả tasks trong MỌI phase đều ✅?
- Có TEST_REPORT trong mỗi phase? Nếu THIẾU:
  - Nếu phase có Backend (NestJS/WordPress/Solidity/Flutter) → cảnh báo: "Phase [X] thiếu TEST_REPORT. Chạy `/pd:test` trước."
  - Nếu phase CHỈ có frontend-only hoặc stack không hỗ trợ test tự động → hỏi user: "Phase [X] chưa có TEST_REPORT. (1) Chạy `/pd:test` để kiểm thử thủ công, (2) Bỏ qua test cho phase này"
  - Nếu user chọn bỏ qua → ghi chú trong MILESTONE_COMPLETE.md: "Phase [X]: kiểm thử bỏ qua (frontend-only/stack không hỗ trợ)"
- Nếu có TEST_REPORT → kiểm tra 2 điều:
  1. Tất cả tests đạt?
  2. **TEST_REPORT không stale?** So sánh ngày trong TEST_REPORT (`> Ngày:`) với ngày commit cuối cùng có prefix `[LỖI]` trong milestone (chạy `git log --oneline --grep="\\[LỖI\\]" -1` trong phase directory). Nếu có commit `[LỖI]` SAU ngày TEST_REPORT → cảnh báo:
     > "TEST_REPORT của phase [X] có thể cũ — có sửa lỗi sau ngày test ([ngày test] vs [ngày fix]). Chạy `/pd:test` lại để xác nhận."
     > Hỏi user: "(1) Chạy lại test, (2) Bỏ qua — TEST_REPORT hiện tại vẫn hợp lệ"
- Nếu có tasks CHƯA hoàn tất (⬜, 🔄, ❌, 🐛) → **CHẶN**:
  > "Không thể hoàn tất. Còn [X] tasks chưa ✅ trong milestone v[x.x]. Chạy `/pd:write-code` hoặc `/pd:fix-bug` trước."

**Cross-check với ROADMAP**: Đọc `.planning/ROADMAP.md` → liệt kê TẤT CẢ phases định nghĩa cho milestone này. So sánh với phase directories thực tế tìm được. Nếu ROADMAP có phase chưa được plan (không có thư mục tương ứng):
> "Milestone v[x.x] có [N] phases trong ROADMAP nhưng chỉ [M] phases đã triển khai. Phases thiếu: [danh sách].
> 1. Chạy `/pd:plan [phase]` trước
> 2. Bỏ qua phases thiếu và hoàn tất milestone (xác nhận: gõ 'bỏ qua')"
- Nếu user chọn "bỏ qua" → tiếp tục hoàn tất, ghi chú phases bỏ qua trong MILESTONE_COMPLETE.md

## Bước 3: Kiểm tra bugs (filter theo milestone)
Scan `.planning/bugs/BUG_*.md`, đọc dòng `> Patch version:` trong header mỗi bug.
**Quy tắc match**: xem @references/conventions.md → "Version filtering"
- Bỏ qua bugs thuộc milestone khác
- Còn bug **Chưa xử lý/Đang sửa** trong milestone này → **CHẶN**:
  > "Không thể hoàn tất. Còn [X] bug chưa giải quyết trong v[x.x]. Chạy `/pd:fix-bug` trước."
- Tất cả bugs milestone này **Đã giải quyết** → cho phép

## Bước 3.5: Xác minh goal-backward + Kiểm tra liên kết cross-phase

### 3.5a — Kiểm tra tiêu chí thành công từng phase (xác minh 4 cấp)
Với MỖI phase directory trong `.planning/milestones/[version]/phase-*/`:
1. Đọc `PLAN.md` → section "Tiêu chí thành công → Sự thật phải đạt"
2. Nếu PLAN.md KHÔNG có section "Tiêu chí thành công" (plan cũ trước khi tích hợp goal-backward) → bỏ qua phase này, ghi chú: "Phase [X] không có tiêu chí thành công (plan format cũ)"
3. **Nếu phase đã có VERIFICATION_REPORT.md** (từ write-code Bước 9.5):
   - Đọc VERIFICATION_REPORT → kiểm tra trạng thái tổng thể
   - Nếu `Đạt` → phase ✅, bỏ qua xác minh lại
   - Nếu `Có gap` hoặc `Cần kiểm tra thủ công` → xác minh lại bên dưới (code có thể đã sửa sau đó)
4. Nếu CHƯA có VERIFICATION_REPORT hoặc cần xác minh lại → thực hiện xác minh 4 cấp (xem @references/verification-patterns.md):
   - **Cấp 1 — Tồn tại**: Đọc "Artifacts" → Glob kiểm tra file tồn tại trên đĩa
   - **Cấp 2 — Thực chất**: Kiểm tra nội dung thật (không stub) — quét anti-pattern trong @references/verification-patterns.md, kiểm tra cột "Kiểm tra tự động" nếu PLAN.md có
   - **Cấp 3 — Kết nối**: Đọc "Key Links" → Grep kiểm tra import/export/gọi hàm còn nguyên
   - **Cấp 4 — Truths**: Đọc "Cách kiểm chứng" → kiểm tra logic/test tồn tại
5. Tổng hợp:
   - Phase đạt 100% Truths + không có 🛑 anti-pattern → ✅
   - Phase có Truth chưa đạt hoặc 🛑 anti-pattern → ⚠️ liệt kê chi tiết

### 3.5b — Kiểm tra liên kết cross-phase (integration check)
Kiểm tra các phase KẾT NỐI với nhau đúng không:
1. Thu thập "Key Links" từ TẤT CẢ phases
2. Với mỗi link có `Từ` ở phase A và `Đến` ở phase B (cross-phase):
   - File `Từ` export/tạo ra thứ gì? (Grep export/function)
   - File `Đến` import/dùng đúng thứ đó? (Grep import/require)
   - Nếu mismatch (tên khác, signature khác, file không tồn tại) → ghi nhận
3. Nếu PLAN.md các phases KHÔNG có Key Links cross-phase → skip, chỉ kiểm tra basic:
   - Quét `TASKS.md` tất cả phases → tìm tasks có `Phụ thuộc` cross-phase
   - Kiểm tra file output của phase trước tồn tại và được import đúng ở phase sau

### Kết quả Bước 3.5
Hiển thị tổng hợp cho user:
```
### Xác minh goal-backward:
| Phase | Truths | Đạt | Chưa đạt | Chi tiết |
|-------|--------|-----|----------|----------|
| 1.1 | 3 | 3 | 0 | ✅ |
| 1.2 | 4 | 3 | 1 | ⚠️ T3: [mô tả vấn đề] |

### Cross-phase integration:
| Từ phase | Đến phase | Liên kết | Trạng thái |
|----------|-----------|----------|-----------|
| 1.1 | 1.2 | auth.service → user.controller | ✅ |
```

- Nếu TẤT CẢ đạt → tiếp tục Bước 4
- Nếu có vấn đề → **CẢNH BÁO** (không chặn):
  > "Phát hiện [X] vấn đề trong xác minh goal-backward / kiểm tra liên kết.
  > 1. Sửa trước khi đóng milestone (chạy `/pd:fix-bug` hoặc `/pd:write-code`)
  > 2. Bỏ qua — đóng milestone với ghi chú (nợ kỹ thuật)"
  - Nếu user chọn bỏ qua → ghi vào MILESTONE_COMPLETE.md mục "Nợ kỹ thuật"

---

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

## Xác minh goal-backward
| Phase | Truths | Đạt | Ghi chú |

## Cross-phase integration
| Liên kết | Trạng thái | Ghi chú |

## Nợ kỹ thuật (nếu có)
```

> CHỈ tạo sections có dữ liệu. Bỏ 'Tổng hợp API' nếu không có backend. Bỏ 'Smart Contracts' nếu không có Solidity. Bỏ 'WordPress' nếu không có WordPress. Bỏ 'Flutter' nếu không có Flutter.
> Viết chức năng bằng ngôn ngữ user-friendly — xem @references/ui-brand.md → "Milestone summary"

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

> CHANGELOG entries viết hướng sản phẩm — xem @references/ui-brand.md → "CHANGELOG entries"

## Bước 6: Cập nhật ROADMAP.md
Tìm milestone hiện tại trong ROADMAP → cập nhật `Trạng thái: 🔄` → `Trạng thái: ✅`

## Bước 6.5: Cập nhật REQUIREMENTS.md + STATE.md + PROJECT.md (nếu có)
**REQUIREMENTS.md (nếu tồn tại):**
- Đọc bảng theo dõi → cập nhật trạng thái tất cả yêu cầu thuộc milestone này: `Chờ triển khai` / `Đang triển khai` → `Hoàn tất`
- Cập nhật thống kê độ phủ

**STATE.md (nếu tồn tại):** xem @templates/state.md → "Quy tắc cập nhật" cho thời điểm "Đóng milestone"
- Cập nhật "Vị trí hiện tại": Trạng thái → `Milestone v[X.Y] hoàn tất`
- Cập nhật "Hoạt động cuối": `[DD_MM_YYYY] — Hoàn tất milestone v[X.Y]`
- Giữ nguyên "Bối cảnh tích lũy" (sẽ được kế thừa bởi milestone tiếp nếu chạy `/pd:new-milestone`)

**PROJECT.md (nếu tồn tại):**
- Thêm dòng mới vào bảng "Lịch sử Milestones": `| v[X.Y] | [Tên milestone] | [DD_MM_YYYY] | [Tóm tắt 1 dòng chức năng chính đã giao] |`
- Hỏi user: "Có bài học kinh nghiệm gì từ milestone này cần ghi lại?" → nếu có → thêm vào "Bài học kinh nghiệm"
- Cập nhật dòng `> Cập nhật: [DD_MM_YYYY]`

## Bước 7: Cập nhật CURRENT_MILESTONE.md
Xem @templates/current-milestone.md → "Quy tắc cập nhật" cho thời điểm "Đóng milestone"

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
Xem @references/conventions.md → commit prefix `[PHIÊN BẢN]`

```bash
# Commit báo cáo milestone
# CHỈ git add bug reports thuộc milestone hiện tại (filter theo version), KHÔNG add toàn bộ .planning/bugs/
git add .planning/milestones/[version]/ .planning/ROADMAP.md .planning/CURRENT_MILESTONE.md .planning/CHANGELOG.md
# Add REQUIREMENTS.md, STATE.md, PROJECT.md nếu tồn tại:
git add .planning/REQUIREMENTS.md .planning/STATE.md .planning/PROJECT.md 2>/dev/null
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
- Báo cáo tổng kết + CHANGELOG viết hướng sản phẩm (xem @references/ui-brand.md)
</rules>
