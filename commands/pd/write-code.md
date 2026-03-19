---
name: pd:write-code
description: Viết code theo task đã plan trong TASKS.md, lint, build, commit và báo cáo (yêu cầu có PLAN.md + TASKS.md trước)
---

<objective>
Viết code theo task từ PLAN.md/TASKS.md, tuân thủ coding style trong `.planning/rules/`, chạy lint + build, commit và tạo báo cáo.
</objective>

<context>
User input: $ARGUMENTS
- Có thể là task number (VD: `3`) → làm task cụ thể
- Có thể là `--auto` → làm TẤT CẢ tasks còn lại trong phase tuần tự, không hỏi giữa chừng
- Có thể là `--parallel` → phân tích dependency, nhóm wave, chạy song song tasks độc lập bằng multi-agent
- Có thể kết hợp: `3 --auto` → bắt đầu từ task 3, làm hết phase tuần tự
- Có thể kết hợp: `3 --parallel` → bắt đầu từ task 3, chạy song song tasks độc lập
- Không có gì → pick task tiếp theo ⬜, làm xong 1 task thì DỪNG hỏi user

Đọc:
- `.planning/CONTEXT.md` → tech stack, thư viện, milestone
- `.planning/rules/general.md` → quy tắc chung (luôn đọc)
- `.planning/rules/backend.md` → quy tắc NestJS (đọc khi task Backend/Fullstack, CHỈ nếu file tồn tại)
- `.planning/rules/frontend.md` → quy tắc NextJS (đọc khi task Frontend/Fullstack, CHỈ nếu file tồn tại)
- `.planning/rules/wordpress.md` → quy tắc WordPress/PHP (đọc khi task WordPress, CHỈ nếu file tồn tại). Tra cứu `.planning/docs/wordpress/*.md` cho patterns phức tạp (plugin architecture, theme, Gutenberg, WooCommerce, v.v.)

Nếu chưa có CONTEXT.md → thông báo chạy `/pd:init` trước.
</context>

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
- **Nếu TẤT CẢ tasks đều ✅** (không còn ⬜, 🔄, ❌, 🐛) → **DỪNG**, thông báo: "Phase [x.x] đã hoàn tất tất cả [N] tasks." + gợi ý: `/pd:test` (nếu có Backend NestJS hoặc WordPress), `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`
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

Cập nhật trạng thái → 🔄

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
5. **Đặc biệt: Backend + Frontend song song**:
   - Task Backend (API) + Task Frontend consume API đó → NẾU PLAN.md đã có thiết kế API (method, path, request/response format) → Frontend agent dùng response shape từ PLAN.md để code trước, KHÔNG cần chờ Backend xong → **nhóm cùng wave**
   - Frontend agent đọc PLAN.md → mục "API Endpoints" → dùng response format đã thiết kế để tạo types, API functions, components
   - Sau khi cả hai agent xong → verify integration (API response thực tế khớp với types frontend đã tạo)

Hiển thị plan cho user trước khi chạy:
```
╔══════════════════════════════════════════════════╗
║              KẾ HOẠCH THỰC THI SONG SONG          ║
╠══════════════════════════════════════════════════╣
║ Wave 1 (song song):                              ║
║   🔀 Agent A: Task 1 (Backend) — tạo API users   ║
║   🔀 Agent B: Task 2 (Frontend) — trang users    ║
║ Wave 2 (tuần tự — dùng code từ Wave 1):         ║
║   → Task 3: Kết nối API users + validation       ║
║ Wave 3 (song song):                              ║
║   🔀 Agent C: Task 4 (Backend) — API orders      ║
║   🔀 Agent D: Task 5 (Frontend) — trang orders   ║
╚══════════════════════════════════════════════════╝
Xác nhận chạy? (y/n)
```

**Nếu user xác nhận** → nhảy sang **Bước 10** (chế độ parallel).
**Nếu KHÔNG có `--parallel`** → bỏ qua bước này, chạy tuần tự như bình thường.

## Bước 2: Đọc context cho task
- Chi tiết task trong TASKS.md (mô tả, checklist, ghi chú kỹ thuật)
- PLAN.md sections liên quan (thiết kế kỹ thuật, API, database)
- PLAN.md section `Quyết định thiết kế` (nếu có) → các quyết định đã chốt với user trong chế độ DISCUSS — code PHẢI tuân thủ
- Nếu PLAN.md thiếu thông tin cần thiết cho task (VD: thiếu response format, thiếu DB schema, thiếu component props) → **DỪNG**, thông báo: "PLAN.md thiếu [thông tin cụ thể]. Chạy `/pd:plan --discuss` để bổ sung, hoặc xác nhận để Claude tự quyết định (sẽ ghi vào CODE_REPORT)."
- `.planning/docs/*.md` → chỉ đọc **mục lục nhanh**, rồi đọc sections liên quan đến task bằng offset/limit
- `.planning/rules/` chứa đầy đủ quy tắc code — đọc file rules phù hợp với Loại task

