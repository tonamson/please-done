# Quy tắc Flutter (Dart + GetX)

> Chỉ chứa quy ước riêng. Kiến thức Flutter/GetX chuẩn → tra Context7 (`resolve-library-id` → `query-docs`).

## Phong cách code (khác general.md)
- File naming: **snake_case** (Dart convention, VD: `home_view.dart`, `user_repository.dart`)

## Kiến trúc (Logic + State tách riêng)
- Mỗi feature: `_binding.dart`, `_logic.dart`, `_state.dart`, `_view.dart`
- **State**: class chứa `.obs` variables — KHÔNG logic
- **Logic**: `extends GetxController` — business logic, update state
- **View**: `extends GetView<XxxLogic>` — UI, `Obx()` wrap phần reactive
- **Binding**: `extends Bindings` — `Get.lazyPut`
- BẮT BUỘC `onClose()` dispose resources: TextEditingController, StreamSubscription, Timer, ScrollController

## Hệ thống thiết kế (Token-based)
- BẮT BUỘC dùng: `AppColors`, `AppSpacing`, `AppTextStyles`, `AppBorders`
- CẤM hardcode: `Color(0xFF...)`, `Colors.xxx`, `SizedBox(height: [number])`, `TextStyle(fontSize: ...)`, `BorderRadius.circular(...)`
- Nếu project có DLS widgets (AppButton, AppTextField) → ưu tiên dùng

## HTTP & Dữ liệu
- HTTP: `dio` — CẤM `http` package
- Models: viết `fromJson()`/`toJson()`/`copyWith()` **thủ công** — CẤM `json_serializable`, `freezed`, `built_value`
- Storage non-sensitive: `get_storage` | Sensitive (tokens): `flutter_secure_storage`

## Quản lý trạng thái
- `Obx()` wrap CHỈ phần cần reactive — CẤM wrap cả Scaffold
- `GetBuilder` cho manual update (performance-sensitive)
- Route constants: `static const HOME = '/home'` (UPPER_SNAKE_CASE)

## Bảo mật
- KHÔNG hardcode API keys — dùng `flutter_dotenv` hoặc `--dart-define`
- Tokens lưu `flutter_secure_storage` — CẤM `get_storage`/`SharedPreferences`
- Obfuscate release: `--obfuscate --split-debug-info=build/debug-info`

## Build & Lint
- Lint: `flutter analyze`
- Build: `flutter build apk` / `flutter build ios`
- Test: `flutter test`
- Detect: Glob `**/pubspec.yaml` + Grep `flutter`
