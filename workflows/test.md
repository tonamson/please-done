<purpose>
Viết test files cho project (Jest + Supertest cho NestJS, PHPUnit cho WordPress, Hardhat/Foundry cho Solidity, flutter_test + mocktail cho Flutter). Test với dữ liệu đầu vào cụ thể, kiểm tra đầu ra đúng logic. Chạy test, yêu cầu user xác nhận giao diện/database, commit test files.
</purpose>

<required_reading>
Đọc tất cả files được tham chiếu trước khi bắt đầu:
- @references/conventions.md → biểu tượng trạng thái, commit prefixes, patch version
</required_reading>

<process>

## Bước 1: Xác định scope + đọc context
- Đọc `.planning/CONTEXT.md` → Tech Stack → xác định test framework:
  - **NestJS** → Jest + Supertest (flow bên dưới Bước 2-5)
  - **WordPress** → PHPUnit + WP_UnitTestCase (tra Context7 cho patterns). Viết `tests/test-*.php`, chạy `composer test`
  - **Solidity** → Hardhat (`npx hardhat test`) hoặc Foundry (`forge test -vvv`). Đọc `.planning/docs/solidity/audit-checklist.md` cho test bắt buộc (deploy, access control, reentrancy, events, signatures)
  - **Flutter** → flutter_test + mocktail (tra Context7 cho patterns). Unit: `test/unit/`, Widget: `test/widget/`, chạy `flutter test`
  - **Framework khác** → thông báo hỗ trợ NestJS/WP/Solidity/Flutter. User có thể viết test thủ công hoặc bỏ qua
  - **Frontend-only** → kiểm thử thủ công: liệt kê chức năng + kết quả kỳ vọng, user xác nhận từng mục
- Tất cả stacks: hiển thị kết quả → yêu cầu user xác nhận → tạo TEST_REPORT (Bước 7) → bug report nếu fail (Bước 8) → commit (Bước 10)
- Kiểm tra git: `git rev-parse --git-dir 2>/dev/null` → lưu `HAS_GIT` (dùng ở Bước 10)
- Đọc `.planning/CURRENT_MILESTONE.md` → version + phase + status
- Nếu status = `Hoàn tất toàn bộ` → **DỪNG**, thông báo: "Tất cả milestones đã hoàn tất. Không còn gì để test."
- Kiểm tra `.planning/milestones/[version]/phase-[phase]/PLAN.md` tồn tại:
  - KHÔNG → **DỪNG**, thông báo: "Phase [phase] chưa có plan. Chạy `/pd:plan` trước."
- Kiểm tra `.planning/milestones/[version]/phase-[phase]/TASKS.md` tồn tại:
  - KHÔNG → **DỪNG**, thông báo: "Phase [phase] chưa có tasks. Chạy `/pd:plan` trước."
- Đọc PLAN.md → thiết kế kỹ thuật, API endpoints, request/response format
- Nếu `$ARGUMENTS` chứa `--all` → đọc PLAN.md, TASKS.md, CODE_REPORT_TASK_*.md từ TẤT CẢ phase directories (`milestones/[version]/phase-*/`), không chỉ phase hiện tại. Cần context tất cả phases để debug regression. Chạy toàn bộ test suite (tất cả tasks ✅ trong mọi phase), không chỉ tasks mới.
- Nếu `$ARGUMENTS` chỉ định task → kiểm tra trạng thái task đó:
  - Task number chỉ áp dụng cho phase hiện tại trong CURRENT_MILESTONE. Nếu không tìm thấy task [N] trong phase hiện tại → tìm trong các phase khác cùng milestone. Nếu tìm thấy → thông báo: "Task [N] thuộc phase [x.x], không phải phase hiện tại [y.y]. Vẫn muốn test?"
  - ✅ → test riêng task đó
  - KHÔNG ✅ (⬜/🔄/❌/🐛) → **DỪNG**, thông báo: "Task [N] chưa hoàn tất (trạng thái: [icon]). Chỉ test được task có trạng thái ✅. Chạy `/pd:write-code [N]` trước."
    Xem @references/conventions.md → 'Biểu tượng trạng thái Task'
- Nếu không → đọc `phase-[phase]/TASKS.md` + `phase-[phase]/reports/CODE_REPORT_TASK_*.md` để lấy tất cả endpoints/features cần test
- Chỉ test tasks có trạng thái ✅
- **Nếu KHÔNG có task ✅ nào trong phase hiện tại** → kiểm tra auto-advance:
  - Quét TẤT CẢ phase directories trong `milestones/[version]/phase-*/`:
    - Tìm phases có TẤT CẢ tasks ✅ nhưng KHÔNG có TEST_REPORT.md
  - Nếu tìm thấy phase(s) chưa test → tự động chuyển sang test phase đó (phase có số lớn nhất = vừa hoàn tất):
    > "Phase hiện tại [y.y] chưa có task hoàn tất. Phát hiện phase [x.x] đã hoàn tất nhưng chưa test → chuyển sang test phase [x.x]."
    - Cập nhật biến `phase` nội bộ sang phase chưa test → tiếp tục flow bình thường
  - Nếu KHÔNG tìm thấy → **DỪNG**, thông báo: "Chưa có task hoàn tất. Chạy `/pd:write-code` trước."
