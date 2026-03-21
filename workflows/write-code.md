<purpose>
Viết code theo task đã plan trong TASKS.md, tuân thủ coding style trong `.planning/rules/`, chạy lint + build, commit và tạo báo cáo.
Hỗ trợ 3 chế độ: mặc định (1 task → dừng), --auto (tuần tự tất cả), --parallel (multi-agent song song theo waves).
</purpose>

<required_reading>
Đọc tất cả files được tham chiếu trước khi bắt đầu:
- @references/conventions.md → biểu tượng trạng thái, commit prefixes, version, ngôn ngữ
- @references/prioritization.md → thứ tự ưu tiên tasks
- @references/security-checklist.md → bảng kiểm bảo mật (dùng ở Bước 6.5b)
- @references/ui-brand.md → product framing, design continuity, UX gaps cho feature mới
</required_reading>

<process>

## Bước 1: Xác định task
- Đọc `.planning/CURRENT_MILESTONE.md` → version + phase + status
- Nếu status = `Hoàn tất toàn bộ` → **DỪNG**, thông báo: "Tất cả milestones đã hoàn tất. Không còn task để thực hiện."
- Kiểm tra `.planning/milestones/[version]/phase-[phase]/TASKS.md` tồn tại:
  - KHÔNG → **DỪNG**, thông báo: "Phase [phase] chưa có plan. Chạy `/pd:plan` trước."
- Kiểm tra `.planning/milestones/[version]/phase-[phase]/PLAN.md` tồn tại:
  - KHÔNG → **DỪNG**, thông báo: "PLAN.md không tồn tại. Chạy `/pd:plan` để tạo."
- Đọc PLAN.md → thiết kế kỹ thuật
- Đọc TASKS.md → danh sách tasks
- Kiểm tra git: `git rev-parse --git-dir 2>/dev/null` → lưu `HAS_GIT` (dùng ở Bước 7)

Chọn task:
- **Nếu TẤT CẢ tasks đều ✅** (không còn ⬜, 🔄, ❌, 🐛) → **DỪNG**, thông báo: "Phase [x.x] đã hoàn tất tất cả [N] tasks." + gợi ý: `/pd:test` (nếu có Backend NestJS, WordPress, Solidity, hoặc Flutter), `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`
- Nếu `$ARGUMENTS` chỉ định task number → đọc trạng thái task đó:
  - ⬜ hoặc 🔄 → tiếp tục (🔄 = resume task đang làm dở)
  - ✅ → hỏi user: "Task [N] đã hoàn tất. Bạn muốn thực hiện lại?"
  - ❌ → hỏi user: "Task [N] đang bị chặn. Xác nhận vẫn muốn tiếp tục?" Nếu user xác nhận tiếp tục → đổi trạng thái ❌ → 🔄, tiếp tục Bước 2.
  - 🐛 → thông báo: "Task [N] có lỗi. Nên chạy `/pd:fix-bug` thay vì viết lại code."
- Nếu không → ưu tiên task 🔄 (resume task đang dở) trước, nếu không có thì task tiếp theo ⬜ theo thứ tự:
  - Task ⬜ có `Phụ thuộc: Không` hoặc tất cả dependencies đã ✅ → **sẵn sàng**, pick task này
  - Task ⬜ nhưng Phụ thuộc task chưa ✅ (⬜/🔄/❌/🐛) → **bỏ qua**, tìm task ⬜ tiếp theo
  - Bỏ qua tasks ❌ hoặc 🐛
- **Nếu TẤT CẢ tasks còn lại bị ❌, 🐛, hoặc bị chặn bởi dependency chưa ✅**: thông báo user danh sách blocked/lỗi + lý do. KHÔNG pick bừa. Đề xuất `/pd:fix-bug` cho tasks 🐛.
- Nếu scan hết tất cả tasks mà không tìm được task sẵn sàng (còn tasks ⬜ nhưng tất cả bị chặn bởi dependencies) → thông báo: "Phát hiện circular dependency hoặc missing dependency giữa [tasks]. Kiểm tra lại TASKS.md."

