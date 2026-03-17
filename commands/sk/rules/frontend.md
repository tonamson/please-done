# Quy tắc Frontend (NextJS App Router)

## Cấu trúc thư mục
    src/
    ├── app/          → Pages (App Router), URL tiếng Việt (san-pham, gio-hang, dat-hang)
    ├── components/   → PascalCase, nhóm theo domain (admin/, product/, cart/, layout/, ui/)
    ├── hooks/        → use[Name].ts (useHydration.ts)
    ├── lib/          → kebab-case utilities (api.ts, admin-api.ts, format.ts, constants.ts)
    ├── stores/       → Zustand: use[Name]Store.ts (useCartStore.ts)
    ├── types/        → kebab-case interfaces (product.ts, cart.ts)

## Component
- Default export cho component chính, named function cho sub-components cùng file
- Props interface ngay trên component: `interface XxxProps { ... }`
- `'use client'` CHỈ khi cần (hooks, state, browser APIs) — Server Components mặc định
- Sub-components nội bộ = named functions cùng file (GridCard, ListCard), KHÔNG tách file riêng
- Section separators: `/* ===== Section ===== */` hoặc `/* ───── Section ───── */`

## UI & Styling
- Ant Design v6 (`antd`) — ConfigProvider + AntdRegistry + viVN locale
- Inline styles `style={{}}` — CẤM CSS modules, CẤM Tailwind, CẤM styled-components
- Theme tokens động qua `const { token } = theme.useToken()`
- Layout dùng antd: Row/Col, Space, Card, Layout (Sider, Content, Header)

## State Management (Zustand)
- File: `use[Name]Store.ts` | Export: `export const use[Name]Store = create<State>()(persist(...))`
- Pattern: `interface State` → `create<State>()(persist((set, get) => ({...}), { name, partialize }))`
- Computed values = functions dùng `get()`, KHÔNG dùng derived state
- JSDoc tiếng Việt cho mỗi action

## API Layer
- Server-side: `fetchFromApi<T>()` dùng `INTERNAL_API_URL` (gọi thẳng backend container)
- Client-side: native `fetch()` dùng `PUBLIC_API_URL` (/api qua Nginx proxy)
- KHÔNG dùng axios — chỉ native `fetch`
- Mỗi function: `export async function fetchXxx(): Promise<T>` + JSDoc kèm HTTP method + endpoint
- Error: try parse `body.message` → `throw new Error('message')` (ngôn ngữ theo backend)
- Admin API: truyền `token: string` param, set `Authorization: Bearer ${token}`

## Pages (App Router)
- URL tiếng Việt kebab-case: `/san-pham/[slug]`, `/gio-hang`, `/dat-hang/xac-nhan`
- `export const dynamic = 'force-dynamic'` khi cần dữ liệu realtime
- `Promise.allSettled` cho parallel data fetching, xử lý từng result riêng
- `export async function generateMetadata()` cho SEO (title, description, OG, canonical)
- Server Components mặc định — `notFound()` cho 404

## TypeScript
- `interface` cho data shapes (KHÔNG dùng `type` cho objects)
- Generic response wrappers: `ApiResponse<T>`, `PaginatedResponse<T>`
- camelCase cho properties, PascalCase cho type/interface names

## Form (antd Form)
- `const [form] = Form.useForm<FormValues>()`
- Validation dùng antd rules: `{ required, pattern, max, message: '...' }` (ngôn ngữ theo dự án, mặc định tiếng Việt)
- Submit handler: `async function handleFinish(values: FormValues)` với try/catch + loading state

## Build & Lint
- Lint: `npx eslint --fix`
- Build: `npx next build`
- Detect thư mục: Glob `**/next.config.*` → thư mục chứa = frontend root
