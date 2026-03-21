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

**Nếu task Backend (NestJS):**
- **Database migration** nếu thay đổi schema:
  - Prisma: `npx prisma migrate dev --name [tên]`
  - MongoDB: migration script hoặc `migrate-mongo`
  - TypeORM: `npx typeorm migration:generate -n [Tên]`

**Nếu task Frontend (NextJS):**
- Tuân thủ cấu trúc thư mục frontend trong `.planning/rules/nextjs.md`
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

**Nếu task Solidity (smart contract):**
- Tuân thủ quy tắc trong `.planning/rules/solidity.md` (security, coding standards, OZ imports, SafeERC20)
- BẮT BUỘC: SPDX-License-Identifier + pragma solidity + named imports `{}` (CẤM wildcard)
- BẮT BUỘC: `using SafeERC20 for IERC20` cho mọi lệnh transfer/approve token
- BẮT BUỘC: `clearUnknownToken` function trong mọi contract
- BẮT BUỘC: `rescueETH` function nếu contract có `receive()` hoặc nhận ETH
- BẮT BUỘC: NatSpec comments tiếng Anh (`@title`, `@dev`, `@notice`, `@param`, `@return`)
- BẮT BUỘC: Signature hash include `block.chainid + address(this) + msg.sender + deadline`
- BẮT BUỘC: Slippage parameter (`_minAmountOut`) cho swap/trade functions
- Security checklist: `nonReentrant` + `whenNotPaused` theo bảng trong solidity.md, DoS prevention, Flash Loan, Frontrunning/MEV, CẤM `tx.origin`, CẤM `delegatecall` (trừ proxy pattern), CẤM `unchecked` (trừ khi có comment verify)
- Tra cứu `.planning/docs/solidity/templates.md` cho base contract pattern
- Tra cứu `.planning/docs/solidity/audit-checklist.md` khi review code
- Tra cứu Context7 (`openzeppelin`, `hardhat`, `foundry`) cho API cụ thể
- Build: `npx hardhat compile` (Hardhat) hoặc `forge build` (Foundry)
- Test: `npx hardhat test` (Hardhat) hoặc `forge test` (Foundry)

**Nếu task Flutter (Dart + GetX):**
- Tuân thủ quy tắc trong `.planning/rules/flutter.md` (architecture, GetX patterns, design tokens)
- BẮT BUỘC: Architecture Logic + State + View + Binding cho mỗi feature/module
- BẮT BUỘC: Design tokens (AppColors, AppSpacing, AppTextStyles) — CẤM hardcode colors, magic numbers
- BẮT BUỘC: `onClose()` dispose resources (TextEditingController, StreamSubscription, Timer, ScrollController)
- BẮT BUỘC: Models viết `fromJson()`/`toJson()` thủ công — CẤM dùng json_serializable/freezed
- BẮT BUỘC: Obx() wrap CHỈ phần reactive — CẤM wrap toàn bộ Scaffold
- Security: `flutter_secure_storage` cho tokens, `flutter_dotenv` cho env vars
- Tra cứu `.planning/docs/flutter/` cho state management, navigation, design system patterns
- Tra cứu Context7 (`flutter`, `get`) cho API cụ thể
- Build: `flutter build apk` (Android) / `flutter build ios` (iOS)
- Test: `flutter test`

**Nếu task stack khác** (Chrome extension, CLI, v.v.):
- Tuân thủ thiết kế trong PLAN.md + quy tắc chung trong `general.md`
- Tra cứu docs thư viện qua Context7 nếu cần

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

## API Endpoints (nếu có — Backend/WordPress REST)
| Phương thức | Đường dẫn | Mô tả |

## Database (nếu có — Backend/WordPress)
[Migration + schema thay đổi]

## Contract Functions (nếu có — Solidity)
| Function | Visibility | Modifiers | Mô tả |

## Screens & Navigation (nếu có — Flutter)
| Route | View | Logic | Mô tả |

## Hooks & Filters (nếu có — WordPress)
| Loại | Hook name | Callback | Mô tả |

## Review bảo mật
> Ngữ cảnh: [PUBLIC|ADMIN|INTERNAL] | Dữ liệu: [CAO|TRUNG BÌNH|THẤP] | Auth: [JWT|SESSION|API_KEY|SIGNATURE|NONE]

### Rủi ro đã xử lý
| # | Rủi ro | Cách xử lý | Files |
|---|--------|-----------|-------|

### Giả định + giới hạn còn lại
- [giả định bảo mật / rủi ro chấp nhận được, nếu có]

## Sai lệch so với kế hoạch (nếu có)
| # | Loại | Mô tả | Files |
(Ghi lại mọi thay đổi ngoài kế hoạch: bug tự sửa, thiếu sót bổ sung, vấn đề chặn đã gỡ)

## Vấn đề hoãn lại (nếu có)
(Lỗi có sẵn từ trước, không thuộc phạm vi task này — ghi lại để xử lý sau)

## Ghi chú
[Quyết định kỹ thuật đáng lưu ý, nếu có]
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

7. **Khi hết waves** → thực hiện Bước 9 (cập nhật ROADMAP) rồi thông báo:
```
╔══════════════════════════════════════════════════╗
║           HOÀN TẤT SONG SONG                     ║
╠══════════════════════════════════════════════════╣
║ Phase [x.x]: [N] tasks hoàn tất                 ║
║ Waves: [X] | Song song: [Y] tasks | Tuần tự: [Z]║
╠══════════════════════════════════════════════════╣
║ Gợi ý:                                          ║
║   /pd:test              → Kiểm thử (NestJS/WP/Sol/Flutter)║
║   /pd:plan [phase tiếp] → Phase tiếp theo       ║
║   /pd:complete-milestone → Đóng milestone        ║
╚══════════════════════════════════════════════════╝
```

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

