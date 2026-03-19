---
name: pd:test
description: Viết test files, chạy kiểm thử (NestJS/WordPress/Solidity/Flutter), xác nhận với user, báo cáo lỗi
---

<objective>
Viết test files cho project (Jest + Supertest cho NestJS, PHPUnit cho WordPress, Hardhat/Foundry cho Solidity, flutter_test + mocktail cho Flutter). Test với dữ liệu đầu vào cụ thể, kiểm tra đầu ra đúng logic. Chạy test, yêu cầu user xác nhận giao diện/database, commit test files.
</objective>

<context>
User input: $ARGUMENTS

Đọc:
- `.planning/CONTEXT.md` → tech stack, database type
- `.planning/rules/general.md` → quy tắc chung
- `.planning/rules/nestjs.md` → quy tắc NestJS + Build & Lint (CHỈ nếu file tồn tại)
- `.planning/rules/wordpress.md` → quy tắc WordPress + Build & Lint (CHỈ nếu file tồn tại, đọc khi WordPress flow)
- `.planning/rules/solidity.md` → quy tắc Solidity + Build & Lint (CHỈ nếu file tồn tại, đọc khi Solidity flow)
- `.planning/rules/flutter.md` → quy tắc Flutter + Build & Lint (CHỈ nếu file tồn tại, đọc khi Flutter flow)

Nếu chưa có CONTEXT.md → thông báo chạy `/pd:init` trước.
</context>

<process>

## Bước 1: Xác định scope + đọc context
- Đọc `.planning/CONTEXT.md` → Tech Stack → kiểm tra project có Backend không
- Xác định backend framework từ CONTEXT.md.
- **Nếu NestJS** → tiếp tục flow Jest + Supertest bên dưới (giữ nguyên)
- **Nếu WordPress** → chuyển sang flow PHPUnit + WP_UnitTestCase:
  1. Kiểm tra PHPUnit + WordPress test suite đã cài (`composer require --dev phpunit/phpunit wp-phpunit/wp-phpunit`)
  2. Đọc `.planning/docs/wordpress/testing.md` (nếu có) để lấy patterns WP_UnitTestCase
  3. Viết test files `tests/test-*.php` (class extends `WP_UnitTestCase`)
  4. Dùng factory methods: `$this->factory()->post->create()`, `$this->factory()->user->create()`
  5. Chạy: `./vendor/bin/phpunit --verbose` hoặc `composer test`
  6. Hiển thị kết quả (bảng tương tự Bước 5 NestJS) → yêu cầu user xác nhận database + API (tương tự Bước 6)
  7. Phần còn lại (report, bug, commit) — nhảy thẳng Bước 7 (TEST_REPORT) bên dưới
- **Nếu Solidity** → chuyển sang flow Hardhat/Foundry test:
  1. Detect framework: Glob `**/hardhat.config.*` → Hardhat | Glob `**/foundry.toml` → Foundry
  2. Đọc `.planning/docs/solidity/audit-checklist.md` (nếu có) để lấy security checklist
  3. **Hardhat flow**: Viết test files `test/*.ts` hoặc `test/*.js` (dùng ethers.js + chai)
     - Import: `import { ethers } from "hardhat"`, `import { expect } from "chai"`
     - Pattern: `describe("ContractName", () => { ... })` — deploy contract trong `beforeEach`
     - Test: deploy, function calls, revert cases, event emission, access control
     - Chạy: `npx hardhat test --verbose`
  4. **Foundry flow**: Viết test files `test/*.t.sol` (contract extends `Test` từ forge-std)
     - Import: `import "forge-std/Test.sol"`
     - Pattern: `contract MyContractTest is Test { ... }` — deploy trong `setUp()`
     - Test functions prefix `test` (pass) hoặc `testFail` (expect revert)
     - Chạy: `forge test -vvv`
  5. **Test bắt buộc cho mọi Solidity contract**:
     - Deploy + constructor args
     - Core function happy path
     - Access control (onlyOwner revert khi non-owner gọi)
     - Input validation (require revert messages)
     - Reentrancy guard (nếu có nonReentrant)
     - Pause/unpause behavior
     - clearUnknownToken function
     - rescueETH function (nếu contract có receive() hoặc nhận ETH)
     - Event emission (verify đúng event + đúng params sau mỗi state change)
     - Signature verification (nếu có): valid signature, expired deadline, wrong signer, hash replay, wrong msg.sender
  6. Hiển thị kết quả (bảng tương tự Bước 5 NestJS) → yêu cầu user xác nhận on-chain state (tương tự Bước 6)
  7. Phần còn lại (report, bug, commit) — nhảy thẳng Bước 7 (TEST_REPORT) bên dưới
