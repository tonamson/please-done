# Security Checklist for Writing Code

> Used by: write-code (Step 2 + 4 + 6.5b), fix-bug, test
> (1) Analyze security context BEFORE writing, (2) Check vulnerabilities BEFORE commit — ALL stacks

---

## Part A: Security Context Analysis (Step 2 — before writing code)

Identify 3 context factors for each task/endpoint/feature. Record in CODE_REPORT under "Security context".

### A1. Endpoint Type

| Type | Description | Assumption |
|------|-------------|------------|
| **PUBLIC** | Anyone on the internet can call | All input may be malicious. Attacker has partial knowledge of the system |
| **ADMIN** | Only authenticated administrators | Still needs defense — admin accounts can be compromised, or insider threat |
| **INTERNAL** | Service-to-service communication | Don't trust client-provided data. Defend against misconfiguration and internal abuse |

### A2. Data Sensitivity Level

| Level | Examples | Requirements |
|-------|---------|-------------|
| **HIGH** | Passwords, tokens, payment information, private keys, medical/legal data | Minimize exposure in response/log/error. Encrypt if needed. Strict access control |
| **MEDIUM** | Email, phone number, transaction history, private content | Protect access, avoid unnecessary exposure |
| **LOW** | Public data, general display content | Still follow safe defaults, don't trust user input |

### A3. Authentication Type

| Type | Check Rules |
|------|-------------|
| **JWT** | Verify signature, expiration (exp), issuer (iss), audience (aud). DO NOT trust unverified or weakly verified tokens |
| **SESSION** | Defend against session fixation, CSRF, cookie flags (httpOnly, Secure, SameSite), invalidate session on logout |
| **API_KEY** | Validate scope + permissions of key. DO NOT expose key in logs or response |
| **SIGNATURE** | Verify signature, nonce, timestamp, replay protection, message binding (chainid + address for blockchain) |
| **NONE** | MUST have clear reason why authentication is not needed — record in CODE_REPORT |

---

## Part B: Context-Based Security Rules (Step 4 — while writing code)

Apply rules corresponding to Part A context.

### B1. By Endpoint Type

**PUBLIC:**
- ALL input → validate + sanitize
- Prevent all injection (SQL, NoSQL, Command, XSS, Template)
- DO NOT expose internal errors in response (stack trace, DB table names, server paths)
- Rate limiting + anti brute force, spam, enumeration
- Response returns only necessary fields

**ADMIN:**
- Mandatory authentication + RBAC for ALL actions
- Validate permissions per operation — DO NOT just check "logged in"
- Defend against privilege escalation: regular user cannot self-elevate role
- Audit log for critical actions (create/edit/delete user, change permissions/config)
- Deny-by-default: default deny, only allow when explicit permission exists

**INTERNAL:**
- Still validate input — other services may send incorrect data due to bugs
- Don't trust client data through intermediary services
- Explicit service-to-service authentication (API key, mTLS, service token)

### B2. By Data Sensitivity Level

**HIGH:**
- Response returns only required fields
- Mask/redact in logs (password → `***`, token → `...xxxx`)
- DO NOT store sensitive data in logs
- Validation + authorization + audit stricter than normal
- Consider encryption, secret management, replay attack prevention

**MEDIUM:** Protect access, avoid unnecessary exposure in response/log.

**LOW:** Still follow safe defaults, DO NOT trust user input.

---

## Part C: Global Security Requirements (ALL contexts)

### C1. Attack Prevention (OWASP Top 10+)

| Attack Type | Requirement |
|-------------|------------|
| Injection (SQL, NoSQL, Command, XSS, CSRF, SSRF) | See Part D details (technical checklist) |
| Unsafe patterns | FORBIDDEN `eval()`, raw string-concatenated queries, unsafe deserialization, `Function()` |
| Hardcoded secrets | FORBIDDEN — MUST use environment variables |
| DoS / Resource exhaustion | Limit input size, pagination, timeout, limit batch size |
| Race conditions | Transaction/lock for read-write operations on same resource |
| Replay attacks | Nonce + timestamp + message binding for sensitive operations (especially blockchain) |
| Timing attacks | Constant-time comparison for password/token/signature |
| Business logic abuse | Check business flow: bypassing payment? Coupon abuse? Self-voting? |

### C2. Design Principles

- **Least privilege**: code/service/user only has minimum necessary permissions
- **Deny by default**: deny by default
- **Prefer safe libraries**: DO NOT self-implement crypto/auth/sanitize
- **Logging**: record security events (login failure, access denied, permission changes) — DO NOT log sensitive data

### C3. Advanced Security Analysis

Apply when logic is complex, data is sensitive, or multiple systems interact.

**Trust Boundaries:**
- Boundaries: client ↔ API ↔ database ↔ external services
- Data crossing boundaries MUST be re-validated — DO NOT trust data from internal services
- Prevent trust escalation: data from less trusted source does NOT automatically become trusted through intermediary services

**State Consistency:**
- Defend against race conditions: 2 concurrent requests must not cause incorrect state
- Idempotency key for state-changing operations (payment, order creation, email sending)
- Transaction/atomic — 1 step fails → rollback all
- Verify: "Request sent twice → correct result?"

