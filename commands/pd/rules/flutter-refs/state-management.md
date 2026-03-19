# Flutter State Management Reference (GetX)

## GetxController Lifecycle
```dart
class MyController extends GetxController {
  @override
  void onInit() {
    super.onInit();
    // Khởi tạo data, setup workers, fetch initial data
  }

  @override
  void onReady() {
    super.onReady();
    // Gọi sau khi widget rendered lần đầu (1 frame sau onInit)
    // Dùng cho: show dialogs, snackbars, animations
  }

  @override
  void onClose() {
    // Dispose resources: streams, timers, controllers
    _scrollController.dispose();
    _subscription?.cancel();
    super.onClose();
  }
}
```

## Reactive Variables (.obs)
```dart
// Primitive types
final count = 0.obs;
final name = ''.obs;
final isLoading = false.obs;
final price = 0.0.obs;

// Collections
final items = <String>[].obs;
final userMap = <String, User>{}.obs;
final selectedIds = <int>{}.obs;

// Custom objects
final user = Rxn<User>(); // Nullable reactive
final user = User().obs;  // Non-nullable reactive

// Update values
count.value = 10;
count.value++;
items.add('new item');
items.assignAll(newList); // Replace entire list
items.refresh(); // Force update observers khi modify item properties
```

## Workers (Side Effects)
```dart
@override
void onInit() {
  super.onInit();

  // ever: gọi mỗi khi value thay đổi
  ever(count, (value) => print('Count changed: $value'));

  // once: chỉ gọi 1 lần đầu tiên
  once(count, (value) => print('First change: $value'));

  // debounce: chờ N ms sau lần thay đổi cuối
  debounce(searchQuery, _performSearch,
    time: const Duration(milliseconds: 500));

  // interval: gọi tối đa 1 lần mỗi N ms
  interval(scrollPosition, _loadMore,
    time: const Duration(seconds: 1));
}
```

## Obx vs GetBuilder
```dart
// Obx: reactive (stream-based), tự động rebuild khi .obs thay đổi
// Dùng cho: data thay đổi thường xuyên, UI cần realtime update
Obx(() => Text('${controller.count}'));

// GetBuilder: manual update, nhẹ hơn Obx
// Dùng cho: data ít thay đổi, complex widgets, performance-sensitive
GetBuilder<MyController>(
  id: 'profile', // Optional: specific update ID
  builder: (ctrl) => Text(ctrl.profileName),
);
// Trigger update: controller.update(['profile']);

// GetX widget: reactive + access controller
GetX<MyController>(
  builder: (ctrl) => Text('${ctrl.count}'),
);
```

## State Patterns

### Loading/Error/Data Pattern
```dart
class DataController extends GetxController {
  final _status = Rx<DataStatus>(DataStatus.initial);
  final _data = Rxn<MyData>();
  final _error = ''.obs;

  DataStatus get status => _status.value;
  MyData? get data => _data.value;
  String get error => _error.value;

  Future<void> fetchData() async {
    _status.value = DataStatus.loading;
    try {
      _data.value = await _repository.getData();
      _status.value = DataStatus.success;
    } catch (e) {
      _error.value = e.toString();
      _status.value = DataStatus.error;
    }
  }
}

enum DataStatus { initial, loading, success, error }
```

### Pagination Pattern
```dart
class ListController extends GetxController {
  final _items = <Item>[].obs;
  final _page = 1.obs;
  final _hasMore = true.obs;
  final _isLoadingMore = false.obs;

  Future<void> loadMore() async {
    if (!_hasMore.value || _isLoadingMore.value) return;
    _isLoadingMore.value = true;
    try {
      final newItems = await _repository.getItems(page: _page.value);
      if (newItems.isEmpty) {
        _hasMore.value = false;
      } else {
        _items.addAll(newItems);
        _page.value++;
      }
    } finally {
      _isLoadingMore.value = false;
    }
  }

  Future<void> refresh() async {
    _page.value = 1;
    _hasMore.value = true;
    _items.clear();
    await loadMore();
  }
}
```

### Form Controller Pattern
```dart
class FormController extends GetxController {
  final formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final _isSubmitting = false.obs;

  bool get isSubmitting => _isSubmitting.value;

  Future<void> submit() async {
    if (!formKey.currentState!.validate()) return;
    _isSubmitting.value = true;
    try {
      await _repository.create(
        name: nameController.text.trim(),
        email: emailController.text.trim(),
      );
      Get.back(result: true);
      // Hiển thị thành công qua toastification (xem shared/utils/ui/toast.dart)
    } catch (e) {
      ErrorHandler.handleError(e);
    } finally {
      _isSubmitting.value = false;
    }
  }

  @override
  void onClose() {
    nameController.dispose();
    emailController.dispose();
    super.onClose();
  }
}
```

## Communication Between Controllers
```dart
// Cách 1: Get.find() (controller đã registered)
final authCtrl = Get.find<AuthController>();
if (authCtrl.isLoggedIn) { ... }

// Cách 2: Workers lắng nghe shared state
class CartController extends GetxController {
  @override
  void onInit() {
    super.onInit();
    final authCtrl = Get.find<AuthController>();
    ever(authCtrl.user, (user) {
      if (user == null) clearCart();
    });
  }
}

// Cách 3: Event bus (GetX streams)
// Tránh dùng trừ khi controllers không biết nhau
```
