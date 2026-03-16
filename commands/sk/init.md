---
name: sk:init
description: Khởi tạo môi trường làm việc, kiểm tra MCP FastCode, tạo context gọn cho các skill sau
---

<objective>
Skill đầu tiên phải chạy trước mọi skill khác. Kiểm tra FastCode MCP (BẮT BUỘC kết nối thành công), index project, load coding style, tạo CONTEXT.md gọn nhẹ tối ưu token cho các skill sau.
</objective>

<context>
User input: $ARGUMENTS (path dự án, mặc định thư mục hiện tại)
</context>

<process>

## Bước 1: Xác định đường dẫn dự án
- Nếu `$ARGUMENTS` có path → dùng path đó
- Nếu không → dùng thư mục hiện tại
- Ghi nhận absolute path

## Bước 2: Kiểm tra FastCode MCP (BẮT BUỘC)
Gọi `mcp__fastcode__list_indexed_repos` để kiểm tra MCP server:

- **THÀNH CÔNG** → ghi nhận "FastCode MCP: Hoạt động", tiếp tục
- **THẤT BẠI** → **DỪNG NGAY**, thông báo:
  > "FastCode MCP không hoạt động. Không thể tiếp tục.
  > Kiểm tra:
  > 1. Đã chạy `install.sh` chưa?
  > 2. API key Gemini đã điền trong `FastCode/.env` chưa?
  > 3. Đã khởi động lại Claude Code sau khi cài chưa?
  > Chạy lại `/sk:init` sau khi khắc phục."

## Bước 3: Index dự án trong FastCode
Gọi `mcp__fastcode__code_qa`:
- repos: [đường dẫn absolute của project]
- question: "Liệt kê tất cả modules, tech stack, database type đang dùng."

Mục đích: pre-warm index để các skill sau gọi nhanh hơn.

## Bước 4: Phát hiện tech stack
Dùng built-in tools (Glob, Grep, Read) quét nhanh:
- Glob `**/*.module.ts` → Grep `MongooseModule|TypeOrmModule|PrismaService` → xác định DB type
- Glob `nest-cli.json` → NestJS
- Glob `next.config.*` → NextJS

Đọc nhanh:
- `package.json` → tên dự án, dependencies chính (chỉ tên + version, bỏ devDeps)
- `.planning/CURRENT_MILESTONE.md` (nếu có, từ session trước)
- `.planning/ROADMAP.md` (nếu có, chỉ lấy milestone hiện tại)

## Bước 5: Tạo CONTEXT.md
Tạo `.planning/CONTEXT.md` - file NHỎ GỌN chứa TẤT CẢ context cần thiết:

