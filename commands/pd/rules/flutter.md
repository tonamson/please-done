# Quy tắc Flutter (Dart)

## QUAN TRỌNG: Ưu tiên cấu trúc hiện có
- **Dự án đã có code**: ĐỌC cấu trúc thư mục thực tế (`lib/`) TRƯỚC khi áp dụng rules bên dưới. Nếu cấu trúc khác mẫu dưới đây → tuân theo cấu trúc hiện tại, KHÔNG refactor để khớp mẫu
- **State management khác GetX**: Nếu dự án dùng Riverpod, Bloc, Provider, hoặc khác → tuân theo pattern hiện có. Gợi ý chuyển GetX CHỈ khi user yêu cầu, KHÔNG tự ý chuyển
- **Dự án mới (chưa có code)**: áp dụng cấu trúc mẫu bên dưới làm khởi điểm

## Cấu trúc dự án mẫu (Clean Architecture + GetX)
```
lib/
├── core/                           → Foundation layer
│   ├── constants/                  → storage_key.dart, api_constants.dart
│   ├── enums/                      → load_status.dart, app_enums.dart
│   ├── exceptions/                 → exception_handler.dart, exceptions.dart
│   ├── interfaces/                 → Abstract contracts (api_client_interface, storage_interface, logger_interface...)
│   ├── l10n/                       → intl_en.arb, intl_vi.arb... (localization files)
│   ├── styles/                     → theme.dart, app_style.dart, size.dart
│   └── widgets/                    → Shared UI components, nhóm theo chức năng:
│       ├── app/                    → app_avatar, app_checkbox, app_bottom_sheet...
│       ├── buttons/                → primary_button, icon_button...
│       ├── inputs/                 → text_field, dropdown, search_bar...
│       ├── layout/                 → scaffolds/, containers/
│       ├── dialogs/                → confirm_dialog, alert_dialog...
│       ├── display/                → card, list_tile, badge...
│       ├── feedback/               → snackbar, toast...
│       ├── indicators/             → progress, step_indicator...
│       ├── loaders/                → shimmer, skeleton...
│       ├── media/                  → image_viewer, video_player...
│       ├── navigation/             → bottom_nav, tab_bar...
│       ├── states/                 → empty_state, error_state...
│       └── helpers/                → spacing, divider...
├── shared/                         → Cross-cutting concerns
│   ├── controllers/                → Global controllers (auth, theme, system, notification...)
│   ├── services/                   → Singleton services (dio_service, storage_service, log_service, connectivity_service...)
│   ├── routes/                     → route.dart (GetPage definitions), middleware.dart (auth guard)
│   └── utils/                      → Utilities nhóm theo domain:
│       ├── extensions/             → string_extension.dart, num_extension.dart
│       ├── formatters/             → currency_formatter.dart, text_input_formatter.dart
│       ├── security/               → jwt.dart, permission.dart
│       ├── storage/                → storage_manager.dart
│       ├── navigation/             → navigation_utils.dart
│       ├── ui/                     → loading.dart, toast.dart, skeletonizer.dart
│       ├── json/                   → json_utils.dart
│       └── platform/               → notification_helper, url_launcher/, url_strategy/
├── data/                           → Data layer
│   ├── models/                     → *_entity.dart (fromJson/toJson) — user_entity, api_response_entity, paging_res_entity...
│   └── providers/                  → api_client.dart (Dio wrapper, interceptors)
├── presentation/                   → UI layer
│   └── screens/                    → Mỗi screen = 1 thư mục:
│       ├── login_screen/
│       │   ├── login_binding.dart  → DI cho screen
│       │   ├── login_logic.dart    → GetxController (business logic)
│       │   ├── login_state.dart    → Reactive state (.obs variables)
│       │   └── login_view.dart     → UI widget
│       ├── main_screen/
│       │   ├── main_binding.dart
│       │   ├── main_logic.dart
│       │   ├── main_state.dart
│       │   ├── main_view.dart
│       │   ├── tab1/              → Sub-screens (cùng pattern: binding + logic + state + view)
│       │   ├── tab2/
│       │   └── ...
│       ├── splash_screen/
│       └── ...
├── generated/                      → Auto-generated (intl, assets) — KHÔNG sửa tay
└── main.dart
test/                               → unit + widget + integration tests
assets/                             → images/, fonts/, translations/
```

### Pattern mỗi screen (4 files)
- `*_binding.dart` → `Bindings` class — đăng ký dependencies (`Get.lazyPut`)
- `*_logic.dart` → `GetxController` — business logic, gọi API qua services/providers
- `*_state.dart` → Reactive state — khai báo `.obs` variables, tách riêng khỏi logic
- `*_view.dart` → `GetView<XxxLogic>` — UI widget, dùng `Obx()` / `GetBuilder`

