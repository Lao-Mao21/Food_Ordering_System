class OrderModel {
  const OrderModel({
    required this.id,
    required this.orderNumber,
    required this.customerName,
    required this.orderType,
    required this.status,
    required this.paymentStatus,
    required this.total,
    this.notes,
  });

  final int id;
  final String orderNumber;
  final String customerName;
  final String orderType;
  final String status;
  final String paymentStatus;
  final double total;
  final String? notes;

  bool get canEdit => status == 'pending';

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] as int,
      orderNumber: json['order_number'] as String? ?? '',
      customerName: json['customer_name'] as String? ?? '',
      orderType: json['order_type'] as String? ?? '',
      status: json['status'] as String? ?? '',
      paymentStatus: json['payment_status'] as String? ?? '',
      total: double.tryParse('${json['total']}') ?? 0,
      notes: json['notes'] as String?,
    );
  }
}
