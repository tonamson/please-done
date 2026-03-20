# Please Done — "Làm ơn, xong cái!"

> Bộ kỹ năng miễn phí cho công cụ lập trình AI — biến ý tưởng thành mã nguồn có hệ thống, không cần giám sát từng bước.

---

## Tại sao tên "Please Done"?

Ai từng dùng AI viết code đều biết cảm giác này: bạn nhờ AI làm một việc, nó viết được nhưng sai hướng, thiếu ngữ cảnh, hoặc quên mất những gì đã làm trước đó. Bạn phải nhắc đi nhắc lại, sửa đi sửa lại, đến lúc muốn quỳ xuống van xin: **"Làm ơn, xong cái đi!"**

Đó chính là Please Done — tiếng lòng của lập trình viên khi làm việc với AI.

Gốc rễ vấn đề nằm ở 2 điểm yếu cố hữu của AI:

1. **Không có kế hoạch** — AI viết code theo từng câu hỏi, không có bức tranh tổng thể. Mỗi lần hỏi là mỗi kiểu khác, càng viết càng lệch quỹ đạo.
2. **Không nhớ gì** — AI không biết mình đã viết gì trước đó, đã quyết định gì, đã cam kết gì. Mỗi phiên làm việc mới là một tờ giấy trắng.

Please Done giải quyết cả hai: cho AI một **kế hoạch rõ ràng** để đi đúng hướng, và một **bộ nhớ ngoài** (các tệp theo dõi trong `.planning/`) để không quên ngữ cảnh. Bạn chỉ cần lên kế hoạch một lần — AI tự viết code theo đúng kế hoạch đó, đúng cấu trúc, đúng quy tắc, đúng thứ tự.

Để cuối cùng nó **xong cái** cho bạn.

---

## Cách hoạt động

```
Bạn mô tả dự án        AI tự quét, phân tích       Bạn duyệt kế hoạch        AI viết code theo kế hoạch

   /pd:init          →     /pd:scan            →     /pd:plan            →     /pd:write-code
   Nhận diện công nghệ     Báo cáo cấu trúc          Thiết kế kỹ thuật         Từng nhiệm vụ, tự commit
   Nạp quy tắc phù hợp    Thư viện, bảo mật          Chia danh sách việc       Kiểm tra cú pháp, báo cáo
```

### Bước 1 — Khởi tạo (`/pd:init`)

AI tự nhận diện công nghệ của dự án (NestJS, NextJS, WordPress, Solidity, Flutter...) và nạp bộ quy tắc viết code tương ứng. Không cần cấu hình thủ công.

### Bước 2 — Quét dự án (`/pd:scan`)

AI quét toàn bộ mã nguồn: cấu trúc thư mục, thư viện phụ thuộc, mẫu thiết kế đang dùng, lỗ hổng bảo mật. Kết quả lưu thành báo cáo để dùng cho các bước sau.

### Bước 3 — Lập kế hoạch (`/pd:new-milestone` + `/pd:plan`)

Đây là bước quan trọng nhất. AI tạo:

- **Lộ trình** — tổng quan dự án, chia thành các cột mốc và giai đoạn
- **Bản thiết kế kỹ thuật** — chi tiết: điểm cuối API, lược đồ cơ sở dữ liệu, cấu trúc thành phần, quyết định kiến trúc
- **Danh sách công việc** — nhiệm vụ cụ thể, có thứ tự phụ thuộc, mỗi nhiệm vụ ghi rõ tệp cần tạo/sửa

Bạn có thể chọn:
- **Chế độ tự động** — AI tự quyết định toàn bộ, ghi lại lý do cho bạn xem lại
- **Chế độ thảo luận** (`--discuss`) — AI đưa ra các vấn đề cần quyết định, bạn chọn phương án

### Bước 4 — AI viết code (`/pd:write-code`)

Sau khi kế hoạch được duyệt, AI viết code theo từng nhiệm vụ:

- Đọc bản thiết kế kỹ thuật trước khi viết
- Tuân thủ quy tắc code của công nghệ đang dùng (đặt tên, cấu trúc, bảo mật...)
- Tự kiểm tra cú pháp + biên dịch sau mỗi nhiệm vụ
- Tự lưu phiên bản với thông điệp rõ ràng
- Tạo báo cáo chi tiết cho mỗi nhiệm vụ đã hoàn thành

**3 chế độ thực thi:**

| Chế độ | Lệnh | Hành vi |
|---|---|---|
| Từng nhiệm vụ | `/pd:write-code` | Làm 1 nhiệm vụ, dừng hỏi bạn |
| Tự động | `/pd:write-code --auto` | Làm hết tất cả nhiệm vụ tuần tự |
| Song song | `/pd:write-code --parallel` | Phân tích phụ thuộc, chạy đồng thời các nhiệm vụ độc lập bằng đa tác tử |