- `.planning/rules/nestjs.md` chứa coding conventions cho .spec.ts (CHỈ đọc nếu file tồn tại)

---

## Bước 1.5: Kiểm tra khôi phục sau gián đoạn
Kiểm tra trên đĩa xem có dấu vết phiên trước bị gián đoạn không:

1. **TEST_REPORT.md đã tồn tại?** → `.planning/milestones/[version]/phase-[phase]/TEST_REPORT.md`
   - CÓ → thông báo: "TEST_REPORT đã tồn tại từ phiên trước (có thể bị gián đoạn trước khi commit)."
   - Hỏi user:
     > "1. GIỮ report hiện có — chỉ cần commit
     > 2. CHẠY LẠI test từ đầu"
   - Nếu "Giữ" → nhảy Bước 10 (commit)
   - Nếu "Chạy lại" → tiếp tục bình thường

2. **Test files đã tồn tại trên đĩa?** (CHỈ kiểm tra nếu không có TEST_REPORT)
   Tìm files theo stack:
   - NestJS: Glob `**/*.spec.ts` trong thư mục source — so sánh với danh sách tasks ✅
   - WordPress: Glob `**/test-*.php`
   - Solidity: Glob `**/test/*.ts` hoặc `**/test/*.t.sol`
   - Flutter: Glob `**/test/**/*_test.dart`
   - Frontend-only: không có test files tự động → bỏ qua

   Nếu tìm thấy test files CHƯA commit (kiểm tra `git status`):
   - Thông báo: "Tìm thấy [N] test files chưa commit. Có thể phiên trước bị gián đoạn sau khi viết test."
   - Hỏi user:
     > "1. GIỮ test files — chỉ chạy test (bỏ qua bước viết)
     > 2. VIẾT LẠI test từ đầu"
   - Nếu "Giữ" → nhảy Bước 5 (chạy test)
   - Nếu "Viết lại" → tiếp tục bình thường

3. **Không có dấu vết** → tiếp tục bình thường từ Bước 2

---

## Bước 2: Kiểm tra test infrastructure (theo stack)

**NestJS:**
Kiểm tra Jest config + dependencies (`@nestjs/testing`, `supertest`, `jest`).
Nếu chưa có → thông báo user cài: `npm install --save-dev @nestjs/testing supertest @types/supertest`

**WordPress:**
Kiểm tra PHPUnit + WP test suite: `composer show phpunit/phpunit 2>/dev/null` và `composer show wp-phpunit/wp-phpunit 2>/dev/null`.
Nếu chưa có → thông báo cài: `composer require --dev phpunit/phpunit wp-phpunit/wp-phpunit`.
Kiểm tra `phpunit.xml` hoặc `phpunit.xml.dist` tồn tại → nếu chưa có → tạo config cơ bản.
Sau khi cài xong → tiếp tục Bước 3.

**Solidity:**
Detect framework: Glob `**/hardhat.config.*` → Hardhat | Glob `**/foundry.toml` → Foundry.
- Hardhat: kiểm tra `@nomicfoundation/hardhat-toolbox` hoặc `chai` + `ethers` trong devDependencies.
  Nếu thiếu → thông báo: `npm install --save-dev @nomicfoundation/hardhat-toolbox`
- Foundry: kiểm tra `lib/forge-std/` tồn tại. Nếu thiếu → thông báo: `forge install foundry-rs/forge-std`
Sau khi setup xong → tiếp tục Bước 3.

**Flutter:**
Kiểm tra `dev_dependencies` trong `pubspec.yaml`: `flutter_test` (thường có sẵn) + `mocktail`.
Nếu thiếu `mocktail` → thông báo: `flutter pub add --dev mocktail`.
Kiểm tra `test/` directory tồn tại → nếu chưa → `mkdir -p test/unit test/widget`.
Sau khi setup xong → tiếp tục Bước 3.

---

## Bước 3: Đọc code để hiểu logic
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
- "Endpoint [X] làm gì? Request/response format? Validations? Error cases?"

**Lưu ý**: Ưu tiên đọc code thực tế (FastCode/Grep) để viết test dựa trên IMPLEMENTATION. Reference PLAN.md để kiểm tra compliance, nhưng KHÔNG dùng PLAN.md làm source-of-truth cho test — code thực tế có thể khác plan.

