import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/constants/api_constants.dart';
import '../core/network/dio_client.dart';
import '../models/menu_item_model.dart';

final menuServiceProvider = Provider<MenuService>((ref) {
  return MenuService(ref.watch(dioProvider));
});

class MenuService {
  MenuService(this._dio);

  final Dio _dio;

  Future<List<MenuItemModel>> getAvailableItems() async {
    final response = await _dio.get(ApiConstants.menuItems);
    final data = response.data['data'] as Map<String, dynamic>;
    final items = data['menu_items'] as List<dynamic>? ?? [];

    return items
        .map((item) => MenuItemModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }
}
