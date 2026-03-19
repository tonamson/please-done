# Flutter CI/CD Reference

## GitHub Actions Template
```yaml
name: Flutter CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  analyze-and-test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
          cache: true

      - name: Install dependencies
        run: flutter pub get

      # Fail fast: analyze + format TRƯỚC test
      - name: Analyze
        run: flutter analyze --fatal-infos

      - name: Format check
        run: dart format --set-exit-if-changed .

      - name: Run tests
        run: flutter test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: coverage/lcov.info

  build-android:
    needs: analyze-and-test
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
          cache: true

      - run: flutter pub get
      - name: Build APK
        run: flutter build apk --release --obfuscate --split-debug-info=build/debug-info

      - name: Build App Bundle
        run: flutter build appbundle --release --obfuscate --split-debug-info=build/debug-info

      - uses: actions/upload-artifact@v3
        with:
          name: android-release
          path: |
            build/app/outputs/flutter-apk/app-release.apk
            build/app/outputs/bundle/release/app-release.aab

  build-ios:
    needs: analyze-and-test
    runs-on: macos-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
          cache: true

      - run: flutter pub get
      - name: Build iOS
        run: flutter build ios --release --no-codesign --obfuscate --split-debug-info=build/debug-info
```

## Fastlane Setup
```ruby
# android/fastlane/Fastfile
default_platform(:android)

platform :android do
  desc "Deploy to Play Store Internal"
  lane :internal do
    upload_to_play_store(
      track: 'internal',
      aab: '../build/app/outputs/bundle/release/app-release.aab',
      json_key: 'fastlane/play-store-key.json',
    )
  end
end

# ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Deploy to TestFlight"
  lane :beta do
    build_app(
      workspace: "Runner.xcworkspace",
      scheme: "Runner",
      export_method: "app-store",
    )
    upload_to_testflight(
      api_key_path: "fastlane/api-key.json",
    )
  end
end
```

## Version Automation
```bash
# Bump version từ git tag
VERSION=$(git describe --tags --abbrev=0 | sed 's/v//')
BUILD=$(git rev-list --count HEAD)

# Update pubspec.yaml
sed -i "s/version: .*/version: $VERSION+$BUILD/" pubspec.yaml

# Hoặc dùng cider package
dart pub global activate cider
cider bump patch  # 1.0.0 → 1.0.1
cider bump minor  # 1.0.0 → 1.1.0
cider bump major  # 1.0.0 → 2.0.0
```

## Best Practices
- Cache: pub dependencies, gradle, cocoapods — giảm CI time đáng kể
- Parallel jobs: analyze/format + test chạy song song, build chờ cả 2 pass
- Secrets: `${{ secrets.KEYSTORE_BASE64 }}`, decode trong CI — KHÔNG commit vào repo
- Strict mode: `--fatal-infos` cho analyze, `--set-exit-if-changed` cho format
- Build number: dùng `git rev-list --count HEAD` cho auto-increment
