# Nâng cấp `pd:test` — Chế độ test độc lập (`--standalone`)

## Bối cảnh

Hiện tại `pd:test` **bắt buộc** phải có task ở trạng thái ✅ (đã qua `pd:write-code`). Điều này không phù hợp với:
- **Dự án cũ** đã có code nhưng chưa dùng please-done workflow
- **Dự án import** từ bên ngoài cần kiểm thử ngay
- **Regression test** trên code có sẵn mà không cần tạo milestone/plan/write-code

**Mục tiêu:** Thêm tham số `--standalone` cho phép test chạy độc lập — bỏ qua guards về task status, tự phân tích code và viết test trực tiếp.

---

## Nguyên tắc thiết kế

> [!IMPORTANT]
> **Flow hiện tại KHÔNG bị thay đổi.** Logic `write-code` → `test` (task phải ✅) vẫn giữ nguyên 100%. `--standalone` là flow **mới hoàn toàn**, song song, không ảnh hưởng flow cũ.

| Flow | Điều kiện | Mô tả |
|------|-----------|-------|
| **Chuẩn** (giữ nguyên) | Task number / `--all` / không tham số | Yêu cầu TASKS.md + task ✅. Đúng workflow hiện tại |
| **Độc lập** (MỚI) | `--standalone [scope]` | Bỏ qua milestone/task. Tự scan code → viết test → chạy |

---

## Audit xung đột với hệ thống hiện tại

> [!CAUTION]
> Dưới đây là **6 xung đột** phát hiện qua cross-reference audit toàn bộ các skill/workflow. Mỗi xung đột đều có phương án xử lý.

### Xung đột 1: `state-machine.md` dòng 50 — Điều kiện tiên quyết cứng

**Hiện tại:**
```
| `/pd:test` | CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅) | "Chạy `/pd:write-code` trước" |
```

**Vấn đề:** Bảng điều kiện tiên quyết không nhắc đến `--standalone`, các skill khác đọc `state-machine.md` để validate → sẽ hiểu sai rằng test luôn cần PLAN.md + TASKS.md.

**Sửa:**
```diff
-| `/pd:test` | CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅) | "Chạy `/pd:write-code` trước" |
+| `/pd:test` | CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅) | "Chạy `/pd:write-code` trước" |
+| `/pd:test --standalone` | CONTEXT.md (hoặc tự detect) + có source code | "Dự án chưa có code để test" |
```

Thêm dòng mới trong bảng cho `--standalone`, giữ nguyên dòng cũ.

---

### Xung đột 2: `state-machine.md` Luồng chính — Thiếu nhánh standalone

**Hiện tại:**
```
→ [/pd:write-code] → Đang code
  → [/pd:test] → Đã test (tùy chọn)
```

**Vấn đề:** Luồng chính chỉ thể hiện `test` sau `write-code`. Không có nhánh cho standalone.

**Sửa:** Thêm vào phần **Nhánh phụ**:
```diff
 **Nhánh phụ** (bất kỳ lúc nào sau init):
 - `/pd:fix-bug` → điều tra + sửa lỗi
 - `/pd:what-next` → kiểm tra tiến trình
+- `/pd:test --standalone` → test độc lập (không cần milestone/plan/write-code)
```

---

### Xung đột 3: `what-next.md` — Không phát hiện standalone reports

**Hiện tại (Bước 3):**
- Dòng 37: `phase-[phase]/TEST_REPORT.md tồn tại?`
- Dòng 38: Quét `phase-*/` chưa có `TEST_REPORT.md`
- Ưu tiên 5.6/6: Chỉ gợi ý `/pd:test` dựa trên phase-based TEST_REPORT

**Vấn đề:** Standalone reports lưu ở `.planning/reports/STANDALONE_TEST_REPORT_*.md` → `what-next` hoàn toàn không biết, không gợi ý.

**Sửa:** Thêm sub-step 8 vào Bước 3:
```diff
 7. `VERIFICATION_REPORT.md` tồn tại? → `Đạt`/`Có gap`/`Cần kiểm tra thủ công`
+8. Glob `.planning/reports/STANDALONE_TEST_REPORT_*.md` → đếm. CÓ → ghi nhận "Có [N] báo cáo test độc lập"
```

