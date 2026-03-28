# Backend Rules (NestJS)

> Contains project-specific conventions only. Standard NestJS knowledge → look up via Context7 (`resolve-library-id` → `query-docs`).

## Special conventions
- **MongoDB collection**: prefix `m` + snake_case (e.g.: `mUsers`, `mOrder_items`)
- **Mongoose schema**: `@Schema({ versionKey: false, timestamps: true })` + `mongoose-paginate-v2`
- **TypeORM**: camelCase + suffix `Repo` + `@Column({ comment: 'description' })` + `@DeleteDateColumn()` soft delete
- **Prisma**: `@@map("table_name")` + `@@index` + camelCase
- **DTO**: `@ApiProperty({ description: 'field description', example: '...' })` MUST be on every field
- **Decorator stack order**: JSDoc → @Post → @HttpCode → @UseGuards → @Roles
- **Controller**: ONLY delegate, NO business logic
- **Enum values**: STRING UPPER_SNAKE_CASE, file: `enums/enum-name.enum.ts`

## Pagination and response
- Format: `{ docs, page, limit, totalDocs, totalPages }`
- Query error: return `{ docs: [], page, limit, totalPages: 1 }`
- Mutation error: throw NestJS exception

## Message language
- Grep pattern `throw`/`message` in existing code → use the language the project is using
- Cannot determine → default to English

## Security
- Password: bcrypt(10), strip from response
- Sort: whitelist `allowedSortFields`, FORBIDDEN to pass user input directly
- Rate limiting: `@nestjs/throttler` for auth endpoints
- Input validation: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` global
- Soft delete: `deletedAt` field (TypeORM: `@DeleteDateColumn()`, Mongoose: field + middleware filter, Prisma: field + middleware)

## Build and lint
- Lint: `npx eslint src/ --fix`
- Build: `npx nest build`
- Detection: Glob `**/nest-cli.json` → containing directory is the backend root