### Phân cấp rõ ràng
- Widgets dùng chung (>1 screen) → `core/widgets/` nhóm theo chức năng (buttons, inputs, dialogs...)
- Global controllers (auth, theme, system) → `shared/controllers/` — permanent, dùng xuyên suốt app
- Screen-specific logic → `presentation/screens/[tên_screen]/` — lazy, dispose khi rời screen
- Services (dio, storage, log) → `shared/services/` — singleton, inject qua binding
- Abstract contracts → `core/interfaces/` — để mock trong tests

## Coding Style (Dart)
- Indentation: **2 spaces**, KHÔNG tabs
- Naming: `snake_case` cho files/folders/variables/functions, `PascalCase` cho classes/widgets/enums, `camelCase` cho variables/methods, `SCREAMING_SNAKE_CASE` cho constants
- Suffix bắt buộc: `Logic` (screen controller), `State` (reactive state), `View`, `Binding`, `Entity` (model), `Service`, `Interface`
- Screen files: `[screen]_logic.dart`, `[screen]_state.dart`, `[screen]_view.dart`, `[screen]_binding.dart`
- File naming: `snake_case.dart` — khớp tên class (VD: `LoginLogic` → `login_logic.dart`)
- Prefer `const` constructors khi có thể — giảm rebuild
- Trailing commas cho tất cả argument lists — formatting đẹp hơn khi `dart format`
- `import` thứ tự: dart: → package: → relative (project) — mỗi nhóm cách 1 dòng trống
- Quotes: single quotes cho strings — KHÔNG double quotes (trừ interpolation phức tạp)
- Null safety BẮT BUỘC — KHÔNG dùng `!` (force unwrap) trừ khi chắc chắn 100%. Ưu tiên `??`, `?.`, `?? ''`
- `late` CHỈ dùng cho biến chắc chắn khởi tạo trước khi dùng (lifecycle methods)

## State Management (GetX — tách Logic + State)
- Pattern: tách **state** (`.obs` variables) ra file `*_state.dart`, **logic** (business methods) ở `*_logic.dart`
- State class: khai báo reactive variables (`.obs`) + getters — VD: `LoginState`
- Logic class: extends `GetxController`, khởi tạo `final state = LoginState()` → gọi `state.xxx` để đọc/ghi state
- View: extends `GetView<XxxLogic>` — truy cập qua `controller.state.xxx` hoặc `controller.doSomething()`
- Workers: `debounce()`, `ever()`, `interval()` cho side effects trong `onInit()` của Logic
- `GetBuilder` cho widgets KHÔNG cần reactive updates (static data) — tiết kiệm memory
- `update(['id'])` để refresh specific `GetBuilder` widgets
- CẤM `setState()` — dùng GetX reactive thay thế
- CẤM `Get.find()` trong `build()` — dùng `GetView` hoặc `GetBuilder`
- Global controllers (`shared/controllers/`) KHÔNG tách state riêng — dùng `.obs` trực tiếp trong controller

## Dependency Injection (GetX Bindings)
- Mỗi screen có 1 `*_binding.dart` → đăng ký Logic + dependencies cho screen đó
- `Get.lazyPut()` cho Logic/services screen-specific (lazy loading, dispose khi rời screen)
- `Get.put(permanent: true)` CHỈ cho global services + controllers (`shared/services/`, `shared/controllers/`)
- Đăng ký binding trong `GetPage` route (`shared/routes/route.dart`) — CẤM inject thủ công trong view
- `InitialBinding` / `InitService` trong `main.dart` cho global services (dio, storage, auth, theme...)

## Navigation (GetX Routes)
- Named routes: `Get.toNamed()`, `Get.offNamed()`, `Get.offAllNamed()`
- Routes constants: `static const HOME = '/home'` trong `AppRoutes`
- CẤM `Navigator.push()` / `Navigator.of(context)` — dùng GetX navigation
- Truyền data: `arguments` parameter hoặc `parameters` cho URL params
- Middleware: `GetMiddleware` cho auth guards, role checks

---

## Quy tắc thay thế khi KHÔNG dùng GetX

> Áp dụng khi dự án hiện tại KHÔNG dùng GetX (detect: không có `get:` trong pubspec.yaml dependencies).
> Đọc cấu trúc thư mục thực tế để xác định state management đang dùng.

### State Management (Non-GetX)