**Persist 🔄 ngay lập tức** (trước khi tiếp tục):
- Edit TASKS.md: cập nhật CẢ HAI nơi (bảng Tổng quan cột Trạng thái + task detail block `> Trạng thái:`) từ ⬜ → 🔄
- Ghi thay đổi vào đĩa TRƯỚC khi tạo PROGRESS.md — đảm bảo cơ chế khôi phục (Bước 1.1) nhận diện đúng task đang làm dở nếu bị gián đoạn
- **Cập nhật STATE.md (nếu có, CHỈ khi đây là task đầu tiên chuyển sang 🔄 trong phase):** Kế hoạch → `Đang code`

Xem @references/conventions.md cho biểu tượng trạng thái

### Bước 1.1: Điểm khôi phục — phục hồi sau gián đoạn
Đường dẫn: `.planning/milestones/[version]/phase-[phase]/PROGRESS.md`

**Trường hợp 0: Task ✅ + PROGRESS.md tồn tại** (gián đoạn giữa Bước 7a và 7b):
PROGRESS.md chưa bị xóa → commit có thể chưa xong dù TASKS.md đã cập nhật ✅.
1. Kiểm tra git: `git log --oneline -5 --grep="TASK-[N]"` → đã commit?
   - **Đã commit** → chỉ xóa PROGRESS.md → xong
   - **Chưa commit** → revert TASKS.md về 🔄 (cả bảng Tổng quan + task detail) → nhảy Bước 7 (commit lại)

**Trường hợp 1: Task 🔄 + PROGRESS.md tồn tại** (phục hồi sau mất mạng/đóng phiên):
1. Đọc PROGRESS.md → xác định giai đoạn cuối + files đã viết
2. Kiểm tra thực tế trên đĩa:
   - Từng file trong "Files đã viết" → Glob kiểm tra tồn tại, Read kiểm tra nội dung (không rỗng, không bị cắt giữa chừng — VD: thiếu dấu đóng `}`, class chưa kết thúc)
   - CODE_REPORT: `reports/CODE_REPORT_TASK_[N].md` tồn tại?
   - Git: `git log --oneline -5 --grep="TASK-[N]"` → đã commit chưa?
   - Git: `git diff --name-only` → có files chưa commit từ task này?
3. Xác định điểm tiếp tục:
   - Đã commit → xóa PROGRESS.md → xong (Bước 7a đã cập nhật ✅ trước commit)
   - Có CODE_REPORT nhưng chưa commit → nhảy Bước 7
   - Có files + lint/build đã pass (ghi trong PROGRESS.md) → nhảy Bước 6
   - Có files nhưng chưa lint/build → nhảy Bước 5
   - Có files nhưng chưa đủ (so với TASKS.md `> Files:`) → tiếp tục Bước 4 (CHỈ viết files còn thiếu, GIỮ NGUYÊN files đã viết tốt)
   - Chưa có files nào → bắt đầu từ Bước 2
4. Thông báo user:
```
🔄 Phục hồi Task [N] sau gián đoạn.
   Đã xong: [danh sách giai đoạn]
   Files đã viết: [X]/[Y]
   Tiếp tục từ: [giai đoạn tiếp theo]
```

**Trường hợp 2: Task mới (⬜ → 🔄) HOẶC 🔄 nhưng KHÔNG có PROGRESS.md**:
Tạo PROGRESS.md:
```markdown
# Tiến trình thực thi
> Cập nhật: [DD_MM_YYYY HH:MM]
> Task: [N] — [Tên]
> Giai đoạn: Bắt đầu

## Các bước
- [x] Chọn task
- [ ] Đọc context + nghiên cứu
- [ ] Viết code
- [ ] Lint + Build
- [ ] Tạo báo cáo
- [ ] Commit

## Files dự kiến
(Lấy từ task detail `> Files:` trong TASKS.md)

## Files đã viết
(Cập nhật sau mỗi file hoàn tất)
```

---

### Bước 1.5: Phân tích dependency + nhóm wave (CHỈ khi `--parallel`)
Nếu `$ARGUMENTS` chứa `--parallel`:

1. **Đọc TASKS.md** → lấy tất cả tasks ⬜ còn lại + cột `Phụ thuộc` của mỗi task. Nếu KHÔNG có task ⬜ nào (tất cả ✅/❌/🐛) → DỪNG parallel, thông báo tương tự Bước 1 (không còn task sẵn sàng)
2. **Phân tích dependency graph**:
   - Task KHÔNG phụ thuộc task khác (hoặc chỉ phụ thuộc task ✅ đã xong) → **sẵn sàng**
   - Task phụ thuộc task ⬜/🔄 khác → **chờ**
