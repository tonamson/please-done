# Flutter Design System Reference

## Token-Based Design

### Colors
```dart
// core/styles/app_colors.dart
abstract class AppColors {
  // Primary
  static const primary = Color(0xFF1E88E5);
  static const primaryLight = Color(0xFF6AB7FF);
  static const primaryDark = Color(0xFF005CB2);

  // Neutral
  static const background = Color(0xFFF5F5F5);
  static const surface = Color(0xFFFFFFFF);
  static const textPrimary = Color(0xFF212121);
  static const textSecondary = Color(0xFF757575);

  // Semantic
  static const success = Color(0xFF4CAF50);
  static const warning = Color(0xFFFF9800);
  static const error = Color(0xFFE53935);
  static const info = Color(0xFF2196F3);
}

// ✅ ĐÚNG
Container(color: AppColors.primary)
Text('Hello', style: TextStyle(color: AppColors.textPrimary))

// ❌ SAI — CẤM
Container(color: Color(0xFF1E88E5))
Container(color: Colors.blue)
```

### Spacing
```dart
// core/styles/app_spacing.dart
abstract class AppSpacing {
  static const double xxs = 2.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;
  static const double xxxl = 48.0;
}

// ✅ ĐÚNG
SizedBox(height: AppSpacing.lg)
Padding(padding: EdgeInsets.all(AppSpacing.md))
Gap(AppSpacing.sm) // nếu dùng gap package

// ❌ SAI — CẤM magic numbers
SizedBox(height: 16)
Padding(padding: EdgeInsets.all(12))
```

### Typography
```dart
// core/styles/app_text_styles.dart
abstract class AppTextStyles {
  static const heading1 = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    height: 1.3,
  );
  static const heading2 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.3,
  );
  static const body1 = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    height: 1.5,
  );
  static const body2 = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    height: 1.5,
  );
  static const caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    height: 1.4,
  );
}

// ✅ ĐÚNG
Text('Title', style: AppTextStyles.heading1)

// ❌ SAI
Text('Title', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold))
```

### Borders & Radius
```dart
abstract class AppBorders {
  static const radiusSm = BorderRadius.all(Radius.circular(4));
  static const radiusMd = BorderRadius.all(Radius.circular(8));
  static const radiusLg = BorderRadius.all(Radius.circular(12));
  static const radiusXl = BorderRadius.all(Radius.circular(16));
  static const radiusFull = BorderRadius.all(Radius.circular(999));
}

// ✅ ĐÚNG
Container(decoration: BoxDecoration(borderRadius: AppBorders.radiusMd))

// ❌ SAI
Container(decoration: BoxDecoration(borderRadius: BorderRadius.circular(8)))
```

## ThemeData Integration
```dart
// core/styles/theme.dart
class AppTheme {
  static ThemeData get light => ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
    textTheme: TextTheme(
      displayLarge: AppTextStyles.heading1,
      displayMedium: AppTextStyles.heading2,
      bodyLarge: AppTextStyles.body1,
      bodyMedium: AppTextStyles.body2,
      labelSmall: AppTextStyles.caption,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: AppBorders.radiusMd),
        padding: EdgeInsets.symmetric(
          horizontal: AppSpacing.xl,
          vertical: AppSpacing.md,
        ),
      ),
    ),
  );

  static ThemeData get dark => ThemeData.dark().copyWith(
    // Dark theme overrides...
  );
}
```

## Theme Extension for Quick Access
```dart
extension ThemeX on BuildContext {
  ThemeData get theme => Theme.of(this);
  TextTheme get textTheme => Theme.of(this).textTheme;
  ColorScheme get colorScheme => Theme.of(this).colorScheme;
}

// Sử dụng
Text('Hello', style: context.textTheme.bodyLarge)
Container(color: context.colorScheme.primary)
```

## DLS Widget Pattern
```dart
// Nếu project có Design Language System widgets → ưu tiên dùng
// VD: AppButton thay vì ElevatedButton, AppTextField thay vì TextField

// ✅ ĐÚNG — dùng DLS widget
AppButton(label: 'Submit', onPressed: onSubmit)

// ❌ SAI — dùng raw Material khi có DLS
ElevatedButton(onPressed: onSubmit, child: Text('Submit'))
```

## Anti-Patterns Checklist
- [ ] Không có `Color(0xFF...)` trong code UI
- [ ] Không có `Colors.xxx` trong code UI
- [ ] Không có `SizedBox(height: [number])` trực tiếp — dùng tokens
- [ ] Không có inline `TextStyle(fontSize: ...)` — dùng AppTextStyles
- [ ] Không có `BorderRadius.circular(...)` trực tiếp — dùng AppBorders
- [ ] Tất cả colors tham chiếu từ AppColors hoặc theme
- [ ] Tất cả spacing tham chiếu từ AppSpacing hoặc constants
