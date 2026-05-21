class MenuItemModel {
  const MenuItemModel({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.isAvailable,
    this.description,
    this.imageUrl,
  });

  final int id;
  final String name;
  final String category;
  final double price;
  final bool isAvailable;
  final String? description;
  final String? imageUrl;

  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    return MenuItemModel(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      category: json['category'] as String? ?? '',
      price: double.tryParse('${json['price']}') ?? 0,
      isAvailable: json['is_available'] == true,
      description: json['description'] as String?,
      imageUrl: json['image_url'] as String?,
    );
  }
}
