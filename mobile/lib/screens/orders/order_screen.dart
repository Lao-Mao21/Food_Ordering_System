import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/menu_item_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/menu_service.dart';
import '../../services/order_service.dart';

class CartLine {
  CartLine({required this.item, this.quantity = 1});

  final MenuItemModel item;
  int quantity;
}

class OrderScreen extends ConsumerStatefulWidget {
  const OrderScreen({super.key});

  @override
  ConsumerState<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends ConsumerState<OrderScreen> {
  final _customerController = TextEditingController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();
  final _cart = <int, CartLine>{};

  late Future<List<MenuItemModel>> _menuFuture;
  String _orderType = 'dine_in';
  String _paymentMethod = 'cash';
  bool _isSubmitting = false;
  bool _isCleaningNote = false;

  @override
  void initState() {
    super.initState();
    _menuFuture = ref.read(menuServiceProvider).getAvailableItems();
  }

  @override
  void dispose() {
    _customerController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  double get _total {
    return _cart.values.fold(
      0,
      (sum, line) => sum + (line.item.price * line.quantity),
    );
  }

  void _addItem(MenuItemModel item) {
    setState(() {
      final existing = _cart[item.id];
      if (existing == null) {
        _cart[item.id] = CartLine(item: item);
      } else {
        existing.quantity++;
      }
    });
  }

  void _removeItem(int id) {
    setState(() => _cart.remove(id));
  }

  Future<void> _cleanNote() async {
    final note = _notesController.text.trim();
    if (note.isEmpty) return;

    setState(() => _isCleaningNote = true);
    try {
      final fixed = await ref.read(orderServiceProvider).cleanNote(note);
      _notesController.text = fixed;
      _showMessage('Note cleaned.');
    } on DioException catch (error) {
      _showMessage(error.response?.data['message'] as String? ?? 'Unable to clean note.');
    } finally {
      if (mounted) setState(() => _isCleaningNote = false);
    }
  }

  Future<void> _submitOrder() async {
    if (_customerController.text.trim().isEmpty) {
      _showMessage('Customer name is required.');
      return;
    }

    if (_cart.isEmpty) {
      _showMessage('Add at least one menu item.');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await ref.read(orderServiceProvider).createOrder(
            customerName: _customerController.text.trim(),
            customerPhone: _phoneController.text.trim().isEmpty
                ? null
                : _phoneController.text.trim(),
            orderType: _orderType,
            paymentMethod: _paymentMethod,
            paymentStatus: 'pending',
            notes: _notesController.text.trim().isEmpty
                ? null
                : _notesController.text.trim(),
            items: _cart.values
                .map(
                  (line) => {
                    'menu_item_id': line.item.id,
                    'quantity': line.quantity,
                  },
                )
                .toList(),
          );

      _customerController.clear();
      _phoneController.clear();
      _notesController.clear();
      setState(() => _cart.clear());
      _showMessage('Order submitted. It will appear in the web system.');
    } on DioException catch (error) {
      _showMessage(error.response?.data['message'] as String? ?? 'Unable to submit order.');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _logout() async {
    await ref.read(authProvider.notifier).logout();
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('OrderGood'),
        actions: [
          IconButton(
            tooltip: 'Refresh menu',
            onPressed: () {
              setState(() {
                _menuFuture = ref.read(menuServiceProvider).getAvailableItems();
              });
            },
            icon: const Icon(Icons.refresh),
          ),
          IconButton(
            tooltip: 'Sign out',
            onPressed: _logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            setState(() {
              _menuFuture = ref.read(menuServiceProvider).getAvailableItems();
            });
            await _menuFuture;
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Place Order',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'Signed in as ${user?.name ?? 'OrderGood user'}',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              _buildOrderForm(),
              const SizedBox(height: 16),
              _buildCart(),
              const SizedBox(height: 16),
              _buildMenu(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOrderForm() {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _customerController,
              decoration: const InputDecoration(
                labelText: 'Customer name',
                prefixIcon: Icon(Icons.person_outline),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _orderType,
                    decoration: const InputDecoration(labelText: 'Type'),
                    items: const [
                      DropdownMenuItem(value: 'dine_in', child: Text('Dine in')),
                      DropdownMenuItem(value: 'takeout', child: Text('Takeout')),
                      DropdownMenuItem(value: 'delivery', child: Text('Delivery')),
                    ],
                    onChanged: (value) => setState(() => _orderType = value ?? 'dine_in'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _paymentMethod,
                    decoration: const InputDecoration(labelText: 'Payment'),
                    items: const [
                      DropdownMenuItem(value: 'cash', child: Text('Cash')),
                      DropdownMenuItem(value: 'card', child: Text('Card')),
                      DropdownMenuItem(value: 'ewallet', child: Text('E-wallet')),
                    ],
                    onChanged: (value) => setState(() => _paymentMethod = value ?? 'cash'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              minLines: 3,
              maxLines: 5,
              decoration: InputDecoration(
                labelText: 'Notes',
                alignLabelWithHint: true,
                suffixIcon: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: TextButton.icon(
                    onPressed: _isCleaningNote ? null : _cleanNote,
                    icon: _isCleaningNote
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.auto_fix_high, size: 16),
                    label: const Text('Grammar'),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCart() {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Cart',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                ),
                Text(
                  'PHP ${_total.toStringAsFixed(2)}',
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_cart.isEmpty)
              const Text('No items selected.')
            else
              ..._cart.values.map(
                (line) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(line.item.name),
                  subtitle: Text('Qty ${line.quantity}'),
                  trailing: IconButton(
                    onPressed: () => _removeItem(line.item.id),
                    icon: const Icon(Icons.close),
                  ),
                ),
              ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _isSubmitting ? null : _submitOrder,
              icon: _isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.receipt_long),
              label: Text(_isSubmitting ? 'Submitting...' : 'Submit order'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenu() {
    return FutureBuilder<List<MenuItemModel>>(
      future: _menuFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (snapshot.hasError) {
          return Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Unable to load menu: ${snapshot.error}'),
            ),
          );
        }

        final items = snapshot.data ?? [];

        if (items.isEmpty) {
          return const Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No available menu items.'),
            ),
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Available Menu',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            ...items.map(_buildMenuItem),
          ],
        );
      },
    );
  }

  Widget _buildMenuItem(MenuItemModel item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _addItem(item),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 72,
                  height: 72,
                  child: item.imageUrl == null || item.imageUrl!.isEmpty
                      ? Container(
                          color: const Color(0xFFDCE7F8),
                          child: const Icon(Icons.restaurant),
                        )
                      : CachedNetworkImage(
                          imageUrl: item.imageUrl!,
                          fit: BoxFit.cover,
                          errorWidget: (_, _, _) => Container(
                            color: const Color(0xFFDCE7F8),
                            child: const Icon(Icons.restaurant),
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      style: const TextStyle(fontWeight: FontWeight.w900),
                    ),
                    Text(
                      item.category,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'PHP ${item.price.toStringAsFixed(2)}',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.add_circle_outline),
            ],
          ),
        ),
      ),
    );
  }
}