- **Nếu Flutter** → chuyển sang flow flutter_test + mocktail:
  1. Kiểm tra `flutter_test` + `mocktail` đã có trong `dev_dependencies` (`pubspec.yaml`)
  2. Đọc `.planning/docs/flutter/testing.md` (nếu có) để lấy test patterns (unit, widget, integration)
  3. Viết test files:
     - Unit tests: `test/unit/[feature]/[feature]_logic_test.dart` — test Logic/Repository
     - Widget tests: `test/widget/[feature]/[feature]_view_test.dart` — test View rendering
  4. Chạy: `flutter test --verbose`
  5. **Test bắt buộc**:
     - Logic: fetch data success + error handling
     - Logic: reactive state updates (.obs values change correctly)
     - Logic: onClose() disposes resources
     - Widget: hiển thị loading state
     - Widget: hiển thị data list
     - Widget: tap actions gọi đúng logic method
     - Form: validation rules
  6. Hiển thị kết quả (bảng tương tự Bước 5 NestJS) → yêu cầu user xác nhận
  7. Phần còn lại (report, bug, commit) — nhảy thẳng Bước 7 (TEST_REPORT) bên dưới
- **Nếu framework khác** (Express, Fastify, v.v.) → thông báo: "Hiện `/pd:test` chỉ hỗ trợ tự động hóa test cho NestJS, WordPress, Solidity, và Flutter. Project của bạn dùng [X]. Bạn có thể:
  1. Viết test thủ công (tạo file test theo pattern chuẩn của framework)
  2. Bỏ qua automated test cho phase này"
- **Frontend-only projects** → tạo checklist kiểm thử thủ công từ PLAN.md: liệt kê pages, components, user flows cần verify. DỪNG flow test tự động.
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
- Nếu không → đọc `phase-[phase]/TASKS.md` + `phase-[phase]/reports/CODE_REPORT_TASK_*.md` để lấy tất cả endpoints/features cần test
- Chỉ test tasks có trạng thái ✅
- **Nếu KHÔNG có task ✅ nào** → **DỪNG**, thông báo: "Chưa có task hoàn tất. Chạy `/pd:write-code` trước."
- `.planning/rules/nestjs.md` chứa coding conventions cho .spec.ts (CHỈ đọc nếu file tồn tại)

## Bước 2: Kiểm tra test infrastructure (CHỈ NestJS flow)
Kiểm tra Jest config + dependencies (`@nestjs/testing`, `supertest`, `jest`).
Nếu chưa có → thông báo user cài: `npm install --save-dev @nestjs/testing supertest @types/supertest`

## Bước 3: Đọc code để hiểu logic
Dùng `mcp__fastcode__code_qa` (repos: đường dẫn dự án từ CONTEXT.md):
- "Endpoint [X] làm gì? Request/response format? Validations? Error cases?"

**Lưu ý**: Ưu tiên đọc code thực tế (FastCode/Grep) để viết test dựa trên IMPLEMENTATION. Reference PLAN.md để kiểm tra compliance, nhưng KHÔNG dùng PLAN.md làm source-of-truth cho test — code thực tế có thể khác plan.