### Bước 5 — Kiểm thử + Hoàn tất

- `/pd:test` — AI viết bài kiểm thử, chạy, báo cáo kết quả
- `/pd:fix-bug` — Phát hiện lỗi? AI tự phân tích nguyên nhân, sửa, lưu phiên bản, lặp đến khi hết lỗi
- `/pd:complete-milestone` — Kiểm tra tất cả nhiệm vụ + kiểm thử đạt, tạo báo cáo tổng kết, đánh dấu phiên bản

---

## Tại sao tiết kiệm thời gian?

### Lên kế hoạch 1 lần, không cần nhắc lại

Mọi quyết định thiết kế được ghi lại. AI đọc bản thiết kế trước khi viết mỗi dòng code — không cần bạn nhắc lại "dùng thư viện gì", "cấu trúc thư mục ra sao", "định dạng phản hồi API thế nào".

### Không bị lạc hướng giữa chừng

Danh sách công việc có thứ tự phụ thuộc rõ ràng. AI biết nhiệm vụ nào làm trước, nhiệm vụ nào phải chờ.

### Mất mạng? Bấm Esc nhầm? Không sao.

Mọi tiến trình được lưu vào đĩa (không phụ thuộc kết nối). Khi quay lại:
- AI biết đã viết được bao nhiêu tệp, đang ở bước nào
- Tiếp tục từ chỗ dừng — không viết lại từ đầu
- Hoạt động cho tất cả lệnh: viết code, lập kế hoạch, kiểm thử, sửa lỗi

### Quy tắc tự động theo công nghệ

Mỗi công nghệ có bộ quy tắc riêng — cấu trúc thư mục, quy ước đặt tên, mẫu bảo mật, lệnh kiểm tra cú pháp. AI tự nạp đúng bộ quy tắc, không cần bạn nhắc "nhớ dùng hàm khởi tạo hằng" hay "nhớ lọc đầu vào".

### Chế độ song song cho dự án lớn

AI phân tích đồ thị phụ thuộc giữa các nhiệm vụ, nhóm thành đợt, chạy đồng thời các nhiệm vụ độc lập bằng đa tác tử. Phần máy chủ và giao diện có thể viết cùng lúc — giao diện dùng đặc tả API từ bản thiết kế để code trước, không cần chờ máy chủ xong.

---

## So sánh với cách dùng AI thông thường

| | Gõ lệnh trực tiếp cho AI | Dùng Please Done |
|---|---|---|
| **Lên kế hoạch** | Trong đầu bạn (AI không biết) | Trong PLAN.md (AI đọc được) |
| **Theo dõi tiến trình** | Tự nhớ | TASKS.md + trạng thái tự động |
| **Quy tắc viết code** | Nhắc mỗi lần | Tự động nạp theo công nghệ |
| **Mất kết nối** | Mất hết ngữ cảnh | Tiếp tục từ chỗ dừng |
| **Đổi phiên làm việc** | Phải giải thích lại | `/pd:what-next` → biết ngay |
| **Kiểm thử** | "Viết test cho cái này" | AI tự viết test dựa trên code thật |
| **Lưu phiên bản** | Tự gõ hoặc AI đoán | Tự động, theo quy ước |
| **Nhiều nền tảng AI** | Mỗi nền tảng 1 cách dùng | Cùng 1 quy trình, 5 nền tảng |

---

## Con số thực đo

> Tự chạy lại bằng `node test/benchmark.js` — không phải con số tự khai.

### Hệ thống quy trình

| | Số lượng |
|---|---|
| Lệnh người dùng có thể gọi | 11 |
| Tổng bước trong quy trình | 78 |
| Cổng kiểm tra (AI không thể bỏ qua) | 48 |
| Điểm khôi phục (chống mất tiến trình) | 42 |
| Quy tắc viết code theo từng công nghệ | 35 tệp |
| Tổng dòng logic quy trình | 3.167 |

### Cài đặt đa nền tảng

Viết 1 lần → tạo ra **191 tệp, 46.100 dòng** cho 4 nền tảng:

| Nền tảng | Thời gian cài | Tệp sinh ra |
|---|---|---|
| Codex CLI | 33ms | 48 |
| GitHub Copilot | 24ms | 48 |
| Gemini CLI | 19ms | 48 |
| OpenCode | 15ms | 47 |

### Chất lượng

| | |
|---|---|
| Kiểm thử tự động (smoke tests) | **75/75 đạt** |
| Rò rỉ đường dẫn giữa nền tảng | **0** |
| Cài lại an toàn (idempotent) | **4/4 nền tảng** |
| Thời gian chạy toàn bộ kiểm thử | **338ms** |

