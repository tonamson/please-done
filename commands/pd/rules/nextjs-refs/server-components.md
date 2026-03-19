# NextJS Server Components Reference

## Server vs Client Components
```tsx
// ✅ Server Component (mặc định, KHÔNG cần directive)
// Dùng khi: fetch data, truy cập DB, giữ secrets, không cần interactivity
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);
  return <ProductDetail product={product} />;
}

// ✅ Client Component — CHỈ khi cần hooks, state, browser APIs
'use client';
function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  return <Button loading={loading} onClick={handleAdd}>Thêm vào giỏ</Button>;
}
```

```tsx
// ❌ SAI: đặt 'use client' ở page → mất khả năng fetch trên server, kém SEO
'use client';
export default function ProductPage() { /* fetch trên client = chậm */ }

// ❌ SAI: import Server Component vào Client Component
'use client';
import ServerChart from './ServerChart'; // Bị chuyển thành Client Component

// ✅ ĐÚNG: truyền Server Component qua children prop
'use client';
function ClientLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>; // children vẫn là Server Component
}
```

## Data Fetching — async Server Component
```tsx
// app/products/page.tsx
import { fetchFromApi } from '@/lib/api';

export default async function ProductsPage() {
  // fetch trực tiếp — KHÔNG cần useEffect
  const products = await fetchFromApi<Product[]>('/products', {
    next: { revalidate: 60 }, // ISR: revalidate mỗi 60 giây
  });

  return (
    <div style={{ padding: 24 }}>
      {products.map((p) => (
        <div key={p.id} style={{ marginBottom: 16 }}>
          <h3>{p.name}</h3>
          <span>{p.price.toLocaleString('vi-VN')}đ</span>
        </div>
      ))}
    </div>
  );
}
```

### Parallel Fetch — Promise.allSettled
```tsx
export default async function DashboardPage() {
  const [statsResult, ordersResult] = await Promise.allSettled([
    fetchFromApi<Stats>('/dashboard/stats'),
    fetchFromApi<Order[]>('/orders/recent'),
  ]);

  // 1 API lỗi không ảnh hưởng cái khác
  const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;
  const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {stats && <StatsCards stats={stats} />}
      <RecentOrders orders={orders} />
    </div>
  );
}
```

### Fetch Options
```tsx
await fetch(url, { cache: 'no-store' });             // Không cache — realtime
await fetch(url, { cache: 'force-cache' });           // Cache vĩnh viễn (mặc định)
await fetch(url, { next: { revalidate: 300 } });      // ISR — 5 phút
await fetch(url, { next: { tags: ['products'] } });   // Revalidate theo tag
// Invalidate: revalidateTag('products') trong Server Action
```

## Streaming + Suspense
```tsx
// app/products/loading.tsx — loading UI tự động cho route segment
import { Skeleton, Space } from 'antd';

export default function ProductsLoading() {
  return (
    <Space direction="vertical" style={{ width: '100%', padding: 24 }}>
      <Skeleton active paragraph={{ rows: 2 }} />
      <Skeleton active paragraph={{ rows: 2 }} />
    </Space>
  );
}
```

```tsx
// Suspense boundaries — streaming từng phần độc lập
import { Suspense } from 'react';
import { Spin, Skeleton } from 'antd';

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', gap: 24, padding: 24 }}>
      <Suspense fallback={<Skeleton active />}>
        <StatsSection /> {/* async Server Component — stream riêng */}
      </Suspense>
      <Suspense fallback={<Spin tip="Đang tải..." />}>
        <RecentOrders /> {/* async Server Component — stream riêng */}
      </Suspense>
    </div>
  );
}

async function StatsSection() {
  const stats = await fetchFromApi<Stats>('/dashboard/stats');
  return <StatsCards stats={stats} />;
}
```

## Server Actions
```tsx
// app/products/actions.ts
'use server';
import { revalidatePath } from 'next/cache';

/** Tạo sản phẩm mới — gọi từ form action */
export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string;
  const price = Number(formData.get('price'));

  const res = await fetch(`${process.env.INTERNAL_API_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, price }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Tạo sản phẩm thất bại');
  }

  revalidatePath('/products');
}
```

### useFormState — xử lý kết quả phía client
```tsx
'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { Button, Input } from 'antd';
import { createProduct } from './actions';

interface ActionState { error?: string; success?: boolean }

async function createAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await createProduct(formData);
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export default function CreateProductForm() {
  const [state, formAction] = useFormState(createAction, {});
  return (
    <form action={formAction} style={{ maxWidth: 400 }}>
      {state.error && <p style={{ color: 'red' }}>{state.error}</p>}
      {state.success && <p style={{ color: 'green' }}>Tạo thành công!</p>}
      <Input name="name" placeholder="Tên sản phẩm" style={{ marginBottom: 12 }} />
      <Input name="price" type="number" placeholder="Giá" style={{ marginBottom: 12 }} />
      <SubmitButton />
    </form>
  );
}

/** Nút submit riêng — useFormStatus phải ở component con của form */
function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="primary" htmlType="submit" loading={pending}>Tạo</Button>;
}
```
