# Bảng kiểm bảo mật khi viết code

> Dùng bởi: write-code (Bước 2 + 4 + 6.5b), fix-bug, test
> (1) Phân tích ngữ cảnh bảo mật TRƯỚC khi viết, (2) Kiểm tra lỗ hổng TRƯỚC khi commit — MỌI stack

---

## Phần A: Phân tích ngữ cảnh bảo mật (Bước 2 — trước khi viết code)

Xác định 3 yếu tố ngữ cảnh cho mỗi task/endpoint/feature. Ghi vào CODE_REPORT mục "Ngữ cảnh bảo mật".

### A1. Loại endpoint

| Loại | Mô tả | Giả định |
|------|-------|----------|
| **PUBLIC** | Bất kỳ ai trên internet có thể gọi | Mọi input đều có thể độc hại. Kẻ tấn công có hiểu biết một phần về hệ thống |
| **ADMIN** | Chỉ người quản trị đã xác thực | Vẫn cần phòng thủ — admin có thể bị chiếm tài khoản, hoặc insider threat |
| **INTERNAL** | Giao tiếp service-to-service | Không tin tưởng dữ liệu client cung cấp. Phòng sai cấu hình và lạm dụng nội bộ |

### A2. Mức độ nhạy cảm dữ liệu

| Mức | Ví dụ | Yêu cầu |
|-----|-------|---------|
| **CAO** | Mật khẩu, token, thông tin thanh toán, private key, dữ liệu y tế/pháp lý | Tối thiểu hóa lộ lọt trong response/log/error. Mã hóa nếu cần. Kiểm soát truy cập chặt |
| TRUNG BÌNH | Email, số điện thoại, lịch sử giao dịch, nội dung riêng tư | Bảo vệ truy cập, tránh lộ lọt không cần thiết |
| THẤP | Dữ liệu công khai, nội dung hiển thị chung | Vẫn tuân thủ mặc định an toàn, không tin user input |

### A3. Loại xác thực

| Loại | Quy tắc kiểm tra |
|------|------------------|
| **JWT** | Verify chữ ký, hạn (exp), issuer (iss), audience (aud). KHÔNG tin token chưa verify hoặc verify yếu |
| **SESSION** | Phòng session fixation, CSRF, cookie flags (httpOnly, Secure, SameSite), hủy session khi logout |
| **API_KEY** | Validate scope + quyền của key. KHÔNG lộ key trong log hoặc response |
| **SIGNATURE** | Verify chữ ký, nonce, timestamp, replay protection, message binding (chainid + address cho blockchain) |
| **NONE** | PHẢI có lý do rõ ràng tại sao không cần xác thực — ghi vào CODE_REPORT |

---

## Phần B: Quy tắc bảo mật theo ngữ cảnh (Bước 4 — khi viết code)

Áp dụng quy tắc tương ứng ngữ cảnh Phần A.

### B1. Theo loại endpoint

**PUBLIC:**
- MỌI input → validate + sanitize
- Ngăn chặn mọi injection (SQL, NoSQL, Command, XSS, Template)
- KHÔNG lộ lỗi nội bộ ra response (stack trace, tên bảng DB, đường dẫn server)
- Rate limiting + chống brute force, spam, enumeration
- Response chỉ trả field cần thiết

**ADMIN:**
- Bắt buộc xác thực + RBAC cho MỌI hành động
- Validate quyền từng thao tác — KHÔNG chỉ check "đã đăng nhập"
- Phòng leo quyền: user thường không tự nâng role
- Audit log cho hành động quan trọng (tạo/sửa/xóa user, thay đổi quyền/cấu hình)
- Deny-by-default: mặc định từ chối, chỉ cho phép khi có quyền rõ ràng

**INTERNAL:**
- Vẫn validate input — service khác có thể gửi sai do bug
- Không tin dữ liệu client qua service trung gian
- Xác thực service-to-service rõ ràng (API key, mTLS, service token)