## Bước 3: Research code hiện có + tra cứu thư viện
Đọc CONTEXT.md → kiểm tra `Dự án mới`:
- **Dự án mới = Có VÀ chưa có source files**: skip FastCode, chỉ dùng Context7 tra cứu docs thư viện
- **Có code rồi**: dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
  1. "Patterns đang dùng cho [loại file cần tạo]."
  2. "Functions/services tái sử dụng cho [task]."

Nếu FastCode MCP lỗi khi gọi → DỪNG, thông báo user chạy `/pd:init` kiểm tra lại.

**Tra cứu API thư viện qua Context7** (nếu task dùng thư viện bên ngoài):
1. `mcp__context7__resolve-library-id` (libraryName: "nestjs", query: "mô tả ngắn task") → lấy Context7 library ID
2. `mcp__context7__query-docs` (libraryId: ID từ bước 1, query: "câu hỏi cụ thể về API cần dùng") → lấy docs đúng version
- **TỰ ĐỘNG tra cứu** khi task cần dùng API của thư viện — KHÔNG cần user yêu cầu
- Ưu tiên Context7 hơn đoán API từ memory — đảm bảo đúng version + đúng cú pháp
- **Giao diện Admin**: BẮT BUỘC tra Context7 (antd) cho mỗi component Ant Design mới — verify props, cú pháp, tham số
- **Guard/JWT/Role**: BẮT BUỘC tra Context7 (nestjs) + FastCode pattern hiện có trước khi viết
- Nếu Context7 MCP không có → dùng `.planning/docs/` (từ `/pd:fetch-doc`) hoặc knowledge sẵn có

## Bước 4: Viết code
Tuân thủ **quy tắc code trong `.planning/rules/`**. Đặc biệt:

- **JSDoc + Logger + Comments** → TIẾNG VIỆT CÓ DẤU
- **Error/Exception messages** → theo quy tắc trong `.planning/rules/backend.md` hoặc `frontend.md` (match ngôn ngữ throw/message đang dùng trong dự án)
- **Tên biến/function/class/file** → tiếng Anh
- **Giới hạn file**: mục tiêu 300 dòng, BẮT BUỘC tách >500

**Nếu task Backend:**
- **Database migration** nếu thay đổi schema:
  - Prisma: `npx prisma migrate dev --name [tên]`
  - MongoDB: migration script hoặc `migrate-mongo`
  - TypeORM: `npx typeorm migration:generate -n [Tên]`

**Nếu task Frontend (NextJS):**
- Tuân thủ cấu trúc thư mục frontend trong `.planning/rules/frontend.md`
- Inline styles `style={{}}` — KHÔNG CSS modules, KHÔNG Tailwind
- Ant Design v6 components + `theme.useToken()` cho dynamic values
- `'use client'` CHỈ khi cần — Server Components mặc định
- Zustand stores theo pattern `create<State>()(persist(...))`
- API calls: native `fetch`, KHÔNG axios

**Nếu task WordPress (plugin/theme/block):**
- Tuân thủ quy tắc trong `.planning/rules/wordpress.md` (security, coding standards, hooks)
- Mỗi file PHP: BẮT BUỘC `defined( 'ABSPATH' )` check ở đầu
- Tra cứu `.planning/docs/wordpress/` cho patterns phức tạp (đọc mục lục nhanh, rồi sections liên quan)
- Tra cứu Context7 (`wordpress`, `woocommerce`) cho API cụ thể
- Gutenberg blocks: dùng `@wordpress/scripts` build toolchain
- PHP lint: `composer run lint` (nếu đã setup PHPCS + WordPress standards)

**Nếu task stack khác** (Chrome extension, CLI, v.v.):
- Tuân thủ thiết kế trong PLAN.md + quy tắc chung trong `general.md`
- Tra cứu docs thư viện qua Context7 nếu cần

## Bước 5: Lint + Build
Đọc CONTEXT.md → Tech Stack → xác định thư mục + công cụ build.

**Nếu có rules file** (backend.md/frontend.md/wordpress.md): đọc mục **Build & Lint** → lấy lệnh lint + build.
**Nếu không có rules file** (stack khác): đọc `package.json` hoặc `composer.json` scripts → dùng `npm run lint` / `npm run build` hoặc `composer run lint` nếu có, hoặc skip nếu project chưa setup build.

Chạy lệnh trong đúng thư mục của task. Output pipe qua `| tail -50` để gọn.