---

## Hỗ trợ 5 nền tảng lập trình AI

| Nền tảng | Lệnh |
|---|---|
| Claude Code | `/pd:init`, `/pd:plan`... |
| Codex CLI | `$pd-init`, `$pd-plan`... |
| Gemini CLI | `/pd:init`, `/pd:plan`... |
| OpenCode | `/pd-init`, `/pd-plan`... |
| GitHub Copilot | `/pd:init`, `/pd:plan`... |

Viết 1 lần cho Claude Code, trình cài đặt tự chuyển đổi sang định dạng riêng của từng nền tảng.

---

## Công nghệ có quy tắc chuyên biệt

| Công nghệ | Bộ quy tắc | Tài liệu tham khảo |
|---|---|---|
| NestJS | Bộ điều khiển, dịch vụ, đối tượng truyền dữ liệu, bộ bảo vệ | 5 tài liệu (xác thực, CSDL, kiểm thử, tài liệu API, xử lý lỗi) |
| NextJS (App Router) | Thành phần, quản lý trạng thái, tầng API, thành phần máy chủ | 5 tài liệu (thành phần máy chủ, xác thực, SEO, API, quản lý trạng thái) |
| WordPress | Bảo mật, móc nối, API REST, tiêu chuẩn mã WP | 9 tài liệu (bổ sung, giao diện, trình soạn khối, thương mại điện tử...) |
| Solidity | OpenZeppelin, bảo mật, chú thích NatSpec, tối ưu phí gas | 2 tài liệu (mẫu hợp đồng, danh mục kiểm tra) |
| Flutter (GetX) | Giao diện, trạng thái, điều hướng, kết nối mạng, kênh nền tảng | 8 tài liệu (trạng thái, điều hướng, hệ thống thiết kế, kiểm thử...) |

Công nghệ khác (Express, Vite/React...) được nhận diện nhưng chỉ áp dụng quy tắc chung. Có thể mở rộng bằng cách thêm tệp quy tắc mới.

---

## Miễn phí và mã nguồn mở

- Giấy phép MIT — dùng cho dự án cá nhân lẫn thương mại
- Không cần đăng ký, không giới hạn sử dụng
- Yêu cầu: Node.js 16+ và ít nhất 1 công cụ lập trình AI đã cài

### Cài đặt

```bash
git clone https://github.com/tonamson/please-done.git
cd please-done
node bin/install.js
```

### Bắt đầu

```bash
cd /đường-dẫn/tới/dự-án
/pd:init              # Khởi tạo
/pd:scan              # Quét dự án
/pd:new-milestone     # Lập lộ trình
/pd:plan              # Thiết kế kỹ thuật + chia nhiệm vụ
/pd:write-code --auto # AI viết code theo kế hoạch
```

---

## Quy trình tổng thể

```
┌──────────────────────────────────────────────────────────────────────┐
│                       QUY TRÌNH PLEASE DONE                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /pd:init ──→ /pd:scan ──→ /pd:new-milestone ──→ /pd:plan           │
│  Nhận diện     Phân tích     Lộ trình + giai đoạn   Thiết kế kỹ thuật│
│  công nghệ     mã nguồn     + cột mốc               + chia nhiệm vụ │
│                                                                      │
│                              ┌───────────────────────┐               │
│                              │    /pd:write-code      │               │
│                              │  AI viết theo thiết kế │               │
│                              │  Kiểm tra → Biên dịch  │               │
│                              │  → Lưu phiên bản       │               │
│                              └──────┬────────────────┘               │
│                                     │                                │
│                              ┌──────▼────────────────┐               │
│              ┌───────────────│      /pd:test          │               │
│              │  Có lỗi?      │  Viết + chạy kiểm thử  │               │
│              │               └──────┬────────────────┘               │
│       ┌──────▼──────┐               │                                │
│       │ /pd:fix-bug │               │ Kiểm thử đạt                   │
│       │ Phân tích,  │───────────────┘                                │
│       │ sửa, lặp    │                                                │
│       └─────────────┘        ┌──────▼────────────────┐               │
│                              │/pd:complete-milestone  │               │
│                              │ Tổng kết, đánh dấu     │               │
│                              │ phiên bản, phát hành    │               │
│                              └───────────────────────┘               │
│                                                                      │
│  Tiện ích:                                                           │
│  /pd:what-next    → Quên đang làm gì? AI gợi ý bước tiếp            │
│  /pd:fetch-doc    → Tải tài liệu thư viện về máy                    │
│  /pd:update       → Cập nhật Please Done                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

*Please Done — Bạn lên kế hoạch, AI thực thi.*
