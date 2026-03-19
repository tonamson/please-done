# Flutter Testing Reference

## Setup
```yaml
# pubspec.yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  mocktail: ^1.0.0       # Mocking (preferred over mockito — no codegen)
  integration_test:
    sdk: flutter
```

## Unit Tests (Logic, Repositories, Services)
```dart
// test/unit/home/home_logic_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mocktail/mocktail.dart';

class MockUserRepository extends Mock implements UserRepository {}

void main() {
  late HomeLogic logic;
  late MockUserRepository mockRepo;

  setUp(() {
    mockRepo = MockUserRepository();
    Get.put<UserRepository>(mockRepo);
    logic = HomeLogic();
    Get.put(logic);
  });

  tearDown(() {
    Get.reset();
  });

  group('HomeLogic', () {
    test('fetchUsers - tải danh sách thành công', () async {
      // Arrange
      final users = [
        User(id: '1', name: 'Nguyễn Văn A', email: 'a@test.com'),
        User(id: '2', name: 'Trần Thị B', email: 'b@test.com'),
      ];
      when(() => mockRepo.getUsers()).thenAnswer((_) async => users);

      // Act
      await logic.fetchUsers();

      // Assert
      expect(logic.state.userList.length, equals(2));
      expect(logic.state.isLoading.value, isFalse);
      verify(() => mockRepo.getUsers()).called(1);
    });

    test('fetchUsers - xử lý lỗi khi API fail', () async {
      // Arrange
      when(() => mockRepo.getUsers()).thenThrow(Exception('Network error'));

      // Act
      await logic.fetchUsers();

      // Assert
      expect(logic.state.userList.isEmpty, isTrue);
      expect(logic.state.isLoading.value, isFalse);
    });

    test('selectUser - cập nhật selectedIndex', () {
      // Act
      logic.selectUser(2);

      // Assert
      expect(logic.state.selectedIndex.value, equals(2));
    });
  });
}
```

## Widget Tests
```dart
// test/widget/home/home_view_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mocktail/mocktail.dart';

class MockHomeLogic extends GetxController
    with Mock
    implements HomeLogic {
  @override
  final state = HomeState(); // Real state object — mock logic methods, not state
}

void main() {
  late MockHomeLogic mockLogic;

  setUp(() {
    mockLogic = MockHomeLogic();
    Get.put<HomeLogic>(mockLogic);
  });

  tearDown(() {
    Get.reset();
  });

  testWidgets('HomeView - hiển thị danh sách users', (tester) async {
    // Arrange — set state trực tiếp (real state, không cần when/thenReturn)
    mockLogic.state.isLoading.value = false;
    mockLogic.state.userList.assignAll([
      User(id: '1', name: 'Nguyễn Văn A', email: 'a@test.com'),
    ]);

    // Act
    await tester.pumpWidget(
      GetMaterialApp(home: const HomeView()),
    );
    await tester.pumpAndSettle();

    // Assert
    expect(find.text('Nguyễn Văn A'), findsOneWidget);
    expect(find.text('a@test.com'), findsOneWidget);
  });

  testWidgets('HomeView - hiển thị loading indicator', (tester) async {
    // Arrange
    mockLogic.state.isLoading.value = true;
    mockLogic.state.userList.clear();

    // Act
    await tester.pumpWidget(
      GetMaterialApp(home: const HomeView()),
    );

    // Assert
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('HomeView - tap vào user gọi selectUser', (tester) async {
    // Arrange
    mockLogic.state.isLoading.value = false;
    mockLogic.state.userList.assignAll([
      User(id: '1', name: 'Test User', email: 'test@test.com'),
    ]);
    when(() => mockLogic.selectUser(any())).thenReturn(null);

    // Act
    await tester.pumpWidget(
      GetMaterialApp(home: const HomeView()),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Test User'));

    // Assert
    verify(() => mockLogic.selectUser(0)).called(1);
  });
}
```

## Integration Tests
```dart
// integration_test/app_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:my_app/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('App E2E Tests', () {
    testWidgets('Đăng nhập và xem trang chủ', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Nhập thông tin đăng nhập
      await tester.enterText(find.byKey(const Key('email_field')), 'test@test.com');
      await tester.enterText(find.byKey(const Key('password_field')), 'password123');
      await tester.tap(find.byKey(const Key('login_button')));
      await tester.pumpAndSettle();

      // Verify trang chủ hiển thị
      expect(find.text('Trang chủ'), findsOneWidget);
    });
  });
}
```

## Test Helpers
```dart
// test/helpers/test_helpers.dart

/// Wrap widget với GetMaterialApp cho testing
Widget makeTestableWidget(Widget child) {
  return GetMaterialApp(home: child);
}

/// Setup common mocks
void setupCommonMocks() {
  Get.put<AuthService>(MockAuthService());
  Get.put<ApiProvider>(MockApiProvider());
}

/// Fake data factories
class FakeData {
  static User user({String? id, String? name}) => User(
    id: id ?? 'fake-id-${DateTime.now().millisecondsSinceEpoch}',
    name: name ?? 'Test User',
    email: 'test@test.com',
  );

  static List<User> userList(int count) =>
    List.generate(count, (i) => user(id: '$i', name: 'User $i'));
}
```

## Running Tests
```bash
# Unit + Widget tests
flutter test

# With coverage
flutter test --coverage

# Specific file
flutter test test/unit/home/home_logic_test.dart

# Integration tests
flutter test integration_test/app_test.dart

# Generate coverage report (needs lcov)
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```
