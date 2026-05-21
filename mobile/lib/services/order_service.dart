import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/constants/api_constants.dart';
import '../core/network/dio_client.dart';

final orderServiceProvider = Provider<OrderService>((ref) {
  return OrderService(ref.watch(dioProvider));
});

class OrderService {
  OrderService(this._dio);

  final Dio _dio;

  Future<void> createOrder({
    required String customerName,
    required String orderType,
    required String paymentMethod,
    required String paymentStatus,
    required List<Map<String, dynamic>> items,
    String? customerPhone,
    String? notes,
    double discount = 0,
  }) async {
    await _dio.post(
      ApiConstants.orders,
      data: {
        'customer_name': customerName,
        'customer_phone': customerPhone,
        'order_type': orderType,
        'payment_method': paymentMethod,
        'payment_status': paymentStatus,
        'discount': discount,
        'notes': notes,
        'items': items,
      },
    );
  }

  Future<String> cleanNote(String note) async {
    final response = await _dio.post(
      ApiConstants.cleanOrderNote,
      data: {'note': note},
    );

    final data = response.data['data'] as Map<String, dynamic>;
    return data['note'] as String? ?? note;
  }
}
