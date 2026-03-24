<purpose>
Viết + chạy test files theo stack (Jest+Supertest/PHPUnit/Hardhat|Foundry/flutter_test+mocktail). Hiển thị kết quả, user xác nhận, tạo TEST_REPORT, bug report nếu fail, commit.
</purpose>

<required_reading>
- @references/conventions.md → biểu tượng trạng thái, commit prefixes, patch version
</required_reading>

<conditional_reading>
Đọc KHI cần:
- @references/context7-pipeline.md — KHI test dùng thư viện bên thứ ba
- @references/security-checklist.md — KHI test liên quan xác thực, mã hóa
</conditional_reading>

<process>

## Bước 1: Xác định scope + đọc context
- Đọc `.planning/CONTEXT.md` → Tech Stack → xác định test framework:

| Stack | Framework | Vị trí test | Lệnh chạy |
|-------|-----------|-------------|------------|
| NestJS | Jest + Supertest | cạnh source `*.spec.ts` | `npm test` |
| WordPress | PHPUnit + WP_UnitTestCase | `tests/test-*.php` | `composer test` |
| Solidity | Hardhat `npx hardhat test` / Foundry `forge test -vvv` | `test/*.ts` / `test/*.t.sol` | đọc `.planning/docs/solidity/audit-checklist.md` |
| Flutter | flutter_test + mocktail | `test/unit/`, `test/widget/` | `flutter test` |
| Framework khác | — | — | thông báo hỗ trợ NestJS/WP/Solidity/Flutter |
| Frontend-only | kiểm thử thủ công | — | liệt kê chức năng + kỳ vọng, user xác nhận |

- Mọi stack: hiển thị kết quả → user xác nhận → TEST_REPORT (Bước 7) → bug report nếu fail (Bước 8) → commit (Bước 10)
- `git rev-parse --git-dir 2>/dev/null` → lưu `HAS_GIT`
- Đọc `.planning/CURRENT_MILESTONE.md` → version + phase + status
- status = `Hoàn tất toàn bộ` → **DỪNG**: "Tất cả milestones đã hoàn tất."
- `.planning/milestones/[version]/phase-[phase]/PLAN.md` → không có → **DỪNG**: "Chưa có plan. Chạy `/pd:plan`."
- `.planning/milestones/[version]/phase-[phase]/TASKS.md` → không có → **DỪNG**: "Chưa có tasks. Chạy `/pd:plan`."
- Đọc PLAN.md → thiết kế kỹ thuật, API endpoints, request/response format
- `$ARGUMENTS` chứa `--all` → đọc PLAN.md, TASKS.md, CODE_REPORT_TASK_*.md từ TẤT CẢ phases (`milestones/[version]/phase-*/`). Chạy toàn bộ test suite (mọi tasks ✅), không chỉ phase hiện tại.
- `$ARGUMENTS` chỉ định task → kiểm tra trạng thái:
  - Task number áp dụng cho phase hiện tại. Không tìm thấy → tìm các phase khác cùng milestone → thông báo: "Task [N] thuộc phase [x.x], không phải phase hiện tại."
  - ✅ → test riêng task đó
  - KHÔNG ✅ → **DỪNG**: "Task [N] chưa hoàn tất (trạng thái: [icon]). Chạy `/pd:write-code [N]`."
    Xem @references/conventions.md → 'Biểu tượng trạng thái Task'
- Không chỉ định → đọc `phase-[phase]/TASKS.md` + `phase-[phase]/reports/CODE_REPORT_TASK_*.md` → lấy endpoints/features cần test
- Chỉ test tasks ✅

**Effort routing cho test:**
Test mirrors effort của task đang test:
- Đọc `Effort:` từ task metadata trong TASKS.md
- Thiếu trường Effort → mặc định `standard` (sonnet)
- Thông báo: "Spawning {model} agent cho test ({effort})..."

- **KHÔNG có task ✅ nào** → kiểm tra auto-advance:
  - Quét TẤT CẢ `milestones/[version]/phase-*/` → tìm phases có TẤT CẢ tasks ✅ nhưng KHÔNG có TEST_REPORT.md
  - Tìm thấy → chuyển sang test phase đó (số lớn nhất): "Phase [y.y] chưa có task hoàn tất. Phase [x.x] đã hoàn tất chưa test → chuyển sang test phase [x.x]."
  - Không tìm thấy → **DỪNG**: "Chưa có task hoàn tất. Chạy `/pd:write-code`."
- `.planning/rules/nestjs.md` → đọc conventions cho .spec.ts (CHỈ nếu file tồn tại)

---

## Bước 1.5: Kiểm tra khôi phục sau gián đoạn