Nếu lint/build fail → sửa code và chạy lại. Tối đa 3 lần. Nếu vẫn fail sau 3 lần → **DỪNG**, báo user kèm error message. Có thể cần sửa PLAN.md.
Nếu chưa có lint/build config (project mới) → skip bước này, ghi chú trong report.

## Bước 6: Tạo báo cáo
Viết `.planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_[N].md`:

```markdown
# Báo cáo code - Task [N]: [Tên]
> Ngày: [DD_MM_YYYY HH:MM] | Build: Thành công

## Files đã tạo/sửa
| Hành động | File | Mô tả ngắn |

## API Endpoints (nếu có)
| Phương thức | Đường dẫn | Mô tả |

## Database (nếu có)
[Migration + schema thay đổi]

## Ghi chú
[Quyết định kỹ thuật đáng lưu ý, nếu có]
```

## Bước 7: Git commit (CHỈ nếu HAS_GIT = true, xem Bước 1)
```
git add [source code files đã tạo/sửa ở Bước 4]
git add [migration files nếu có (Prisma: prisma/migrations/, TypeORM: src/migrations/)]
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/milestones/[version]/phase-[phase]/reports/CODE_REPORT_TASK_[N].md
git commit -m "[TASK-N] [Tóm tắt tiếng Việt]

Mô tả: [Chi tiết task đã hoàn thành]
Files: [danh sách files]"
```

## Bước 8: Cập nhật TASKS.md → ✅ (SAU commit thành công)
Cập nhật trạng thái task: 🔄 → ✅ trong CẢ HAI nơi: (1) bảng Tổng quan (cột Trạng thái), (2) task detail block (`> Trạng thái: 🔄` → `> Trạng thái: ✅`).
Cập nhật trường `> Files:` trong task detail nếu files thực tế khác với files trong plan.
Nếu git commit ở Bước 7 FAIL → giữ task ở 🔄, KHÔNG đánh dấu ✅. Sửa lỗi commit trước.

Nếu CONTEXT.md có `Dự án mới: Có` VÀ đây là task đầu tiên hoàn tất → cập nhật thành `Dự án mới: Không` + cập nhật `Cập nhật: [DD_MM_YYYY HH:MM]`.

## Bước 9: Cập nhật ROADMAP (khi phase hoàn tất)
Nếu TẤT CẢ tasks trong phase đều ✅ (không còn ⬜, 🔄, ❌, hoặc 🐛):
- Đọc `.planning/ROADMAP.md` → tìm phase hiện tại (VD: `#### Phase 1.1:`)
- Đánh dấu tất cả deliverables: `- [ ]` → `- [x]`

Khi tất cả tasks trong phase hiện tại ✅:
- Kiểm tra ROADMAP: milestone có phase tiếp theo không?
- Nếu phase tiếp đã có TASKS.md (đã plan) → tự động advance `phase` trong CURRENT_MILESTONE.md sang phase tiếp.
- Nếu phase tiếp chưa plan → giữ nguyên, gợi ý `/pd:plan [phase tiếp]`.

**Tracking commit** (CHỈ khi HAS_GIT = true VÀ tất cả tasks trong phase ✅):
```
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/ROADMAP.md
git add .planning/CURRENT_MILESTONE.md
# Nếu CONTEXT.md đã cập nhật ở Bước 8 ("Dự án mới" flag):
git add .planning/CONTEXT.md
git commit -m "[TRACKING] Phase [x.x] hoàn tất

Tổng: [N] tasks ✅"
```

## Bước 10: Tiếp tục hoặc dừng

### Chế độ `--parallel` (multi-agent song song)
Thực thi theo waves đã phân tích ở Bước 1.5:

**Với mỗi wave:**
1. **Spawn Agent tool** cho mỗi task song song trong wave — mỗi agent nhận đầy đủ:
   - PLAN.md (toàn bộ thiết kế kỹ thuật)
   - Task detail từ TASKS.md (task cụ thể agent cần làm)
   - Rules files phù hợp (general + backend/frontend theo Loại task)
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
   - Nếu tất cả OK → tạo report cho mỗi task (Bước 6) → commit từng task riêng (Bước 7) → cập nhật TASKS.md → ✅ (Bước 8)

5. **Verify integration** (sau wave có cả Backend + Frontend):
   - So sánh TypeScript interfaces/types trong frontend với response DTO/entity trong backend (đọc cả 2 files, kiểm tra field names + types khớp nhau)
   - Kiểm tra API endpoint paths frontend gọi đúng backend đã tạo
   - Nếu mismatch → sửa frontend cho khớp, commit bổ sung `[TASK-N] Đồng bộ types với backend`

6. **Chuyển wave tiếp theo** → lặp lại từ bước 1 của quy trình wave (spawn agents)

