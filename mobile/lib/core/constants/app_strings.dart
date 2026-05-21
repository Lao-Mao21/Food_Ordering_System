import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppStrings {
  AppStrings._();

  // App Configuration
  static final String appName = dotenv.get('APP_NAME');
  static const String appTagline = 'Flutter';

  // Auth
  static const String login = 'Login';
  static const String logout = 'Logout';
  static const String email = 'Email';
  static const String password = 'Password';
  static const String welcomeBack = 'Welcome Back';
  static const String loginSubtitle = 'Sign in to continue';
  static const String loginSuccess = 'Login successful!';
  static const String logoutSuccess = 'Logged out successfully';

  // Navigation
  static const String home = 'Home';
  static const String users = 'Users';
  static const String profile = 'Profile';

  // Global error message
  static const String somethingWentWrong = 'Something went wrong';
  static const String noInternetConnection = 'No internet connection';
  static const String sessionExpired = 'Session expired. Please login again.';
}
