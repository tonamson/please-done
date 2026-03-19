# NestJS Authentication Reference

## Passport + JWT Setup
```bash
npm i @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt class-validator
npm i -D @types/passport-jwt @types/bcrypt
```

```typescript
// auth/strategies/jwt.strategy.ts
export interface JwtPayload {
  sub: string; email: string; roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // Giá trị trả về sẽ được gắn vào request.user
  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, roles: payload.roles };
  }
}
```

## Guards
```typescript
// auth/guards/jwt-auth.guard.ts — cho phép bỏ qua auth nếu @Public()
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}

// auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!requiredRoles) return true; // Không có @Roles() → cho phép tất cả
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

## Custom Decorators
```typescript
// Lấy user từ request — dùng @CurrentUser() hoặc @CurrentUser('id')
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  },
);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

## Auth Service
```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Email không tồn tại');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Mật khẩu không đúng');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload: JwtPayload = { sub: user.id, email: user.email, roles: user.roles };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({ ...dto, password: hashedPassword });
    return this.login(user.email, dto.password);
  }
}
```

## Auth Module
```typescript
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
})
export class AuthModule {}
```

## Protected Routes Example
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.id);
  }

  @Get()
  @Roles('admin')   // Chỉ admin mới được xem danh sách
  findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Public()          // Bỏ qua JWT auth
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.usersService.forgotPassword(dto.email);
  }
}
```

## Refresh Token
```typescript
@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId); // Xóa refresh token khỏi DB/Redis
  }
}
```

## Anti-patterns
```typescript
// ❌ SAI: Hardcode secret
JwtModule.register({ secret: 'my-super-secret-key' });
// ✅ ĐÚNG: Dùng ConfigService + biến môi trường

// ❌ SAI: Trả về password trong response
return this.usersRepo.findOne({ where: { id } });
// ✅ ĐÚNG: Loại bỏ password
const { password, ...result } = user;
return result;
```