**Nếu dùng Riverpod:**
- Provider types: `Provider`, `StateProvider`, `FutureProvider`, `StreamProvider`, `NotifierProvider`
- `ref.watch()` trong `build()` cho reactive UI, `ref.read()` trong callbacks/event handlers
- `ConsumerWidget` / `ConsumerStatefulWidget` thay vì `StatelessWidget` / `StatefulWidget`
- `@riverpod` annotation + code generation (`riverpod_generator`) nếu dự án đã setup
- Scoping: `ProviderScope` ở root, `overrides` cho testing
- CẤM mix Riverpod với GetX/Bloc/Provider trong cùng project

**Nếu dùng Bloc/Cubit:**
- Pattern: `Event` → `Bloc` → `State` (Bloc) hoặc method → `Cubit` → `State` (Cubit)
- `BlocProvider` cho DI, `BlocBuilder` / `BlocConsumer` / `BlocListener` cho UI
- State classes: dùng `sealed class` cho union types (Initial, Loading, Success, Error). `freezed` cho Bloc state CHỈ nếu dự án đã dùng sẵn
- `context.read<XxxBloc>()` cho events, `context.watch<XxxBloc>()` cho reactive UI
- Repository pattern: inject qua `RepositoryProvider`

**Nếu dùng Provider (package):**
- `ChangeNotifierProvider` cho state đơn giản
- `Consumer` / `context.watch()` cho reactive UI, `context.read()` trong callbacks
- `MultiProvider` ở root cho nhiều providers
- `ProxyProvider` cho dependencies giữa providers

**Nếu dùng StatefulWidget thuần (no state management package):**
- `setState()` cho UI state local
- `InheritedWidget` / `InheritedNotifier` cho shared state
- `ValueNotifier` + `ValueListenableBuilder` cho reactive đơn giản

### Navigation (Non-GetX)
- `Navigator 2.0` / `GoRouter` / `auto_route` — tùy theo dự án đang dùng
- `GoRouter`: `context.go()`, `context.push()`, route guards qua `redirect`
- `auto_route`: `@RoutePage()` annotation, `AutoRouter` widget
- `Navigator 1.0` thuần: `Navigator.push()`, `Navigator.pushNamed()` — chấp nhận nếu dự án đã dùng

### Dependency Injection (Non-GetX)
- `get_it` (service locator): `GetIt.I.registerSingleton()`, `GetIt.I.registerFactory()`
- `injectable` + `get_it`: code generation cho DI
- `Riverpod` tự quản lý DI qua providers — không cần package DI riêng
- `BlocProvider` / `RepositoryProvider` (Bloc ecosystem)
- Constructor injection: truyền dependencies qua constructor — đơn giản nhất, dễ test

### Testing (Non-GetX)
- Riverpod: `ProviderContainer` + `overrides` trong test
- Bloc: `blocTest()` từ `bloc_test` package
- Provider: `ChangeNotifierProvider.value()` wrap test widget
- Chung: `mocktail` cho mocking, `flutter_test` cho widget tests

---

## Model & Data Layer
- Model files: `data/models/*_entity.dart` — VD: `user_entity.dart`, `api_response_entity.dart`
- `fromJson()` factory constructor + `toJson()` method + `copyWith()` — viết tay, KHÔNG dùng code generation
- CẤM `json_serializable`, `freezed`, `built_value` cho Model/Entity — tự viết serialization thủ công
- API provider: `data/providers/api_client.dart` — Dio wrapper, interceptors
- Abstract interfaces: `core/interfaces/*_interface.dart` — contracts cho services/providers
- CẤM gọi API trực tiếp từ Logic — LUÔN qua Service hoặc Provider

## API Layer
- Dùng `Dio` cho HTTP requests — CẤM `http` package thuần
- `ApiProvider` class: base URL, headers, interceptors (auth token, logging, error handling)
- Interceptor: tự động attach token, refresh token khi 401, retry logic
- Base URL từ environment config — CẤM hardcode
- Response wrapper: `ApiResponse<T>` với `data`, `message`, `statusCode`

## Bảo mật
- API keys, secrets: lưu trong `.env` → đọc qua `flutter_dotenv` — CẤM hardcode
- Token storage: `flutter_secure_storage` — CẤM `SharedPreferences` cho tokens
- Certificate pinning cho production (tùy yêu cầu)
- Obfuscate code: `flutter build apk --obfuscate --split-debug-info=build/debug-info`
- Input validation: validate form trước khi gửi API, sanitize user input
- Deep link: validate params trước khi navigate