**Response Data Minimization:**
- Return only fields client needs — use DTO/select
- DO NOT return extra fields — each extra field = data exposure risk
- DO NOT expose internal information via error messages
- Verify: "Response leaked → contains sensitive information?"

**Third-Party Risk:**
- Assume external libraries may have vulnerabilities
- Fewer dependencies = smaller attack surface
- Security functions (crypto, auth, sanitize) → MUST use standard libraries, DO NOT self-implement

**Secure-by-Default:**
- All access MUST be denied unless explicitly allowed
- Default values MUST be safe when misconfigured
- Verify: "Developer forgets config → system still secure?"

**Operational Security:**
- Logs MUST NOT contain sensitive data
- Logs MUST have: who, what, when, outcome
- Consider monitoring: count login failures, 4xx/5xx error requests, unusual spikes

**Human Error & Misuse:**
- Admin functions MUST have confirmation for destructive actions
- Defend against accidental production endpoint calls, wrong-environment scripts
- API MUST NOT rely on client "sending correctly" — validate everything
- Verify: "New developer calls API without reading docs → worst case scenario?"

---

## Part D: Technical Checklist (Step 6.5b — before commit)

Run checklist on files just created/modified. Only check items relevant to current stack.
Vulnerability found → fix immediately (Deviation Rules 1-2), record in CODE_REPORT under "Deviations".

### 1. Secrets — all stacks

| Check | How to detect | How to fix |
|-------|--------------|-----------|
| Hardcoded password/key/token in code | Grep `password\|secret\|api_key\|token\|private_key` in source — if assigning fixed string value (not env variable) | Move to environment variable + add key to `.env.example` |
| Committing sensitive files | Check `git diff --cached` contains `.env`, `*.pem`, `*.key` | Remove from staging, add to `.gitignore` |
| Logs containing sensitive data | Grep `console.log\|logger\.\|print\(` near password/token variables | Remove or replace with `***` |

### 2. Injection — backend + database

| Check | How to detect | How to fix |
|-------|--------------|-----------|
| SQL injection | Query concatenating user input: `` `SELECT * FROM ${table} WHERE id = ${id}` `` | Use parameterized: `$wpdb->prepare()` (WP), `@Param` (TypeORM), `$1` (Prisma raw) |
| NoSQL injection | MongoDB query receiving object from user: `{ username: req.body.username }` without type validation | Validate type first: `typeof input === 'string'` |
| Command injection | `exec()`, `execSync()`, `child_process` receiving user input | Use `execFile()` with args array, DO NOT concatenate strings |
| `eval()` / `Function()` | Grep `eval\(\|new Function\(` receiving dynamic input | Replace with JSON.parse, switch-case, or alternatives |
| SSRF | `fetch()`/`axios`/`http.get()` receiving URL from user input | Validate URL: whitelist domains, block private IPs (127.0.0.1, 10.x, 192.168.x, 169.254.x), HTTPS only |

### 3. XSS — frontend + CMS

| Check | How to detect | How to fix |
|-------|--------------|-----------|
| `dangerouslySetInnerHTML` without sanitize | Grep `dangerouslySetInnerHTML` — data from API/user without DOMPurify | Add `DOMPurify.sanitize()` before rendering |
| Echo raw data (WordPress) | Grep `echo \$\|print \$` without `esc_html\|esc_attr\|esc_url` preceding | Wrap with appropriate escape function |
| Template injection | User input displayed in HTML attribute without escaping | Use `esc_attr()` (WP), template engine auto-escape (React JSX auto-escapes) |

### 3.5. NextJS / React frontend

| Check | How to detect | How to fix |
|-------|--------------|-----------|
| Server Action receives unvalidated input | Grep `'use server'` → check if function params are validated (zod/class-validator) before processing | Add schema validation (zod) at start of each Server Action |
| URL query/params injection | `searchParams` or `params` used directly in query/redirect without validation | Validate + sanitize before use: `z.string().parse()`, whitelist redirect URLs |
| Client-side auth bypass | UI show/hide logic based on client state without server-side check | MANDATORY server-side permission check (middleware/API), UI is just UX — not security |
| Sensitive data in client bundle | Grep `process.env` in files without `'use server'` — env vars exposed to client | Only use `NEXT_PUBLIC_` prefix for client env, sensitive vars only in Server Components/Actions |
| `fetch` without error handling | `fetch()` not checking `response.ok` or missing try-catch | Wrap in try-catch, check `response.ok`, show error state instead of crashing |
| Open redirect | `redirect()` or `router.push()` receiving URL from user input | Validate URL belongs to whitelisted domains, or use relative paths only |

### 4. Authentication & Authorization — backend