1. **TEST_REPORT.md đã tồn tại?** → `.planning/milestones/[version]/phase-[phase]/TEST_REPORT.md`
   - CÓ → "TEST_REPORT đã tồn tại (có thể bị gián đoạn trước commit)."
   - Hỏi: "1. GIỮ report — chỉ commit | 2. CHẠY LẠI từ đầu"
   - Giữ → nhảy Bước 10 | Chạy lại → tiếp tục

2. **Test files đã tồn tại?** (CHỈ kiểm tra khi không có TEST_REPORT)
   Glob theo stack: NestJS `**/*.spec.ts` | WP `**/test-*.php` | Solidity `**/test/*.ts` hoặc `**/test/*.t.sol` | Flutter `**/test/**/*_test.dart` | Frontend-only → bỏ qua

   Tìm thấy test files CHƯA commit (`git status`):
   - "Tìm thấy [N] test files chưa commit."
   - Hỏi: "1. GIỮ — chỉ chạy test (bỏ qua viết) | 2. VIẾT LẠI từ đầu"
   - Giữ → nhảy Bước 5 | Viết lại → tiếp tục

3. **Không có dấu vết** → tiếp tục Bước 2

---

## Bước 2: Kiểm tra test infrastructure

| Stack | Kiểm tra | Cài nếu thiếu |
|-------|----------|----------------|
| NestJS | Jest config + `@nestjs/testing`, `supertest`, `jest` | `npm install --save-dev @nestjs/testing supertest @types/supertest` |
| WordPress | PHPUnit + WP test suite | `composer require --dev phpunit/phpunit wp-phpunit/wp-phpunit` + tạo `phpunit.xml` nếu thiếu |
| Solidity/Hardhat | `@nomicfoundation/hardhat-toolbox` hoặc `chai`+`ethers` | `npm install --save-dev @nomicfoundation/hardhat-toolbox` |
| Solidity/Foundry | `lib/forge-std/` | `forge install foundry-rs/forge-std` |
| Flutter | `flutter_test` + `mocktail` trong `dev_dependencies` | `flutter pub add --dev mocktail` + `mkdir -p test/unit test/widget` |

---

## Bước 3: Đọc code để hiểu logic
`mcp__fastcode__code_qa` (repos: đường dẫn từ CONTEXT.md):
- "Endpoint [X] làm gì? Request/response format? Validations? Error cases?"
- Ưu tiên đọc code thực tế (FastCode/Grep) — PLAN.md chỉ để kiểm tra compliance, KHÔNG phải source-of-truth cho test.
- FastCode lỗi → Grep/Read. Cảnh báo: "FastCode lỗi — chạy `/pd:init`."

**Context7** (thư viện bên thứ ba): @references/context7-pipeline.md

---

## Bước 4: Viết test files (NestJS — .spec.ts)
Đặt cạnh source: `src/modules/users/users.controller.spec.ts`

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
  afterAll(async () => { await app.close(); });

  describe('POST /api/users', () => {
    it('trả về 201 khi dữ liệu hợp lệ', async () => {
      const duLieuVao = { email: `test_${Date.now()}@test.com`, name: 'Nguyễn Văn A', password: 'MatKhau123!' };
      const response = await request(app.getHttpServer()).post('/api/users').send(duLieuVao).expect(201);
      expect(response.body.email).toBe(duLieuVao.email);
      expect(response.body.password).toBeUndefined();
    });
    it('trả về 400 khi thiếu trường bắt buộc', async () => {
      await request(app.getHttpServer()).post('/api/users').send({ name: 'Thiếu email' }).expect(400);
    });
  });
});
```

Quy tắc: mỗi test case có đầu vào RÕ RÀNG + đầu ra CỤ THỂ. Test data dùng `Date.now()` unique. Nhóm: happy path → validation → auth → edge cases. Describe/it/comment tiếng Việt có dấu. KHÔNG mock database nếu có test database.

---

## Bước 5: Chạy test
Đọc CONTEXT.md → thư mục backend (Glob `**/nest-cli.json`):
```bash
cd [đường-dẫn-backend] && npm test -- --verbose --testPathPattern=[pattern] 2>&1
```
- Mặc định: regex match `.spec.ts` của phase hiện tại
- `--all` (regression): bỏ `--testPathPattern`, chạy tất cả `.spec.ts`

Hiển thị bảng kết quả:
```
╔═══╦═════════════════════╦════╦══════════════╦═════════════════╗
║ # ║ Test case           ║ KQ ║ Đầu vào     ║ Đầu ra          ║
╠═══╬═════════════════════╬════╬══════════════╬═════════════════╣
║ 1 ║ Tạo user thành công ║ ✅ ║ email,name   ║ 201 + user obj  ║
╚═══╩═════════════════════╩════╩══════════════╩═════════════════╝
Tổng: X/Y đạt
```

---

## Bước 6: User xác nhận database + giao diện
> 1. Database: [bảng cần kiểm tra, dữ liệu kỳ vọng]
> 2. API responses: [endpoint test thủ công, dữ liệu kỳ vọng]
> 3. Giao diện: [CHỈ nếu CONTEXT.md có Frontend]
> 4. Tất cả đã đúng? (y/n)

Không có Frontend → bỏ phần giao diện. Cho phép xác nhận batch.

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

## Xác nhận giao diện (bỏ nếu không có Frontend)
| Chức năng | Kết quả | Ghi chú |

## Xác nhận dữ liệu (bỏ nếu không có Database/On-chain)
| Bảng/Collection/Contract | Kết quả | Ghi chú |
```

