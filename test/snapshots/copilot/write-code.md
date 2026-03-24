---
name: pd:write-code
description: Viết code theo task đã plan trong TASKS.md, lint, build, commit và báo cáo (yêu cầu có PLAN.md + TASKS.md trước)
---
<!-- Audit 2026-03-23: Intentional -- agent tool required for --parallel mode multi-agent execution. See Phase 14 Audit I4. -->
<objective>
Viết mã nguồn (code) theo các công việc (tasks) trong `PLAN.md` và `TASKS.md`, tuân thủ `.planning/rules/`, chạy kiểm tra lỗi cú pháp (lint) + biên dịch (build) rồi commit.
**Chế độ:** Mặc định thực hiện 1 task -> dừng hỏi | `--auto`: thực hiện tất cả tuần tự | `--parallel`: thực hiện song song theo đợt (waves) bằng đa tác tử.
**Khôi phục:** Tự động phát hiện tiến trình qua `PROGRESS.md` + trạng thái tệp tin/git -> tiếp tục từ điểm bị dừng.
**Sau khi xong:** Chạy `/pd:test`, `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`.
</objective>
<guards>
Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:
- [ ] `.planning/CONTEXT.md` ton tai -> "Chay `/pd:init` truoc."
- [ ] Số thứ tự task hợp lệ hoặc có cờ `--auto`/`--parallel` -> "Cung cấp số task hoặc cờ chế độ."
- [ ] `PLAN.md` và `TASKS.md` tồn tại cho giai đoạn (phase) hiện tại -> "Chạy `/pd:plan` trước để tạo kế hoạch."
- [ ] FastCode MCP ket noi thanh cong -> "Kiem tra Docker dang chay va FastCode MCP da duoc cau hinh."
- [ ] Context7 MCP ket noi thanh cong -> "Kiem tra Context7 MCP da duoc cau hinh."
- [ ] Context7 MCP hoat dong (thu resolve-library-id "react") -> "Context7 khong phan hoi. Kiem tra ket noi MCP."
</guards>
<context>
Dữ liệu nhập: $ARGUMENTS
- Số thứ tự task (VD: `3`) -> thực hiện task cụ thể.
- `--auto` -> thực hiện tuần tự | `--parallel` -> thực hiện song song | Kết hợp: `3 --auto`.
- Không có gì -> chọn task tiếp theo ⬜, xong 1 task thì DỪNG để hỏi ý kiến người dùng.
Đọc thêm:
- `.planning/PROJECT.md` -> tầm nhìn, ràng buộc dự án.
- `.planning/rules/general.md` -> quy tắc chung (luôn đọc).
- `.planning/rules/{nestjs,nextjs,wordpress,solidity,flutter}.md` -> theo công nghệ (CHỈ nếu tồn tại).
</context>
<required_reading>
Đọc .pdconfig → lấy SKILLS_DIR, rồi đọc các files sau trước khi bắt đầu:
(Claude Code: cat ~/.copilot/.pdconfig — nền tảng khác: converter tự chuyển đổi đường dẫn)
Đọc trước khi bắt đầu:
- [SKILLS_DIR]/references/conventions.md → biểu tượng, commit prefixes, version, ngôn ngữ
</required_reading>
<conditional_reading>
Đọc CHỈ KHI cần (phân tích mô tả task trước):
- [SKILLS_DIR]/references/prioritization.md -- KHI task ordering/ranking nhieu tasks hoac triage
- [SKILLS_DIR]/references/ui-brand.md -- KHI task tao/sua UI components hoac man hinh user-facing
- [SKILLS_DIR]/references/security-checklist.md -- KHI task lien quan den auth, encryption, input validation, data exposure
- [SKILLS_DIR]/references/verification-patterns.md -- KHI task can multi-level verification (khong phai simple pass/fail)
- [SKILLS_DIR]/templates/progress.md -- KHI task can
- [SKILLS_DIR]/references/context7-pipeline.md -- KHI task can
</conditional_reading>
<process>
## Bước 1: Xác định task
- Đọc `.planning/CURRENT_MILESTONE.md` → version + phase + status
- status = `Hoàn tất toàn bộ` → **DỪNG**: "Tất cả milestones đã hoàn tất."
- `.planning/milestones/[version]/phase-[phase]/TASKS.md` → không có → **DỪNG**: "Chạy `/pd:plan` trước."
- `.planning/milestones/[version]/phase-[phase]/PLAN.md` → không có → **DỪNG**: "Chạy `/pd:plan` để tạo."
- Đọc PLAN.md → thiết kế kỹ thuật. Đọc TASKS.md → danh sách tasks
- Kiểm tra git: `git rev-parse --git-dir 2>/dev/null` → lưu `HAS_GIT`
Chọn task:
| Điều kiện | Hành động |
|-----------|-----------|
| TẤT CẢ tasks ✅ | **DỪNG**: "Phase hoàn tất [N] tasks." Gợi ý `/pd:test`, `/pd:plan`, `/pd:complete-milestone` |
| `$ARGUMENTS` chỉ định task | ⬜/🔄 → tiếp tục. ✅ → hỏi thực hiện lại? ❌ → hỏi xác nhận → đổi ❌→🔄. 🐛 → "Chạy `/pd:fix-bug`." |
| Không chỉ định | Ưu tiên 🔄 trước, rồi ⬜ theo thứ tự. ⬜ có dependencies chưa ✅ → bỏ qua |
| TẤT CẢ còn lại ❌/🐛/blocked | Thông báo danh sách + lý do. Đề xuất `/pd:fix-bug` cho 🐛 |
| Scan hết mà ⬜ bị circular dependency | "Phát hiện circular/missing dependency. Kiểm tra TASKS.md." |
**Đọc effort và chọn model:**
Đọc `Effort:` từ metadata task trong TASKS.md:
| Effort | Model |
|--------|-------|
| simple | haiku |
| standard | sonnet |
| complex | opus |
| (thiếu/không rõ) | sonnet |
Thông báo: "Spawning {model} agent cho {task_id} ({effort})..."
**Persist 🔄 ngay** (trước khi tiếp):
- TASKS.md: cập nhật CẢ HAI nơi (bảng Tổng quan + task detail) ⬜ → 🔄
- Ghi đĩa TRƯỚC khi tạo PROGRESS.md
- **STATE.md** (CHỈ task đầu tiên 🔄 trong phase): Kế hoạch → `Đang code`
### Bước 1.1: Điểm khôi phục — phục hồi sau gián đoạn
Đường dẫn: `.planning/milestones/[version]/phase-[phase]/PROGRESS.md`
**Trường hợp 0: Task ✅ + PROGRESS.md tồn tại** (gián đoạn giữa 7a và 7b):
1. `git log --oneline -5 --grep="TASK-[N]"` → đã commit?
   - Đã commit → xóa PROGRESS.md → xong
   - Chưa → revert TASKS.md về 🔄 → nhảy Bước 7
