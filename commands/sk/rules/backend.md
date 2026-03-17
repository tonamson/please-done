# Quy tắc Backend (NestJS)

## Controller
- CHỈ delegate, KHÔNG business logic
- Decorator stack: JSDoc → @Post → @HttpCode → @UseGuards → @Group/@Role
- @Req() req: any để lấy req.user

## Service
- private readonly logger = new Logger(XxxService.name)
- Async + try/catch: re-throw NestJS exceptions, wrap unknown → message theo ngôn ngữ throw lỗi của dự án (xem mục Ngôn ngữ message)
- Config: this.configService.get('KEY'), KHÔNG hardcode

## DTO
- @ApiProperty({ description: 'tiếng Việt', example: '...' }) BẮT BUỘC
- Create: required | Update: optional trừ id | Query: page/limit/search/sortBy/sortOrder | Detail: id
- Validation decorators mỗi dòng 1 cái, barrel export qua dto/index.ts nếu nhiều DTOs

## Entity
- MongoDB: @Schema({ versionKey:false, timestamps:true }) + snake_case + prefix m + mongoose-paginate-v2
- TypeORM: camelCase + suffix Repo + @Column({ comment:'tiếng Việt' }) + @DeleteDateColumn() soft delete
- Prisma: @@map("tên_bảng") + @@index + camelCase

## Enum
- File: enums/tên-enum.enum.ts | Values: STRING UPPER_SNAKE_CASE

## Response & Error
- Phân trang: { docs, page, limit, totalDocs, totalPages }
- Query lỗi: return { docs:[], page, limit, totalPages:1 }
- Mutate lỗi: throw NestJS exception (ngôn ngữ theo dự án)

## Ngôn ngữ message (DTO validation, error, exception)
- Grep pattern throw/message trong code hiện có để xác định ngôn ngữ dự án dùng
- Dự án throw tiếng Việt → dùng tiếng Việt
- Dự án throw tiếng Anh → dùng tiếng Anh
- Không xác định được → mặc định tiếng Việt

## Bảo mật code
- Password: bcrypt(10), strip khỏi response
- Sort: whitelist allowedSortFields chống injection
- Soft delete: @DeleteDateColumn() thay vì xóa thật

## Build & Lint
- Lint: `npx eslint src/ --fix`
- Build: `npx nest build`
- Detect thư mục: Glob `**/nest-cli.json` → thư mục chứa = backend root
