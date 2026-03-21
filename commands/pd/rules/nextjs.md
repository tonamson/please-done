# Quy tắc Frontend (NextJS App Router)

> Chỉ chứa quy ước riêng. Kiến thức NextJS chuẩn → tra Context7 (`resolve-library-id` → `query-docs`).

## Thư viện giao diện
- **Ant Design v6** (`antd`) — ConfigProvider + AntdRegistry + viVN locale
- **Styling**: inline `style={{}}` — CẤM CSS modules, CẤM Tailwind, CẤM styled-components
- **Theme tokens**: `const { token } = theme.useToken()`
- Section separators: `/* ===== Section ===== */` hoặc `/* ───── Section ───── */`

## Quản lý trạng thái (Zustand)
- File: `use[Name]Store.ts`
- Pattern: `create<State>()(persist((set, get) => ({...}), { name, partialize }))`
- Computed values = functions dùng `get()`, KHÔNG derived state
- JSDoc tiếng Việt cho mỗi action

## Tầng API
- Server-side: `fetchFromApi<T>()` dùng `INTERNAL_API_URL`
- Client-side: native `fetch()` dùng `PUBLIC_API_URL`
- **KHÔNG dùng axios** — chỉ native `fetch`
- Mỗi function: `export async function fetchXxx(): Promise<T>` + JSDoc kèm HTTP method + endpoint
- Admin API: truyền `token: string` param, set `Authorization: Bearer ${token}`

## Trang
- URL kebab-case, mặc định tiếng Anh (chỉ tiếng Việt nếu project đang chuẩn hoá route tiếng Việt)
- `Promise.allSettled` cho parallel data fetching
- TypeScript: `interface` cho data shapes (KHÔNG dùng `type` cho objects)

## Giao diện Admin — Phân quyền
- Mỗi page/menu PHẢI kiểm tra role trước khi render
- Buttons/actions: disable hoặc ẩn nếu user không có role
- KHÔNG để user thao tác rồi mới báo 403 — chặn từ giao diện
- Role/permissions từ JWT hoặc `/auth/me` → lưu `useAuthStore`
- Khi backend thêm Guard/Role mới → frontend PHẢI cập nhật ẩn/hiện tương ứng

## Bảo mật
- XSS: KHÔNG `dangerouslySetInnerHTML`, nếu bắt buộc → DOMPurify
- Token: httpOnly cookie hoặc memory — CẤM localStorage/sessionStorage
- Secrets: CẤM đặt vào `NEXT_PUBLIC_*`
- External links `target="_blank"`: kèm `rel="noopener noreferrer"`

## Build & Lint
- Lint: `npx eslint --fix`
- Build: `npx next build`
- Detect thư mục: Glob `**/next.config.*` → thư mục chứa = frontend root
