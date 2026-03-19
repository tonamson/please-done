# NestJS Swagger/OpenAPI Reference

## Setup
```bash
npm i @nestjs/swagger
```

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API documentation cho hệ thống quản lý')
    .setVersion('1.0')
    .addBearerAuth()                     // Nút Authorize cho JWT
    .addTag('users', 'Quản lý người dùng')
    .addTag('orders', 'Quản lý đơn hàng')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(3000);
  // Swagger UI: http://localhost:3000/api-docs
}
```

## Controller Decorators
```typescript
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách users' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Thành công', type: PaginatedUserResponse })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy user theo ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo user mới' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

## DTO Documentation
```typescript
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

export class CreateUserDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ tên đầy đủ' })
  @IsString() @MinLength(2)
  name: string;

  @ApiProperty({ example: 'nguyenvana@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MatKhau123!', minLength: 8 })
  @IsString() @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    enum: UserRole, isArray: true,
    example: [UserRole.USER], description: 'Danh sách vai trò',
  })
  @IsOptional() @IsArray() @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional() @IsString()
  phone?: string;
}

// PartialType kế thừa Swagger docs + tất cả fields thành optional
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
```

```typescript
// Nested object + array trong DTO
export class AddressDto {
  @ApiProperty({ example: '123 Nguyễn Huệ, Q1' })
  @IsString()
  street: string;

  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  @IsString()
  city: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt() @Min(1)
  quantity: number;

  @ApiProperty({ type: AddressDto, description: 'Địa chỉ giao hàng' })
  @ValidateNested() @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @ApiPropertyOptional({ type: [String], example: ['DISCOUNT10'] })
  @IsOptional() @IsArray() @IsString({ each: true })
  couponCodes?: string[];
}
```

## Response Schemas
```typescript
export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  name: string;

  @ApiProperty({ example: 'nguyenvana@gmail.com' })
  email: string;

  @ApiProperty({ enum: UserRole, isArray: true })
  roles: UserRole[];
}

// Generic pagination không hoạt động với Swagger → tạo class cụ thể
export class PaginatedUserResponse {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

// Error response chuẩn
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Dữ liệu không hợp lệ' })
  message: string;

  @ApiProperty({ example: ['email must be an email'], type: [String] })
  errors?: string[];
}
```

## Plugin tự động (giảm boilerplate)
```json
// nest-cli.json — tự đọc TS types + class-validator → sinh @ApiProperty
{
  "compilerOptions": {
    "plugins": [{
      "name": "@nestjs/swagger",
      "options": { "classValidatorShim": true, "introspectComments": true }
    }]
  }
}
```

## Anti-patterns
```typescript
// ❌ SAI: Không document error responses → FE không biết xử lý lỗi
@Post()
create(@Body() dto: CreateUserDto) { ... }
// ✅ ĐÚNG: Document đầy đủ các status codes
@ApiResponse({ status: 201, type: UserResponseDto })
@ApiResponse({ status: 400, description: 'Validation thất bại' })
@ApiResponse({ status: 409, description: 'Email đã tồn tại' })

// ❌ SAI: Dùng @ApiProperty({ required: false })
@ApiProperty({ required: false }) phone?: string;
// ✅ ĐÚNG: Dùng @ApiPropertyOptional — rõ ý hơn
@ApiPropertyOptional({ example: '0901234567' }) phone?: string;
```
