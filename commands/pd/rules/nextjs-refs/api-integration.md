# NextJS API Integration Reference

## Server-side Fetch — fetchFromApi helper
```tsx
// src/lib/api.ts
// INTERNAL_API_URL: gọi thẳng backend container (VD: http://backend:3001)

export async function fetchFromApi<T>(
  path: string,
  options?: RequestInit & { next?: NextFetchRequestConfig },
): Promise<T> {
  const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:3001';

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  if (!res.ok) {
    // Backend trả { message, statusCode } → parse lấy message
    const body = await res.json().catch(() => ({ message: `API Error: ${res.status}` }));
    throw new Error(body.message);
  }

  return res.json();
}
```

### Sử dụng + auth token từ cookie
```tsx
// app/orders/page.tsx
import { cookies } from 'next/headers';
import { fetchFromApi } from '@/lib/api';

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const orders = await fetchFromApi<Order[]>('/orders', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store', // Dữ liệu cá nhân — không cache
  });

  return <OrderList orders={orders} />;
}
```

## Client-side Fetch — native fetch
```tsx
// ❌ SAI: dùng axios — CẤM, chỉ native fetch
import axios from 'axios';

// ✅ ĐÚNG: native fetch với PUBLIC_API_URL (qua Nginx proxy)
'use client';
import { useState } from 'react';
import { Button, message } from 'antd';

export default function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    setLoading(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Lỗi thêm giỏ hàng');
      }
      message.success('Đã thêm vào giỏ hàng');
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return <Button type="primary" loading={loading} onClick={handleAdd}>Thêm vào giỏ</Button>;
}
```

## Admin API — token param pattern
```tsx
// src/lib/admin-api.ts — mọi hàm nhận token param
import { fetchFromApi } from './api';

/** GET /admin/users — danh sách users (phân trang) */
export async function fetchUsers(
  token: string,
  params?: { page?: number; limit?: number },
): Promise<PaginatedResponse<User>> {
  const query = new URLSearchParams({
    page: String(params?.page || 1),
    limit: String(params?.limit || 20),
  });
  return fetchFromApi(`/admin/users?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
}

/** DELETE /admin/products/:id */
export async function deleteProduct(token: string, id: string): Promise<void> {
  await fetchFromApi(`/admin/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
```

### Sử dụng trong Admin Server Component
```tsx
// app/admin/users/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { fetchUsers } from '@/lib/admin-api';

export default async function AdminUsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) redirect('/login');

  const { items: users, total } = await fetchUsers(token, { page: 1 });
  return <UserTable users={users} total={total} />;
}
```

## Error Handling
```tsx
// error.tsx — Error Boundary cho route segment
'use client';
import { Button, Result } from 'antd';

export default function ProductError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Result
      status="error"
      title="Đã xảy ra lỗi"
      subTitle={error.message}
      extra={<Button type="primary" onClick={reset}>Thử lại</Button>}
    />
  );
}
```

```tsx
// Server Component — lỗi tự bắt bởi error.tsx, 404 dùng notFound()
export default async function ProductPage({ params }: PageProps) {
  const product = await fetchFromApi<Product | null>(`/products/${params.slug}`);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
```

## Type-safe API — Generic Response Types
```tsx
// src/types/api.ts
interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

```tsx
// ❌ SAI: any response
const data = await fetch('/api/products').then((r) => r.json());
data.items; // TypeScript không biết shape

// ✅ ĐÚNG: generic type
const { items, total } = await fetchFromApi<PaginatedResponse<Product>>('/products');
// items: Product[], total: number — type-safe
```
