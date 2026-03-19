# NextJS Zustand Patterns Reference

## Store Setup — pattern chuẩn
```tsx
// src/stores/useCartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem { id: string; name: string; price: number; quantity: number }

interface CartState {
  items: CartItem[];
  /** Thêm sản phẩm — đã có thì tăng số lượng */
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  /** Xóa sản phẩm */
  removeItem: (id: string) => void;
  /** Cập nhật số lượng */
  updateQuantity: (id: string, quantity: number) => void;
  /** Xóa toàn bộ giỏ */
  clearCart: () => void;
  /** Tổng số lượng */
  getTotalItems: () => number;
  /** Tổng tiền */
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        const existing = items.find((i) => i.id === item.id);
        if (existing) {
          set({ items: items.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
      },

      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) { get().removeItem(id); return; }
        set({ items: get().items.map((i) => i.id === id ? { ...i, quantity } : i) });
      },

      clearCart: () => set({ items: [] }),

      // Computed values — dùng get(), KHÔNG lưu vào state
      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // Chỉ persist items
    },
  ),
);
```

## SSR Hydration — tránh mismatch
```tsx
// src/hooks/useHydration.ts
// Zustand persist đọc localStorage → server/client khác giá trị → React warning
import { useEffect, useState } from 'react';

export function useHydration() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return hydrated;
}
```

```tsx
// ❌ SAI: render giá trị persist store ngay → hydration mismatch
'use client';
export default function CartIcon() {
  const total = useCartStore((s) => s.getTotalItems());
  return <Badge count={total} />; // Server: 0, Client: 3 → mismatch
}

// ✅ ĐÚNG: chờ hydration
'use client';
import { useHydration } from '@/hooks/useHydration';
import { useCartStore } from '@/stores/useCartStore';
import { Badge } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

export default function CartIcon() {
  const hydrated = useHydration();
  const total = useCartStore((s) => s.getTotalItems());

  return (
    <Badge count={hydrated ? total : 0} size="small">
      <ShoppingCartOutlined style={{ fontSize: 24 }} />
    </Badge>
  );
}
```

## Computed Values — dùng get()
```tsx
// ❌ SAI: lưu computed vào state → phải sync thủ công, dễ quên
interface State {
  items: CartItem[];
  totalPrice: number; // Phải update mỗi khi items đổi
}

// ✅ ĐÚNG: computed = function dùng get() → luôn đúng
interface State {
  items: CartItem[];
  getTotalPrice: () => number;
}
// Trong store: getTotalPrice: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
// Trong component: const total = useCartStore((s) => s.getTotalPrice());
```

## Store Communication
### Gọi store khác trong action
```tsx
// src/stores/useCheckoutStore.ts
import { create } from 'zustand';
import { useCartStore } from './useCartStore';

interface CheckoutState {
  isProcessing: boolean;
  /** Tạo đơn hàng từ giỏ hàng */
  placeOrder: () => Promise<void>;
}

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  isProcessing: false,

  placeOrder: async () => {
    const { items, getTotalPrice, clearCart } = useCartStore.getState();
    if (items.length === 0) throw new Error('Giỏ hàng trống');

    set({ isProcessing: true });
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, total: getTotalPrice() }),
      });
      clearCart(); // Xóa giỏ sau khi đặt hàng
    } finally {
      set({ isProcessing: false });
    }
  },
}));
```

### Subscribe — lắng nghe store khác
```tsx
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// subscribeWithSelector bọc ngoài persist
export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({ /* ...actions */ }),
      { name: 'auth-storage' },
    ),
  ),
);

// Lắng nghe logout → xóa giỏ hàng
useAuthStore.subscribe(
  (state) => state.user,
  (user, prevUser) => {
    if (prevUser && !user) useCartStore.getState().clearCart();
  },
);
```

## Persist Options
### partialize — chọn lọc data persist
```tsx
persist(
  (set, get) => ({ items: [], isOpen: false, searchQuery: '' }),
  {
    name: 'cart-storage',
    partialize: (state) => ({ items: state.items }), // Chỉ lưu items
  },
);
```

### Storage + Security
```tsx
// sessionStorage — mất khi đóng tab (form draft)
import { createJSONStorage } from 'zustand/middleware';

persist(
  (set, get) => ({ /* ... */ }),
  { name: 'form-draft', storage: createJSONStorage(() => sessionStorage) },
);

// ❌ SAI: persist token vào localStorage → XSS đọc được
persist((set) => ({ token: '' }), { name: 'auth' });

// ✅ ĐÚNG: token trong httpOnly cookie, Zustand chỉ lưu user info
persist((set) => ({ user: null }), {
  name: 'auth',
  partialize: (state) => ({ user: state.user }),
});
```

### Version migration
```tsx
persist(
  (set, get) => ({ /* state v2 */ }),
  {
    name: 'cart-storage',
    version: 2,
    migrate: (persisted, version) => {
      const state = persisted as Record<string, unknown>;
      if (version < 2) return { ...state, currency: 'VND' }; // Thêm field mới
      return state;
    },
  },
);
```
