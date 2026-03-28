# Flutter Rules (Dart + GetX)

> Contains project-specific conventions only. Standard Flutter/GetX knowledge → look up via Context7 (`resolve-library-id` → `query-docs`).

## Code style (differs from general.md)
- File naming: **snake_case** (Dart convention, e.g.: `home_view.dart`, `user_repository.dart`)

## Architecture (Logic + State separated)
- Each feature: `_binding.dart`, `_logic.dart`, `_state.dart`, `_view.dart`
- **State**: class containing `.obs` variables — NO logic
- **Logic**: `extends GetxController` — business logic, update state
- **View**: `extends GetView<XxxLogic>` — UI, `Obx()` wraps reactive parts
- **Binding**: `extends Bindings` — `Get.lazyPut`
- MUST `onClose()` dispose resources: TextEditingController, StreamSubscription, Timer, ScrollController

## Design system (Token-based)
- MUST use: `AppColors`, `AppSpacing`, `AppTextStyles`, `AppBorders`
- FORBIDDEN hardcode: `Color(0xFF...)`, `Colors.xxx`, `SizedBox(height: [number])`, `TextStyle(fontSize: ...)`, `BorderRadius.circular(...)`
- If project has DLS widgets (AppButton, AppTextField) → prefer using them

## HTTP & Data
- HTTP: `dio` — FORBIDDEN `http` package
- Models: write `fromJson()`/`toJson()`/`copyWith()` **manually** — FORBIDDEN `json_serializable`, `freezed`, `built_value`
- Storage non-sensitive: `get_storage` | Sensitive (tokens): `flutter_secure_storage`

## State management
- `Obx()` wraps ONLY the part that needs reactivity — FORBIDDEN wrapping entire Scaffold
- `GetBuilder` for manual update (performance-sensitive)
- Route constants: `static const HOME = '/home'` (UPPER_SNAKE_CASE)

## Security
- DO NOT hardcode API keys — use `flutter_dotenv` or `--dart-define`
- Tokens stored in `flutter_secure_storage` — FORBIDDEN `get_storage`/`SharedPreferences`
- Obfuscate release: `--obfuscate --split-debug-info=build/debug-info`

## Build and lint
- Lint: `flutter analyze`
- Build: `flutter build apk` / `flutter build ios`
- Test: `flutter test`
- Detection: Glob `**/pubspec.yaml` + Grep `flutter`
