# Quy tắc Backend (NestJS)

> Chỉ chứa quy ước riêng. Kiến thức NestJS chuẩn → tra Context7 (`resolve-library-id` → `query-docs`).

## Quy ước đặc biệt
- **MongoDB collection**: prefix `m` + snake_case (VD: `mUsers`, `mOrder_items`)
- **Mongoose schema**: `@Schema({ versionKey: false, timestamps: true })` + `mongoose-paginate-v2`
- **TypeORM**: camelCase + suffix `Repo` + `@Column({ comment: 'tiếng Việt' })` + `@DeleteDateColumn()` soft delete
- **Prisma**: `@@map("tên_bảng")` + `@@index` + camelCase
- **DTO**: `@ApiProperty({ description: 'tiếng Việt', example: '...' })` BẮT BUỘC mỗi field
- **Decorator stack order**: JSDoc → @Post → @HttpCode → @UseGuards → @Roles
- **Controller**: CHỈ delegate, KHÔNG chứa business logic
- **Enum values**: STRING UPPER_SNAKE_CASE, file: `enums/tên-enum.enum.ts`

## Phân trang & Response
- Format: `{ docs, page, limit, totalDocs, totalPages }`
- Query lỗi: return `{ docs: [], page, limit, totalPages: 1 }`
- Mutate lỗi: throw NestJS exception

## Ngôn ngữ message
- Grep pattern `throw`/`message` trong code hiện có → dùng ngôn ngữ project đang dùng
- Không xác định → mặc định tiếng Việt

## Bảo mật
- Password: bcrypt(10), strip khỏi response
- Sort: whitelist `allowedSortFields`, CẤM truyền user input trực tiếp
- Rate limiting: `@nestjs/throttler` cho auth endpoints
- Input validation: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` global
- Soft delete: `deletedAt` field (TypeORM: `@DeleteDateColumn()`, Mongoose: field + middleware filter, Prisma: field + middleware)

## Build & Lint
- Lint: `npx eslint src/ --fix`
- Build: `npx nest build`
- Detect thư mục: Glob `**/nest-cli.json` → thư mục chứa = backend root