### B2. Theo mức nhạy cảm dữ liệu

**CAO:**
- Response chỉ trả field bắt buộc
- Mask/redact trong log (password → `***`, token → `...xxxx`)
- KHÔNG lưu dữ liệu nhạy cảm vào log
- Validation + authorization + audit chặt hơn bình thường
- Cân nhắc mã hóa, quản lý secret, phòng replay attack

**TRUNG BÌNH:** Bảo vệ truy cập, tránh lộ lọt không cần thiết trong response/log.

**THẤP:** Vẫn tuân thủ mặc định an toàn, KHÔNG tin user input.

---

## Phần C: Yêu cầu bảo mật toàn cục (MỌI ngữ cảnh)

### C1. Phòng chống tấn công (OWASP Top 10+)

| Loại tấn công | Yêu cầu |
|---------------|---------|
| Injection (SQL, NoSQL, Command, XSS, CSRF, SSRF) | Xem chi tiết Phần D (bảng kiểm kỹ thuật) |
| Unsafe patterns | CẤM `eval()`, raw queries nối chuỗi, unsafe deserialization, `Function()` |
| Hardcode secrets | CẤM — PHẢI dùng biến môi trường |
| DoS / Resource exhaustion | Giới hạn kích thước input, phân trang, timeout, giới hạn batch size |
| Race conditions | Transaction/lock cho thao tác đọc-ghi trên cùng resource |
| Replay attacks | Nonce + timestamp + message binding cho thao tác nhạy cảm (đặc biệt blockchain) |
| Timing attacks | Constant-time comparison cho password/token/signature |
| Business logic abuse | Kiểm tra luồng nghiệp vụ: bỏ qua thanh toán? Lạm dụng coupon? Tự vote? |

### C2. Nguyên tắc thiết kế

- **Quyền tối thiểu**: code/service/user chỉ có quyền vừa đủ
- **Mặc định từ chối**: deny by default
- **Ưu tiên thư viện an toàn**: KHÔNG tự implement crypto/auth/sanitize
- **Logging**: ghi sự kiện bảo mật (login fail, truy cập bị từ chối, thay đổi quyền) — KHÔNG log dữ liệu nhạy cảm

### C3. Phân tích bảo mật nâng cao

Áp dụng khi logic phức tạp, dữ liệu nhạy cảm, hoặc tương tác nhiều hệ thống.

**Trust Boundaries:**
- Ranh giới: client ↔ API ↔ database ↔ dịch vụ ngoài
- Dữ liệu qua ranh giới PHẢI validate lại — KHÔNG tin dữ liệu từ service nội bộ
- Ngăn trust escalation: dữ liệu từ nguồn ít tin cậy KHÔNG tự động đáng tin qua service trung gian

**State Consistency:**
- Phòng race condition: 2 request đồng thời không gây sai trạng thái
- Idempotency key cho thao tác thay đổi trạng thái (thanh toán, tạo đơn, gửi email)
- Transaction/atomic — 1 bước fail → rollback tất cả
- Kiểm tra: "Request gửi 2 lần → kết quả đúng?"

**Response Data Minimization:**
- Chỉ trả field client cần — dùng DTO/select
- KHÔNG trả thừa field — mỗi field thừa = rủi ro lộ lọt
- KHÔNG lộ thông tin nội bộ qua error message
- Kiểm tra: "Response bị lộ → có thông tin nhạy cảm?"

**Third-Party Risk:**
- Giả định thư viện ngoài có thể có lỗ hổng
- Ít dependency = ít bề mặt tấn công
- Chức năng bảo mật (crypto, auth, sanitize) → PHẢI dùng thư viện chuẩn, KHÔNG tự viết

**Secure-by-Default:**
- Mọi truy cập PHẢI bị từ chối trừ khi cho phép rõ ràng
- Giá trị mặc định PHẢI an toàn khi bị cấu hình sai
- Kiểm tra: "Developer quên config → hệ thống vẫn an toàn?"

