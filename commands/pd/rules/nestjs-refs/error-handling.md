# NestJS Error Handling Reference

## Global Exception Filter
```typescript
// common/filters/all-exceptions.filter.ts
@Catch() // Bắt TẤT CẢ exception — kể cả lỗi không phải HttpException
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Đã xảy ra lỗi, vui lòng thử lại sau';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object') {
        const obj = exResponse as Record<string, any>;
        message = obj.message || exception.message;
        // ValidationPipe trả về mảng lỗi
        if (Array.isArray(obj.message)) {
          errors = obj.message;
          message = 'Dữ liệu không hợp lệ';
        }
      }
    } else if (exception instanceof Error) {
      // Lỗi không mong đợi — log chi tiết, không lộ ra client
      this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

```typescript
// Đăng ký trong main.ts
app.useGlobalFilters(new AllExceptionsFilter());
```

## Custom Exceptions
```typescript
// common/exceptions/business.exception.ts
export class BusinessException extends HttpException {
  constructor(message: string, statusCode = HttpStatus.BAD_REQUEST) {
    super({ statusCode, message, type: 'BUSINESS_ERROR' }, statusCode);
  }
}

export class InsufficientBalanceException extends BusinessException {
  constructor() {
    super('Số dư không đủ để thực hiện giao dịch');
  }
}

export class DuplicateEmailException extends HttpException {
  constructor(email: string) {
    super({ statusCode: 409, message: `Email ${email} đã được sử dụng` }, HttpStatus.CONFLICT);
  }
}
```

```typescript
// Sử dụng trong service
@Injectable()
export class OrdersService {
  async create(dto: CreateOrderDto, userId: string) {
    const wallet = await this.walletsService.findByUserId(userId);
    if (wallet.balance < dto.total) throw new InsufficientBalanceException();

    const existing = await this.ordersRepo.findOne({
      where: { userId, productId: dto.productId, status: 'pending' },
    });
    if (existing) {
      throw new BusinessException('Đã có đơn hàng đang chờ cho sản phẩm này');
    }
    return this.ordersRepo.save(this.ordersRepo.create({ ...dto, userId }));
  }
}
```

## Validation Pipe
```typescript
// main.ts — đăng ký global
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // Loại bỏ fields không có trong DTO
  forbidNonWhitelisted: true, // Trả lỗi nếu gửi field lạ
  transform: true,            // Tự động transform types (string → number)
  transformOptions: { enableImplicitConversion: true },
}));
```

```typescript
// users/dto/create-user.dto.ts — class-validator decorators
export class CreateUserDto {
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString()
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(50)
  name: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có chữ hoa, chữ thường và số',
  })
  password: string;

  @IsOptional() @IsInt() @Min(1) @Max(150)
  age?: number;

  @IsOptional()
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })   // Validate từng item trong mảng
  @Type(() => AddressDto)           // Bắt buộc để transform nested
  addresses?: AddressDto[];
}
```

## Custom Validator
```typescript
// common/validators/is-unique.validator.ts
@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async validate(value: any, args: ValidationArguments) {
    const [entity, field] = args.constraints;
    const existing = await this.dataSource.getRepository(entity)
      .findOne({ where: { [field]: value } });
    return !existing; // true = chưa tồn tại = hợp lệ
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.constraints[1]} đã tồn tại`;
  }
}

// Decorator wrapper
export function IsUnique(entity: any, field: string, options?: ValidationOptions) {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      target: object.constructor, propertyName, options,
      constraints: [entity, field], validator: IsUniqueConstraint,
    });
  };
}

// Sử dụng: @IsUnique(User, 'email', { message: 'Email đã đăng ký' })
```

## Error Response Format chuẩn
```json
// Validation error (400)
{ "statusCode": 400, "message": "Dữ liệu không hợp lệ",
  "errors": ["Tên không được để trống", "Email không đúng định dạng"],
  "timestamp": "2024-01-15T10:30:00Z", "path": "/api/users" }

// Business error (400/409)
{ "statusCode": 409, "message": "Email a@test.com đã được sử dụng",
  "timestamp": "2024-01-15T10:30:00Z", "path": "/api/users" }

// Server error (500) — KHÔNG lộ chi tiết kỹ thuật
{ "statusCode": 500, "message": "Đã xảy ra lỗi, vui lòng thử lại sau",
  "timestamp": "2024-01-15T10:30:00Z", "path": "/api/users" }
```

## Anti-patterns
```typescript
// ❌ SAI: Trả lỗi kỹ thuật cho client → lộ chi tiết hệ thống
throw new InternalServerErrorException(error.message);
// ✅ ĐÚNG: Log nội bộ, trả message chung
this.logger.error('Lỗi tạo order', error.stack);
throw new InternalServerErrorException('Đã xảy ra lỗi, vui lòng thử lại sau');

// ❌ SAI: try/catch ở mỗi controller method → code lặp
@Post()
async create(@Body() dto: CreateUserDto) {
  try { return await this.usersService.create(dto); }
  catch (e) { throw new BadRequestException(e.message); }
}
// ✅ ĐÚNG: Để exception tự bubble up → filter xử lý
@Post()
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}

// ❌ SAI: Không bật whitelist → client gửi field lạ vào DB
app.useGlobalPipes(new ValidationPipe());
// ✅ ĐÚNG: Bật whitelist + forbidNonWhitelisted
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
```
