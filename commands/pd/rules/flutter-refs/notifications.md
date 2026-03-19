# Flutter Notifications Reference

## Setup
```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^3.0.0
  firebase_messaging: ^15.0.0
  flutter_local_notifications: ^17.0.0
```

## Firebase Messaging (Push Notifications)

### Initialization
```dart
class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    // Request permission (iOS)
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Get FCM token
      final token = await _messaging.getToken();
      // Send token to backend...

      // Listen for token refresh
      _messaging.onTokenRefresh.listen(_sendTokenToServer);
    }

    // Setup message handlers
    _setupMessageHandlers();
  }
}
```

### Handle 3 Lifecycle States
```dart
Future<void> _setupMessageHandlers() async {
  // 1. FOREGROUND — app đang mở
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    // Hiển thị local notification (vì FCM không auto-show khi foreground)
    _showLocalNotification(message);
  });

  // 2. BACKGROUND — app đang chạy background, user tap notification
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    _handleNotificationTap(message);
  });

  // 3. TERMINATED — app đã đóng hoàn toàn, user tap notification mở app
  // BẮT BUỘC check — thiếu cái này = "mở từ notification không navigate"
  final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
  if (initialMessage != null) {
    _handleNotificationTap(initialMessage);
  }
}
```

### Navigation from Notification
```dart
void _handleNotificationTap(RemoteMessage message) {
  final data = message.data;

  // VALIDATE payload trước khi navigate — CẤM navigate trực tiếp từ raw data
  if (data['type'] == null || data['id'] == null) {
    return; // Invalid payload, ignore
  }

  switch (data['type']) {
    case 'order':
      Get.toNamed(AppRoutes.ORDER_DETAIL, parameters: {'id': data['id']});
      break;
    case 'chat':
      Get.toNamed(AppRoutes.CHAT_DETAIL, parameters: {'id': data['id']});
      break;
    default:
      Get.toNamed(AppRoutes.HOME);
  }
}
```

## Local Notifications (Foreground Display)
```dart
Future<void> _showLocalNotification(RemoteMessage message) async {
  const androidDetails = AndroidNotificationDetails(
    'default_channel',
    'Default',
    importance: Importance.high,
    priority: Priority.high,
  );
  const iosDetails = DarwinNotificationDetails();
  const details = NotificationDetails(
    android: androidDetails,
    iOS: iosDetails,
  );

  await _localNotifications.show(
    message.hashCode,
    message.notification?.title ?? '',
    message.notification?.body ?? '',
    details,
    payload: jsonEncode(message.data),
  );
}
```

## Permission Best Practice
```dart
// CẤM hỏi permission ngay khi mở app
// ĐÚng: hiện custom dialog giải thích lợi ích trước
Future<void> requestPermissionWithContext() async {
  // Bước 1: Hiện dialog giải thích
  final shouldRequest = await Get.dialog<bool>(
    AlertDialog(
      title: const Text('Bật thông báo'),
      content: const Text(
        'Nhận thông báo khi có đơn hàng mới, '
        'tin nhắn và khuyến mãi đặc biệt.',
      ),
      actions: [
        TextButton(
          onPressed: () => Get.back(result: false),
          child: const Text('Để sau'),
        ),
        TextButton(
          onPressed: () => Get.back(result: true),
          child: const Text('Bật ngay'),
        ),
      ],
    ),
  );

  // Bước 2: Gọi system permission CHỈ khi user đồng ý
  if (shouldRequest == true) {
    await _messaging.requestPermission();
  }
}
```

## iOS Badge Management
```dart
// Clear badge khi user vào screen liên quan
@override
void onInit() {
  super.onInit();
  // Clear iOS badge
  FlutterAppBadger.removeBadge();
  // Hoặc
  FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
    badge: false, // Don't increment badge khi foreground
  );
}
```

## Anti-Patterns
- CẤM hỏi permission on startup without context
- CẤM quên `getInitialMessage()` — notification từ terminated state sẽ không navigate
- CẤM navigate trực tiếp từ raw JSON payload — validate trước
- CẤM quên clear badge — user bị confused bởi stale badge count