**Operational Security:**
- Log KHÔNG chứa dữ liệu nhạy cảm
- Log PHẢI có: ai, làm gì, khi nào, kết quả
- Cân nhắc monitoring: đếm login fail, request lỗi 4xx/5xx, spike bất thường

**Human Error & Misuse:**
- Admin function PHẢI có confirmation cho hành động hủy diệt
- Phòng gọi nhầm endpoint production, script nhầm môi trường
- API KHÔNG dựa vào client "gửi đúng" — validate tất cả
- Kiểm tra: "Developer mới gọi API không đọc docs → điều tồi tệ nhất?"

---

## Phần D: Bảng kiểm kỹ thuật (Bước 6.5b — trước khi commit)

Chạy bảng kiểm cho files vừa tạo/sửa. Chỉ kiểm mục liên quan stack đang dùng.
Phát hiện lỗ hổng → sửa ngay (Quy tắc sai lệch 1-2), ghi CODE_REPORT mục "Sai lệch".

### 1. Secrets — mọi stack

| Kiểm tra | Cách phát hiện | Cách sửa |
|----------|---------------|---------|
| Hardcode mật khẩu/key/token trong code | Grep `password\|secret\|api_key\|token\|private_key` trong source — nếu gán giá trị chuỗi cố định (không phải biến env) | Chuyển sang biến môi trường + thêm key vào `.env.example` |
| Commit file nhạy cảm | Kiểm tra `git diff --cached` có chứa `.env`, `*.pem`, `*.key` | Bỏ khỏi staging, thêm vào `.gitignore` |
| Log chứa dữ liệu nhạy cảm | Grep `console.log\|logger\.\|print\(` gần biến password/token | Xóa hoặc thay bằng `***` |

### 2. Injection — backend + database

| Kiểm tra | Cách phát hiện | Cách sửa |
|----------|---------------|---------|
| SQL injection | Query nối chuỗi user input: `` `SELECT * FROM ${table} WHERE id = ${id}` `` | Dùng parameterized: `$wpdb->prepare()` (WP), `@Param` (TypeORM), `$1` (Prisma raw) |
| NoSQL injection | MongoDB query nhận object từ user: `{ username: req.body.username }` mà không validate type | Validate type trước: `typeof input === 'string'` |
| Command injection | `exec()`, `execSync()`, `child_process` nhận user input | Dùng `execFile()` với mảng args, KHÔNG nối chuỗi |
| `eval()` / `Function()` | Grep `eval\(\|new Function\(` nhận input động | Thay bằng JSON.parse, switch-case, hoặc cách khác |
| SSRF | `fetch()`/`axios`/`http.get()` nhận URL từ user input | Validate URL: whitelist domains, block private IPs (127.0.0.1, 10.x, 192.168.x, 169.254.x), chỉ HTTPS |

### 3. XSS — frontend + CMS

| Kiểm tra | Cách phát hiện | Cách sửa |
|----------|---------------|---------|
| `dangerouslySetInnerHTML` không sanitize | Grep `dangerouslySetInnerHTML` — data từ API/user mà không qua DOMPurify | Thêm `DOMPurify.sanitize()` trước khi render |
| Echo raw data (WordPress) | Grep `echo \$\|print \$` mà không có `esc_html\|esc_attr\|esc_url` phía trước | Wrap bằng hàm escape phù hợp |
| Template injection | User input hiển thị trong HTML attribute mà không escape | Dùng `esc_attr()` (WP), template engine auto-escape (React JSX tự escape) |

### 3.5. NextJS / React frontend