3. **Nhóm thành waves** (topological sort):
   - **Wave 1**: tất cả tasks sẵn sàng (không dependency hoặc dependency đã ✅)
   - **Wave 2**: tasks phụ thuộc vào tasks trong Wave 1
   - **Wave N**: tasks phụ thuộc vào Wave N-1
4. **Xác định tasks có thể song song trong mỗi wave**:
   - Tasks trong cùng wave mà **KHÔNG chia sẻ files** (đọc từng task detail block, lấy trường `> Files:` để kiểm tra xung đột files giữa các tasks) → chạy **song song bằng Agent tool**
   - Tasks trong cùng wave nhưng **SỬA CHUNG file** (theo trường `> Files:`) → chạy **tuần tự** trong wave đó
   - **Cảnh báo shared files ẩn**: trường `> Files:` là dự kiến, có thể thiếu shared utility files (helpers, config, types). Trước khi chạy parallel → Grep/FastCode kiểm tra nhanh: các tasks trong cùng wave có import chung module nào không? Nếu phát hiện shared file không liệt kê → chuyển sang tuần tự hoặc cảnh báo user
5. **Đặc biệt: Backend + Frontend song song**:
   - Task Backend (API) + Task Frontend consume API đó → NẾU PLAN.md đã có thiết kế API (method, path, request/response format) → Frontend agent dùng response shape từ PLAN.md để code trước, KHÔNG cần chờ Backend xong → **nhóm cùng wave**
   - Frontend agent đọc PLAN.md → mục "API Endpoints" → dùng response format đã thiết kế để tạo types, API functions, components
   - Sau khi cả hai agent xong → verify integration (API response thực tế khớp với types frontend đã tạo)

Hiển thị bảng wave plan cho user (Wave N → tasks + agents, song song/tuần tự), hỏi xác nhận trước khi chạy.

**Nếu user xác nhận** → nhảy sang **Bước 10** (chế độ parallel).
**Nếu KHÔNG có `--parallel`** → bỏ qua bước này, chạy tuần tự như bình thường.

---

## Bước 2: Đọc context cho task
- Chi tiết task trong TASKS.md (mô tả, checklist, ghi chú kỹ thuật)
- PLAN.md sections liên quan (thiết kế kỹ thuật, API, database)
- PLAN.md section `Quyết định thiết kế` (nếu có) → các quyết định đã chốt với user trong chế độ DISCUSS — code PHẢI tuân thủ
- PLAN.md section `UX States` (nếu có) → empty/loading/error/permission states — code PHẢI xử lý mỗi state. Nếu PLAN.md thiếu UX states cho feature có UI → cảnh báo và tự bổ sung dựa trên patterns hiện có (xem @references/ui-brand.md → Lớp 3)
- PLAN.md section `UI — Kế thừa patterns` (nếu có) → tái sử dụng component/layout đã liệt kê, KHÔNG tạo pattern mới trừ khi PLAN.md ghi rõ lý do (xem @references/ui-brand.md → Lớp 2)
- Nếu PLAN.md thiếu thông tin cần thiết cho task (VD: thiếu response format, thiếu DB schema, thiếu component props) → **DỪNG**, thông báo: "PLAN.md thiếu [thông tin cụ thể]. Chạy `/pd:plan --discuss` để bổ sung, hoặc xác nhận để Claude tự quyết định (sẽ ghi vào CODE_REPORT)."
- `.planning/docs/*.md` → chỉ đọc **mục lục nhanh**, rồi đọc sections liên quan đến task bằng offset/limit
- `.planning/rules/` chứa đầy đủ quy tắc code — đọc file rules phù hợp với Loại task

**Phân tích ngữ cảnh bảo mật** (xem @references/security-checklist.md Phần A):
- Xác định loại endpoint (PUBLIC / ADMIN / INTERNAL) dựa trên task description + PLAN.md
- Xác định mức nhạy cảm dữ liệu (CAO / TRUNG BÌNH / THẤP)
- Xác định loại xác thực (JWT / SESSION / API_KEY / SIGNATURE / NONE)
- Ghi nhận 3 yếu tố này để áp dụng ở Bước 4 và review ở Bước 6.5b

