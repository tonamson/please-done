# Flutter Recommended Packages Reference

## Core / Essential
| Package | Mục đích | Ghi chú |
|---------|----------|---------|
| `get` | State management, routing, DI | Framework chính |
| `dio` | HTTP client | Interceptors, retry, cancel |
| `flutter_dotenv` | Environment variables | Load `.env` files |
| `flutter_secure_storage` | Secure key-value storage | Tokens, secrets |
| `get_storage` | Fast key-value storage | Settings, cache (non-sensitive) |

## UI / Design
| Package | Mục đích | Ghi chú |
|---------|----------|---------|
| `cached_network_image` | Image caching | Placeholder, error widget |
| `flutter_svg` | SVG rendering | Asset + network SVGs |
| `shimmer` | Loading skeleton | Shimmer effect |
| `pull_to_refresh` | Pull-to-refresh + load more | ListView integration |
| `flutter_screenutil` | Responsive sizing | Adapt to screen sizes |
| `google_fonts` | Google Fonts | Dynamic font loading |

## Data / Storage
| Package | Mục đích | Ghi chú |
|---------|----------|---------|
| `hive` + `hive_flutter` | NoSQL local DB | Fast, lightweight |
| `sqflite` | SQLite local DB | Complex queries |
| `intl` | Date/number formatting, i18n | Localization |

> **Lưu ý**: KHÔNG dùng `json_serializable`, `freezed`, `built_value` — viết `fromJson`/`toJson`/`copyWith` thủ công.

## Media / Files
| Package | Mục đích | Ghi chú |
|---------|----------|---------|
| `image_picker` | Camera + gallery | Photo/video selection |
| `file_picker` | File selection | Multi-type files |
| `path_provider` | File system paths | App documents, temp |
| `permission_handler` | Runtime permissions | Camera, storage, location |
| `share_plus` | Share content | Text, files, URLs |

## Firebase (nếu dùng)
| Package | Mục đích | Ghi chú |
|---------|----------|---------|
| `firebase_core` | Firebase init | Required base |
| `firebase_messaging` | Push notifications | FCM |
| `firebase_analytics` | Analytics | Event tracking |
| `cloud_firestore` | Firestore DB | Realtime sync |
| `firebase_auth` | Authentication | Email, Google, Apple |

## Dev / Testing
| Package | Mục đích | Ghi chú |
|---------|----------|---------|
| `mocktail` | Mocking | No codegen needed |
| `flutter_lints` | Lint rules | Official Flutter lints |
| `very_good_analysis` | Strict lint rules | VGV recommended |
| `build_runner` | Code generation | CHỈ dùng cho intl, assets generation — CẤM cho model serialization |

## Version Management (pubspec.yaml)
```yaml
dependencies:
  # Pin major version — cho phép minor/patch updates
  get: ^4.6.0
  dio: ^5.0.0

  # Exact version — khi cần stability
  hive: 2.2.3

  # SDK constraint
  flutter:
    sdk: flutter

dev_dependencies:
  # Dev tools luôn dùng latest compatible
  mocktail: ^1.0.0
  build_runner: ^2.4.0
```

## pubspec.yaml Best Practices
- Chạy `flutter pub upgrade --major-versions` định kỳ (cẩn thận breaking changes)
- `flutter pub outdated` để check packages cần update
- Lock file (`pubspec.lock`) PHẢI commit vào git — đảm bảo reproducible builds
- Kiểm tra package score trên pub.dev trước khi dùng (likes, pub points, popularity)
- Prefer packages có null safety support
- Tránh packages không maintained (>6 tháng không update, nhiều open issues)
