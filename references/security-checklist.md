# Bảng kiểm bảo mật khi viết code

> Dùng bởi: write-code (Bước 2 + 4 + 6.5b), fix-bug, test
> Mục đích: (1) Phân tích ngữ cảnh bảo mật TRƯỚC khi viết, (2) Kiểm tra lỗ hổng TRƯỚC khi commit — áp dụng cho MỌI stack

---

## Phần A: Phân tích ngữ cảnh bảo mật (Bước 2 — trước khi viết code)

Trước khi viết code cho mỗi task/endpoint/feature, xác định 3 yếu tố ngữ cảnh. Ghi vào CODE_REPORT mục "Ngữ cảnh bảo mật".

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

Áp dụng quy tắc tương ứng với ngữ cảnh đã xác định ở Phần A.

### B1. Theo loại endpoint

**PUBLIC — Mặt trận công khai:**
- Coi MỌI input là không đáng tin — validate + sanitize tất cả
- Ngăn chặn mọi loại injection (SQL, NoSQL, Command, XSS, Template)
- KHÔNG lộ lỗi nội bộ ra response (stack trace, tên bảng DB, đường dẫn server)
- Thêm rate limiting + chống lạm dụng (brute force, spam, enumeration)
- Tránh lộ dữ liệu nhạy cảm trong response (chỉ trả field cần thiết)

**ADMIN — Khu vực quản trị:**
- Bắt buộc xác thực + phân quyền theo vai trò (RBAC) cho MỌI hành động
- Validate quyền cho từng thao tác nhạy cảm — KHÔNG chỉ check "đã đăng nhập"
- Phòng leo quyền (privilege escalation): user thường không thể tự nâng role
- Ghi audit log cho hành động quan trọng (tạo/sửa/xóa user, thay đổi quyền, thay đổi cấu hình)
- Áp dụng deny-by-default: mặc định từ chối, chỉ cho phép khi có quyền rõ ràng

**INTERNAL — Giao tiếp nội bộ:**
- Vẫn validate input quan trọng — service khác có thể gửi dữ liệu sai do bug
- Không tin dữ liệu client cung cấp qua service trung gian
- Phòng sai cấu hình và lạm dụng nội bộ
- Yêu cầu xác thực service-to-service rõ ràng (API key, mTLS, service token)

### B2. Theo mức nhạy cảm dữ liệu

**CAO:**
- Tối thiểu hóa dữ liệu trong response — chỉ trả field bắt buộc
- Mask/redact field nhạy cảm trong log (password → `***`, token → `...xxxx`)
- KHÔNG lưu dữ liệu nhạy cảm vào log dù ở bất kỳ log level nào
- Áp dụng validation + authorization + audit chặt hơn bình thường
- Cân nhắc mã hóa, quản lý secret, và phòng replay attack khi phù hợp

**TRUNG BÌNH:**
- Bảo vệ truy cập các thao tác nhạy cảm
- Tránh lộ lọt dữ liệu không cần thiết trong response/log

**THẤP:**
- Vẫn tuân thủ mặc định an toàn
- Vẫn KHÔNG tin user input

---

## Phần C: Yêu cầu bảo mật toàn cục (áp dụng MỌI ngữ cảnh)

### C1. Phòng chống tấn công (OWASP Top 10 + bổ sung)

| Loại tấn công | Yêu cầu |
|---------------|---------|
| Injection (SQL, NoSQL, Command, XSS, CSRF, SSRF) | Xem chi tiết Phần D (bảng kiểm kỹ thuật) |
| Unsafe patterns | CẤM `eval()`, raw queries nối chuỗi, unsafe deserialization, `Function()` |
| Hardcode secrets | CẤM — PHẢI dùng biến môi trường |
| DoS / Resource exhaustion | Giới hạn kích thước input, phân trang, timeout cho operations, giới hạn batch size |
| Race conditions | Dùng transaction/lock cho thao tác đọc-ghi trên cùng resource (VD: trừ số dư, tạo đơn hàng) |
| Replay attacks | Nonce + timestamp + message binding cho thao tác nhạy cảm (đặc biệt blockchain) |
| Timing attacks | Dùng constant-time comparison cho password/token/signature |
| Business logic abuse | Kiểm tra luồng nghiệp vụ: bỏ qua bước thanh toán? Lạm dụng coupon? Tự vote? |

### C2. Nguyên tắc thiết kế

- **Quyền tối thiểu (Least Privilege)**: code/service/user chỉ có quyền vừa đủ để hoạt động
- **Mặc định từ chối (Fail-Safe Defaults)**: deny by default — chỉ cho phép khi có quyền rõ ràng
- **Ưu tiên thư viện an toàn**: dùng thư viện chuẩn có default an toàn, KHÔNG tự implement crypto/auth/sanitize
- **Logging + Monitoring**: ghi log các sự kiện liên quan bảo mật (đăng nhập thất bại, truy cập bị từ chối, thay đổi quyền) — KHÔNG log dữ liệu nhạy cảm

### C3. Phân tích bảo mật nâng cao