Nếu FastCode MCP lỗi khi gọi → Fallback sang Grep/Read để đọc code. Ghi warning: "FastCode MCP lỗi — dùng built-in tools. Chạy `/pd:init` kiểm tra lại sau."

---

## Bước 4: Viết test files (CHỈ NestJS flow — .spec.ts)
Đặt cạnh source file: `src/modules/users/users.controller.spec.ts`

### Cấu trúc mẫu:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('UsersController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/users', () => {
    /** Tạo người dùng mới thành công */
    it('trả về 201 khi dữ liệu hợp lệ', async () => {
      const duLieuVao = {
        email: `test_${Date.now()}@test.com`,
        name: 'Nguyễn Văn A',
        password: 'MatKhau123!',
      };
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send(duLieuVao)
        .expect(201);

      expect(response.body.email).toBe(duLieuVao.email);
      expect(response.body.password).toBeUndefined();
    });

    /** Trả lỗi khi thiếu email */
    it('trả về 400 khi thiếu trường bắt buộc', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .send({ name: 'Thiếu email' })
        .expect(400);
    });
  });
});
```

### Quy tắc viết test:
- Mỗi test case: dữ liệu đầu vào RÕ RÀNG + đầu ra kỳ vọng CỤ THỂ
- Test data dùng `Date.now()` unique tránh trùng
- Nhóm: happy path → validation → auth → edge cases
- Describe/it/comment bằng tiếng Việt có dấu
- KHÔNG mock database nếu có test database

---

## Bước 5: Chạy test
Đọc CONTEXT.md → xác định thư mục backend (Glob `**/nest-cli.json`):
```bash
cd [đường-dẫn-backend] && npm test -- --verbose --testPathPattern=[pattern] 2>&1
```
`[pattern]` xác định theo chế độ:
- **Mặc định**: regex match tên files `.spec.ts` của phase hiện tại. Chỉ chạy tests thuộc phase đang test, tránh tests cũ fail gây nhiễu.
- **`--all` (regression)**: Bỏ `--testPathPattern` hoàn toàn, chạy tất cả `.spec.ts` trong source tree. Dùng CODE_REPORT_TASK_*.md từ tất cả phases để biết danh sách spec files nếu cần filter.

Hiển thị kết quả:
```
╔═════════════════════════════════════════════════════════════════╗
║                    KẾT QUẢ KIỂM THỬ                           ║
╠═══╦═════════════════════╦════╦══════════════╦═════════════════╣
║ # ║ Test case           ║ KQ ║ Đầu vào     ║ Đầu ra          ║
╠═══╬═════════════════════╬════╬══════════════╬═════════════════╣
║ 1 ║ Tạo user thành công ║ ✅ ║ email,name   ║ 201 + user obj  ║
║ 2 ║ Thiếu email         ║ ✅ ║ {name only}  ║ 400 + error msg ║
║ 3 ║ Email trùng         ║ ❌ ║ same email x2║ Expect 409→500  ║
╚═══╩═════════════════════╩════╩══════════════╩═════════════════╝
Tổng: X/Y đạt
```

---

## Bước 6: Yêu cầu user xác nhận database + giao diện (nếu có)
> **Vui lòng kiểm tra thêm:**
> 1. Database: [bảng/collection nào cần kiểm tra, dữ liệu kỳ vọng]
> 2. API responses: [endpoint nào cần test thủ công, dữ liệu kỳ vọng]
> 3. Giao diện: [CHỈ nếu CONTEXT.md có Frontend — hướng dẫn test UI cụ thể]
> 4. Tất cả đã đúng? (y/n) - Nếu có lỗi, cho biết số thứ tự.

Nếu project KHÔNG có Frontend → bỏ phần giao diện, chỉ hỏi database + API.
Cho phép xác nhận batch.

---

## Bước 7: TEST_REPORT.md
Viết `.planning/milestones/[version]/phase-[phase]/TEST_REPORT.md`:

```markdown
# Báo cáo kiểm thử
> Ngày: [DD_MM_YYYY HH:MM]
> Milestone: [tên] (v[x.x])
> Tổng: [X] tests | ✅ [Y] đạt | ❌ [Z] lỗi

## Kết quả [Jest|PHPUnit|Hardhat|Foundry|FlutterTest|Kiểm thử thủ công]
| Test case | Đầu vào | Kỳ vọng | Thực tế | KQ |

## Xác nhận giao diện (Frontend — bỏ nếu không có)
| Chức năng | Kết quả | Ghi chú |

