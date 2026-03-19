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
- Immutability: ưu tiên `const` > `final` > `var` — CẤM `var` cho class members, dùng `final` hoặc explicit type
- CẤM global variables — private globals (nếu bắt buộc) phải prefix `_`
- Dùng `--dart-define` cho secrets thay vì `.env` nếu không cần runtime config

## Dart Language Patterns (3.x+)
- **Pattern Matching**: dùng `switch (value)` với patterns + destructuring thay if-else chain
- **Sealed Classes**: `sealed class` cho exhaustive state handling (Result, ViewState...)
- **Records**: `(String, int)` để return multiple values — thay vì tạo class wrapper
- **Extensions**: `extension on Type` để thêm utility methods — đặt trong `shared/utils/extensions/`
- **Collection operators**: dùng `collection-if`, `collection-for`, spread `...` thay vì imperative loops
- **Tear-offs**: `list.forEach(print)` thay vì `list.forEach((e) => print(e))`
- **Async**: `async/await` thay vì `Future.then()`. Dùng `unawaited()` cho fire-and-forget
- **Wildcards (3.7+)**: `_` cho unused variables trong declarations + patterns

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
- API keys, secrets: dùng `--dart-define` hoặc `.env` + `flutter_dotenv` — CẤM hardcode trong Dart code
- Token storage: `flutter_secure_storage` — CẤM `SharedPreferences` cho tokens/PII
- Certificate pinning: `dio_certificate_pinning` cho high-security apps
- Root/Jailbreak detection: `flutter_jailbreak_detection` cho apps tài chính/nhạy cảm
- Obfuscate code: `flutter build apk --obfuscate --split-debug-info=build/debug-info` — BẮT BUỘC cho release. Lưu ý: chỉ là deterrent, logic nhạy cảm nên để backend
- PII masking: mask email, phone trong logs và analytics
- Input validation: validate form trước khi gửi API, sanitize user input
- Deep link: validate payload data nghiêm ngặt trước khi navigate — CẤM navigate trực tiếp từ raw JSON

## UI & Theming (Design System)
- `ThemeData` tập trung trong `core/styles/theme.dart` — CẤM hardcode colors/fonts trong widgets
- **Design Tokens BẮT BUỘC**: dùng tokens cho mọi visual property:
  - Colors: `AppColors.*` — CẤM `Color(0xFF...)`, CẤM `Colors.red`
  - Spacing: `AppSpacing.*` hoặc `SizedBox`/`Gap` với constants — CẤM magic numbers (`SizedBox(height: 10)`)
  - Typography: `AppTextStyles.*` hoặc `textTheme.*` — CẤM inline `TextStyle(fontSize: 14)`
  - Borders: dùng tokens — CẤM raw `BorderRadius.circular(8)` trực tiếp
- Responsive: `flutter_screenutil` (`ScreenUtil`) — dùng `.w`, `.h`, `.sp`, `.r` cho adaptive sizing. CẤM `responsive_framework`
- Dark mode: hỗ trợ qua `ThemeData.dark()` nếu yêu cầu
- Images: `assets/images/` + khai báo trong `pubspec.yaml` → dùng `Image.asset()`
- Dùng DLS widgets (`core/widgets/`) khi có — ưu tiên hơn raw Material widgets

## Idiomatic Flutter
- **Async + Context**: `if (context.mounted)` BẮT BUỘC kiểm tra trước khi dùng `BuildContext` sau `await`
- **Widget composition**: extract complex UI thành small `const` widgets — tránh deep nesting, tránh helper methods trả Widget (dùng class Widget riêng)
- **Layout**: `Gap(n)` hoặc `SizedBox` cho spacing — ưu tiên hơn `Padding` cho simple gaps
- **Empty UI**: dùng `const SizedBox.shrink()` cho empty state
- **Optimization**: dùng `ColoredBox`/`Padding`/`DecoratedBox` thay `Container` khi chỉ cần 1 property
- **Theme access**: dùng extension methods cho `Theme.of(context)` — gọn hơn

## Mobile UX
- **Touch targets**: tối thiểu 44x44pt (iOS) / 48x48dp (Android) — thêm padding nếu cần
- **Safe areas**: wrap content trong `SafeArea` — tránh notch, home indicator
- **Keyboard**: auto-scroll inputs khi keyboard mở, set đúng `TextInputType` (email/number) + `TextInputAction`
- **Haptic feedback**: dùng `HapticFeedback.lightImpact()` cho interactions quan trọng
- **Typography**: body text tối thiểu 16sp, line height 1.5x

