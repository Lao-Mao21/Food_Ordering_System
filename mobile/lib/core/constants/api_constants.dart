import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConstants {
  ApiConstants._();

  static final String domain = dotenv.get('API_URL');
  static final String baseUrl = '$domain/api';
  static final String storageUrl = '$domain/storage';

  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String user = '/user/auth/me';

  static const String menuItems = '/menu-items';
  static const String orders = '/orders';
  static const String cleanOrderNote = '/orders/notes/clean';

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