Thêm Ưu tiên mới vào Bước 4:
```diff
 | 5.6 | Phase cũ hoàn tất chưa test | `/pd:test` (tự phát hiện phase) |
+| 5.7 | Có STANDALONE_TEST_REPORT với lỗi (❌ > 0) | `/pd:fix-bug` — "Có [N] lỗi từ test độc lập." |
```

---

### Xung đột 4: Bug report format — `Patch version` thiếu cho standalone

**Hiện tại:**
- `workflows/test.md` Bước 8: Bug report có `> Patch version: [x.x.x]` (lấy từ TASKS.md → milestone version)
- `workflows/complete-milestone.md` Bước 3: Grep `Patch version:` → filter bugs theo milestone
- `workflows/what-next.md` Bước 2: Grep `Patch version:` → filter bugs

**Vấn đề:** Standalone không có milestone → không có version → bug report thiếu `Patch version` → **KHÔNG BỊ** `complete-milestone` bắt (tốt — không chặn sai), NHƯNG cũng không hiện trong `what-next` (xấu — bị bỏ quên).

**Sửa:** Standalone bug report dùng format đặc biệt:
```markdown
> Trạng thái: Chưa xử lý | Nguồn: Standalone test | Scope: [path]
> Patch version: standalone
```

Cập nhật `what-next.md` Bước 2:
```diff
 Glob `.planning/bugs/BUG_*.md` → grep `> Trạng thái:` (Chưa xử lý/Đang sửa) + `> Patch version:` → filter milestone hiện tại
+- Bugs có `Patch version: standalone` → hiện riêng: "Có [N] lỗi từ test độc lập chưa xử lý."
```

Cập nhật `complete-milestone.md` Bước 3 — thêm note:
```diff
 - Bỏ qua bugs milestone khác
+- Bỏ qua bugs `Patch version: standalone` (không thuộc milestone nào)
```

> [!NOTE]
> Bugs standalone sẽ được hiển thị trong `what-next` nhưng **KHÔNG chặn** `complete-milestone`. Điều này hợp lý vì chúng không thuộc workflow milestone.

---

### Xung đột 5: Guard `CONTEXT.md` — Standalone muốn bypass

**Hiện tại:** `guard-context.md` yêu cầu `.planning/CONTEXT.md` tồn tại → "Chạy `/pd:init` trước."

**Vấn đề:** Kế hoạch ban đầu đề xuất standalone tự detect stack khi không có CONTEXT.md, nhưng guard chạy TRƯỚC workflow → sẽ DỪNG ngay.

**Sửa 2 bước:**

**a) Trong `commands/pd/test.md` — Guard có điều kiện:**
```diff
-@references/guard-context.md
+- [ ] **CHỈ khi KHÔNG có `--standalone`:** `.planning/CONTEXT.md` tồn tại -> "Chạy `/pd:init` trước."
+- [ ] **CHỈ khi CÓ `--standalone`:** `.planning/CONTEXT.md` tồn tại HOẶC dự án có source code -> "Dự án chưa có code và chưa khởi tạo. Chạy `/pd:init` trước."
```

**b) Trong `workflows/test.md` Bước S1:** Khi CONTEXT.md không tồn tại → tự detect stack (đã có trong kế hoạch, giữ nguyên).

> [!IMPORTANT]
> KHÔNG sửa `guard-context.md` bản thân (shared reference). Chỉ sửa cách đặt guard trong `commands/pd/test.md`.

---

### Xung đột 6: `complete-milestone.md` Bước 2 — Kiểm tra TEST_REPORT

**Hiện tại (dòng 38):**
```
- `phase-*/TEST_REPORT.md` (BẮT BUỘC — backend test tự động, frontend-only kiểm thử thủ công)
```

**Vấn đề:** Nếu user đã chạy `--standalone` test cho code nhưng KHÔNG chạy flow chuẩn → phase vẫn thiếu `TEST_REPORT.md` → `complete-milestone` cảnh báo. Đây là **hành vi mong muốn** — standalone test không thay thế test chuẩn theo phase.