---

## Bước 3: Research code hiện có + tra cứu thư viện
Đọc CONTEXT.md → kiểm tra `Dự án mới`:
- **Dự án mới = Có VÀ chưa có source files**: skip FastCode, chỉ dùng Context7 tra cứu docs thư viện
- **Có code rồi**: dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
  1. "Patterns đang dùng cho [loại file cần tạo]."
  2. "Functions/services tái sử dụng cho [task]."

Nếu FastCode MCP lỗi khi gọi → Fallback sang Grep/Read để research code. Ghi warning: "FastCode MCP lỗi — dùng built-in tools. Chạy `/pd:init` kiểm tra lại sau."

**Tra cứu API thư viện qua Context7** (nếu task dùng thư viện bên ngoài):
1. `mcp__context7__resolve-library-id` (libraryName: "nestjs", query: "mô tả ngắn task") → lấy Context7 library ID
2. `mcp__context7__query-docs` (libraryId: ID từ bước 1, query: "câu hỏi cụ thể về API cần dùng") → lấy docs đúng version
- **TỰ ĐỘNG tra cứu** khi task cần dùng API của thư viện — KHÔNG cần user yêu cầu
- Ưu tiên Context7 hơn đoán API từ memory — đảm bảo đúng version + đúng cú pháp
- **Giao diện Admin**: BẮT BUỘC tra Context7 (antd) cho mỗi component Ant Design mới — verify props, cú pháp, tham số
- **Guard/JWT/Role**: BẮT BUỘC tra Context7 (nestjs) + FastCode pattern hiện có trước khi viết
- Nếu Context7 MCP không có → dùng `.planning/docs/` (từ `/pd:fetch-doc`) hoặc knowledge sẵn có

---

## Bước 4: Viết code

Khi viết code và gặp vấn đề ngoài kế hoạch → áp dụng **Quy tắc xử lý sai lệch** (xem phần Rules → "Quy tắc sai lệch").

**Áp dụng quy tắc bảo mật theo ngữ cảnh** đã xác định ở Bước 2 (xem @references/security-checklist.md Phần B + C):
- PUBLIC → validate + sanitize mọi input, rate limiting, không lộ lỗi nội bộ
- ADMIN → RBAC + kiểm tra quyền từng action + audit log + phòng leo quyền + xác nhận hành động hủy diệt
- INTERNAL → validate input quan trọng + xác thực service-to-service + phòng giả định sai
- Dữ liệu CAO → tối thiểu hóa lộ lọt, mask log, mã hóa nếu cần
- Tuân thủ yêu cầu toàn cục (Phần C): phòng DoS, race condition, replay, timing attack, business logic abuse
- Phân tích nâng cao (Phần C3): ranh giới tin cậy, idempotency, response minimization, secure-by-default, phòng sai sót con người

Tuân thủ **quy tắc code trong `.planning/rules/`**. Đặc biệt:

- **JSDoc + Logger + Comments** → TIẾNG VIỆT CÓ DẤU (ngoại lệ: Solidity NatSpec dùng tiếng Anh — xem solidity.md)
- **Error/Exception messages** → theo quy tắc trong `.planning/rules/nestjs.md` hoặc `nextjs.md` (match ngôn ngữ throw/message đang dùng trong dự án)
- **Tên biến/function/class/file** → tiếng Anh
- **Giới hạn file**: mục tiêu 300 dòng, BẮT BUỘC tách >500 (Solidity: 500/800 — xem solidity.md)

**Quy tắc per-stack đã đọc ở Bước 2** → tuân thủ toàn bộ `.planning/rules/[stack].md` tương ứng. Đặc biệt:
- **NestJS**: database migration khi thay đổi schema (Prisma/TypeORM/Mongoose)
- **Solidity**: BẮT BUỘC SafeERC20, clearUnknownToken, rescueETH, NatSpec tiếng Anh, signature hash binding
- Các stack khác: xem rules file tương ứng, tra cứu `.planning/docs/[stack]/` + Context7 khi cần

