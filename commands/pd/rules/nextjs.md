# Frontend Rules (NextJS App Router)

> Contains project-specific conventions only. Standard NextJS knowledge → look up via Context7 (`resolve-library-id` → `query-docs`).

## UI library
- **Ant Design v6** (`antd`) — ConfigProvider + AntdRegistry + viVN locale
- **Styling**: inline `style={{}}` — FORBIDDEN CSS modules, FORBIDDEN Tailwind, FORBIDDEN styled-components
- **Theme tokens**: `const { token } = theme.useToken()`
- Section separators: `/* ===== Section ===== */` or `/* ───── Section ───── */`

## State management (Zustand)
- File: `use[Name]Store.ts`
- Pattern: `create<State>()(persist((set, get) => ({...}), { name, partialize }))`
- Computed values = functions using `get()`, NOT derived state
- JSDoc in English for each action

## API layer
- Server-side: `fetchFromApi<T>()` using `INTERNAL_API_URL`
- Client-side: native `fetch()` using `PUBLIC_API_URL`
- **DO NOT use axios** — native `fetch` only
- Each function: `export async function fetchXxx(): Promise<T>` + JSDoc with HTTP method + endpoint
- Admin API: pass `token: string` param, set `Authorization: Bearer ${token}`

## Pages
- URL kebab-case, default English (only Vietnamese if the project standardizes Vietnamese routes)
- `Promise.allSettled` for parallel data fetching
- TypeScript: `interface` for data shapes (DO NOT use `type` for objects)

## Admin UI — Authorization
- Every page/menu MUST check role before rendering
- Buttons/actions: disable or hide if user does not have the role
- DO NOT let users perform actions then show 403 — block from the UI level
- Role/permissions from JWT or `/auth/me` → store in `useAuthStore`
- When backend adds new Guard/Role → frontend MUST update show/hide accordingly

## Security
- XSS: DO NOT use `dangerouslySetInnerHTML`, if absolutely necessary → DOMPurify
- Token: httpOnly cookie or memory — FORBIDDEN localStorage/sessionStorage
- Secrets: FORBIDDEN in `NEXT_PUBLIC_*`
- External links `target="_blank"`: include `rel="noopener noreferrer"`

## Build and lint
- Lint: `npx eslint --fix`
- Build: `npx next build`
- Detection: Glob `**/next.config.*` → containing directory is the frontend root