**Quyết định: KHÔNG SỬA.** Đây đúng logic:
- Standalone test = test nhanh, regression, kiểm thử dự án cũ
- Milestone completion vẫn yêu cầu test theo phase (flow chuẩn)
- User muốn bỏ qua → `complete-milestone` đã có option "(2) Bỏ qua"

---

## Thay đổi chi tiết

### File 1: `commands/pd/test.md`

#### 1.1 Cập nhật `argument-hint`

```diff
-argument-hint: "[task number | --all]"
+argument-hint: "[task number | --all | --standalone [module/path]]"
```

#### 1.2 Cập nhật `<objective>`

```diff
 Viết test theo stack (Jest/PHPUnit/Hardhat-Foundry/flutter_test). Frontend-only: danh sách kiểm thử thủ công + xác nhận.
 Test với dữ liệu cụ thể, chạy kiểm thử, để người dùng xác nhận rồi commit.
+
+**Chế độ `--standalone`:** Test độc lập — không cần milestone/plan/write-code. Tự phân tích code có sẵn, viết test, chạy và báo cáo. Dùng cho dự án cũ hoặc regression test.

 **Sau khi xong:** `/pd:write-code`, `/pd:fix-bug`, hoặc `/pd:complete-milestone`
```

#### 1.3 Cập nhật `<guards>`

```diff
 <guards>
 Dừng và hướng dẫn người dùng nếu bất kỳ điều kiện nào sau đây thất bại:

-@references/guard-context.md
-- [ ] Task number hợp lệ hoặc có cờ `--all` -> "Cung cấp số task hoặc dùng `--all`."
+- [ ] **CHỈ khi KHÔNG có `--standalone`:** `.planning/CONTEXT.md` tồn tại -> "Chạy `/pd:init` trước."
+- [ ] **CHỈ khi CÓ `--standalone`:** `.planning/CONTEXT.md` tồn tại HOẶC dự án có source code -> "Dự án chưa có code và chưa khởi tạo. Chạy `/pd:init` trước."
+- [ ] Task number hợp lệ hoặc có cờ `--all` hoặc `--standalone` -> "Cung cấp số task, dùng `--all`, hoặc `--standalone [scope]`."
 @references/guard-fastcode.md
 @references/guard-context7.md
-- [ ] Có ít nhất 1 task ở trạng thái `done` -> "Chưa có task nào hoàn thành. Chạy `/pd:write-code` trước."
+- [ ] **CHỈ khi KHÔNG có `--standalone`:** Có ít nhất 1 task ở trạng thái `done` -> "Chưa có task nào hoàn thành. Chạy `/pd:write-code` trước."
 </guards>
```

#### 1.4 Cập nhật `<context>`

```diff
 <context>
 Người dùng nhập: $ARGUMENTS
 - Task number -> test riêng task đó (phải done)
 - `--all` -> regression toàn bộ phases
 - Không có gì -> test tất cả tasks done trong phase hiện tại
+- `--standalone` -> test độc lập, không cần milestone/plan/write-code:
+  - `--standalone` (không scope) -> hỏi user chọn module/đường dẫn cần test
+  - `--standalone src/modules/users` -> test module chỉ định
+  - `--standalone src/modules/users/users.service.ts` -> test file chỉ định
+  - `--standalone --all` -> quét toàn bộ source, test tất cả
```

#### 1.5 Cập nhật `<output>`

```diff
 **Tạo/Cập nhật:**
 - File test theo từng stack (Jest, PHPUnit, Hardhat, `flutter_test`)
 - Danh sách kiểm thử thủ công cho frontend-only
-- Cập nhật `TASKS.md`
+- Cập nhật `TASKS.md` (chỉ flow chuẩn)
+- `STANDALONE_TEST_REPORT_[timestamp].md` trong `.planning/reports/` (chỉ --standalone)
```

---

### File 2: `workflows/test.md`