**Cập nhật PROGRESS.md** sau mỗi file viết xong:
- Đánh dấu `- [x] Viết code` khi hoàn tất tất cả files
- Thêm tên file vào mục "Files đã viết" sau mỗi file (để khôi phục chính xác nếu bị gián đoạn)
- Cập nhật `> Giai đoạn: Viết code` + `> Cập nhật: [DD_MM_YYYY HH:MM]`

---

## Bước 5: Lint + Build
Đọc CONTEXT.md → Tech Stack → xác định thư mục + công cụ build.

**Nếu có rules file** (nestjs.md/nextjs.md/wordpress.md/solidity.md/flutter.md): đọc mục **Build & Lint** → lấy lệnh lint + build.
**Nếu không có rules file** (stack khác): đọc `package.json` hoặc `composer.json` scripts → dùng `npm run lint` / `npm run build` hoặc `composer run lint` nếu có, hoặc skip nếu project chưa setup build.

Chạy lệnh trong đúng thư mục của task. Dùng Bash tool với timeout phù hợp. Nếu output quá dài, chạy lại với `2>&1` redirect và để Bash tool tự truncate.

Nếu lint/build fail → sửa code và chạy lại. Tối đa 3 lần. Nếu vẫn fail sau 3 lần → **DỪNG**, báo user kèm error message. Có thể cần sửa PLAN.md.
Nếu chưa có lint/build config (project mới) → skip bước này, ghi chú trong report.

---

## Bước 6: Tạo báo cáo
Viết `.planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_[N].md`:

```markdown
# Báo cáo code - Task [N]: [Tên]
> Ngày: [DD_MM_YYYY HH:MM] | Build: Thành công

## Files đã tạo/sửa
| Hành động | File | Mô tả ngắn |
(CHỈ tạo thêm sections có dữ liệu: API Endpoints, Database, Contract Functions, Screens & Navigation, Hooks & Filters — bỏ section rỗng)

## Review bảo mật
> Ngữ cảnh: [PUBLIC|ADMIN|INTERNAL] | Dữ liệu: [CAO|TB|THẤP] | Auth: [loại]
Rủi ro đã xử lý + Giả định/giới hạn (xem format @references/security-checklist.md Phần E3)

## Sai lệch so với kế hoạch (nếu có)
## Vấn đề hoãn lại (nếu có)
## Ghi chú
```

---

## Bước 6.5: Tự kiểm tra báo cáo + bảo mật (trước khi commit)

### 6.5a — Kiểm tra báo cáo đúng
Xác minh mọi thứ trong CODE_REPORT là thật — KHÔNG commit báo cáo sai:

1. Từng file trong bảng "Files đã tạo/sửa" → kiểm tra **tồn tại thật** trên đĩa (`[ -f path ]`)
2. Nếu có API endpoints → kiểm tra route/controller file tương ứng tồn tại
3. Nếu có database migration → kiểm tra migration file tồn tại
4. Nếu có ghi chú "Sai lệch" → kiểm tra mô tả khớp với thay đổi thực tế

Nếu phát hiện file thiếu hoặc sai → quay lại Bước 4 sửa, rồi cập nhật CODE_REPORT.

### 6.5b — Kiểm tra bảo mật code vừa viết
1. Chạy **bảng kiểm kỹ thuật** (Phần D) trong @references/security-checklist.md cho các files vừa tạo/sửa ở Bước 4. Chỉ kiểm tra mục liên quan đến stack đang dùng.
2. Thực hiện **review bảo mật tổng thể** (Phần E) dựa trên ngữ cảnh đã xác định ở Bước 2 — suy nghĩ như kẻ tấn công, kiểm tra kịch bản lạm dụng nghiệp vụ, verify biện pháp phòng thủ tương xứng.
3. Ghi kết quả review vào CODE_REPORT mục "Review bảo mật" theo format trong Phần E3.

Nếu phát hiện lỗ hổng → sửa ngay (Quy tắc sai lệch 1-2), ghi vào CODE_REPORT mục "Sai lệch".

**Nếu đã sửa code ở bước 6.5** → chạy lại lint + build (như Bước 5). Nếu fail → sửa + retry tối đa 3 lần. Cập nhật CODE_REPORT nếu files thay đổi.

---

## Bước 7: Cập nhật TASKS.md + Git commit

