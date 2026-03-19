# Flutter Platform Channels Reference

## MethodChannel (Dart ↔ Native)
```dart
// Dart side
class NativeService {
  static const _channel = MethodChannel('com.myapp/native');

  /// Gọi native method
  static Future<String> getBatteryLevel() async {
    try {
      final result = await _channel.invokeMethod<int>('getBatteryLevel');
      return '$result%';
    } on PlatformException catch (e) {
      return 'Lỗi: ${e.message}';
    }
  }

  /// Gọi native method với arguments
  static Future<bool> saveToGallery(String path) async {
    return await _channel.invokeMethod<bool>('saveToGallery', {
      'path': path,
    }) ?? false;
  }

  /// Lắng nghe events từ native
  static void listenToNativeEvents() {
    _channel.setMethodCallHandler((call) async {
      switch (call.method) {
        case 'onNativeEvent':
          final data = call.arguments as Map;
          // Process event...
          return true;
        default:
          throw MissingPluginException();
      }
    });
  }
}
```

## Android (Kotlin)
```kotlin
// android/app/src/main/kotlin/.../MainActivity.kt
class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.myapp/native"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "getBatteryLevel" -> {
                        val level = getBatteryLevel()
                        if (level != -1) result.success(level)
                        else result.error("UNAVAILABLE", "Battery level not available", null)
                    }
                    "saveToGallery" -> {
                        val path = call.argument<String>("path")
                        // Save logic...
                        result.success(true)
                    }
                    else -> result.notImplemented()
                }
            }
    }

    private fun getBatteryLevel(): Int {
        val batteryManager = getSystemService(BATTERY_SERVICE) as BatteryManager
        return batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }
}
```

## iOS (Swift)
```swift
// ios/Runner/AppDelegate.swift
@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
    override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        let controller = window?.rootViewController as! FlutterViewController
        let channel = FlutterMethodChannel(
            name: "com.myapp/native",
            binaryMessenger: controller.binaryMessenger
        )

        channel.setMethodCallHandler { (call, result) in
            switch call.method {
            case "getBatteryLevel":
                let level = self.getBatteryLevel()
                result(level)
            case "saveToGallery":
                guard let args = call.arguments as? [String: Any],
                      let path = args["path"] as? String else {
                    result(FlutterError(code: "INVALID", message: "Invalid arguments", details: nil))
                    return
                }
                // Save logic...
                result(true)
            default:
                result(FlutterMethodNotImplemented)
            }
        }

        GeneratedPluginRegistrant.register(with: self)
        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }

    private func getBatteryLevel() -> Int {
        UIDevice.current.isBatteryMonitoringEnabled = true
        return Int(UIDevice.current.batteryLevel * 100)
    }
}
```

## EventChannel (Stream from Native)
```dart
// Dart: lắng nghe stream liên tục từ native (sensor data, location, etc.)
class SensorService {
  static const _eventChannel = EventChannel('com.myapp/sensors');

  static Stream<double> get accelerometerStream {
    return _eventChannel.receiveBroadcastStream().map((event) => event as double);
  }
}

// Sử dụng trong Controller
@override
void onInit() {
  super.onInit();
  SensorService.accelerometerStream.listen((value) {
    _sensorValue.value = value;
  });
}
```

## Best Practices
- Channel name: dùng reverse domain notation (`com.myapp/feature`)
- LUÔN try/catch `PlatformException` khi gọi native
- Test: dùng `TestDefaultBinaryMessenger` để mock channel responses
- Tách native code thành plugin riêng nếu reuse across projects
- Dùng `pigeon` package cho type-safe platform channels (generate code cả 2 phía)