| Kiểm tra | Cách phát hiện | Cách sửa |
|----------|---------------|---------|
| Server Action nhận input không validate | Grep `'use server'` → kiểm tra function params có validate (zod/class-validator) trước khi xử lý | Thêm schema validation (zod) ở đầu mỗi Server Action |
| URL query/params injection | `searchParams` hoặc `params` dùng trực tiếp trong query/redirect mà không validate | Validate + sanitize trước khi dùng: `z.string().parse()`, whitelist redirect URLs |
| Client-side auth bypass | Logic ẩn/hiện UI dựa trên state client mà không check server-side | BẮT BUỘC check quyền ở server (middleware/API), UI chỉ là UX — không phải security |
| Sensitive data trong client bundle | Grep `process.env` trong files không có `'use server'` — env vars lộ ra client | Chỉ dùng `NEXT_PUBLIC_` prefix cho env client, sensitive vars chỉ trong Server Components/Actions |
| `fetch` thiếu error handling | `fetch()` không check `response.ok` hoặc thiếu try-catch | Wrap trong try-catch, check `response.ok`, hiển thị error state thay vì crash |
| Open redirect | `redirect()` hoặc `router.push()` nhận URL từ user input | Validate URL thuộc whitelist domains, hoặc chỉ relative paths |

### 4. Xác thực & phân quyền — backend

| Kiểm tra | Cách phát hiện | Cách sửa |
|----------|---------------|---------|
| API endpoint thiếu guard/middleware | Endpoint mới không có `@UseGuards` (NestJS), `current_user_can()` (WP), middleware auth | Thêm guard/middleware phù hợp |
| Thiếu kiểm tra ownership | Endpoint sửa/xóa resource — chỉ check đăng nhập, không check user sở hữu resource | Thêm check `resource.userId === currentUser.id` |
| Thiếu rate limiting | Endpoint đăng nhập/đăng ký/quên mật khẩu/OTP không giới hạn tần suất | Thêm throttle: `@Throttle()` (NestJS), plugin (WP), middleware |
| Password lộ trong response | API trả về object user có trường password | Strip password: `delete user.password`, DTO exclude |
| Leo quyền (privilege escalation) | User tự thay đổi role/quyền qua API | Tách endpoint thay đổi quyền, chỉ admin gọi được, verify role phía server |

### 5. CSRF & token — frontend + backend

| Kiểm tra | Cách phát hiện | Cách sửa |
|----------|---------------|---------|
| Token lưu localStorage/sessionStorage | Grep `localStorage.setItem\|sessionStorage.setItem` kèm token/jwt | Chuyển sang httpOnly cookie hoặc memory (Zustand store) |
| Form thay đổi dữ liệu thiếu CSRF | Form POST/PUT/DELETE không có nonce (WP) hoặc CSRF token | WP: `wp_nonce_field()`. SPA: backend set CSRF cookie + frontend gửi header |
| Token gửi qua URL query | Grep `\?token=\|&token=` trong API call | Chuyển sang header `Authorization: Bearer` |
| External link thiếu rel | Grep `target="_blank"` không kèm `rel="noopener noreferrer"` | Thêm `rel="noopener noreferrer"` |

### 6. Solidity — smart contract

| Kiểm tra | Cách phát hiện | Cách sửa |
|----------|---------------|---------|
| Transfer thiếu `nonReentrant` | Function có `.call{value:}` hoặc `.safeTransfer` mà không có modifier `nonReentrant` | Thêm `nonReentrant` modifier |
| Admin function thiếu access control | Function thay đổi state nhạy cảm mà không có `onlyOwner`/`onlyRole` | Thêm modifier phù hợp |
| `tx.origin` dùng cho xác thực | Grep `tx.origin` | Thay bằng `msg.sender` |
| Thiếu input validation | Function nhận amount/qty mà không check `> 0`, address mà không check `!= address(0)` | Thêm require checks |
| Loop unbounded array | Vòng lặp qua storage array không giới hạn length | Thêm `require(arr.length <= MAX)` hoặc phân trang |
| Thiếu rescue functions | Contract nhận token/ETH mà không có `clearUnknownToken`/`rescueETH` | Thêm rescue functions (xem solidity.md) |
| Thiếu slippage protection | Swap/trade function không có `_minAmountOut` parameter | Thêm slippage parameter |

