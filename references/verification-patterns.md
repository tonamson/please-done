# Mẫu xác minh — Phát hiện stub & placeholder

> Dùng bởi: `/pd:write-code` (Bước 9.5), `/pd:complete-milestone` (Bước 3.5)
> Kiểm tra code thật sự hoạt động, không phải placeholder

## Nguyên tắc cốt lõi

**Task hoàn tất ≠ Tính năng hoạt động.**

Xác minh suy luận NGƯỢC từ mục tiêu:
1. Điều gì phải ĐÚNG? (Truths — hành vi quan sát được)
2. Thứ gì phải TỒN TẠI? (Artifacts — files thật, không phải stub)
3. Thứ gì phải KẾT NỐI? (Key Links — liên kết giữa artifacts)

## 4 cấp độ xác minh

| Cấp | Kiểm tra | Cách phát hiện | Tự động? |
|-----|---------|---------------|---------|
| 1. Tồn tại | File có trên đĩa | `Glob` kiểm tra đường dẫn | ✅ |
| 2. Thực chất | Nội dung thật, không placeholder | Dòng code ≥ ngưỡng, khớp pattern, không stub | ✅ |
| 3. Kết nối | Import/export/gọi hàm đúng | `Grep` kiểm tra imports, exports, lời gọi hàm | ✅ |
| 4. Hoạt động | Chạy được, kết quả đúng | Test hoặc kiểm tra thủ công | ⚠️ Một phần |

Cấp 1-3 tự động. Cấp 4 cần test hoặc user xác nhận.

## Mẫu phát hiện stub

### A. Stub dạng comment
```
TODO, FIXME, XXX, HACK, PLACEHOLDER
"implement later", "add later", "coming soon", "will be"
"tạm thời", "sẽ thêm sau", "chưa triển khai"
// ... hoặc /* ... */
```
**Regex**: `(TODO|FIXME|XXX|HACK|PLACEHOLDER|implement later|add later|coming soon|will be|tạm thời|sẽ thêm sau|chưa triển khai)`

### B. Văn bản placeholder trong giao diện
```
"placeholder", "lorem ipsum", "coming soon", "under construction"
"sample", "example data", "test data", "dummy"
Dấu ngoặc mẫu chưa thay: [...], <...>, {...} (ngoại trừ trong code hợp lệ)
```
**Regex**: `(placeholder|lorem ipsum|coming soon|under construction|sample data|example data|test data|dummy data)`

### C. Triển khai rỗng/tạm
```javascript
return null
return undefined
return {}
return []
() => {}                    // Arrow function rỗng
throw new Error('Not implemented')
pass                        // Python
raise NotImplementedError   // Python
```
**Regex (JS/TS)**: `(return\s+(null|undefined|\{\}|\[\])\s*[;\n]|=>\s*\{\s*\}|throw new Error\(['"]Not implemented)`
**Regex (PHP)**: `(return\s+(null|array\(\)|\[\])\s*;|throw new \\?Exception\(['"]Not implemented)`
**Regex (Dart)**: `(return\s+(null|\[\]|\{\})\s*;|throw UnimplementedError)`

### D. Giá trị hardcoded (khi logic động được kỳ vọng)
```javascript
const users = [{ id: 1, name: "Test" }]
const count = 5
const price = "$99.99"
return { success: true }        // Luôn trả success
return { data: [] }             // Luôn trả mảng rỗng
```
**Phát hiện**: Kiểm tra Key Links — function kỳ vọng gọi database/API nhưng không có import/lời gọi → khả năng cao hardcoded.

### E. Triển khai chỉ có console
```javascript
console.log('only')             // Function chỉ log
print('debug')                  // Dart/Python tương tự
```

## Kiểm tra theo loại artifact

### React/NextJS Components
| Cấp | Kiểm tra | Dấu hiệu stub |
|-----|---------|----------------|
| Tồn tại | File export function/component | — |
| Thực chất | JSX thật (không `<div/>` rỗng), ≥15 dòng | `return null`, `return <></>`, `return <div>Placeholder</div>` |
| Kết nối | Import + dùng props, gọi API/hooks | Không import hooks, không fetch |

### API Routes/Controllers (NestJS/Express/NextJS)
| Cấp | Kiểm tra | Dấu hiệu stub |
|-----|---------|----------------|
| Tồn tại | File export handlers (GET/POST/...) | — |
| Thực chất | ≥10 dòng, xử lý request, response có nghĩa | `return { ok: true }`, `return []` không qua DB |
| Kết nối | Import service/repository, gọi database | Không import DB, không truy vấn |

### Database Schema/Migration
| Cấp | Kiểm tra | Dấu hiệu stub |
|-----|---------|----------------|
| Tồn tại | Model/schema định nghĩa | — |
| Thực chất | Fields ngoài id, types đúng, relationships | Chỉ có id field |
| Kết nối | Migration tồn tại, import ở module | Không có migration |

### Services/Logic
| Cấp | Kiểm tra | Dấu hiệu stub |
|-----|---------|----------------|
| Tồn tại | File export class/functions | — |
| Thực chất | Methods có logic thật, ≥10 dòng/method | `throw new Error('Not implemented')`, hardcoded |
| Kết nối | Được inject/import bởi controller/component | Không ai import |

### Solidity Contracts
| Cấp | Kiểm tra | Dấu hiệu stub |
|-----|---------|----------------|
| Tồn tại | Contract định nghĩa, kế thừa đúng | — |
| Thực chất | Functions có logic, không chỉ revert | `revert("Not implemented")`, function rỗng |
| Kết nối | Interface đúng, events emit, modifiers áp dụng | Thiếu event emit, thiếu modifier |

### Flutter Widgets/Controllers
| Cấp | Kiểm tra | Dấu hiệu stub |
|-----|---------|----------------|
| Tồn tại | Class kế thừa đúng (StatelessWidget/GetxController) | — |
| Thực chất | Build trả Widget tree thật, ≥20 dòng | `return Container()`, `return SizedBox()` rỗng |
| Kết nối | Controller import service, Widget dùng Obx/GetBuilder | Không reactive, hardcoded |

### WordPress Hooks/Filters
| Cấp | Kiểm tra | Dấu hiệu stub |
|-----|---------|----------------|
| Tồn tại | add_action/add_filter đã đăng ký | — |
| Thực chất | Callback có logic, sanitize input | Callback rỗng hoặc chỉ return input |
| Kết nối | Hook đúng priority, callback tồn tại | Tên function sai, hook sai |

## Cột "Kiểm tra tự động" trong PLAN.md

| Ký hiệu | Ý nghĩa | Ví dụ |
|----------|---------|-------|
| `exports: [X, Y]` | File phải export symbols | `exports: [GET, POST]` |
| `contains: "text"` | File phải chứa text | `contains: "model Message"` |
| `min_lines: N` | File ≥ N dòng thực chất | `min_lines: 30` |
| `imports: [X]` | File phải import modules | `imports: [PrismaService]` |
| `calls: "pattern"` | File phải gọi hàm khớp pattern | `calls: "prisma\\.message\\."` |

PLAN.md không chỉ định → dùng kiểm tra mặc định theo loại artifact (bảng trên).

## Quy trình vá gap

Phát hiện gap:
1. **Vòng 1**: Liệt kê gaps → tự sửa → lint/build → xác minh lại
2. **Vòng 2**: Vẫn gap → sửa lại → xác minh lại
3. **Sau 2 vòng**: Vẫn fail → **DỪNG**, chuyển user với chi tiết gaps

Tối đa 2 vòng sửa tự động. Sau đó user can thiệp — có thể cần sửa PLAN.md hoặc thiết kế lại.
