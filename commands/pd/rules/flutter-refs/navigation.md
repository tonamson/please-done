# Flutter Navigation Reference (GetX)

## Route Setup
```dart
// app_routes.dart
abstract class AppRoutes {
  static const SPLASH = '/splash';
  static const LOGIN = '/login';
  static const HOME = '/home';
  static const PROFILE = '/profile';
  static const USER_DETAIL = '/user/:id';
  static const SETTINGS = '/settings';
}

// app_pages.dart
class AppPages {
  static const INITIAL = AppRoutes.SPLASH;

  static final routes = [
    GetPage(
      name: AppRoutes.SPLASH,
      page: () => const SplashView(),
      binding: SplashBinding(),
    ),
    GetPage(
      name: AppRoutes.LOGIN,
      page: () => const LoginView(),
      binding: LoginBinding(),
      transition: Transition.fadeIn,
    ),
    GetPage(
      name: AppRoutes.HOME,
      page: () => const HomeView(),
      binding: HomeBinding(),
      middlewares: [AuthMiddleware()],
      children: [
        GetPage(
          name: AppRoutes.PROFILE,
          page: () => const ProfileView(),
          binding: ProfileBinding(),
        ),
      ],
    ),
    GetPage(
      name: AppRoutes.USER_DETAIL,
      page: () => const UserDetailView(),
      binding: UserDetailBinding(),
    ),
  ];
}

// main.dart
GetMaterialApp(
  title: 'My App',
  initialRoute: AppPages.INITIAL,
  getPages: AppPages.routes,
  initialBinding: InitialBinding(),
  theme: AppTheme.light,
  darkTheme: AppTheme.dark,
  locale: const Locale('vi', 'VN'),
  defaultTransition: Transition.cupertino,
);
```

## Navigation Methods
```dart
// Push new page
Get.toNamed(AppRoutes.PROFILE);

// Push with arguments
Get.toNamed(AppRoutes.USER_DETAIL,
  arguments: {'userId': '123'},
  parameters: {'id': '123'}, // URL parameters
);

// Replace current page
Get.offNamed(AppRoutes.HOME);

// Clear stack and push
Get.offAllNamed(AppRoutes.LOGIN);

// Go back
Get.back();
Get.back(result: data); // Return data to previous page

// Get arguments in destination
final args = Get.arguments as Map<String, dynamic>;
final userId = Get.parameters['id'];
```

## Middleware (Auth Guard)
```dart
class AuthMiddleware extends GetMiddleware {
  @override
  int? get priority => 1; // Lower = higher priority

  @override
  RouteSettings? redirect(String? route) {
    final authService = Get.find<AuthService>();
    if (!authService.isLoggedIn) {
      return const RouteSettings(name: AppRoutes.LOGIN);
    }
    return null; // Continue to requested route
  }
}

class RoleMiddleware extends GetMiddleware {
  final List<String> requiredRoles;
  RoleMiddleware({required this.requiredRoles});

  @override
  RouteSettings? redirect(String? route) {
    final auth = Get.find<AuthController>();
    final hasRole = requiredRoles.any((r) => auth.user.value?.roles.contains(r) ?? false);
    if (!hasRole) {
      return const RouteSettings(name: AppRoutes.UNAUTHORIZED);
    }
    return null;
  }
}
```

## Deep Linking
```dart
// Android: android/app/src/main/AndroidManifest.xml
// <intent-filter>
//   <action android:name="android.intent.action.VIEW"/>
//   <data android:scheme="myapp" android:host="open"/>
// </intent-filter>

// iOS: ios/Runner/Info.plist
// <key>CFBundleURLTypes</key> → <string>myapp</string>

// Handle in GetX
GetPage(
  name: '/product/:id',
  page: () => const ProductView(),
  binding: ProductBinding(),
);
// URL: myapp://open/product/123 → navigates to ProductView with id=123
```

## Bottom Navigation with Nested Routes
```dart
class MainView extends GetView<MainController> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Obx(() => IndexedStack(
        index: controller.currentIndex,
        children: const [
          HomeView(),
          SearchView(),
          ProfileView(),
        ],
      )),
      bottomNavigationBar: Obx(() => BottomNavigationBar(
        currentIndex: controller.currentIndex,
        onTap: controller.changePage,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Trang chủ'),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Tìm kiếm'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Cá nhân'),
        ],
      )),
    );
  }
}
```

## Dialog & Bottom Sheet
```dart
// Dialog
Get.dialog(
  AlertDialog(
    title: const Text('Xác nhận'),
    content: const Text('Bạn có chắc muốn xóa?'),
    actions: [
      TextButton(onPressed: () => Get.back(), child: const Text('Hủy')),
      TextButton(
        onPressed: () { Get.back(result: true); },
        child: const Text('Xóa'),
      ),
    ],
  ),
  barrierDismissible: false,
);

// Bottom sheet
Get.bottomSheet(
  Container(
    padding: const EdgeInsets.all(16),
    decoration: const BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    child: Column(children: [...]),
  ),
  isScrollControlled: true,
);

// Snackbar
Get.snackbar(
  'Thành công',
  'Đã lưu thay đổi',
  snackPosition: SnackPosition.BOTTOM,
  duration: const Duration(seconds: 3),
);
```
