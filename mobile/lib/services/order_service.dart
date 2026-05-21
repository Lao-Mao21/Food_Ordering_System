import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/constants/api_constants.dart';
import '../core/network/dio_client.dart';
import '../models/order_model.dart';

final orderServiceProvider = Provider<OrderService>((ref) {
  return OrderService(ref.watch(dioProvider));
});

class OrderService {
  OrderService(this._dio);

  final Dio _dio;

  Future<List<OrderModel>> getMyOrders() async {
    final response = await _dio.get(ApiConstants.myOrders);
    final data = response.data['data'] as Map<String, dynamic>;
    final orders = data['orders'] as List<dynamic>? ?? [];

    return orders
        .map((order) => OrderModel.fromJson(order as Map<String, dynamic>))
        .toList();
  }

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

  Future<OrderModel> updateMyOrderNote(int id, String note) async {
    final response = await _dio.put(
      ApiConstants.myOrder(id),
      data: {'notes': note},
    );

    final data = response.data['data'] as Map<String, dynamic>;
    return OrderModel.fromJson(data['order'] as Map<String, dynamic>);
  }

  Future<OrderModel> cancelMyOrder(int id) async {
    final response = await _dio.delete(ApiConstants.myOrder(id));
    final data = response.data['data'] as Map<String, dynamic>;
    return OrderModel.fromJson(data['order'] as Map<String, dynamic>);
  }
}