**7a — Cập nhật TASKS.md (luôn thực hiện, TRƯỚC commit):**
- Cập nhật trạng thái task: 🔄 → ✅ trong CẢ HAI nơi: (1) bảng Tổng quan (cột Trạng thái), (2) task detail block (`> Trạng thái: 🔄` → `> Trạng thái: ✅`)
- Cập nhật trường `> Files:` trong task detail nếu files thực tế khác với files trong plan

**7b — Git commit (CHỈ nếu HAS_GIT = true, xem Bước 1):**

Xem @references/conventions.md cho commit prefixes

```
git add [source code files đã tạo/sửa ở Bước 4]
git add [migration files nếu có (Prisma: prisma/migrations/, TypeORM: src/migrations/)]
git add .planning/milestones/[version]/phase-[phase]/PLAN.md
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_[N].md
git commit -m "[TASK-N] [Tóm tắt tiếng Việt]

Mô tả: [Chi tiết task đã hoàn thành]
Files: [danh sách files]"
```

**Nếu commit FAIL** → revert TASKS.md về 🔄 (cả bảng Tổng quan + task detail), sửa lỗi commit rồi thử lại.

**Sau commit thành công** (hoặc sau 7a nếu HAS_GIT = false) → xóa PROGRESS.md:
```bash
rm -f .planning/milestones/[version]/phase-[phase]/PROGRESS.md
```

---

## Bước 8: Cập nhật CONTEXT.md (nếu cần)
Nếu CONTEXT.md có `Dự án mới: Có` VÀ đây là task đầu tiên hoàn tất → cập nhật thành `Dự án mới: Không` + cập nhật `Cập nhật: [DD_MM_YYYY HH:MM]`.

---

## Bước 9: Cập nhật ROADMAP + REQUIREMENTS + STATE (khi phase hoàn tất)
Nếu TẤT CẢ tasks trong phase đều ✅ (không còn ⬜, 🔄, ❌, hoặc 🐛):
- Đọc `.planning/ROADMAP.md` → tìm phase hiện tại (VD: `#### Phase 1.1:`)
- Đánh dấu tất cả deliverables: `- [ ]` → `- [x]`

**Cập nhật REQUIREMENTS.md (nếu tồn tại):**
- Đọc bảng theo dõi → tìm yêu cầu gắn vào phase vừa hoàn tất
- Cập nhật trạng thái: `Chờ triển khai` → `Hoàn tất`
- Cập nhật thống kê độ phủ

**Cập nhật STATE.md (nếu tồn tại):**
- Cập nhật "Hoạt động cuối": `[DD_MM_YYYY] — Phase [x.x] hoàn tất`

Khi tất cả tasks trong phase hiện tại ✅ VÀ auto-advance xảy ra (xem bên dưới):
- Cập nhật STATE.md "Vị trí hiện tại" → Phase: [phase mới] (đồng bộ với CURRENT_MILESTONE)
- Cập nhật STATE.md "Kế hoạch" → `Kế hoạch hoàn tất, sẵn sàng code` (phase mới đã có TASKS.md)

Khi tất cả tasks trong phase hiện tại ✅:
- Đọc ROADMAP.md → tìm phase tiếp theo trong CÙNG milestone (phase số kế tiếp, status ⬜ hoặc chưa triển khai)
- **Verify trước khi advance**: phase tiếp PHẢI tồn tại trong ROADMAP VÀ thuộc cùng milestone version
- Nếu phase tiếp tồn tại trong ROADMAP VÀ đã có TASKS.md (đã plan) → tự động advance `phase` trong CURRENT_MILESTONE.md sang phase tiếp
- Nếu phase tiếp tồn tại trong ROADMAP nhưng chưa plan → giữ nguyên, gợi ý `/pd:plan [phase tiếp]`
- Nếu KHÔNG còn phase nào trong milestone → giữ nguyên, gợi ý `/pd:complete-milestone`

**Tracking commit** (CHỈ khi HAS_GIT = true VÀ tất cả tasks trong phase ✅):
```
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/ROADMAP.md
git add .planning/CURRENT_MILESTONE.md
# Nếu có REQUIREMENTS.md hoặc STATE.md:
git add .planning/REQUIREMENTS.md .planning/STATE.md 2>/dev/null || true
# Nếu CONTEXT.md đã cập nhật ở Bước 8 ("Dự án mới" flag):
git add .planning/CONTEXT.md
git commit -m "[TRACKING] Phase [x.x] hoàn tất

Tổng: [N] tasks ✅"
```

