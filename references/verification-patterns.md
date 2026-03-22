# Verification Patterns — Phát hiện stub & placeholder

> Dùng bởi: `/pd:write-code` (Bước 9.5), `/pd:complete-milestone` (Bước 3.5)
> Mục đích: kiểm tra code thật sự hoạt động, không phải placeholder

## Nguyên tắc cốt lõi

**Task hoàn tất ≠ Tính năng hoạt động.**
Task "tạo chat component" có thể đánh ✅ khi component là placeholder. Task xong — nhưng mục tiêu "giao diện chat hoạt động" chưa đạt.

Verification suy luận NGƯỢC từ mục tiêu:
1. Điều gì phải TRUE? (Truths — hành vi quan sát được)
2. Thứ gì phải TỒN TẠI? (Artifacts — files thật, không stub)
3. Thứ gì phải KẾT NỐI? (Key Links — wiring giữa artifacts)

## 4 cấp độ verification

| Cấp | Kiểm tra | Cách phát hiện | Tự động? |
|-----|---------|---------------|---------|
| 1. Tồn tại | File có trên đĩa | `Glob` kiểm tra path | ✅ |
| 2. Thực chất | Nội dung thật, không placeholder | Dòng code ≥ ngưỡng, pattern matching, không stub | ✅ |
| 3. Kết nối | Import/export/gọi hàm đúng | `Grep` kiểm tra imports, exports, function calls | ✅ |
| 4. Hoạt động | Chạy được, kết quả đúng | Test hoặc kiểm tra thủ công | ⚠️ Một phần |

Cấp 1-3 kiểm tra tự động. Cấp 4 cần test hoặc user xác nhận.

## Patterns phát hiện stub

### A. Comment-based stubs
```
TODO, FIXME, XXX, HACK, PLACEHOLDER
"implement later", "add later", "coming soon", "will be"
"tạm thời", "sẽ thêm sau", "chưa triển khai"
// ... hoặc /* ... */
```
**Regex**: `(TODO|FIXME|XXX|HACK|PLACEHOLDER|implement later|add later|coming soon|will be|tạm thời|sẽ thêm sau|chưa triển khai)`

### B. Placeholder text trong UI
```
"placeholder", "lorem ipsum", "coming soon", "under construction"
"sample", "example data", "test data", "dummy"
Template brackets chưa thay: [...], <...>, {...} (ngoại trừ trong code hợp lệ)
```
**Regex**: `(placeholder|lorem ipsum|coming soon|under construction|sample data|example data|test data|dummy data)`

### C. Empty/trivial implementations
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

### D. Hardcoded values (khi logic dynamic được kỳ vọng)
```javascript
// Hardcoded thay vì query database
const users = [{ id: 1, name: "Test" }]
const count = 5
const price = "$99.99"
return { success: true }        // Luôn success, không xử lý logic
return { data: [] }             // Luôn trả mảng rỗng
```
**Cách phát hiện**: Kiểm tra Key Links — nếu function được kỳ vọng gọi database/API nhưng không có import/call tương ứng → khả năng cao hardcoded.

### E. Console-only implementations
```javascript
console.log('only')             // Function chỉ log, không làm gì
print('debug')                  // Dart/Python tương tự
```

## Kiểm tra theo loại artifact

### React/NextJS Components
| Cấp | Kiểm tra | Stub indicators |
|-----|---------|-----------------|
| Tồn tại | File exports function/component | — |
| Thực chất | Return JSX thật (không phải `<div/>` rỗng), ≥15 dòng | `return null`, `return <></>`, `return <div>Placeholder</div>` |
| Kết nối | Import và dùng props, gọi API/hooks | Không import hooks, không fetch data |

### API Routes/Controllers (NestJS/Express/NextJS)
| Cấp | Kiểm tra | Stub indicators |
|-----|---------|-----------------|
| Tồn tại | File exports handlers (GET/POST/...) | — |
| Thực chất | ≥10 dòng, xử lý request, trả response có nghĩa | `return { ok: true }`, `return []` không qua DB |
| Kết nối | Import service/repository, gọi database | Không import DB module, không query |

### Database Schema/Migration
| Cấp | Kiểm tra | Stub indicators |
|-----|---------|-----------------|
| Tồn tại | Model/schema defined | — |
| Thực chất | Có fields ngoài id, types đúng, relationships | Chỉ có id field |
| Kết nối | Migration tồn tại, được import ở module | Không có migration file |

### Services/Logic
| Cấp | Kiểm tra | Stub indicators |
|-----|---------|-----------------|
| Tồn tại | File exports class/functions | — |
| Thực chất | Methods có logic thật, ≥10 dòng per method | `throw new Error('Not implemented')`, return hardcoded |
| Kết nối | Được inject/import bởi controller/component | Không ai import |

### Solidity Contracts
| Cấp | Kiểm tra | Stub indicators |
|-----|---------|-----------------|
| Tồn tại | Contract defined, inherits đúng | — |
| Thực chất | Functions có logic, không chỉ revert | `revert("Not implemented")`, function rỗng |
| Kết nối | Interface đúng, events emit, modifiers applied | Thiếu event emit, thiếu modifier |

### Flutter Widgets/Controllers
| Cấp | Kiểm tra | Stub indicators |
|-----|---------|-----------------|
| Tồn tại | Class extends đúng (StatelessWidget/GetxController) | — |
| Thực chất | Build method trả Widget tree thật, ≥20 dòng | `return Container()`, `return SizedBox()` rỗng |
| Kết nối | Controller import service, Widget dùng Obx/GetBuilder | Không reactive, hardcoded UI |

### WordPress Hooks/Filters
| Cấp | Kiểm tra | Stub indicators |
|-----|---------|-----------------|
| Tồn tại | add_action/add_filter registered | — |
| Thực chất | Callback function có logic, sanitize input | Callback rỗng hoặc chỉ return input |
| Kết nối | Hook đăng ký đúng priority, callback tồn tại | Function name typo, wrong hook |

## Cột "Kiểm tra tự động" trong PLAN.md

Mỗi Artifact trong PLAN.md có thể chỉ định kiểm tra tự động:

| Ký hiệu | Ý nghĩa | Ví dụ |
|----------|---------|-------|
| `exports: [X, Y]` | File phải export các symbols này | `exports: [GET, POST]` |
| `contains: "text"` | File phải chứa text pattern | `contains: "model Message"` |
| `min_lines: N` | File phải có ≥ N dòng thực chất | `min_lines: 30` |
| `imports: [X]` | File phải import các modules | `imports: [PrismaService]` |
| `calls: "pattern"` | File phải gọi function matching pattern | `calls: "prisma\\.message\\."` |

Nếu PLAN.md không chỉ định → dùng kiểm tra mặc định theo loại artifact (bảng trên).

## Quy trình gap closure

Khi verification phát hiện gap:
1. **Vòng 1**: Liệt kê gaps → tự sửa code cho từng gap → lint/build → re-verify
2. **Vòng 2**: Nếu vẫn còn gap → sửa lại → re-verify
3. **Sau 2 vòng**: Nếu vẫn fail → **DỪNG**, escalate cho user với chi tiết gaps

**Nguyên tắc**: Tối đa 2 vòng sửa tự động. Sau đó user phải can thiệp — có thể cần sửa PLAN.md hoặc thiết kế lại.