Nếu FastCode MCP lỗi khi gọi → Fallback sang Grep/Read để đọc code. Ghi warning: "FastCode MCP lỗi — dùng built-in tools. Chạy `/pd:init` kiểm tra lại sau."

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

## Bước 6: Yêu cầu user xác nhận database + giao diện (nếu có)
> **Vui lòng kiểm tra thêm:**
> 1. Database: [bảng/collection nào cần kiểm tra, dữ liệu kỳ vọng]
> 2. API responses: [endpoint nào cần test thủ công, dữ liệu kỳ vọng]
> 3. Giao diện: [CHỈ nếu CONTEXT.md có Frontend — hướng dẫn test UI cụ thể]
> 4. Tất cả đã đúng? (y/n) - Nếu có lỗi, cho biết số thứ tự.

Nếu project KHÔNG có Frontend → bỏ phần giao diện, chỉ hỏi database + API.
Cho phép xác nhận batch.

## Bước 7: TEST_REPORT.md
Viết `.planning/milestones/[version]/phase-[phase]/TEST_REPORT.md`:

```markdown
# Báo cáo kiểm thử
> Ngày: [DD_MM_YYYY HH:MM]
> Milestone: [tên] (v[x.x])
> Tổng: [X] tests | ✅ [Y] đạt | ❌ [Z] lỗi

## Kết quả tự động ([Jest|PHPUnit|Hardhat|Foundry|FlutterTest])
| Test case | Đầu vào | Kỳ vọng | Thực tế | KQ |

## Xác nhận giao diện (Frontend — bỏ nếu không có)
| Chức năng | Kết quả | Ghi chú |

## Xác nhận dữ liệu (Database/On-chain state — bỏ nếu không có)
| Bảng/Collection/Contract | Kết quả | Ghi chú |
```

## Bước 8: Bug Report (nếu có lỗi)
Tạo `.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md` với header tối thiểu:
```markdown
# Báo cáo lỗi (từ kiểm thử)
> Ngày: [DD_MM_YYYY HH:MM:SS] | Mức độ: [Nghiêm trọng/Cao/Trung bình/Nhẹ — theo ảnh hưởng]
> Trạng thái: Chưa xử lý | Chức năng: [Tên] | Task: [N]
> Patch version: [x.x.x] | Lần sửa: 0
> Format header PHẢI khớp fix-bug.md: `Trạng thái | Chức năng | Task` cùng dòng, `Patch version | Lần sửa` cùng dòng — để fix-bug Grep parse được.
> Patch version LUÔN 3 số (x.y.z) theo convention general.md. Xác định version dựa trên TASKS.md chứa task fail (từ path `milestones/[version]/phase-*/TASKS.md`), KHÔNG mặc định lấy CURRENT_MILESTONE (vì milestone có thể đã advance). Nếu bug thuộc version đó → `[version].0` (VD: `1.0.0`). Nếu tìm thấy patch version trước → increment (VD: `1.0.1` → `1.0.2`).

## Mô tả lỗi
Test case: [tên test] | Đầu vào: [...] | Kỳ vọng: [...] | Thực tế: [...]
```
Header PHẢI có `Trạng thái` + `Patch version` để complete-milestone filter được.

## Bước 9: Cập nhật TASKS.md
- Pass hết → giữ ✅
- Có test fail → CHỈ đổi 🐛 cho task cụ thể có test fail (giữ ✅ cho tasks có test pass). Cập nhật CẢ HAI nơi: (1) bảng Tổng quan (cột Trạng thái), (2) task detail block `> Trạng thái:`. Đề xuất `/pd:fix-bug`
- Nếu test fail có thể do shared code (service dùng chung giữa nhiều tasks) → ghi trong BUG report: `> Suspected root cause: Task [M] (shared service [name])`. Đổi 🐛 cho task có test fail, ghi chú suspected tasks.

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
</rules>