---

## Bước 8: Bug Report (nếu có lỗi)
Tạo `.planning/bugs/BUG_[DD_MM_YYYY_HH_MM_SS].md`:

Xem @references/conventions.md → 'Patch version'

```markdown
# Báo cáo lỗi (từ kiểm thử)
> Ngày: [DD_MM_YYYY HH:MM:SS] | Mức độ: [Nghiêm trọng/Cao/Trung bình/Nhẹ]
> Trạng thái: Chưa xử lý | Chức năng: [Tên] | Task: [N]
> Patch version: [x.x.x] | Lần sửa: 0
> Format header PHẢI khớp fix-bug.md: `Trạng thái | Chức năng | Task` cùng dòng, `Patch version | Lần sửa` cùng dòng.
> Patch version LUÔN 3 số (x.y.z). Xác định version từ TASKS.md chứa task fail (`milestones/[version]/phase-*/TASKS.md`), KHÔNG mặc định CURRENT_MILESTONE. Bug thuộc version → `[version].0`. Patch version trước → increment.

## Mô tả lỗi
Test case: [tên] | Đầu vào: [...] | Kỳ vọng: [...] | Thực tế: [...]

## Tham chiếu
> TEST_REPORT: .planning/milestones/[version]/phase-[phase]/TEST_REPORT.md
> Test framework: [Jest|PHPUnit|Hardhat|Foundry|FlutterTest]
```
Header PHẢI có `Trạng thái` + `Patch version` để complete-milestone filter được.

---

## Bước 9: Cập nhật TASKS.md
Xem @references/conventions.md → 'Biểu tượng trạng thái Task'
- Pass hết → giữ ✅
- Có test fail → đổi 🐛 CHỈ cho task có test fail (giữ ✅ cho tasks pass). Cập nhật CẢ HAI: (1) bảng Tổng quan, (2) task detail `> Trạng thái:`. Đề xuất `/pd:fix-bug`
- Test fail do shared code → ghi BUG report: `> Suspected root cause: Task [M] (shared service [name])`. Đổi 🐛 cho task có test fail, ghi chú suspected tasks.

---

## Bước 10: Git commit (CHỈ nếu HAS_GIT = true)
```
git add [test files — *.spec.ts | test-*.php | test/*.ts hoặc test/*.t.sol | test/**/*_test.dart]
git add .planning/milestones/[version]/phase-[phase]/TASKS.md
git add .planning/milestones/[version]/phase-[phase]/TEST_REPORT.md
# Nếu có bug report:
git add .planning/bugs/BUG_[timestamp].md
git commit -m "[KIỂM THỬ] Thêm kiểm thử cho [module]

Kiểm thử bao gồm:
- [test case 1]: đầu vào [...] → kỳ vọng [...]
Kết quả: X/Y đạt"
```

</process>

<rules>
- Tuân thủ `.planning/rules/` (chung + theo stack).
- PHẢI viết test files vào repo — NestJS `.spec.ts`, WP `test-*.php`, Solidity `test/*.ts`/`test/*.t.sol`, Flutter `test/**/*_test.dart`. KHÔNG chỉ CURL.
- Mỗi test case PHẢI có đầu vào CỤ THỂ + đầu ra kỳ vọng RÕ RÀNG.
- PHẢI yêu cầu người dùng xác nhận giao diện + database.
- PHẢI đọc PLAN.md trước khi viết test.
- Token trong test report rút gọn (eyJhb...xxx).
- FastCode lỗi → Grep/Read, KHÔNG DỪNG.
- PHẢI kiểm tra TEST_REPORT + test files trên đĩa trước khi bắt đầu — phát hiện phiên gián đoạn.
- TEST_REPORT đã tồn tại → hỏi người dùng giữ hay chạy lại.
- Test files chưa commit → hỏi người dùng giữ hay viết lại.
- KHÔNG ghi đè test files/report mà không hỏi người dùng.
</rules>