### 7. Flutter / Mobile

| Kiểm tra | Cách phát hiện | Cách sửa |
|----------|---------------|---------|
| Token lưu SharedPreferences | Grep `GetStorage\|SharedPreferences` kèm token/password | Chuyển sang `flutter_secure_storage` |
| Hardcode API URL | Grep `http://\|https://` trực tiếp trong source (không qua env) | Chuyển sang `flutter_dotenv` hoặc `--dart-define` |
| Notification payload không validate | Navigate trực tiếp từ raw notification data | Validate payload type + giá trị trước khi navigate |
| Debug mode trong release | Grep `kDebugMode\|debugPrint` trong code production | Wrap trong `if (kDebugMode)` hoặc xóa |

### 8. Thư viện mới

Khi thêm package/dependency mới:

| Kiểm tra | Cách xác minh |
|----------|--------------|
| Thư viện có được duy trì | Tra Context7 hoặc npm/pub.dev — commit gần đây < 1 năm |
| Lỗ hổng đã biết | `npm audit` (Node), `pip audit` (Python), pub.dev advisories (Flutter) |
| Phạm vi quyền | Package yêu cầu quyền bất thường (network, file system, native code) → ghi chú trong CODE_REPORT |

Không xác minh được → ghi CODE_REPORT: "Thêm thư viện [tên] — chưa kiểm tra CVE, cần user verify."

---

## Phần E: Review bảo mật tổng thể (Bước 6.5b — sau bảng kiểm kỹ thuật)

### E1. Phương pháp review

1. **Suy nghĩ như kẻ tấn công** theo ngữ cảnh:
   - PUBLIC: injection, brute force, enumeration, spam, data scraping
   - ADMIN: leo quyền, thay đổi cấu hình, xóa dữ liệu
   - INTERNAL: gửi dữ liệu sai, bypass validation, khai thác sai cấu hình

2. **Kịch bản lạm dụng nghiệp vụ:**
   - Spam: request lặp lại gây tốn tài nguyên
   - Bypass: bỏ qua thanh toán/verification
   - Race condition: 2 request đồng thời → trừ tiền 1 lần, nhận 2 lần
   - Replay: gửi lại request cũ (đặc biệt blockchain)
   - Data leakage: lộ qua error message, response thừa field, timing
   - Enumeration: đoán ID/email qua response khác nhau

3. **Verify phòng thủ khớp ngữ cảnh:**
   - Phòng thủ PHẢI tương xứng mức rủi ro (PUBLIC + CAO = phòng thủ mạnh nhất)
   - Kiểm tra cụ thể cho code vừa viết, KHÔNG checklist chung chung

### E2. Ngưỡng tối thiểu

Review phát hiện <3 rủi ro cho endpoint PUBLIC hoặc dữ liệu CAO → chưa đủ sâu, tiếp tục.

### E3. Ghi kết quả vào CODE_REPORT

```markdown
## Review bảo mật
> Ngữ cảnh: [PUBLIC|ADMIN|INTERNAL] | Dữ liệu: [CAO|TRUNG BÌNH|THẤP] | Auth: [JWT|SESSION|API_KEY|SIGNATURE|NONE]

### Rủi ro đã xử lý
| # | Rủi ro | Cách xử lý | Files |
|---|--------|-----------|-------|
| 1 | [mô tả] | [biện pháp đã áp dụng] | [files] |

### Giả định + giới hạn còn lại
- [giả định bảo mật — VD: "giả định API gateway đã rate limit"]
- [rủi ro chấp nhận — VD: "chưa có audit log, cần bổ sung sau"]
```

---

> Bảng kiểm này KHÔNG thay thế rules bảo mật chuyên sâu trong `.planning/rules/[stack].md`. Nó là lớp phân tích ngữ cảnh + kiểm tra nhanh cuối cùng trước khi commit — bắt các lỗ hổng phổ biến mà AI dễ tạo ra.
