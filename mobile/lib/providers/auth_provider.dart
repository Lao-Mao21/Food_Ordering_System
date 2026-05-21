import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/user_model.dart';
import '../services/auth_service.dart';

final authProvider = NotifierProvider<AuthController, AuthState>(
  AuthController.new,
);

class AuthState {
  const AuthState({
    this.user,
    this.isLoading = true,
    this.isSubmitting = false,
  });

  final UserModel? user;
  final bool isLoading;
  final bool isSubmitting;

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    UserModel? user,
    bool clearUser = false,
    bool? isLoading,
    bool? isSubmitting,
  }) {
    return AuthState(
      user: clearUser ? null : user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
    );
  }
}

class AuthController extends Notifier<AuthState> {
  late final AuthService _authService;

  @override
  AuthState build() {
    _authService = ref.watch(authServiceProvider);
    Future.microtask(loadSession);
    return const AuthState();
  }

  Future<void> loadSession() async {
    state = state.copyWith(isLoading: true);

    try {
      final user = await _authService.currentUser();
      state = state.copyWith(user: user, clearUser: user == null, isLoading: false);
    } catch (_) {
      state = state.copyWith(clearUser: true, isLoading: false);
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isSubmitting: true);

    try {
      final user = await _authService.login(email: email, password: password);
      state = state.copyWith(user: user, isSubmitting: false, isLoading: false);
    } catch (_) {
      state = state.copyWith(isSubmitting: false);
      rethrow;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = state.copyWith(clearUser: true, isLoading: false);
  }
}