> [!IMPORTANT]
> Thêm **Bước 0** mới trước Bước 1. Nếu `--standalone` → nhảy sang **Bước S1–S8** (flow mới). Nếu không → giữ nguyên Bước 1–10 100%.

#### 2.1 Bước 0 (MỚI): Route theo chế độ

```markdown
## Bước 0: Phân luồng chế độ

`$ARGUMENTS` chứa `--standalone`?
- **CÓ** → nhảy **Bước S1** (flow standalone)
- **KHÔNG** → tiếp **Bước 1** (flow chuẩn — giữ nguyên 100%)
```

#### 2.2 Flow standalone — Bước S1 đến S8

```markdown
## === FLOW STANDALONE (--standalone) ===

## Bước S1: Xác định scope + đọc context

1. **Đọc CONTEXT.md** → Tech Stack → xác định test framework:
   - CONTEXT.md tồn tại → dùng thông tin stack

   - CONTEXT.md KHÔNG tồn tại → **tự phát hiện stack** (logic từ `workflows/init.md` Bước 4):
     | Detection | Condition | Framework |
     |-----------|-----------|-----------|
     | NestJS | `**/nest-cli.json` / `**/app.module.ts` | Jest + Supertest |
     | WordPress | `**/wp-config.php` / `**/wp-content/plugins/*/` | PHPUnit |
     | Solidity | `**/hardhat.config.*` / `**/foundry.toml` | Hardhat/Foundry |
     | Flutter | `**/pubspec.yaml` + grep `flutter` | flutter_test + mocktail |
     | Frontend-only | `**/vite.config.*` / >5 `.tsx/.jsx` | kiểm thử thủ công |
     
     Thông báo: "Không có CONTEXT.md — tự phát hiện stack: [kết quả]. Chạy `/pd:init` để tạo context đầy đủ."

2. **Xác định scope cần test:**
   - `--standalone [path]` → validate path tồn tại → scope = path đó
   - `--standalone --all` → scope = toàn bộ source (trừ node_modules, .planning, build, dist)
   - `--standalone` (không scope) → hỏi user:
     ```
     Chạy test độc lập. Chọn phạm vi:
     1. Toàn bộ dự án
     2. Module cụ thể (nhập đường dẫn)
     3. File cụ thể (nhập đường dẫn)
     ```

3. `git rev-parse --git-dir 2>/dev/null` → lưu `HAS_GIT`
4. `mkdir -p .planning/reports` (đảm bảo thư mục tồn tại)

---

## Bước S1.5: Kiểm tra khôi phục sau gián đoạn

1. **Test files chưa commit?** Glob theo stack (tương tự Bước 1.5 chuẩn):
   - Tìm thấy test files chưa commit (`git status`):
     - "Tìm thấy [N] test files chưa commit (có thể từ phiên trước)."
     - Hỏi: "1. GIỮ — chỉ chạy test | 2. VIẾT LẠI từ đầu"
     - Giữ → nhảy Bước S5 | Viết lại → tiếp tục

2. **STANDALONE_TEST_REPORT_*.md tồn tại?** → `.planning/reports/STANDALONE_TEST_REPORT_*.md`
   - CÓ → Hỏi: "1. GIỮ report — chỉ commit | 2. CHẠY LẠI từ đầu"
   - Giữ → nhảy Bước S8 | Chạy lại → tiếp tục

3. Không có dấu vết → tiếp Bước S2

---

## Bước S2: Kiểm tra test infrastructure

Giống hệt Bước 2 flow chuẩn (kiểm tra Jest/PHPUnit/Hardhat/Foundry/Flutter + cài nếu thiếu).

---

## Bước S3: Phân tích code trong scope

**Mục tiêu:** Hiểu logic code để viết test chính xác — KHÔNG cần PLAN.md hay TASKS.md.

1. **FastCode** (nếu kết nối): `mcp__fastcode__code_qa` với scope:
   - "Liệt kê tất cả endpoints/functions/services trong [scope]. Mô tả input/output/validation/error cases."

2. **Fallback** (FastCode lỗi hoặc không kết nối):
   - Glob `[scope]/**/*.{ts,tsx,js,jsx,php,sol,dart}` (trừ test files, node_modules)
   - Đọc từng file → extract exports, class, functions, decorators
   
3. **Tổng hợp danh sách cần test:**
   ```
   ╔═══╦══════════════════════╦══════════════╦═════════════╗
   ║ # ║ Module/File          ║ Chức năng    ║ Loại test   ║
   ╠═══╬══════════════════════╬══════════════╬═════════════╣
   ║ 1 ║ users.service.ts     ║ CRUD users   ║ Unit + E2E  ║
   ║ 2 ║ auth.controller.ts   ║ Login/Signup ║ E2E         ║
   ╚═══╩══════════════════════╩══════════════╩═════════════╝
   ```

4. **Hỏi user xác nhận:**
   - "Danh sách trên đúng chưa? Thêm/bớt module nào?"
   - User xác nhận → tiếp. User chỉnh → cập nhật.

5. **Context7** (thư viện bên thứ ba): @references/context7-pipeline.md

---

## Bước S4: Viết test files

Giống hệt Bước 4 flow chuẩn về format + quy tắc:
- Đặt cạnh source (NestJS `*.spec.ts`, WP `test-*.php`, v.v.)
- Mỗi test case có đầu vào RÕ RÀNG + đầu ra CỤ THỂ
- Test data dùng `Date.now()` unique
- Nhóm: happy path → validation → auth → edge cases
- Describe/it/comment tiếng Việt có dấu

**Khác biệt với flow chuẩn:**
- Nguồn thông tin: từ code thực tế (Bước S3), KHÔNG từ PLAN.md/TASKS.md
- Phạm vi: có thể rộng hơn (toàn bộ module, không chỉ 1 task)
- Test có sẵn: kiểm tra test files đã tồn tại → BỔ SUNG, không ghi đè

---

## Bước S5: Chạy test

Giống hệt Bước 5 flow chuẩn:
- `cd [đường-dẫn-backend] && npm test -- --verbose --testPathPattern=[pattern]`
- Hiển thị bảng kết quả (# | Test case | KQ | Đầu vào | Đầu ra)

---

## Bước S6: User xác nhận

Giống hệt Bước 6 flow chuẩn:
> 1. Database: [bảng cần kiểm tra, dữ liệu kỳ vọng]
> 2. API responses: [endpoint test thủ công, dữ liệu kỳ vọng]
> 3. Giao diện: [CHỈ nếu có Frontend]
> 4. Tất cả đã đúng? (y/n)

---

## Bước S7: STANDALONE_TEST_REPORT

Viết `.planning/reports/STANDALONE_TEST_REPORT_[DD_MM_YYYY_HH_MM_SS].md`:

```markdown
# Báo cáo kiểm thử độc lập
> Ngày: [DD_MM_YYYY HH:MM]
> Scope: [đường dẫn / toàn bộ]
> Tech Stack: [phát hiện tự động / từ CONTEXT.md]
> Tổng: [X] tests | ✅ [Y] đạt | ❌ [Z] lỗi