**Quy tắc sai lệch (khi viết code gặp vấn đề ngoài kế hoạch):**

Trong lúc viết code, SẼ gặp vấn đề không có trong kế hoạch. Áp dụng 4 quy tắc sau theo thứ tự ưu tiên:

*Quy tắc 1 — Tự sửa lỗi:*
Khi nào: code chạy sai, lỗi logic, null pointer, type sai, query sai kết quả.
Hành động: sửa ngay, KHÔNG cần hỏi user. Ghi vào CODE_REPORT mục "Sai lệch".

*Quy tắc 2 — Tự bổ sung thiếu sót quan trọng (bao gồm bảo mật):*
Khi nào: thiếu validation đầu vào, thiếu xử lý lỗi, thiếu kiểm tra quyền truy cập, thiếu null check, thiếu rate limiting, thiếu escape output (XSS), thiếu parameterized query (SQL injection), thiếu CSRF token cho form thay đổi dữ liệu, thiếu sanitize input.
Hành động: bổ sung ngay, KHÔNG cần hỏi user. Ghi vào CODE_REPORT mục "Sai lệch".
Quan trọng = cần thiết để code chạy đúng và an toàn. KHÔNG phải "tính năng mới".

*Quy tắc 3 — Tự gỡ vấn đề chặn:*
Khi nào: import sai, dependency thiếu, type không khớp, config lỗi, file thiếu.
Hành động: sửa ngay, KHÔNG cần hỏi user. Ghi vào CODE_REPORT mục "Sai lệch".

*Quy tắc 4 — DỪNG lại hỏi user:*
Khi nào: cần thêm bảng DB mới (không phải thêm cột), đổi kiến trúc, đổi thư viện/framework, thay đổi luồng xác thực, thay đổi API công khai có ảnh hưởng đến người dùng.
Hành động: **DỪNG**, thông báo user: vấn đề gì, đề xuất giải pháp, tại sao cần, ảnh hưởng ra sao. Chờ user quyết định.

*Thứ tự ưu tiên*: Quy tắc 4 (kiến trúc) → kiểm tra trước. Nếu không phải kiến trúc → Quy tắc 1-3 (sửa ngay). Không chắc → coi như Quy tắc 4 (hỏi cho chắc).

**Ranh giới phạm vi:**
- CHỈ sửa lỗi DO TASK HIỆN TẠI gây ra. Lỗi có sẵn từ trước (warning cũ, lint errors ở file khác, test fail không liên quan) → ghi vào CODE_REPORT mục "Vấn đề hoãn lại", KHÔNG sửa.
- KHÔNG chạy lại build/lint mong nó tự hết lỗi.

**Giới hạn lần sửa tự động:**
Tối đa 3 lần sửa tự động (Quy tắc 1-3) cho 1 task. Sau 3 lần vẫn lỗi → DỪNG, ghi vấn đề vào CODE_REPORT mục "Vấn đề hoãn lại", chuyển sang task tiếp theo (nếu --auto) hoặc báo user.

**Chống phân tích tê liệt:**
Nếu đọc liên tiếp 5+ lần (Read/Grep/Glob) mà CHƯA viết dòng code nào (Edit/Write) → DỪNG. Tự hỏi: "Tại sao chưa viết?" Rồi hoặc (1) viết code ngay — đã đủ context, hoặc (2) báo "bị chặn vì thiếu [thông tin cụ thể]". KHÔNG tiếp tục đọc vòng vòng.

**Quy tắc Khôi phục (PROGRESS.md):**
- PHẢI tạo PROGRESS.md khi bắt đầu task mới — đây là điểm khôi phục khi gián đoạn
- PHẢI cập nhật PROGRESS.md sau mỗi file viết xong + sau mỗi giai đoạn hoàn tất
- Khi task 🔄 có PROGRESS.md → kiểm tra thực tế trên đĩa + git trước khi viết lại — GIỮ NGUYÊN code đã viết tốt, CHỈ viết phần còn thiếu
- Xóa PROGRESS.md sau commit thành công — task hoàn tất, không cần khôi phục nữa
- Nếu task 🔄 KHÔNG có PROGRESS.md (bản cũ trước khi có tính năng này) → bắt đầu từ Bước 2, tạo PROGRESS.md mới

**Quy tắc Parallel (--parallel):**
- CHỈ chạy song song tasks KHÔNG chia sẻ files VÀ KHÔNG có dependency trực tiếp
- Tasks phụ thuộc nhau (task B cần dùng function/module task A tạo ra) → PHẢI chạy tuần tự
- Backend + Frontend song song: Frontend agent PHẢI dùng response shape từ PLAN.md, KHÔNG đoán
- Sau mỗi wave: orchestrator PHẢI verify không có file conflict trước khi commit
- Sau wave có Backend + Frontend: PHẢI verify integration (types khớp response thực tế)
- Nếu 2 agents sửa cùng file → DỪNG, báo user — KHÔNG tự merge
- Orchestrator commit riêng cho mỗi task với prefix `[TASK-N]` riêng biệt (agent KHÔNG tự commit)
- PHẢI hiển thị wave plan cho user xác nhận trước khi bắt đầu
</rules>