Áp dụng khi viết code có logic phức tạp, xử lý dữ liệu nhạy cảm, hoặc tương tác nhiều hệ thống.

**Ranh giới hệ thống & vùng tin cậy (Trust Boundaries):**
- Xác định các ranh giới: client ↔ API ↔ database ↔ dịch vụ bên ngoài
- Dữ liệu đi qua ranh giới PHẢI được validate lại — KHÔNG tin dữ liệu chỉ vì nó đến từ service nội bộ
- Ngăn chặn leo thang tin cậy (trust escalation): dữ liệu từ nguồn ít tin cậy (client) KHÔNG được tự động trở thành đáng tin khi truyền qua service trung gian

**Tính nhất quán trạng thái & an toàn giao dịch (State Consistency):**
- Phòng race condition: 2 request đồng thời không được gây sai trạng thái (VD: trừ tiền 2 lần, tạo đơn trùng)
- Phòng thực thi trùng lặp (double execution): dùng idempotency key cho thao tác thay đổi trạng thái (thanh toán, tạo đơn, gửi email)
- Phòng cập nhật dở dang (partial update): dùng transaction/atomic operation — nếu 1 bước fail thì rollback tất cả
- Kiểm tra: "Nếu request này bị gửi 2 lần liên tiếp, kết quả có đúng không?"

**Kiểm soát dữ liệu trả về (Response Data Minimization):**
- Chỉ trả field client thực sự cần — dùng DTO/select để lọc
- KHÔNG trả thừa field "cho tiện" — mỗi field thừa là một rủi ro lộ lọt
- KHÔNG lộ thông tin nội bộ qua error message (tên bảng, đường dẫn file, stack trace, query)
- Kiểm tra: "Nếu response bị lộ ra ngoài, có thông tin nào nhạy cảm không?"

**Dependency bên thứ ba (Third-Party Risk):**
- Giả định mọi thư viện bên ngoài đều có thể có lỗ hổng
- Tránh dependency rủi ro hoặc không cần thiết — ít dependency = ít bề mặt tấn công
- Ưu tiên thư viện được duy trì tốt, có cộng đồng lớn, ít CVE lịch sử
- Khi dùng dependency cho chức năng bảo mật (crypto, auth, sanitize) → PHẢI dùng thư viện chuẩn công nghiệp, KHÔNG tự viết

**An toàn mặc định (Secure-by-Default Design):**
- Mọi truy cập PHẢI bị từ chối trừ khi được cho phép rõ ràng — KHÔNG dựa vào "quên thêm guard = ai cũng vào được"
- Giá trị mặc định PHẢI an toàn ngay cả khi bị cấu hình sai (VD: timeout mặc định, session expiry mặc định, CORS mặc định restrictive)
- Kiểm tra: "Nếu developer quên config một thứ, hệ thống có an toàn mặc định không?"

**An toàn vận hành (Operational Security):**
- Log KHÔNG ĐƯỢC chứa dữ liệu nhạy cảm (password, token, PII, nội dung request body nhạy cảm)
- Log PHẢI có đủ thông tin để phát hiện bất thường: ai (user/service), làm gì (action), khi nào (timestamp), kết quả (success/fail)
- Cân nhắc thêm tín hiệu giám sát (monitoring signals): đếm login fail, đếm request lỗi 4xx/5xx, phát hiện spike bất thường

**Phòng sai sót con người & lạm dụng nội bộ (Human Error & Misuse):**
- Admin/internal function PHẢI có xác nhận (confirmation) cho hành động hủy diệt (xóa tất cả, reset, purge)
- Phòng lạm dụng không cố ý: developer gọi nhầm endpoint production, script chạy nhầm môi trường
- Phòng giả định sai từ client/developer: API KHÔNG dựa vào client "gửi đúng" — validate tất cả dù là internal
- Kiểm tra: "Nếu developer mới join team gọi API này mà không đọc docs, điều tồi tệ nhất có thể xảy ra là gì?"

---

## Phần D: Bảng kiểm kỹ thuật (Bước 6.5b — trước khi commit)

Sau khi viết code xong (Bước 4) và tạo báo cáo (Bước 6), chạy bảng kiểm dưới đây cho các files vừa tạo/sửa. Chỉ kiểm tra mục liên quan đến stack đang dùng.

Nếu phát hiện lỗ hổng → sửa ngay (Quy tắc sai lệch 1-2), ghi vào CODE_REPORT mục "Sai lệch".

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
| SSRF | `fetch()`/`axios`/`http.get()` nhận URL từ user input | Validate URL: whitelist domains, block private IPs (127.0.0.1, 10.x, 192.168.x, 169.254.x), chỉ cho phép HTTPS |

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
| Sensitive data trong client bundle | Grep `process.env` trong files không có `'use server'` — env vars lộ ra client | Chỉ dùng `NEXT_PUBLIC_` prefix cho env client, sensitive vars chỉ dùng trong Server Components/Actions |
| `fetch` thiếu error handling | `fetch()` không check `response.ok` hoặc thiếu try-catch | Wrap trong try-catch, check `response.ok`, hiển thị error state thay vì crash |
| Open redirect | `redirect()` hoặc `router.push()` nhận URL từ user input | Validate URL thuộc whitelist domains, hoặc chỉ cho relative paths |