---

## Bước 10: Tiếp tục hoặc dừng

### Chế độ `--parallel` (multi-agent song song)
Thực thi theo waves đã phân tích ở Bước 1.5:

**Với mỗi wave:**
1. **Spawn Agent tool** cho mỗi task song song trong wave — mỗi agent nhận đầy đủ:
   - PLAN.md (toàn bộ thiết kế kỹ thuật)
   - Task detail từ TASKS.md (task cụ thể agent cần làm)
   - Rules files phù hợp (general + nestjs/nextjs/wordpress/solidity/flutter theo Loại task)
   - CONTEXT.md (tech stack, thư viện)
   - Docs liên quan (nếu có)
   - Chỉ dẫn: thực hiện Bước 2→3→4→5 cho task được giao (agent CHỈ viết code + lint/build, KHÔNG tạo report/cập nhật TASKS/commit)

2. **Agent Frontend đặc biệt**: khi chạy song song với Backend API:
   - Đọc PLAN.md → mục "API Endpoints" → lấy response format đã thiết kế
   - Tạo types/interfaces từ response shape trong PLAN.md (KHÔNG cần gọi API thật)
   - Tạo API functions với đúng endpoint + method từ PLAN.md
   - Tạo components/pages dùng types + API functions đã tạo
   - Sau khi Backend agent xong → verify types khớp với response thực tế

3. **Chờ TẤT CẢ agents trong wave hoàn thành**

4. **Sau mỗi wave** (orchestrator thực hiện, KHÔNG phải agent):
   - Thu thập kết quả từ mỗi agent (files đã tạo/sửa, build status)
   - Kiểm tra conflicts: nếu 2 agents sửa cùng file → **DỪNG**, báo user giải quyết
   - Nếu agent nào build fail → **DỪNG wave**, báo lỗi task cụ thể
   - Nếu tất cả OK → tạo report cho mỗi task (Bước 6) → cập nhật TASKS.md + commit từng task (Bước 7)

5. **Verify integration** (sau wave có cả Backend + Frontend):
   - So sánh TypeScript interfaces/types trong frontend với response DTO/entity trong backend (đọc cả 2 files, kiểm tra field names + types khớp nhau)
   - Kiểm tra API endpoint paths frontend gọi đúng backend đã tạo
   - Nếu mismatch → sửa frontend cho khớp, commit bổ sung `[TASK-N] Đồng bộ types với backend`

6. **Chuyển wave tiếp theo** → lặp lại từ bước 1 của quy trình wave (spawn agents)

7. **Khi hết waves** → thực hiện Bước 9 (cập nhật ROADMAP) rồi thông báo tổng kết: phase, số tasks, waves, gợi ý `/pd:test`, `/pd:plan [phase tiếp]`, `/pd:complete-milestone`.

### Chế độ `--auto` (tuần tự)
**Lưu phase ban đầu**: Khi bắt đầu `--auto`, ghi nhớ `INITIAL_PHASE = [phase hiện tại từ CURRENT_MILESTONE.md]`. Dùng giá trị này (KHÔNG đọc lại CURRENT_MILESTONE.md) để xác định scope auto loop.

Còn task 🔄 hoặc ⬜ trong `INITIAL_PHASE` → quay lại **Bước 1** pick task tiếp theo (KHÔNG hỏi user, ưu tiên 🔄 trước ⬜). Dừng khi:
- Hết task 🔄 và ⬜ trong phase ban đầu (tất cả ✅) → Bước 9 đã chạy trong normal flow (sau Bước 8) và đã tạo tracking commit → **DỪNG auto loop** (KHÔNG tự nhảy sang phase tiếp dù CURRENT_MILESTONE đã advance) → thông báo: "Phase [x.x] hoàn tất [N] tasks. Gợi ý: `/pd:test`, `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`"
- **TẤT CẢ tasks còn lại đều bị ❌, 🐛, hoặc ⬜ nhưng bị chặn bởi dependency chưa ✅** → **DỪNG auto loop**, thông báo user danh sách tasks blocked/lỗi + đề xuất `/pd:fix-bug`
- Gặp lỗi build BẮT BUỘC (lint/build fail) → dừng, báo lỗi
- Nếu lint/build được skip (project chưa setup build tools) → tiếp tục task tiếp theo bình thường