**Trường hợp 1: Task 🔄 + PROGRESS.md tồn tại** (phục hồi sau mất mạng/đóng phiên):
1. Đọc PROGRESS.md → giai đoạn cuối + files đã viết
2. Kiểm tra thực tế trên đĩa:
   - Từng file trong "Files đã viết" → glob kiểm tra tồn tại, read kiểm tra nội dung (không rỗng, không cắt giữa chừng — thiếu `}`, class chưa kết thúc)
   - CODE_REPORT: `reports/CODE_REPORT_TASK_[N].md` tồn tại?
   - Git: `git log --oneline -5 --grep="TASK-[N]"` → đã commit? `git diff --name-only` → files chưa commit?
3. Xác định điểm tiếp tục:
| Trạng thái | Nhảy đến |
|------------|----------|
| Đã commit | Xóa PROGRESS.md → xong |
| Có CODE_REPORT, chưa commit | Bước 7 |
| Có files, lint/build đã pass | Bước 6 |
| Có files, chưa lint/build | Bước 5 |
| Có files nhưng chưa đủ | Bước 4 (CHỈ viết thiếu, GIỮ đã viết) |
| Chưa có files | Bước 2 |
4. Thông báo user: phục hồi Task [N], đã xong gì, tiếp từ đâu
**Trường hợp 2: Task mới hoặc 🔄 không có PROGRESS.md:**
Tạo PROGRESS.md: task name, các bước checklist, files dự kiến/đã viết.
---
### Bước 1.5: Phân tích dependency + nhóm wave (CHỈ `--parallel`)
1. Đọc TASKS.md → tasks ⬜ + cột `Phụ thuộc`. Không có ⬜ → DỪNG parallel
2. **Dependency graph** (Kahn's algorithm / topological sort):
   - Xây adjacency list từ cột `Phụ thuộc`:
     - `Task A` (code dependency) → edge A→B
     - `Không` (design dependency) → không edge (parallel-safe)
     - `Task A (shared file)` → edge A→B
   - Tính in-degree cho mỗi task
   - Wave 1 = tất cả tasks có in-degree 0 VÀ status ⬜
   - Mỗi wave tiếp: xóa tasks wave trước → tính lại in-degree → in-degree 0 mới = wave tiếp
   - Không task nào in-degree 0 + còn tasks chưa xử lý → **DỪNG**: "Circular dependency phát hiện."
3. **Phát hiện shared files** (two-layer detection):
**Layer 1 — Bảng hotspot patterns (static):**
| Stack | Files | Pattern |
|-------|-------|---------|
| Chung | Barrel exports | `index.ts`, `index.js` |
| Chung | Config | `package.json`, `tsconfig.json`, `*.config.*` |
| NestJS | Registration | `app.module.ts`, `main.ts`, `*.module.ts` |
| Next.js | Layout/Middleware | `layout.tsx`, `middleware.ts`, `next.config.*` |
| Flutter | Core | `pubspec.yaml`, `main.dart`, `routes.dart` |
| WordPress | Theme/Plugin | `functions.php`, `style.css` |
| Solidity | Config | `hardhat.config.*`, migration files |
**Layer 2 — `> Files:` cross-reference (dynamic):**
- Thu thập `> Files:` của tất cả tasks trong cùng wave
- So sánh từng cặp: giao nhau > 0 files → conflict
- File match hotspot pattern + xuất hiện trong 2+ tasks → conflict
- Task thiếu `> Files:` → **CANH BAO RO RANG** truoc khi spawn agents:
  "Task [N] thieu `> Files:` metadata. Conflict detection bi giam cap -- chi phat hien hotspot patterns.
  Khuyen nghi: them `> Files:` vao TASKS.md truoc khi chay --parallel, hoac chap nhan rui ro conflict."
- Hien thi CA danh sach tasks thieu `> Files:` trong wave plan (Buoc 1.5 sub-step 6)
4. **Xử lý conflict (auto-serialize — KHÔNG hard-stop):**
   - Conflict phát hiện → giữ task số nhỏ trong wave hiện tại, dời task số lớn sang wave tiếp
   - Hiển thị: "Task X dời sang wave N+1 (conflict: shared-file.ts)"
   - TẤT CẢ tasks còn lại conflict lẫn nhau → chuyển sequential (deadlock fallback)
5. **Backend + Frontend song song**: PLAN.md có thiết kế API → Frontend dùng response shape từ PLAN.md → cùng wave. Sau cả hai xong → verify integration
6. **Hiển thị wave plan** (bảng compact):
```
Wave 1: Task 1 (simple/haiku), Task 3 (standard/sonnet) — 2 song song
Wave 2: Task 2 (complex/opus) — phụ thuộc Task 1
Conflict: Task 4 dời W1→W2 (shared: app.module.ts)
Tổng: [N] tasks, [M] waves, tối đa [K] song song/wave
```
Xác nhận chạy? (Y/n) — hỏi 1 lần, sau đó chạy liên tục → **Bước 10** (parallel).
Không `--parallel` → bỏ qua Bước 1.5.
---
## Bước 1.6: Phân tích task -- quyết định tài liệu tham khảo
Đọc mô tả task từ TASKS.md. Xác định:
- Task có liên quan đến bảo mật/auth? → đọc [SKILLS_DIR]/references/security-checklist.md
- Task tạo/sửa UI? → đọc [SKILLS_DIR]/references/ui-brand.md
- Task cần verification phức tạp? → đọc [SKILLS_DIR]/references/verification-patterns.md
- Task cần sắp xếp ưu tiên? → đọc [SKILLS_DIR]/references/prioritization.md
Nếu không rõ → BỎ QUA. Nếu phát hiện cần giữa chừng → đọc khi cần (tự sửa, không cần khởi động lại).
---
## Bước 1.7: Re-validate Logic -- xác nhận Business Logic trước khi code
Đọc PLAN.md "Tiêu chí thành công -> Sự thật phải đạt" VÀ task detail `> Truths:`.
In ra **targeted paraphrase** của Business Logic liên quan tới task này:
    **Logic cần đảm bảo (Task [N]):**
    - T[x]: [diễn giải ngắn gọn sự thật + giá trị nghiệp vụ, KHÔNG sao chép nguyên văn]
    - T[y]: [tương tự]
    Logic đúng chưa? (Y/n)
Quy tắc:
- Chỉ Truths mà task này map tới (từ `> Truths:` trong TASKS.md)
- Tối đa ~100 tokens -- diễn giải, KHÔNG copy-paste bảng
- Mục đích: kiểm tra AI HIỂU logic trước khi viết code, không chỉ đọc qua
- Không có Truths (plan format cũ) -> bỏ qua Bước 1.7
- User trả lời "n" hoặc chỉ ra sai -> đọc lại PLAN.md phần Truths, sửa diễn giải, hỏi lại
---
## Bước 2: Đọc context cho task
- Task detail (mô tả, checklist, ghi chú kỹ thuật) + PLAN.md sections liên quan
- PLAN.md `Quyết định thiết kế` → code PHẢI tuân thủ
- PLAN.md `UX States` → code PHẢI xử lý mỗi state. Thiếu → cảnh báo, tự bổ sung ([SKILLS_DIR]/references/ui-brand.md → Lớp 3)
- PLAN.md `UI — Kế thừa patterns` → tái sử dụng, KHÔNG tạo pattern mới trừ khi PLAN.md ghi rõ
- PLAN.md thiếu thông tin cần thiết → **DỪNG**: "PLAN.md thiếu [cụ thể]. Chạy `/pd:plan --discuss` hoặc xác nhận Claude tự quyết."
- `.planning/rules/` → quy ước code theo Loại task
**Phân tích bảo mật** ([SKILLS_DIR]/references/security-checklist.md Phần A):
- Xác định: loại endpoint (PUBLIC/ADMIN/INTERNAL), mức nhạy cảm dữ liệu (CAO/TB/THẤP), loại xác thực
- Ghi nhận để áp dụng Bước 4 + review Bước 6.5b
---
## Bước 3: Research code hiện có + tra cứu thư viện
CONTEXT.md → `Dự án mới`:
- **Mới, chưa có source:** skip FastCode, chỉ Context7 tra docs
- **Có code:** `fastcode/code_qa`: patterns đang dùng, functions tái sử dụng
FastCode lỗi → search/read fallback. Warning: "FastCode lỗi — dùng built-in. Chạy `/pd:init` kiểm tra."
**Context7** (task dùng thư viện ngoài): Thực hiện theo [SKILLS_DIR]/references/context7-pipeline.md
---
## Bước 4: Viết code
Vấn đề ngoài kế hoạch → **Quy tắc sai lệch** (xem Rules).
**Bảo mật theo ngữ cảnh** ([SKILLS_DIR]/references/security-checklist.md Phần B+C):
| Loại | Yêu cầu |
|------|---------|
| PUBLIC | validate + sanitize input, rate limiting, không lộ lỗi nội bộ |
| ADMIN | RBAC + kiểm tra quyền/action + audit log + phòng leo quyền + xác nhận hủy diệt |
| INTERNAL | validate input quan trọng + auth service-to-service + phòng giả định sai |
| Dữ liệu CAO | tối thiểu lộ lọt, mask log, mã hóa nếu cần |
Tuân thủ Phần C (toàn cục): phòng DoS, race condition, replay, timing attack, business logic abuse. Phần C3 (nâng cao): ranh giới tin cậy, idempotency, response minimization, secure-by-default.
**Quy tắc code `.planning/rules/`:**
- JSDoc + Logger + Comments → TIẾNG VIỆT CÓ DẤU (Solidity NatSpec: tiếng Anh)
- Error messages → theo rules/nestjs.md hoặc nextjs.md
- Tên biến/function/class/file → tiếng Anh
- Giới hạn: mục tiêu 300 dòng, BẮT BUỘC tách >500 (Solidity: 500/800)
**Per-stack:** NestJS → migration khi đổi schema. Solidity → BẮT BUỘC SafeERC20, clearUnknownToken, rescueETH, NatSpec EN, signature hash binding. Khác → xem rules, tra Context7.
**Cập nhật PROGRESS.md** sau mỗi file: đánh dấu `[x]`, thêm tên file vào "Files đã viết", cập nhật giai đoạn + thời gian.
---
## Bước 5: Lint + Build
CONTEXT.md → Tech Stack → thư mục + công cụ build.
- Có rules file → đọc mục **Build & Lint** → lấy lệnh
- Không có → `package.json`/`composer.json` scripts → `npm run lint`/`npm run build` hoặc skip
- Chạy trong đúng thư mục. Timeout phù hợp
- Fail → sửa + chạy lại. Tối đa 3 lần → **DỪNG**, báo user + error message
- Chưa có lint/build config → skip, ghi chú report
---
## Bước 6: Tạo báo cáo
`.planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_[N].md`:
```markdown
# Báo cáo code - Task [N]: [Tên]
> Ngày: [DD_MM_YYYY HH:MM] | Build: Thành công
## Files đã tạo/sửa
| Hành động | File | Mô tả ngắn |
(CHỈ tạo sections có dữ liệu — bỏ rỗng)
## Review bảo mật
> Ngữ cảnh: [PUBLIC|ADMIN|INTERNAL] | Dữ liệu: [CAO|TB|THẤP] | Auth: [loại]
Rủi ro đã xử lý + Giả định/giới hạn ([SKILLS_DIR]/references/security-checklist.md Phần E3)
## Sai lệch so với kế hoạch (nếu có)
## Vấn đề hoãn lại (nếu có)
## Ghi chú
```
---
## Bước 6.5: Tự kiểm tra báo cáo + bảo mật
### 6.5a — Kiểm tra báo cáo
- Từng file trong "Files đã tạo/sửa" → `[ -f path ]` tồn tại thật
- API endpoints → route/controller file tồn tại
- Migration → migration file tồn tại
- Sai lệch → khớp thay đổi thực tế
- Thiếu/sai → quay Bước 4 sửa → cập nhật CODE_REPORT
### 6.5b — Kiểm tra bảo mật
1. Chạy bảng kiểm kỹ thuật (Phần D) cho files vừa tạo/sửa (chỉ mục liên quan stack)
2. Review tổng thể (Phần E) theo ngữ cảnh Bước 2 — suy nghĩ như kẻ tấn công
3. Ghi kết quả vào CODE_REPORT "Review bảo mật"
Phát hiện lỗ hổng → sửa ngay (Quy tắc sai lệch 1-2), ghi "Sai lệch".
Đã sửa code → chạy lại lint + build (Bước 5). Fail → retry 3 lần. Cập nhật CODE_REPORT.
---
## Bước 7: Cập nhật TASKS.md + Git commit
**7a — Cập nhật TASKS.md (luôn, TRƯỚC commit):**
- 🔄 → ✅ CẢ HAI nơi (bảng Tổng quan + task detail)
- Cập nhật `> Files:` nếu files thực tế khác plan
**7b — Git commit (CHỈ HAS_GIT = true):**
```
git add [source files Bước 4]
git add [migration files nếu có]
git add .planning/milestones/[version]/phase-[phase]/PLAN.md
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_[N].md
git commit -m "[TASK-N] [Tóm tắt tiếng Việt]
Mô tả: [Chi tiết]
Files: [danh sách]"
```
Commit FAIL → revert TASKS.md về 🔄, sửa, thử lại.
Sau commit (hoặc 7a nếu !HAS_GIT):
```bash
rm -f .planning/milestones/[version]/phase-[phase]/PROGRESS.md
```
---
## Bước 8: Cập nhật CONTEXT.md
CONTEXT.md `Dự án mới: Có` VÀ task đầu tiên hoàn tất → `Dự án mới: Không` + cập nhật ngày.
---
## Bước 9: Cập nhật ROADMAP + REQUIREMENTS + STATE (khi phase hoàn tất)
TẤT CẢ tasks ✅:
- ROADMAP.md → đánh dấu deliverables `- [ ]` → `- [x]`
- REQUIREMENTS.md → `Chờ triển khai` → `Hoàn tất`, cập nhật thống kê
- STATE.md → `Hoạt động cuối: [DD_MM_YYYY] — Phase [x.x] hoàn tất`
- Auto-advance → STATE.md Phase + Kế hoạch đồng bộ CURRENT_MILESTONE
### Bước 9.5: Xác minh tính năng (tự động khi phase hoàn tất)
PLAN.md không có "Tiêu chí thành công" → bỏ qua 9.5.
CÓ → xác minh 4 cấp ([SKILLS_DIR]/references/verification-patterns.md):
**Lưu**: `VERIFY_ROUND = 0`, `MAX_ROUNDS = 2`
**<verification_loop>** `VERIFY_ROUND += 1`
**9.5a — Cấp 1: Kiểm tra tồn tại (Artifacts)**
Đọc bảng "Sản phẩm cần có" trong PLAN.md → glob kiểm tra đường dẫn dự kiến. Ghi nhận specs cho Cấp 2.
**9.5b — Cấp 2: Kiểm tra thực chất (phát hiện stub)**
Với mỗi artifact tồn tại:
1. Kiểm tra tự động từ PLAN.md (nếu có cột "Kiểm tra tự động"): `exports: [X,Y]`, `contains: "text"`, `min_lines: N`, `imports: [X]`, `calls: "pattern"`
2. Mặc định theo loại ([SKILLS_DIR]/references/verification-patterns.md)
3. Quét anti-pattern: `TODO|FIXME|PLACEHOLDER`, `return\s+(null|undefined|{}|[])`, `throw new Error('Not implemented')` → 🛑 Chặn (function cốt lõi) vs ⚠️ Cảnh báo (helper)
**9.5c — Cấp 3: Kiểm tra kết nối (Key Links)**
Với mỗi Key Link (`Từ` → `Đến`): file `Từ` import/gọi `Đến`? File `Đến` export thứ `Từ` cần?
**9.5d — Cấp 4: Truths Verified (kiểm tra logic)**
Với mỗi Truth: verify "Cách kiểm chứng" trên code thực tế.
- Ghi nhận **loại bằng chứng** cho mỗi Truth: Test | Log | Screenshot | File | Manual
- Cross-check: Truths mà TẤT CẢ artifacts đạt Cấp 1-3 → khả năng cao đạt.
**9.5e — Tổng hợp** → VERIFICATION_REPORT.md ([SKILLS_DIR]/templates/verification-report.md)
**9.5f — Xử lý kết quả:**
- TẤT CẢ Truths đạt + không 🛑 → "Xác minh thành công." → thoát loop, auto-advance
- Có gap + `VERIFY_ROUND < MAX_ROUNDS` → tự sửa (tạo file thiếu, thay stub bằng logic thật, sửa import/export) → lint/build → commit → quay đầu loop
- Có gap + `VERIFY_ROUND >= MAX_ROUNDS` → **DỪNG**, hỏi user: (1) `/pd:fix-bug`, (2) re-plan, (3) bỏ qua + ghi nợ kỹ thuật
**</verification_loop>**
**Auto-advance:**
- ROADMAP → phase tiếp cùng milestone
- Phase tiếp có TASKS.md → advance CURRENT_MILESTONE
- Chưa plan → gợi ý `/pd:plan`
- Không còn phase → gợi ý `/pd:complete-milestone`
**Tracking commit** (HAS_GIT + tất cả ✅):
```
git add TASKS.md VERIFICATION_REPORT.md ROADMAP.md CURRENT_MILESTONE.md
git add REQUIREMENTS.md STATE.md 2>/dev/null || true
git add CONTEXT.md  # nếu cập nhật Bước 8
git commit -m "[TRACKING] Phase [x.x] hoàn tất — Xác minh [đạt|có gap]
Tổng: [N] tasks ✅ | Truths: [X]/[Y] đạt | Vòng sửa: [VERIFY_ROUND]"
```
---
## Bước 10: Tiếp tục hoặc dừng
### `--parallel` (multi-agent song song)
Thực thi theo waves từ Bước 1.5:
**Với mỗi wave:**
1. **Spawn agent tool** cho mỗi task — KHÔNG dump toàn bộ PLAN.md. Mỗi agent nhận:
   - Task detail từ TASKS.md (mô tả + tiêu chí chấp nhận + ghi chú kỹ thuật)
   - PLAN.md sections liên quan đến task (quyết định thiết kế, API endpoints cho task đó)
   - Applicable `.planning/rules/` files
   - CONTEXT.md path
   - Effort→model: `Effort:` từ task metadata → model (simple→haiku, standard→sonnet, complex→opus, mặc định→sonnet)
   - Truyền `model: {resolved_model}` vào agent tool
   - Thông báo: "Spawning {model} agent cho {task_id} ({effort})..."
   - Chỉ dẫn agent: Bước 1.7→2→3→4→5 (validate logic → research → code → lint/build → test). KHÔNG report, KHÔNG commit, KHÔNG cập nhật TASKS.md — orchestrator làm sau wave
2. **agent Frontend đặc biệt** (song song Backend): đọc PLAN.md "API Endpoints" → tạo types/interfaces từ response shape (KHÔNG cần API thật) → tạo API functions + components. Sau Backend xong → verify types khớp response thực tế
3. **Chờ TẤT CẢ agents wave hoàn thành**
4. **Post-wave safety net** (orchestrator):
   a. `git diff --name-only` → danh sách files đã sửa
   b. Kiểm tra: 2+ agents sửa cùng file? → **DỪNG**: "Conflict phát hiện: [file] bị sửa bởi Task X và Task Y. Cần resolve thủ công."
   b2. Tasks thieu `> Files:` trong wave vua chay → hien thi:
    "⚠ [N] tasks thieu `> Files:` metadata. Review ky cac files sau day (co the bi conflict khong phat hien): [list files from git diff --name-only]"
   c. Build check: chạy lint + build → build fail → **DỪNG**: "Build fail sau wave N. Task [X] có thể là nguyên nhân. Output: [lỗi]". KHÔNG chạy wave tiếp khi build fail
   d. OK → report (Bước 6) + TASKS.md (Bước 7a) + commit (Bước 7b) cho TỪNG task
5. **Verify integration** (Backend + Frontend wave): so sánh TypeScript interfaces frontend với response DTO backend, kiểm tra endpoint paths. Mismatch → sửa frontend, commit `[TASK-N] Đồng bộ types với backend`
6. **Wave tiếp** → lặp từ bước 1
7. **Hết waves** → Bước 9 → thông báo tổng kết:
```
Tổng kết: [N] tasks, [M] waves hoàn thành
Wave 1: Task 1 ✅, Task 3 ✅ (2 song song)
Wave 2: Task 2 ✅ (1 tuần tự)
Conflicts resolved: [K] tasks dời wave
```
Gợi ý: `/pd:test`, `/pd:plan`, `/pd:complete-milestone`
### `--auto` (tuần tự)
**Lưu phase ban đầu**: `INITIAL_PHASE = [phase từ CURRENT_MILESTONE.md]`. Dùng giá trị này (KHÔNG đọc lại) để xác định scope.
Còn 🔄/⬜ trong INITIAL_PHASE → Bước 1 pick tiếp (KHÔNG hỏi user, ưu tiên 🔄 trước ⬜). Dừng khi:
- Hết task (tất cả ✅) → Bước 9 đã chạy → **DỪNG auto loop** (KHÔNG nhảy phase tiếp dù CURRENT_MILESTONE đã advance) → "Phase [x.x] hoàn tất [N] tasks. Gợi ý: `/pd:test`, `/pd:plan`, `/pd:complete-milestone`"
- TẤT CẢ tasks còn lại ❌/🐛/blocked → **DỪNG**, thông báo danh sách + đề xuất `/pd:fix-bug`
- Lint/build fail BẮT BUỘC → dừng, báo lỗi
- Lint/build được skip (chưa setup) → tiếp bình thường
### Mặc định (không có flag)
DỪNG sau mỗi task:
- Task hoàn thành + files + build status
- Còn ⬜ → hỏi: "Còn [X] tasks. Tiếp tục?"
- Hết ⬜ → đề xuất:
  - `/pd:test` (CHỈ gợi ý nếu CONTEXT.md có Backend NestJS, WordPress, Solidity, hoặc Flutter)
  - `/pd:plan [phase tiếp]`
  - `/pd:complete-milestone` (nếu phase cuối)
</process>
<output>
**Tạo/Cập nhật:**
- Mã nguồn và các tệp kiểm thử theo task.
- Cập nhật `TASKS.md` và `PROGRESS.md`.
**Bước tiếp theo:** `/pd:test`, `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`.
**Thành công khi:**
- Mã nguồn đã viết xong, lint và build đều vượt qua (pass).
- Công việc được đánh dấu hoàn thành trong `TASKS.md`.
- Commit có thông điệp (message) rõ ràng.
**Lỗi thường gặp:**
- Lỗi lint hoặc build -> đọc thông báo lỗi, sửa mã rồi chạy lại.
- Công việc chưa rõ ràng -> hỏi người dùng qua `AskUserQuestion`.
- MCP không kết nối -> kiểm tra dịch vụ và cấu hình.
</output>
<rules>
- Mọi kết quả đầu ra PHẢI bằng tiếng Việt có dấu.
- PHẢI đọc và tuân thủ quy tắc trong `.planning/rules/` trước khi viết mã.
- PHẢI chạy lint và build sau khi viết mã.
- PHẢI commit sau khi hoàn thành mỗi task.
- KHÔNG được thay đổi mã nguồn ngoài phạm vi của task đang thực hiện.
- Tuân thủ `.planning/rules/` (general + stack-specific theo Loại task)
- CẤM đọc/hiển thị file nhạy cảm (`.env`, `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- CẤM hardcode secrets — PHẢI dùng biến môi trường + `.env.example`
- Thêm thư viện mới → (1) `npm audit`/`composer audit`/`pip audit`/`flutter pub outdated` kiểm tra CVE, (2) ghi CODE_REPORT "Thư viện mới". KHÔNG dùng Context7 cho bảo mật
- PHẢI đọc PLAN.md + task detail + docs trước khi code
- PLAN.md `Quyết định thiết kế` → code PHẢI tuân thủ. KHÔNG THỂ tuân thủ → **DỪNG**, thông báo user
- PHẢI lint + build sau code, VÀ chạy lại nếu sửa ở 6.5b
- PHẢI commit sau build pass, message tiếng Việt có dấu
- Tra Context7 cho patterns phức tạp
- Tái sử dụng code/thư viện có sẵn
- Tasks blocked → THÔNG BÁO user, KHÔNG pick bừa
- FastCode lỗi → search/read fallback, ghi warning
**Quy tắc sai lệch:**
- **Sửa ngay** (1-3): lỗi logic/type/null, thiếu validation/auth/sanitize/CSRF, import sai/dependency thiếu → sửa, ghi CODE_REPORT "Sai lệch". Tối đa 3 lần/task → DỪNG
- **DỪNG hỏi** (4): thêm bảng DB mới, đổi kiến trúc/framework/auth, đổi API công khai → vấn đề + đề xuất + ảnh hưởng → chờ user
- Ưu tiên: kiểm tra Quy tắc 4 trước. Không chắc → hỏi
- Ranh giới: CHỈ sửa lỗi do task hiện tại. Lỗi có sẵn → "Vấn đề hoãn lại"
- Chống tê liệt: đọc 5+ lần chưa viết → DỪNG, viết hoặc báo blocked
**Khôi phục (PROGRESS.md):** tạo khi bắt đầu, cập nhật mỗi file, xóa sau commit. Task 🔄 có PROGRESS → kiểm tra đĩa+git, giữ code tốt, chỉ viết thiếu. Không có → Bước 2.
</rules>
