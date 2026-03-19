# Flutter State Management Reference (GetX)

## GetxController Lifecycle
```dart
class MyLogic extends GetxController {
  @override
  void onInit() {
    super.onInit();
    // Khởi tạo data, setup workers, fetch initial data
  }

  @override
  void onReady() {
    super.onReady();
    // Gọi sau khi widget rendered lần đầu (1 frame sau onInit)
    // Dùng cho: show dialogs, toasts, animations
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
Obx(() => Text('${controller.state.count}'));

// GetBuilder: manual update, nhẹ hơn Obx
// Dùng cho: data ít thay đổi, complex widgets, performance-sensitive
GetBuilder<MyLogic>(
  id: 'profile', // Optional: specific update ID
  builder: (ctrl) => Text(ctrl.state.profileName),
);
// Trigger update: controller.update(['profile']);

// GetX widget: reactive + access controller
GetX<MyLogic>(
  builder: (ctrl) => Text('${ctrl.state.count}'),
);
```

## State Patterns

### Loading/Error/Data Pattern
```dart
// data_state.dart — reactive state tách riêng
class DataState {
  final status = Rx<DataStatus>(DataStatus.initial);
  final data = Rxn<MyData>();
  final error = ''.obs;
}

enum DataStatus { initial, loading, success, error }

// data_logic.dart — business logic
class DataLogic extends GetxController {
  final state = DataState();
  final _repository = Get.find<MyRepository>();

  Future<void> fetchData() async {
    state.status.value = DataStatus.loading;
    try {
      state.data.value = await _repository.getData();
      state.status.value = DataStatus.success;
    } catch (e) {
      state.error.value = e.toString();
      state.status.value = DataStatus.error;
    }
  }
}
```

### Pagination Pattern
```dart
// list_state.dart
class ListState {
  final items = <Item>[].obs;
  final page = 1.obs;
  final hasMore = true.obs;
  final isLoadingMore = false.obs;
}

// list_logic.dart
class ListLogic extends GetxController {
  final state = ListState();
  final _repository = Get.find<ItemRepository>();

  Future<void> loadMore() async {
    if (!state.hasMore.value || state.isLoadingMore.value) return;
    state.isLoadingMore.value = true;
    try {
      final newItems = await _repository.getItems(page: state.page.value);
      if (newItems.isEmpty) {
        state.hasMore.value = false;
      } else {
        state.items.addAll(newItems);
        state.page.value++;
      }
    } finally {
      state.isLoadingMore.value = false;
    }
  }

  Future<void> refresh() async {
    state.page.value = 1;
    state.hasMore.value = true;
    state.items.clear();
    await loadMore();
  }
}
```

### Form Pattern (tách Logic + State)
```dart
// create_item_state.dart
class CreateItemState {
  final isSubmitting = false.obs;
}

// create_item_logic.dart
class CreateItemLogic extends GetxController {
  final state = CreateItemState();
  final formKey = GlobalKey<FormState>();
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final _repository = Get.find<ItemRepository>();

  Future<void> submit() async {
    if (!(formKey.currentState?.validate() ?? false)) return;
    state.isSubmitting.value = true;
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
      state.isSubmitting.value = false;
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
