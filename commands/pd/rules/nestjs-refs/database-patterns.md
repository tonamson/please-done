# NestJS Database Patterns Reference

## Mongoose Patterns
```typescript
// users/schemas/user.schema.ts
@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ select: false })   // Không trả về password mặc định
  password: string;

  @Prop({ type: [String], default: ['user'] })
  roles: string[];

  @Prop({ type: Types.ObjectId, ref: 'Company' })
  company: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
UserSchema.index({ name: 'text' });
```

```typescript
// users/users.service.ts — Mongoose repository pattern
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;
    const filter: FilterQuery<User> = { isDeleted: false };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.userModel.find(filter)
        .skip((page - 1) * limit).limit(limit)
        .sort({ createdAt: -1 })
        .populate('company', 'name').exec(),
      this.userModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Soft delete — không xóa thật
  async softDelete(id: string) {
    await this.userModel.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() });
  }
}
```

## TypeORM Patterns
```typescript
// users/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ select: false })
  password: string;

  @ManyToOne(() => Company, (c) => c.users)
  company: Company;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()   // Soft delete tự động với TypeORM
  deletedAt?: Date;
}
```

```typescript
// users/users.service.ts — TypeORM QueryBuilder
async findAll(query: PaginationDto) {
  const { page = 1, limit = 20, search, sortBy = 'createdAt', order = 'DESC' } = query;

  // Whitelist sort fields — tránh SQL injection
  const allowedSort = ['createdAt', 'name', 'email'];
  const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';

  const qb = this.usersRepo.createQueryBuilder('user')
    .leftJoinAndSelect('user.company', 'company');
  if (search) {
    qb.where('user.name ILIKE :search OR user.email ILIKE :search', {
      search: `%${search}%`,
    });
  }
  const [data, total] = await qb
    .orderBy(`user.${sortField}`, order === 'ASC' ? 'ASC' : 'DESC')
    .skip((page - 1) * limit).take(limit)
    .getManyAndCount();
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

## Prisma Patterns
```typescript
// prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}

// prisma/prisma.module.ts — đăng ký global, không cần import lại
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

```typescript
// users/users.service.ts — Prisma query + transaction
async findAll(query: PaginationDto) {
  const { page = 1, limit = 20, search } = query;
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  const [data, total] = await this.prisma.$transaction([
    this.prisma.user.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { company: { select: { id: true, name: true } } },
    }),
    this.prisma.user.count({ where }),
  ]);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Transaction — đảm bảo tính toàn vẹn dữ liệu
async transferCredits(fromId: string, toId: string, amount: number) {
  return this.prisma.$transaction(async (tx) => {
    const sender = await tx.user.update({
      where: { id: fromId }, data: { credits: { decrement: amount } },
    });
    if (sender.credits < 0) throw new BadRequestException('Không đủ credits');
    await tx.user.update({
      where: { id: toId }, data: { credits: { increment: amount } },
    });
  });
}
```

## Common: Pagination DTO
```typescript
export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  search?: string;
}
```

## Anti-patterns
```typescript
// ❌ SAI: Không dùng transaction cho thao tác nhiều bảng
await this.usersRepo.save(user);
await this.walletRepo.save(wallet); // Nếu fail → dữ liệu không nhất quán
// ✅ ĐÚNG: Wrap trong transaction
await this.dataSource.transaction(async (manager) => {
  await manager.save(User, user);
  await manager.save(Wallet, wallet);
});

// ❌ SAI: Truyền sortBy trực tiếp → SQL injection risk
.orderBy(`user.${query.sortBy}`, 'ASC')
// ✅ ĐÚNG: Whitelist sort fields
const allowedSort = ['createdAt', 'name', 'email'];
```
