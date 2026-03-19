# NextJS Authentication Reference

## JWT Middleware — bảo vệ routes ở edge
```tsx
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bỏ qua public routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Lấy token từ httpOnly cookie (bảo mật hơn localStorage)
  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Decode payload, check expiry (Edge Runtime — không dùng được jsonwebtoken)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('access_token');
      return response;
    }
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)'],
};
```

## Protected Pages — Server Component auth check
```tsx
// app/admin/layout.tsx — bảo vệ toàn bộ /admin/*
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

function decodeToken(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) redirect('/login?redirect=/admin');

  const payload = decodeToken(token);
  if (!payload?.roles?.includes('admin')) redirect('/unauthorized');

  return <>{children}</>;
}
```

```tsx
// ❌ SAI: check auth phía client → flash content trước redirect
'use client';
export default function AdminPage() {
  const { user } = useAuthStore();
  useEffect(() => { if (!user) router.push('/login'); }, [user]);
  // User thấy trang admin 1 tích tắc → lộ thông tin
}

// ✅ ĐÚNG: check trong Server Component hoặc middleware → redirect trước khi render
```

## Auth API Routes — login/logout
```tsx
// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${process.env.INTERNAL_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ message: data.message || 'Đăng nhập thất bại' }, { status: res.status });
  }

  // Set httpOnly cookie — client JS không đọc được → chống XSS
  const response = NextResponse.json({ user: data.user });
  response.cookies.set('access_token', data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
    path: '/',
  });
  return response;
}
```

```tsx
// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Đã đăng xuất' });
  response.cookies.delete('access_token');
  return response;
}
```

## Auth Store (Zustand) — state phía client
```tsx
// src/stores/useAuthStore.ts
import { create } from 'zustand';

interface User { id: string; email: string; name: string; roles: string[] }

interface AuthState {
  user: User | null;
  isLoading: boolean;
  /** Fetch thông tin user từ /api/auth/me */
  fetchUser: () => Promise<void>;
  /** Đăng nhập — gọi API route, set user */
  login: (email: string, password: string) => Promise<void>;
  /** Đăng xuất — xóa cookie qua API, clear state */
  logout: () => Promise<void>;
  /** Kiểm tra role */
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: true,

  fetchUser: async () => {
    try {
      const res = await fetch('/api/auth/me');
      const { user } = res.ok ? await res.json() : { user: null };
      set({ user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'Đăng nhập thất bại');
    }
    const { user } = await res.json();
    set({ user });
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null });
  },

  hasRole: (role) => get().user?.roles.includes(role) ?? false,
}));
```

### Sử dụng trong Client Component
```tsx
'use client';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button, Space, Typography } from 'antd';

export default function UserMenu() {
  const { user, logout, hasRole } = useAuthStore();
  if (!user) return null;

  return (
    <Space>
      <Typography.Text>Xin chào, {user.name}</Typography.Text>
      {hasRole('admin') && <Button href="/admin" type="link">Quản trị</Button>}
      <Button onClick={logout}>Đăng xuất</Button>
    </Space>
  );
}
```