## Animation
- **Timing**: Short 100-150ms (toggles, press) | Medium 250-350ms (navigation, modals) | Long 400-600ms (complex transitions) — CẤM >600ms
- **Easing**: `Curves.fastOutSlowIn` (Material) hoặc `Curves.easeInOut` — CẤM `Curves.linear` (robotic)
- **Performance**: animate `transform` (scale/translation) + `opacity` — CẤM animate `width`/`height`/`padding` (trigger layout rebuild)
- **Implicit animations**: `AnimatedContainer`, `AnimatedOpacity`, `FadeTransition`, `SlideTransition` cho simple cases
- **Dispose**: BẮT BUỘC `dispose()` mọi `AnimationController` trong `onClose()` / `dispose()`

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
- `const` widgets: BẮT BUỘC dùng `const` constructor khi widget không thay đổi — `debugRepaintRainbowEnabled` để debug rebuilds
- `ListView.builder()` thay vì `ListView(children: [...])` cho danh sách dài — item recycling
- Image: cache với `cached_network_image` + `memCacheWidth`, `precachePicture` cho SVGs
- Heavy tasks: dùng `compute()` hoặc `Isolate` cho parsing JSON lớn, image processing — KHÔNG chạy trong UI thread
- Lazy loading: pagination cho lists. GetX: `Get.lazyPut()` | Non-GetX: lazy init trong DI container
- Avoid rebuilds: wrap CHỈ phần widget cần reactive (GetX: `Obx()` scope nhỏ | Bloc: `BlocSelector`/`buildWhen` | Riverpod: `select`), KHÔNG wrap cả Scaffold
- Memory: dispose resources khi screen bị hủy (GetX: `onClose()` | StatefulWidget: `dispose()`)
- `RepaintBoundary` cho widgets animate thường xuyên
- CẤM logic nặng trong `build()` — parsing/sorting phải ở Business Layer

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
- **Testing Pyramid**: ~70% Unit Tests, ~20% Widget Tests, ~10% Integration Tests
- Unit tests: `test/unit/` — business logic, mapping, controllers/blocs (mọi edge case: Success, Failure, Exception)
- Widget tests: `test/widget/` — UI interactions (button clicks, error states, loading indicators)
- Integration tests: `integration_test/` — E2E flows
- Mock: `mocktail` (preferred, no codegen) — mock I/O (repositories, services). CẤM mock data classes/entities, dùng real instances
- GetX test setup: `Get.put()` trong `setUp()`, `Get.reset()` trong `tearDown()`
- Test pattern: Arrange → Act → Assert
- Mỗi test PHẢI có `expect()` — CẤM test chỉ chạy mà không assert
- CẤM `Future.delayed()` trong tests — dùng `FakeAsync` hoặc expectations cho timing
- Code coverage target: 80%+ cho Domain + Logic layers
- Chạy: `flutter test` (unit + widget), `flutter test integration_test/` (integration)

## Notifications (Push + Local)
- Stack: `firebase_messaging` (Push) + `flutter_local_notifications` (Local/Foreground)
- Xử lý đầy đủ 3 states: Foreground, Background, Terminated (`getInitialMessage()`)
- Permission: hiển thị custom dialog giải thích lợi ích TRƯỚC khi gọi system request — CẤM hỏi permission ngay khi mở app
- Validate notification payload nghiêm ngặt trước khi navigate
- iOS: clear app badge khi user vào screen liên quan

## Audit & Ghi nhận lỗi
- Khi scan/review/fix-bug phát hiện vi phạm rules Flutter → ghi vào `.planning/bugs/` hoặc `CODE_REPORT` cụ thể:
  - Loại lỗi + rule bị vi phạm
  - File + dòng code
  - Cách sửa đúng
- Mục đích: không lặp lại cùng loại lỗi — lỗi đã gặp 1 lần = CẤM gặp lại
- **Lỗi thường gặp (đã phát hiện)**:
  - Dùng `Get.snackbar()` thay vì `toastification` / Dialog → sửa: toast cho lỗi nhẹ, dialog cho lỗi nặng
  - Dùng `json_serializable` / `freezed` cho Model/Entity → sửa: viết `fromJson`/`toJson`/`copyWith` tay
  - Dùng `responsive_framework` → sửa: dùng `flutter_screenutil`
  - Hardcode `Color(0xFF...)`, `Colors.xxx`, `SizedBox(height: 16)` → sửa: dùng design tokens
  - Dùng `Navigator.push()` trong project GetX → sửa: dùng `Get.toNamed()`
  - Thiếu `context.mounted` check sau `await` → sửa: `if (context.mounted)` trước khi dùng context
  - Dùng `Container` khi chỉ cần 1 property → sửa: `ColoredBox` / `Padding` / `DecoratedBox`
  - Animate `width`/`height`/`padding` → sửa: animate `transform` + `opacity`

## Tham khảo chi tiết
Khi cần patterns phức tạp → đọc `.planning/docs/flutter/`:
- `state-management.md` — GetX patterns, Workers, reactive programming
- `navigation.md` — Routes, middleware, deep linking, nested navigation
- `testing.md` — Unit/widget/integration test setup, mocking, robot pattern
- `platform-channels.md` — Native code integration (Android/iOS), MethodChannel
- `performance.md` — Profiling, optimization, memory management, build modes
- `packages.md` — Recommended packages, version management, pub.dev guidelines
- `notifications.md` — FCM setup, local notifications, lifecycle handling
- `design-system.md` — Token enforcement, DLS patterns, anti-patterns
