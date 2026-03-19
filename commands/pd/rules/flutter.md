# Quy tắc Flutter (Dart + GetX)

## Code style
- 2 spaces indent (giống general.md)
- File naming: **snake_case** (ngoại lệ cho general.md: Dart convention dùng snake_case thay vì kebab-case. VD: `home_view.dart`, `user_repository.dart`)
- Class/Widget: PascalCase | Variables/functions: camelCase | Constants: camelCase hoặc UPPER_SNAKE_CASE
- `import 'package:...'` cho cross-module, `import '...'` cho relative cùng feature
- Giới hạn file: mục tiêu 300 dòng, BẮT BUỘC tách >500

## Cấu trúc dự án (GetX pattern)
```
lib/
├── main.dart
├── app/
│   ├── routes/        → app_routes.dart, app_pages.dart
│   └── bindings/      → initial_binding.dart
├── core/
│   ├── network/       → api_provider.dart, interceptors
│   ├── storage/       → storage_service.dart
│   ├── styles/        → app_colors.dart, app_spacing.dart, app_text_styles.dart, theme.dart
│   └── utils/         → error_handler.dart, validators.dart
├── data/
│   ├── models/        → user_model.dart (fromJson/toJson thủ công)
│   └── repositories/  → user_repository.dart
├── modules/           → Feature-first
│   └── [feature]/
│       ├── [feature]_binding.dart
│       ├── [feature]_logic.dart
│       ├── [feature]_state.dart
│       └── [feature]_view.dart
└── shared/
    ├── widgets/       → Reusable widgets
    └── utils/         → Shared helpers
```

## Architecture (Logic + State tách riêng)
- Mỗi feature có 4 files: `_binding.dart`, `_logic.dart`, `_state.dart`, `_view.dart`
- **State**: class chứa reactive variables (`.obs`) — KHÔNG chứa logic
- **Logic**: `extends GetxController` — business logic, gọi repository, update state
- **View**: `extends GetView<XxxLogic>` — UI, dùng `Obx()` wrap phần reactive
- **Binding**: `extends Bindings` — đăng ký dependencies (`Get.lazyPut`)
- BẮT BUỘC `onClose()` dispose resources: `TextEditingController`, `StreamSubscription`, `Timer`, `ScrollController`

## State Management (GetX)
- Reactive: `final count = 0.obs` → UI dùng `Obx(() => Text('${controller.state.count}'))`
- `Obx()` wrap CHỈ phần cần reactive — CẤM wrap cả Scaffold/toàn bộ widget tree
- `GetBuilder` cho manual update (performance-sensitive, ít thay đổi)
- Workers: `ever()`, `debounce()`, `interval()` setup trong `onInit()`
- Cross-controller: `Get.find<OtherController>()` — controller đã registered qua Binding

## Navigation (GetX Routes)
- Routes tập trung: `app_routes.dart` (constants) + `app_pages.dart` (GetPage list)
- `Get.toNamed()`, `Get.offNamed()`, `Get.offAllNamed()`, `Get.back()`
- Auth guard: `AuthMiddleware extends GetMiddleware` với `redirect()` override
- Route constants: `static const HOME = '/home'` (UPPER_SNAKE_CASE)

## Design System (Token-based)
- BẮT BUỘC dùng design tokens: `AppColors`, `AppSpacing`, `AppTextStyles`, `AppBorders`
- CẤM hardcode `Color(0xFF...)`, `Colors.xxx`, `SizedBox(height: [number])`, `TextStyle(fontSize: ...)`, `BorderRadius.circular(...)`
- Nếu project có DLS widgets (AppButton, AppTextField) → ưu tiên dùng thay Material widgets
- Tra cứu `.planning/docs/flutter/design-system.md` cho token definitions

## HTTP & Data
- HTTP client: `dio` (interceptors, retry, cancel) — CẤM dùng `http` package
- Models: viết `fromJson()`/`toJson()`/`copyWith()` **thủ công** — CẤM dùng `json_serializable`, `freezed`, `built_value`
- Storage non-sensitive: `get_storage` | Storage sensitive (tokens, secrets): `flutter_secure_storage`

## Bảo mật (BẮT BUỘC)
- KHÔNG hardcode API keys, secrets — dùng `flutter_dotenv` hoặc `--dart-define`
- Tokens lưu `flutter_secure_storage` — CẤM `get_storage` hoặc `SharedPreferences` cho tokens
- Obfuscate release builds: `flutter build apk --obfuscate --split-debug-info=build/debug-info`
- Certificate pinning cho production API calls
- Validate notification payload trước khi navigate — CẤM navigate từ raw JSON data
- Permission requests: hiện custom dialog giải thích trước khi gọi system permission

## Build & Lint
- Lint: `flutter analyze`
- Build: `flutter build apk` (Android) / `flutter build ios` (iOS)
- Test: `flutter test`
- Detect thư mục: Glob `**/pubspec.yaml` + Grep `flutter` → Flutter project root

## Tham khảo chi tiết
Khi cần patterns phức tạp → đọc `.planning/docs/flutter/`:
- `state-management.md` — GetxController lifecycle, .obs, Workers, Obx vs GetBuilder, patterns (loading/error, pagination, form)
- `navigation.md` — GetX routing, middleware, deep linking, bottom navigation
- `design-system.md` — Token definitions (colors, spacing, typography, borders), ThemeData, DLS widgets
- `testing.md` — Unit tests (mocktail), widget tests, integration tests, test helpers
- `performance.md` — const constructors, minimize rebuild scope, list optimization, image caching, memory management
- `platform-channels.md` — MethodChannel, EventChannel, Android (Kotlin), iOS (Swift)
- `packages.md` — Recommended packages per category, version management
- `notifications.md` — Firebase Messaging, local notifications, 3 lifecycle states, permission UX