## Phạm vi đã test
| Module/File | Chức năng | Số test | Kết quả |

## Kết quả chi tiết [Jest|PHPUnit|Hardhat|Foundry|FlutterTest|Kiểm thử thủ công]
| Test case | Đầu vào | Kỳ vọng | Thực tế | KQ |

## Xác nhận giao diện (bỏ nếu không có Frontend)
| Chức năng | Kết quả | Ghi chú |

## Xác nhận dữ liệu (bỏ nếu không có Database/On-chain)
| Bảng/Collection/Contract | Kết quả | Ghi chú |

## Lỗi phát hiện (nếu có)
| # | Module | Mô tả lỗi | Mức độ | Đề xuất sửa |
```

**Nếu có lỗi** → tạo bug report `.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md`:
```markdown
# Báo cáo lỗi (từ kiểm thử độc lập)
> Ngày: [DD_MM_YYYY HH:MM:SS] | Mức độ: [Nghiêm trọng/Cao/Trung bình/Nhẹ]
> Trạng thái: Chưa xử lý | Nguồn: Standalone test | Scope: [path]
> Patch version: standalone
> Format: BUG_[timestamp].md (giống flow chuẩn)
```

> [!IMPORTANT]
> `Patch version: standalone` → `complete-milestone` sẽ bỏ qua (không khớp version nào). `what-next` sẽ hiện riêng. `fix-bug` vẫn tìm được qua Glob + grep `Chưa xử lý`.

---

## Bước S8: Git commit (CHỈ nếu HAS_GIT = true)

```bash
git add [test files]
git add .planning/reports/STANDALONE_TEST_REPORT_[timestamp].md
# Nếu có bug report:
git add .planning/bugs/BUG_[timestamp].md
git commit -m "[KIỂM THỬ] Kiểm thử độc lập [scope]