## Xác nhận dữ liệu (Database/On-chain state — bỏ nếu không có)
| Bảng/Collection/Contract | Kết quả | Ghi chú |
```

---

## Bước 8: Bug Report (nếu có lỗi)
Tạo `.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md` với header tối thiểu:

Xem @references/conventions.md → 'Patch version' cho quy tắc xác định patch version

```markdown
# Báo cáo lỗi (từ kiểm thử)
> Ngày: [DD_MM_YYYY HH:MM:SS] | Mức độ: [Nghiêm trọng/Cao/Trung bình/Nhẹ — theo ảnh hưởng]
> Trạng thái: Chưa xử lý | Chức năng: [Tên] | Task: [N]
> Patch version: [x.x.x] | Lần sửa: 0
> Format header PHẢI khớp fix-bug.md: `Trạng thái | Chức năng | Task` cùng dòng, `Patch version | Lần sửa` cùng dòng — để fix-bug Grep parse được.
> Patch version LUÔN 3 số (x.y.z) theo convention general.md. Xác định version dựa trên TASKS.md chứa task fail (từ path `milestones/[version]/phase-*/TASKS.md`), KHÔNG mặc định lấy CURRENT_MILESTONE (vì milestone có thể đã advance). Nếu bug thuộc version đó → `[version].0` (VD: `1.0.0`). Nếu tìm thấy patch version trước → increment (VD: `1.0.1` → `1.0.2`).

## Mô tả lỗi
Test case: [tên test] | Đầu vào: [...] | Kỳ vọng: [...] | Thực tế: [...]

## Tham chiếu
> TEST_REPORT: .planning/milestones/[version]/phase-[phase]/TEST_REPORT.md
> Test framework: [Jest|PHPUnit|Hardhat|Foundry|FlutterTest]
```
Header PHẢI có `Trạng thái` + `Patch version` để complete-milestone filter được.
Mục "Tham chiếu" giúp `/pd:fix-bug` đọc TEST_REPORT trực tiếp thay vì điều tra lại từ đầu.

---

## Bước 9: Cập nhật TASKS.md

Xem @references/conventions.md → 'Biểu tượng trạng thái Task'

- Pass hết → giữ ✅
- Có test fail → CHỈ đổi 🐛 cho task cụ thể có test fail (giữ ✅ cho tasks có test pass). Cập nhật CẢ HAI nơi: (1) bảng Tổng quan (cột Trạng thái), (2) task detail block `> Trạng thái:`. Đề xuất `/pd:fix-bug`
- Nếu test fail có thể do shared code (service dùng chung giữa nhiều tasks) → ghi trong BUG report: `> Suspected root cause: Task [M] (shared service [name])`. Đổi 🐛 cho task có test fail, ghi chú suspected tasks.

---

## Bước 10: Git commit (CHỈ nếu HAS_GIT = true, xem Bước 1)
```
git add [test files — *.spec.ts (NestJS) | test-*.php (WordPress) | test/*.ts hoặc test/*.t.sol (Solidity) | test/**/*_test.dart (Flutter)]
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/milestones/[version]/phase-[phase]/TEST_REPORT.md
# Nếu có bug report từ Bước 8:
git add .planning/bugs/BUG_[timestamp].md
git commit -m "[KIỂM THỬ] Thêm kiểm thử cho [module]

Kiểm thử bao gồm:
- [test case 1]: đầu vào [...] → kỳ vọng [...]
- [test case 2]: đầu vào [...] → kỳ vọng [...]
Kết quả: X/Y đạt"
```

</process>

<rules>
- Tuân thủ quy tắc trong `.planning/rules/` (ngôn ngữ, ngày tháng, bảo mật)
- PHẢI viết test files commit vào repo — NestJS: `.spec.ts` (Jest + Supertest), WordPress: `test-*.php` (PHPUnit), Solidity: `test/*.ts` (Hardhat) hoặc `test/*.t.sol` (Foundry), Flutter: `test/**/*_test.dart` (flutter_test + mocktail) — KHÔNG chỉ chạy CURL
- Mỗi test case PHẢI có đầu vào CỤ THỂ + đầu ra kỳ vọng RÕ RÀNG
- PHẢI yêu cầu user xác nhận giao diện + database (mắt người đánh giá)
- PHẢI đọc PLAN.md trước khi viết test
- Token trong test report rút gọn (eyJhb...xxx)
- Nếu FastCode MCP lỗi → fallback Grep/Read, ghi warning gợi ý `/pd:init`

**Quy tắc khôi phục (gián đoạn):**
- PHẢI kiểm tra TEST_REPORT + test files trên đĩa trước khi bắt đầu — phát hiện phiên bị gián đoạn
- Nếu TEST_REPORT đã tồn tại → hỏi user muốn giữ (chỉ commit) hay chạy lại
- Nếu test files đã tồn tại nhưng chưa commit → hỏi user muốn giữ (chỉ chạy test) hay viết lại
- KHÔNG bao giờ ghi đè test files/report mà không hỏi user trước
</rules>
