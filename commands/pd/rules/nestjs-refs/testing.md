# NestJS Testing Reference

## Unit Test — Service với Mongoose
```typescript
// users/users.service.spec.ts
const mockUserModel = {
  create: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();
    service = module.get(UsersService);
    jest.clearAllMocks(); // Reset mock trước mỗi test
  });

  describe('findById', () => {
    it('trả về user khi tìm thấy', async () => {
      const mockUser = { _id: '1', name: 'Nguyễn Văn A', email: 'a@test.com' };
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });

      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith('1');
    });

    it('throw NotFoundException khi không tìm thấy', async () => {
      mockUserModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

## Unit Test — Service với TypeORM
```typescript
// orders/orders.service.spec.ts
const mockRepository = () => ({
  find: jest.fn(), findOne: jest.fn(),
  save: jest.fn(), create: jest.fn(), softDelete: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let repo: jest.Mocked<Repository<Order>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useFactory: mockRepository },
      ],
    }).compile();
    service = module.get(OrdersService);
    repo = module.get(getRepositoryToken(Order));
  });

  it('tạo order mới và trả về entity', async () => {
    const dto = { productId: 'p1', quantity: 2 };
    const order = { id: '1', ...dto, total: 200000 };
    repo.create.mockReturnValue(order as any);
    repo.save.mockResolvedValue(order as any);

    const result = await service.create(dto as any);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('1');
  });
});
```

## E2E Test — Controller
```typescript
// test/users.e2e-spec.ts
describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    // Phải setup giống main.ts — nếu không test sẽ khác production
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Đăng nhập lấy token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => { await app.close(); });

  describe('GET /users', () => {
    it('trả về danh sách users (200)', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body).toHaveProperty('total');
        });
    });

    it('trả về 401 khi không có token', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });
  });

  describe('POST /users', () => {
    it('tạo user mới (201)', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Trần Văn B', email: 'b@test.com', password: 'Pass123!' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('trả về 400 khi thiếu required fields', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' })
        .expect(400);
    });
  });
});
```

## Test Utilities
```typescript
// test/helpers/testing.helper.ts
export async function createTestApp(...modules: any[]) {
  const module = await Test.createTestingModule({ imports: modules }).compile();
  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}

export async function getAuthToken(app: INestApplication, email = 'admin@test.com') {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'password123' });
  return res.body.accessToken;
}

// Mock factory — tạo fake data cho test
export const createMockUser = (overrides = {}) => ({
  id: 'user-1', name: 'Test User', email: 'test@test.com',
  roles: ['user'], createdAt: new Date(), ...overrides,
});
```

## Running Tests
```bash
npm run test             # Unit tests
npm run test:watch       # Watch mode
npx jest users.service   # Chạy 1 file cụ thể
npm run test:e2e         # E2E tests
npm run test:cov         # Coverage report
```

## Anti-patterns
```typescript
// ❌ SAI: Không clear mocks → test bị ảnh hưởng lẫn nhau
it('test 1', () => { mockRepo.find.mockResolvedValue([item]); });
it('test 2', () => { /* mockRepo.find vẫn trả [item] từ test 1! */ });
// ✅ ĐÚNG: Clear trong beforeEach
beforeEach(() => { jest.clearAllMocks(); });

// ❌ SAI: E2E test thiếu ValidationPipe → bỏ qua validation
const app = module.createNestApplication();
await app.init(); // Thiếu useGlobalPipes!
// ✅ ĐÚNG: Setup giống production
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```
