Phân tích dự án hiện tại, phát hiện quy ước lập trình từ code có sẵn, hỏi người dùng về ưu tiên riêng, tạo/cập nhật CLAUDE.md.

<context>
Tham khảo:
- @references/conventions.md → commit prefixes, biểu tượng, ngôn ngữ
</context>

<process>

## Bước 1: Kiểm tra CLAUDE.md hiện có
Kiểm tra file `CLAUDE.md` ở root project:
- Nếu **đã có** → đọc nội dung, thông báo: "Đã có CLAUDE.md. Bạn muốn:
  1. Bổ sung thêm conventions (giữ nội dung cũ)
  2. Tạo lại từ đầu"
- Nếu **chưa có** → tiếp tục

## Bước 2: Phát hiện conventions từ code
Dùng Grep/Read quét code hiện có để phát hiện patterns:

### 2a. Quy ước đặt tên
- Grep tên files → snake_case, kebab-case, camelCase, PascalCase?
- Grep tên functions/methods → camelCase, snake_case?
- Grep tên biến → prefix/suffix patterns? (VD: `is*`, `has*`, `_private`)

### 2b. Quy ước import & module
- Import aliases? (`@/`, `~/`, `#/`)
- Relative vs absolute imports?
- Barrel exports (`index.ts`)?

### 2c. Phương pháp tạo kiểu
- Grep `className` + Tailwind patterns → Tailwind
- Grep `styled.` hoặc `css\`` → styled-components
- Grep `\.module\.css` → CSS Modules
- Grep `style={{` → inline styles
- Grep `antd` hoặc `ant-design` → Ant Design

### 2d. Quản lý trạng thái
- Grep `zustand`/`create<` → Zustand
- Grep `redux`/`createSlice` → Redux
- Grep `GetxController`/`.obs` → GetX
- Grep `useState`/`useReducer` → React hooks only

### 2e. Quy ước API
- Grep `axios` → Axios
- Grep `fetch(` → Native fetch
- Grep `Dio` → Dio (Flutter)

### 2f. Quy ước kiểm thử
- Grep `describe(`/`it(` → Jest/Vitest
- Grep `WP_UnitTestCase` → WordPress PHPUnit
- Grep `flutter_test` → Flutter test

### 2g. Xử lý lỗi & ghi log
- Grep `console.log`/`Logger`/`winston` → logging approach
- Grep `throw new`/`throw new HttpException` → error patterns
- Grep ngôn ngữ trong throw messages → tiếng Việt hay Anh?

### 2h. Định dạng code
- Đọc `.prettierrc`/`.eslintrc`/`biome.json` nếu có → lấy settings
- Đọc `tsconfig.json` → strict mode, paths, target

## Bước 3: Tổng hợp phát hiện
Liệt kê cho user những gì đã phát hiện:

```
Phát hiện từ code:
- Đặt tên: kebab-case files, camelCase functions
- Giao diện: Ant Design v6 + inline styles
- Trạng thái: Zustand
- API: Native fetch, không axios
- Kiểm thử: Jest
- Ngôn ngữ message: tiếng Việt
- Định dạng: Prettier (semi, singleQuote)
```

## Bước 4: Hỏi user bổ sung
Hỏi user về những thứ KHÔNG detect được từ code:

1. **Ngôn ngữ giao tiếp**: Ghi chú/JSDoc tiếng Việt hay Anh?
2. **Phong cách commit**: Conventional commits? Tiếng Việt? Tiền tố?
3. **Có quy ước đặc biệt nào khác không?** (VD: prefix collection MongoDB, format phân trang response, cấu trúc thư mục bắt buộc...)
4. **Thứ gì AI hay làm sai mà bạn muốn nhắc?** (VD: hay tạo file mới thay vì sửa file cũ, hay thêm thư viện không cần thiết...)

User có thể skip câu nào không muốn trả lời.

## Bước 5: Tạo CLAUDE.md
Tạo file `CLAUDE.md` ở root project với format:

```markdown
# Quy ước dự án

## Phong cách code
- [quy ước phát hiện + người dùng bổ sung]

## Đặt tên
- [đặt tên file, function, variable]

## Kiến trúc
- [patterns phát hiện: quản lý trạng thái, tầng API, cấu trúc thư mục]

## Nên / Không nên
- [những thứ AI nên/không nên làm — từ câu trả lời người dùng]

## Build & Kiểm thử
- [lệnh lint, build, test phát hiện từ package.json/config files]
```

**Quy tắc viết CLAUDE.md:**
- CHỈ viết những thứ AI không thể tự suy ra từ code
- KHÔNG lặp lại kiến thức framework cơ bản
- Ngắn gọn, mỗi bullet 1 dòng
- Mục tiêu: **dưới 50 dòng**
- Nếu có CLAUDE.md cũ + user chọn "bổ sung" → merge nội dung mới vào, loại bỏ trùng lặp

## Bước 6: Thông báo kết quả
```
╔══════════════════════════════════════╗
║     CLAUDE.md đã tạo!               ║
╠══════════════════════════════════════╣
║ File: CLAUDE.md (root project)      ║
║ Dòng: [N] dòng                      ║
║                                      ║
║ Claude Code sẽ tự động đọc file     ║
║ này mỗi conversation mới.           ║
║                                      ║
║ Chỉnh sửa bất cứ lúc nào:          ║
║   - Sửa trực tiếp CLAUDE.md        ║
║   - Chạy /pd:conventions để tạo lại ║
╚══════════════════════════════════════╝
```

</process>

<rules>
- CLAUDE.md phải DƯỚI 50 dòng — ngắn gọn, chỉ conventions riêng
- KHÔNG viết tutorial hay giải thích framework
- KHÔNG lặp lại nội dung đã có trong `.planning/rules/`
- PHẢI scan code thực tế trước khi hỏi user — không hỏi thứ đã detect được
- Nếu project chưa có code → hỏi user nhiều hơn, ít detect hơn
- CẤM đọc/hiển thị nội dung file nhạy cảm
- File tạo ra phải tương thích với Claude Code auto-load (CLAUDE.md ở root)
</rules>