7. **Khi hết waves** → thực hiện Bước 9 (cập nhật ROADMAP) rồi thông báo:
```
╔══════════════════════════════════════════════════╗
║           HOÀN TẤT SONG SONG                     ║
╠══════════════════════════════════════════════════╣
║ Phase [x.x]: [N] tasks hoàn tất                 ║
║ Waves: [X] | Song song: [Y] tasks | Tuần tự: [Z]║
╠══════════════════════════════════════════════════╣
║ Gợi ý:                                          ║
║   /pd:test              → Kiểm thử (NestJS/WP)   ║
║   /pd:plan [phase tiếp] → Phase tiếp theo       ║
║   /pd:complete-milestone → Đóng milestone        ║
╚══════════════════════════════════════════════════╝
```

### Chế độ `--auto` (tuần tự)
Còn task 🔄 hoặc ⬜ trong phase **ban đầu** (phase tại thời điểm bắt đầu `--auto`, KHÔNG phải phase sau khi Bước 9 advance) → quay lại **Bước 1** pick task tiếp theo (KHÔNG hỏi user, ưu tiên 🔄 trước ⬜). Dừng khi:
- Hết task 🔄 và ⬜ trong phase ban đầu (tất cả ✅) → Bước 9 đã chạy trong normal flow (sau Bước 8) và đã tạo tracking commit → **DỪNG auto loop** (KHÔNG tự nhảy sang phase tiếp dù CURRENT_MILESTONE đã advance) → thông báo: "Phase [x.x] hoàn tất [N] tasks. Gợi ý: `/pd:test`, `/pd:plan [phase tiếp]`, hoặc `/pd:complete-milestone`"
- **TẤT CẢ tasks còn lại đều bị ❌, 🐛, hoặc ⬜ nhưng bị chặn bởi dependency chưa ✅** → **DỪNG auto loop**, thông báo user danh sách tasks blocked/lỗi + đề xuất `/pd:fix-bug`
- Gặp lỗi build BẮT BUỘC (lint/build fail) → dừng, báo lỗi
- Nếu lint/build được skip (project chưa setup build tools) → tiếp tục task tiếp theo bình thường

### Chế độ mặc định (không có flag)
DỪNG sau mỗi task, thông báo:
- Task hoàn thành + files + build status
- Nếu còn task ⬜ → hỏi: "Còn [X] tasks. Tiếp tục task tiếp theo không?"
- Nếu hết task ⬜ → đề xuất:
  - `/pd:test` → chạy kiểm thử (CHỈ gợi ý nếu CONTEXT.md có Backend NestJS hoặc WordPress)
  - `/pd:plan [phase tiếp]` → lên kế hoạch phase tiếp theo
  - `/pd:complete-milestone` → hoàn tất milestone (nếu đây là phase cuối)
</process>

<rules>
- Tuân thủ toàn bộ quy tắc trong `.planning/rules/` (general + backend/frontend theo Loại task)
- PHẢI đọc PLAN.md + task detail + docs liên quan trước khi code
- Nếu PLAN.md có section `Quyết định thiết kế` → code PHẢI tuân thủ các quyết định đã chốt — KHÔNG được tự ý thay đổi
- Nếu quyết định thiết kế KHÔNG THỂ tuân thủ (do constraint kỹ thuật phát hiện khi code) → **DỪNG**, thông báo user và ghi nhận trong CODE_REPORT. KHÔNG tự ý thay đổi.
- PHẢI lint + build sau khi code
- PHẢI commit sau khi pass build, commit message tiếng Việt có dấu
- Docs/: chỉ đọc mục lục + sections liên quan, KHÔNG đọc toàn bộ
- Tái sử dụng code/thư viện có sẵn
- Nếu tasks blocked → THÔNG BÁO user, KHÔNG pick bừa
- Nếu FastCode MCP lỗi → DỪNG, yêu cầu chạy `/pd:init`

**Quy tắc Parallel (--parallel):**
- CHỈ chạy song song tasks KHÔNG chia sẻ files VÀ KHÔNG có dependency trực tiếp
- Tasks phụ thuộc nhau (task B cần dùng function/module task A tạo ra) → PHẢI chạy tuần tự
- Backend + Frontend song song: Frontend agent PHẢI dùng response shape từ PLAN.md, KHÔNG đoán
- Sau mỗi wave: orchestrator PHẢI verify không có file conflict trước khi commit
- Sau wave có Backend + Frontend: PHẢI verify integration (types khớp response thực tế)
- Nếu 2 agents sửa cùng file → DỪNG, báo user — KHÔNG tự merge
- Mỗi agent commit riêng với prefix `[TASK-N]` riêng biệt
- PHẢI hiển thị wave plan cho user xác nhận trước khi bắt đầu
</rules>