Phạm vi: [scope]
Kết quả: X/Y đạt
Stack: [framework]"
```

## === KẾT THÚC FLOW STANDALONE ===
```

---

### File 3: `references/state-machine.md` — Cập nhật 2 chỗ

#### 3.1 Bảng điều kiện tiên quyết (dòng 50)

```diff
 | `/pd:test` | CONTEXT.md + PLAN.md + TASKS.md (≥1 task ✅) | "Chạy `/pd:write-code` trước" |
+| `/pd:test --standalone` | CONTEXT.md (hoặc tự detect) + có source code | "Dự án chưa có code để test" |
```

#### 3.2 Nhánh phụ (dòng 20-24)

```diff
 **Nhánh phụ** (bất kỳ lúc nào sau init):
 - `/pd:fix-bug` → điều tra + sửa lỗi
 - `/pd:what-next` → kiểm tra tiến trình
+- `/pd:test --standalone` → test độc lập (không cần milestone/plan/write-code)
 - `/pd:fetch-doc` → cache tài liệu
```

---

### File 4: `workflows/what-next.md` — Cập nhật 2 chỗ

#### 4.1 Bước 3: Thêm sub-step 8 (sau dòng 39)

```diff
 7. `VERIFICATION_REPORT.md` tồn tại? → `Đạt`/`Có gap`/`Cần kiểm tra thủ công`
+8. Glob `.planning/reports/STANDALONE_TEST_REPORT_*.md` → đếm. CÓ → ghi nhận "Có [N] báo cáo test độc lập"
```

#### 4.2 Bước 2: Bổ sung xử lý bug standalone (dòng 28-30)

```diff
 Glob `.planning/bugs/BUG_*.md` → grep `> Trạng thái:` (Chưa xử lý/Đang sửa) + `> Patch version:` → filter milestone hiện tại
 - CÓ bugs mở → ghi nhận
 - Bugs milestone khác → ghi riêng, gợi ý phụ
+- Bugs `Patch version: standalone` → ghi riêng: "Có [N] lỗi từ test độc lập chưa xử lý." Gợi ý `/pd:fix-bug`
```

#### 4.3 Bước 4: Thêm Ưu tiên 5.7 (sau dòng 51)

```diff
 | 5.6 | Phase cũ hoàn tất chưa test | `/pd:test` (tự phát hiện phase) |
+| 5.7 | Có standalone bug mở (`Patch version: standalone`) | `/pd:fix-bug` — "Có [N] lỗi từ test độc lập." |
```

---

### File 5: `workflows/complete-milestone.md` — Bổ sung 1 dòng Bước 3

```diff
 - Bỏ qua bugs milestone khác
+- Bỏ qua bugs `Patch version: standalone` (không thuộc milestone — sẽ hiện trong `/pd:what-next`)
```

---

## Ma trận so sánh 2 flow