### Chế độ mặc định (không có flag)
DỪNG sau mỗi task, thông báo:
- Task hoàn thành + files + build status
- Nếu còn task ⬜ → hỏi: "Còn [X] tasks. Tiếp tục task tiếp theo không?"
- Nếu hết task ⬜ → đề xuất:
  - `/pd:test` → chạy kiểm thử (CHỈ gợi ý nếu CONTEXT.md có Backend NestJS, WordPress, Solidity, hoặc Flutter)
  - `/pd:plan [phase tiếp]` → lên kế hoạch phase tiếp theo
  - `/pd:complete-milestone` → hoàn tất milestone (nếu đây là phase cuối)

</process>

<rules>
- Tuân thủ toàn bộ quy tắc trong `.planning/rules/` (general + nestjs/nextjs/wordpress/solidity/flutter theo Loại task)
- CẤM đọc/hiển thị nội dung file nhạy cảm (`.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*`, `wp-config.php`)
- CẤM hardcode secrets/keys/tokens/passwords trong source code — PHẢI dùng biến môi trường + thêm key vào `.env.example`
- Khi thêm thư viện mới (`npm install`, `pip install`, `composer require`, thêm vào pubspec.yaml) → kiểm tra nhanh: (1) chạy `npm audit` / `composer audit` / `pip audit` / `flutter pub outdated` để phát hiện CVE đã biết, (2) ghi kết quả vào CODE_REPORT mục "Thư viện mới" để user verify. KHÔNG dùng Context7 cho kiểm tra bảo mật — Context7 chỉ cung cấp API docs
- PHẢI đọc PLAN.md + task detail + docs liên quan trước khi code
- Nếu PLAN.md có section `Quyết định thiết kế` → code PHẢI tuân thủ các quyết định đã chốt — KHÔNG được tự ý thay đổi
- Nếu quyết định thiết kế KHÔNG THỂ tuân thủ (do constraint kỹ thuật phát hiện khi code) → **DỪNG**, thông báo user và ghi nhận trong CODE_REPORT. KHÔNG tự ý thay đổi.
- PHẢI lint + build sau khi code, VÀ chạy lại nếu sửa code ở bước bảo mật (6.5b)
- PHẢI commit sau khi pass build, commit message tiếng Việt có dấu
- Docs/: chỉ đọc mục lục + sections liên quan, KHÔNG đọc toàn bộ
- Tái sử dụng code/thư viện có sẵn
- Nếu tasks blocked → THÔNG BÁO user, KHÔNG pick bừa
- Nếu FastCode MCP lỗi → fallback Grep/Read, ghi warning gợi ý `/pd:init`

**Quy tắc sai lệch** (vấn đề ngoài kế hoạch khi viết code):
- **Sửa ngay** (Quy tắc 1-3): lỗi logic/type/null, thiếu validation/auth/sanitize/CSRF, import sai/dependency thiếu/config lỗi → sửa ngay, ghi CODE_REPORT "Sai lệch". Tối đa 3 lần/task, sau đó DỪNG.
- **DỪNG hỏi user** (Quy tắc 4): thêm bảng DB mới, đổi kiến trúc/framework/luồng xác thực, đổi API công khai → thông báo vấn đề + đề xuất + ảnh hưởng, chờ user quyết định.
- *Ưu tiên*: kiểm tra Quy tắc 4 trước. Không chắc → hỏi.
- **Ranh giới**: CHỈ sửa lỗi do task hiện tại gây ra. Lỗi có sẵn → ghi "Vấn đề hoãn lại", KHÔNG sửa.
- **Chống tê liệt**: đọc 5+ lần liên tiếp mà chưa viết code → DỪNG, viết ngay hoặc báo bị chặn.

**Khôi phục (PROGRESS.md):** PHẢI tạo khi bắt đầu task, cập nhật sau mỗi file, xóa sau commit. Task 🔄 có PROGRESS → kiểm tra đĩa+git, giữ code tốt, chỉ viết phần thiếu. Không có PROGRESS → bắt đầu từ Bước 2.
</rules>