| Check | How to detect | How to fix |
|-------|--------------|-----------|
| API endpoint missing guard/middleware | New endpoint without `@UseGuards` (NestJS), `current_user_can()` (WP), auth middleware | Add appropriate guard/middleware |
| Missing ownership check | Endpoint modifies/deletes resource — only checks login, not user ownership | Add check `resource.userId === currentUser.id` |
| Missing rate limiting | Login/register/forgot-password/OTP endpoint without rate limiting | Add throttle: `@Throttle()` (NestJS), plugin (WP), middleware |
| Password exposed in response | API returns user object with password field | Strip password: `delete user.password`, DTO exclude |
| Privilege escalation | User self-changes role/permissions via API | Separate permission-change endpoint, admin-only, verify role server-side |

### 5. CSRF & tokens — frontend + backend

| Check | How to detect | How to fix |
|-------|--------------|-----------|
| Token stored in localStorage/sessionStorage | Grep `localStorage.setItem\|sessionStorage.setItem` with token/jwt | Switch to httpOnly cookie or memory (Zustand store) |
| Data-changing form missing CSRF | POST/PUT/DELETE form without nonce (WP) or CSRF token | WP: `wp_nonce_field()`. SPA: backend sets CSRF cookie + frontend sends header |
| Token sent via URL query | Grep `\?token=\|&token=` in API calls | Switch to `Authorization: Bearer` header |
| External link missing rel | Grep `target="_blank"` without `rel="noopener noreferrer"` | Add `rel="noopener noreferrer"` |

### 6. Solidity — smart contracts

| Check | How to detect | How to fix |
|-------|--------------|-----------|
| Transfer missing `nonReentrant` | Function has `.call{value:}` or `.safeTransfer` without `nonReentrant` modifier | Add `nonReentrant` modifier |
| Admin function missing access control | Function changes sensitive state without `onlyOwner`/`onlyRole` | Add appropriate modifier |
| `tx.origin` used for authentication | Grep `tx.origin` | Replace with `msg.sender` |
| Missing input validation | Function receives amount/qty without checking `> 0`, address without checking `!= address(0)` | Add require checks |
| Unbounded array loop | Loop over storage array without length limit | Add `require(arr.length <= MAX)` or pagination |
| Missing rescue functions | Contract receives token/ETH without `clearUnknownToken`/`rescueETH` | Add rescue functions (see solidity.md) |
| Missing slippage protection | Swap/trade function without `_minAmountOut` parameter | Add slippage parameter |

### 7. Flutter / Mobile

| Check | How to detect | How to fix |
|-------|--------------|-----------|
| Token stored in SharedPreferences | Grep `GetStorage\|SharedPreferences` with token/password | Switch to `flutter_secure_storage` |
| Hardcoded API URL | Grep `http://\|https://` directly in source (not via env) | Switch to `flutter_dotenv` or `--dart-define` |
| Notification payload not validated | Navigating directly from raw notification data | Validate payload type + value before navigation |
| Debug mode in release | Grep `kDebugMode\|debugPrint` in production code | Wrap in `if (kDebugMode)` or remove |

### 8. New Libraries

When adding new package/dependency:

| Check | How to verify |
|-------|--------------|
| Library is maintained | Check Context7 or npm/pub.dev — recent commit < 1 year |
| Known vulnerabilities | `npm audit` (Node), `pip audit` (Python), pub.dev advisories (Flutter) |
| Permission scope | Package requires unusual permissions (network, file system, native code) → note in CODE_REPORT |

Cannot verify → record in CODE_REPORT: "Added library [name] — CVE not checked, needs user verification."

---

## Part E: Overall Security Review (Step 6.5b — after technical checklist)

### E1. Review Method

1. **Think like an attacker** according to context:
   - PUBLIC: injection, brute force, enumeration, spam, data scraping
   - ADMIN: privilege escalation, configuration changes, data deletion
   - INTERNAL: sending incorrect data, bypassing validation, exploiting misconfiguration

2. **Business logic abuse scenarios:**
   - Spam: repeated requests consuming resources
   - Bypass: skipping payment/verification
   - Race condition: 2 concurrent requests → charged once, received twice
   - Replay: resending old requests (especially blockchain)
   - Data leakage: exposure via error messages, extra response fields, timing
   - Enumeration: guessing ID/email through different responses

3. **Verify defenses match context:**
   - Defenses MUST match risk level (PUBLIC + HIGH = strongest defense)
   - Check specifically for code just written, NOT generic checklist

### E2. Minimum Threshold

Review finds <3 risks for PUBLIC endpoint or HIGH data → not deep enough, continue.

### E3. Record Results in CODE_REPORT

```markdown
## Security Review
> Context: [PUBLIC|ADMIN|INTERNAL] | Data: [HIGH|MEDIUM|LOW] | Auth: [JWT|SESSION|API_KEY|SIGNATURE|NONE]

### Risks Handled
| # | Risk | How handled | Files |
|---|------|------------|-------|
| 1 | [description] | [measures applied] | [files] |

### Assumptions + Remaining Limitations
- [security assumption — e.g.: "assumed API gateway already rate limits"]
- [accepted risk — e.g.: "no audit log yet, needs to be added later"]
```

---

> This checklist DOES NOT replace in-depth security rules in `.planning/rules/[stack].md`. It is a context analysis layer + final quick check before commit — catching common vulnerabilities that AI tends to create.