```markdown
# Context dự án
> Khởi tạo: [DD_MM_YYYY HH:MM]
> Đường dẫn: [absolute path]
> FastCode MCP: Hoạt động

## Tech Stack
- Backend: NestJS
- Frontend: NextJS (App Router)
- Database: MongoDB | TypeORM (MySQL) | Prisma
- Auth: JWT

## Thư viện chính
| Tên | Phiên bản |
|-----|-----------|
(chỉ dependencies chính, bỏ devDeps, tối đa 20 dòng)

## Quy tắc code
### Chung
- No semicolons, 4 spaces, single quotes
- Import: @/ cross-module, ./ cùng module
- File: kebab-case + hậu tố (create-user.dto.ts) | Class: PascalCase
- Giới hạn: mục tiêu 300 dòng, BẮT BUỘC tách >500

### Controller
- CHỈ delegate, KHÔNG business logic
- Decorator stack: JSDoc → @Post → @HttpCode → @UseGuards → @Group/@Role
- @Req() req: any để lấy req.user

### Service
- private readonly logger = new Logger(XxxService.name)
- Async + try/catch: re-throw NestJS exceptions, wrap unknown → message tiếng Việt
- Config: this.configService.get('KEY'), KHÔNG hardcode

### DTO
- @ApiProperty({ description: 'tiếng Việt', example: '...' }) BẮT BUỘC
- Create: required | Update: optional trừ id | Query: page/limit/search/sortBy/sortOrder | Detail: id
- Validation decorators mỗi dòng 1 cái, barrel export qua dto/index.ts nếu nhiều DTOs

### Entity
- MongoDB: @Schema({ versionKey:false, timestamps:true }) + snake_case + prefix m + mongoose-paginate-v2
- TypeORM: camelCase + suffix Repo + @Column({ comment:'tiếng Việt' }) + @DeleteDateColumn() soft delete
- Prisma: @@map("tên_bảng") + @@index + camelCase

### Enum
- File: enums/tên-enum.enum.ts | Values: STRING UPPER_SNAKE_CASE

### Response & Error
- Phân trang: { docs, page, limit, totalDocs, totalPages }
- Query lỗi: return { docs:[], page, limit, totalPages:1 }
- Mutate lỗi: throw NestJS exception tiếng Việt

### Bảo mật code
- Password: bcrypt(10), strip khỏi response
- Sort: whitelist allowedSortFields chống injection
- Soft delete: @DeleteDateColumn() thay vì xóa thật

## Quy tắc chung
- Ngôn ngữ: TIẾNG VIỆT CÓ DẤU (báo cáo, JSDoc, logger, commit, test descriptions)
- Ngoại lệ: tên biến, function, class, file → tiếng Anh
- Ngày tháng: DD_MM_YYYY
- Icon: ⬜ Chưa bắt đầu | 🔄 Đang thực hiện | ✅ Hoàn tất | ❌ Bị chặn | 🐛 Có lỗi
- Version: số thuần trong path (1.0), prefix v hiển thị (v1.0)
- Commit: [TASK-N], [KIỂM THỬ], [LỖI], [PHIÊN BẢN] - tiếng Việt có dấu
- BẢO MẬT: CẤM đọc/ghi/hiển thị nội dung: `.env`, `.env.*` (trừ `.env.example`), `credentials.*`, `*.pem`, `*.key`, `*secret*` — chỉ ghi TÊN biến, KHÔNG ghi giá trị

## Milestone hiện tại
(nếu có từ session trước)
- Version: [x.x]
- Phase: [x.x]
- Trạng thái: [...]
```

**CONTEXT.md phải DƯỚI 100 dòng** - file duy nhất chứa toàn bộ context, các skill sau chỉ cần đọc file này.

## Bước 6: Tạo .planning/ structure
```bash
mkdir -p .planning/scan .planning/docs .planning/bugs
```

## Bước 7: Thông báo kết quả
```
╔══════════════════════════════════════╗
║     Khởi tạo hoàn tất!              ║
╠══════════════════════════════════════╣
║ Dự án: [tên]                        ║
║ Tech:  NestJS + NextJS + [DB]       ║
║ MCP:   ✅ Hoạt động                 ║
║ Context: .planning/CONTEXT.md       ║
╠══════════════════════════════════════╣
║ Tiếp theo:                          ║
║   /sk:scan   → Quét chi tiết        ║
║   /sk:roadmap → Lập lộ trình        ║
╚══════════════════════════════════════╝
```
</process>

<rules>
- CONTEXT.md phải DƯỚI 100 dòng - chứa đầy đủ coding style, không cần file riêng
- FastCode MCP PHẢI kết nối thành công → DỪNG nếu thất bại, KHÔNG có fallback
- CẤM đọc/ghi/hiển thị nội dung file nhạy cảm (`.env`, `.env.*`, `credentials.*`, `*.pem`, `*.key`, `*secret*`) — chỉ kiểm tra tồn tại, chỉ ghi TÊN biến
- PHẢI tạo thư mục .planning/ structure
- Nếu đã có CONTEXT.md từ session trước → hỏi user muốn khởi tạo lại hay giữ
- Tuân thủ quy tắc ngôn ngữ + bảo mật trong CONTEXT.md template
</rules>