## UI & Theming
- `ThemeData` tập trung trong `app_theme.dart` — CẤM hardcode colors/fonts trong widgets
- `AppColors`, `AppTextStyles` constants — tham chiếu từ theme
- Responsive: `flutter_screenutil` (`ScreenUtil`) — dùng `.w`, `.h`, `.sp`, `.r` cho adaptive sizing. CẤM `responsive_framework`
- Spacing/sizing: dùng constants (VD: `AppSpacing.sm = 8.0`) — CẤM magic numbers
- Dark mode: hỗ trợ qua `ThemeData.dark()` nếu yêu cầu
- Images: `assets/images/` + khai báo trong `pubspec.yaml` → dùng `Image.asset()`

## Error Handling
- Centralized `ErrorHandler` class — xử lý DioException, FormatException, generic errors
- Logic/Controller/Bloc: try/catch trong mọi async method → gọi `ErrorHandler.handleError()`
- Hiển thị lỗi nhẹ: `toastification` package qua helper (`shared/utils/ui/toast.dart`) — validation fail, network timeout, lỗi không chặn flow
- Hiển thị lỗi nặng/quan trọng: Dialog (`core/widgets/dialogs/`) — session hết hạn, lỗi nghiêm trọng, cần user xác nhận
- CẤM `Get.snackbar()` cho hiển thị lỗi (kể cả khi dùng GetX)
- CẤM để exception unhandled — luôn catch và xử lý
- Custom exceptions: `AppException`, `NetworkException`, `CacheException`

## Local Storage
- Key-value: `GetStorage` hoặc `SharedPreferences` (settings, preferences)
- Sensitive data: `flutter_secure_storage` (tokens, credentials)
- Database: `sqflite` hoặc `hive` cho offline data
- Cache strategy: API response cache với TTL, invalidate khi cần

## Performance
- `const` widgets: BẮT BUỘC dùng `const` constructor khi widget không thay đổi
- `ListView.builder()` thay vì `ListView(children: [...])` cho danh sách dài
- Image: cache với `cached_network_image`, resize phù hợp
- Lazy loading: pagination cho lists. GetX: `Get.lazyPut()` | Non-GetX: lazy init trong DI container
- Avoid rebuilds: wrap CHỈ phần widget cần reactive (GetX: `Obx()` scope nhỏ | Bloc: `BlocSelector` | Riverpod: `select`), KHÔNG wrap cả Scaffold
- Memory: dispose resources khi screen bị hủy (GetX: `onClose()` | StatefulWidget: `dispose()`)
- `RepaintBoundary` cho widgets animate thường xuyên

## Internationalization (i18n)
- Ưu tiên `intl` package + `.arb` files (`core/l10n/`) — chuẩn Flutter, hoạt động với mọi state management
- GetX i18n (`.tr`): chấp nhận nếu dự án đã dùng GetX và setup `.tr` sẵn
- Translation files: `core/l10n/intl_*.arb` hoặc `assets/translations/` tùy dự án
- CẤM hardcode strings hiển thị cho user

## Build & Lint
- Lint: `dart analyze` hoặc `flutter analyze`
- Format: `dart format lib/ test/`
- Build Android: `flutter build apk --release` hoặc `flutter build appbundle`
- Build iOS: `flutter build ios --release`
- Build Web: `flutter build web`
- Test: `flutter test --coverage`
- Detect thư mục: Glob `**/pubspec.yaml` → Grep `flutter:` trong file đó → thư mục chứa = Flutter root
- Custom lint rules: `analysis_options.yaml` với `flutter_lints` hoặc `very_good_analysis`

## Testing
- Unit tests: `test/` thư mục, file `*_test.dart`
- Widget tests: `testWidgets()` + `WidgetTester`
- Integration tests: `integration_test/` thư mục
- Mock: `mocktail` hoặc `mockito` — mock repositories, services
- GetX test setup: `Get.put()` trong `setUp()`, `Get.reset()` trong `tearDown()`
- Test pattern: Arrange → Act → Assert
- Chạy: `flutter test` (unit + widget), `flutter test integration_test/` (integration)

## Tham khảo chi tiết
Khi cần patterns phức tạp → đọc `.planning/docs/flutter/`:
- `state-management.md` — GetX patterns, Workers, reactive programming
- `navigation.md` — Routes, middleware, deep linking, nested navigation
- `testing.md` — Unit/widget/integration test setup, mocking, golden tests
- `platform-channels.md` — Native code integration (Android/iOS), MethodChannel
- `performance.md` — Profiling, optimization, memory management, build modes
- `packages.md` — Recommended packages, version management, pub.dev guidelines