### 4. Xác thực & phân quyền — backend

| Kiểm tra | Cách phát hiện | Cách sửa |
|----------|---------------|---------|
| API endpoint thiếu guard/middleware | Endpoint mới không có `@UseGuards` (NestJS), `current_user_can()` (WP), middleware auth | Thêm guard/middleware phù hợp |
| Thiếu kiểm tra ownership | Endpoint sửa/xóa resource — chỉ check đăng nhập, không check user có sở hữu resource | Thêm check `resource.userId === currentUser.id` |
| Thiếu rate limiting | Endpoint đăng nhập/đăng ký/quên mật khẩu/OTP không giới hạn tần suất | Thêm throttle: `@Throttle()` (NestJS), plugin (WP), middleware |
| Password lộ trong response | API trả về object user có trường password | Strip password khỏi response: `delete user.password`, DTO exclude |
| Leo quyền (privilege escalation) | User có thể tự thay đổi role/quyền qua API | Tách endpoint thay đổi quyền, chỉ admin mới gọi được, verify role phía server |

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

Khi thêm package/dependency mới trong task:

| Kiểm tra | Cách xác minh |
|----------|--------------|
| Thư viện có được duy trì | Tra Context7 hoặc npm/pub.dev — commit gần đây < 1 năm |
| Lỗ hổng đã biết | `npm audit` (Node), `pip audit` (Python), pub.dev advisories (Flutter) |
| Phạm vi quyền | Package yêu cầu quyền bất thường (network, file system, native code) → ghi chú trong CODE_REPORT |

Nếu không xác minh được → ghi vào CODE_REPORT: "Thêm thư viện [tên] — chưa kiểm tra CVE, cần user verify."

---

## Phần E: Review bảo mật tổng thể (Bước 6.5b — sau bảng kiểm kỹ thuật)

Sau khi chạy bảng kiểm Phần D, thực hiện review tổng thể dựa trên ngữ cảnh đã xác định ở Phần A.

### E1. Phương pháp review

1. **Suy nghĩ như kẻ tấn công** nhắm vào ngữ cảnh cụ thể này:
   - PUBLIC: tấn công từ internet — injection, brute force, enumeration, spam, data scraping
   - ADMIN: tấn công sau khi chiếm tài khoản admin — leo quyền, thay đổi cấu hình, xóa dữ liệu
   - INTERNAL: lạm dụng service — gửi dữ liệu sai, bypass validation, khai thác sai cấu hình

2. **Kiểm tra các kịch bản lạm dụng nghiệp vụ** (không chỉ kỹ thuật):
   - Spam: gửi request lặp lại gây tốn tài nguyên (email, SMS, notification)
   - Bypass: bỏ qua bước thanh toán, bỏ qua verification, truy cập trước khi approve
   - Race condition: gửi 2 request đồng thời để trừ tiền 1 lần nhưng nhận 2 lần
   - Replay: gửi lại request cũ đã thành công (đặc biệt giao dịch tài chính/blockchain)
   - Data leakage: lộ dữ liệu qua error message, response thừa field, timing difference
   - Enumeration: đoán ID/email/username qua response khác nhau (exists vs not exists)

3. **Verify biện pháp phòng thủ khớp ngữ cảnh**:
   - Biện pháp phòng thủ PHẢI tương xứng với mức rủi ro (PUBLIC + CAO cần phòng thủ mạnh nhất)
   - KHÔNG áp dụng checklist chung chung — kiểm tra cụ thể cho code vừa viết

### E2. Ngưỡng tối thiểu

Nếu review phát hiện ít hơn 3 rủi ro/nhận xét cho endpoint PUBLIC hoặc dữ liệu CAO → review chưa đủ sâu, tiếp tục kiểm tra.

### E3. Ghi kết quả vào CODE_REPORT

Thêm mục "Review bảo mật" vào CODE_REPORT với format:

```markdown
## Review bảo mật
> Ngữ cảnh: [PUBLIC|ADMIN|INTERNAL] | Dữ liệu: [CAO|TRUNG BÌNH|THẤP] | Auth: [JWT|SESSION|API_KEY|SIGNATURE|NONE]

### Rủi ro đã xử lý
| # | Rủi ro | Cách xử lý | Files |
|---|--------|-----------|-------|
| 1 | [mô tả] | [biện pháp đã áp dụng] | [files] |

### Giả định + giới hạn còn lại
- [giả định bảo mật đang dựa vào — VD: "giả định API gateway đã rate limit"]
- [rủi ro chấp nhận được — VD: "chưa có audit log cho action này, cần bổ sung sau"]
```

---

> Bảng kiểm này KHÔNG thay thế rules bảo mật chuyên sâu trong `.planning/rules/[stack].md`. Nó là lớp phân tích ngữ cảnh + kiểm tra nhanh cuối cùng trước khi commit — bắt các lỗ hổng phổ biến mà AI dễ tạo ra.
