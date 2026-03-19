# Flutter Performance Reference

## Widget Optimization

### const Constructors
```dart
// ✅ ĐÚNG: const widget — không rebuild
const Text('Hello');
const SizedBox(height: 16);
const Icon(Icons.home);
const MyCustomWidget(title: 'Static');

// ❌ SAI: không const khi có thể
Text('Hello'); // Tạo instance mới mỗi lần rebuild
SizedBox(height: 16);
```

### Minimize Rebuild Scope
```dart
// ✅ ĐÚNG: Obx wrap CHỈ phần cần reactive
Scaffold(
  appBar: AppBar(title: const Text('App')), // Không rebuild
  body: Column(
    children: [
      const HeaderWidget(), // Không rebuild
      Obx(() => Text('Count: ${controller.count}')), // Chỉ phần này rebuild
      const FooterWidget(), // Không rebuild
    ],
  ),
);

// ❌ SAI: Obx wrap cả Scaffold
Obx(() => Scaffold(
  appBar: AppBar(title: Text('Count: ${controller.count}')),
  body: HugeWidgetTree(), // Toàn bộ rebuild!
));
```

### RepaintBoundary
```dart
// Dùng cho widgets animate/repaint thường xuyên
RepaintBoundary(
  child: AnimatedWidget(...),
)

// Dùng cho list items phức tạp
ListView.builder(
  itemBuilder: (context, index) => RepaintBoundary(
    child: ComplexListItem(data: items[index]),
  ),
);
```

## List Performance

### ListView.builder vs ListView
```dart
// ✅ ĐÚNG: builder — lazy rendering, chỉ build items visible
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemWidget(item: items[index]),
);

// ❌ SAI: tất cả items build cùng lúc
ListView(
  children: items.map((item) => ItemWidget(item: item)).toList(),
);
```

### Pagination
```dart
// NotificationListener cho infinite scroll
NotificationListener<ScrollNotification>(
  onNotification: (notification) {
    if (notification is ScrollEndNotification &&
        notification.metrics.extentAfter < 200) {
      controller.loadMore();
    }
    return false;
  },
  child: ListView.builder(...),
);
```

### itemExtent cho fixed-height items
```dart
// Nếu items cùng height → itemExtent cải thiện scroll performance
ListView.builder(
  itemExtent: 72.0, // Fixed height
  itemCount: 1000,
  itemBuilder: (context, index) => ListTile(...),
);
```

## Image Optimization
```dart
// Cache network images
CachedNetworkImage(
  imageUrl: url,
  placeholder: (context, url) => const CircularProgressIndicator(),
  errorWidget: (context, url, error) => const Icon(Icons.error),
  memCacheWidth: 300, // Resize in memory
);

// Resize asset images
Image.asset(
  'assets/large_image.png',
  cacheWidth: 300, // Decode smaller
  cacheHeight: 300,
);

// Precache images
@override
void onInit() {
  super.onInit();
  precacheImage(const AssetImage('assets/hero.png'), Get.context!);
}
```

## Memory Management
```dart
class MyController extends GetxController {
  StreamSubscription? _subscription;
  Timer? _timer;
  final _scrollController = ScrollController();

  @override
  void onInit() {
    super.onInit();
    _subscription = stream.listen((_) {});
    _timer = Timer.periodic(const Duration(seconds: 30), (_) => refresh());
  }

  @override
  void onClose() {
    // BẮT BUỘC dispose tất cả resources
    _subscription?.cancel();
    _timer?.cancel();
    _scrollController.dispose();
    super.onClose();
  }
}
```

## Build Modes
```bash
# Debug: hot reload, assertions, debug info
flutter run

# Profile: performance profiling, no debug overhead
flutter run --profile

# Release: optimized, minified, no debug
flutter build apk --release
flutter build ios --release

# Obfuscate (release only)
flutter build apk --obfuscate --split-debug-info=build/debug-info
```

## DevTools Profiling
```bash
# Mở Flutter DevTools
flutter pub global activate devtools
flutter pub global run devtools

# Profile widget rebuilds
# → DevTools → Performance → Track widget rebuilds

# Memory profiling
# → DevTools → Memory → Take snapshot → Analyze allocations
```

## Common Performance Pitfalls
1. **Animated opacity** → dùng `AnimatedOpacity` thay vì rebuild toàn bộ widget tree
2. **Heavy compute** → dùng `compute()` function (isolate) cho JSON parsing lớn, image processing
3. **Excessive setState/update** → batch changes, debounce rapid updates
4. **Large images** → resize trước khi display, dùng `cacheWidth`/`cacheHeight`
5. **Deep widget trees** → flatten, extract sub-trees thành separate widgets
6. **String concatenation in loops** → dùng `StringBuffer`