| Tiêu chí | Flow chuẩn | Flow standalone |
|----------|-----------|-----------------|
| **Yêu cầu** | `init` → `plan` → `write-code` → `test` | `init` (hoặc tự detect) → `test --standalone` |
| **Guard task ✅** | Bắt buộc | Bỏ qua |
| **Guard CONTEXT.md** | Bắt buộc (qua @guard-context) | Có thì dùng, không thì tự detect + cảnh báo |
| **PLAN.md / TASKS.md** | Bắt buộc (đọc thiết kế) | Không cần |
| **Nguồn thông tin** | PLAN.md + TASKS.md + CODE_REPORT | Code thực tế (FastCode/Grep/Read) |
| **Scope** | Theo task/phase | Theo path/module/toàn bộ |
| **Report** | `TEST_REPORT.md` trong phase dir | `STANDALONE_TEST_REPORT_*.md` trong `.planning/reports/` |
| **Cập nhật TASKS.md** | Có (đánh 🐛 nếu fail) | Không (không có tasks) |
| **Bug report** | `Patch version: [x.x.x]` | `Patch version: standalone` |
| **`complete-milestone`** | Kiểm tra TEST_REPORT + bugs | Bỏ qua standalone bugs + reports |
| **`what-next`** | Gợi ý dựa trên phase | Gợi ý fix bugs standalone riêng |
| **Commit prefix** | `[KIỂM THỬ]` | `[KIỂM THỬ]` (giữ nguyên) |

---

## Tóm tắt files cần sửa

| # | File | Thay đổi | Ảnh hưởng |
|---|------|----------|-----------|
| 1 | `commands/pd/test.md` | Thêm `--standalone` vào args, guards, context, output | **Chính** |
| 2 | `workflows/test.md` | Thêm Bước 0 (router) + flow S1–S8 | **Chính** |
| 3 | `references/state-machine.md` | Thêm dòng bảng + nhánh phụ | Đồng bộ |
| 4 | `workflows/what-next.md` | Thêm sub-step 8 + Ưu tiên 5.7 + standalone bugs | Đồng bộ |
| 5 | `workflows/complete-milestone.md` | Thêm 1 dòng bỏ qua standalone bugs | Đồng bộ |

**KHÔNG SỬA:** `guard-context.md`, `conventions.md`, `fix-bug.md`, `write-code.md`, `complete-milestone.md` (logic chính)

---

## Xác minh

### Kiểm tra sau khi thay đổi

1. **Flow chuẩn vẫn hoạt động:**
   - Chạy `/pd:test 1` với task ✅ → đúng flow cũ, tạo TEST_REPORT trong phase dir
   - Chạy `/pd:test` không có task ✅ → vẫn DỪNG + thông báo "Chạy `/pd:write-code`"
   - Chạy `/pd:test --all` → regression toàn bộ phases (giữ nguyên)

2. **Flow standalone hoạt động:**
   - Chạy `/pd:test --standalone src/modules/users` → tự detect stack, phân tích code, hỏi xác nhận scope, viết test, chạy, tạo STANDALONE_TEST_REPORT
   - Chạy `/pd:test --standalone` (không scope) → hỏi user chọn scope
   - Chạy `/pd:test --standalone --all` → quét toàn bộ source

3. **Tích hợp hệ thống:**
   - `/pd:what-next` → hiện standalone test reports + standalone bugs
   - `/pd:complete-milestone` → bỏ qua standalone bugs (không chặn sai)
   - `/pd:fix-bug` → tìm standalone bugs qua Glob (hoạt động bình thường)
   - `state-machine.md` → phản ánh đúng 2 flow

4. **Edge cases:**
   - Dự án chưa có code → DỪNG "Dự án chưa có code để test"
   - Không có CONTEXT.md + có code → tự detect stack, cảnh báo chạy `/pd:init`
   - FastCode lỗi → fallback Grep/Read
   - Gián đoạn giữa chừng → khôi phục từ test files chưa commit
   - Bug standalone → hiện trong `what-next`, không chặn `complete-milestone`

### Kiểm tra thủ công
- Review `commands/pd/test.md` và `workflows/test.md` sau khi thay đổi
- Đọc qua flow standalone (Bước S1–S8) xác nhận logic hợp lý
- Xác nhận flow chuẩn (Bước 1–10) KHÔNG bị chỉnh sửa nội dung
- Xác nhận `state-machine.md` phản ánh đúng prerequisites mới
- Xác nhận `what-next.md` gợi ý đúng cho standalone bugs/reports
- Xác nhận `complete-milestone.md` bỏ qua standalone bugs
