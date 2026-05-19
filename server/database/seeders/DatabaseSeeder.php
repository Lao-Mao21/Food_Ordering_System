<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'slug' => Str::slug('Admin'),
                'name' => 'Admin',
                'phone' => '+639000000000',
                'role' => UserRole::ADMIN,
                'password' => Hash::make('Password123!'),
            ]
        );

        $missingUsers = max(10 - User::count(), 0);

        if ($missingUsers > 0) {
            User::factory($missingUsers)->create();
        }

        $menuItems = [
            ['name' => 'Chicken Teriyaki Bowl', 'category' => 'Rice Meals', 'description' => 'Grilled chicken, steamed rice, vegetables, and teriyaki sauce.', 'price' => 165],
            ['name' => 'Beef Tapa Plate', 'category' => 'Rice Meals', 'description' => 'House-cured beef tapa with garlic rice and egg.', 'price' => 185],
            ['name' => 'Classic Cheeseburger', 'category' => 'Burgers', 'description' => 'Beef patty, cheddar, lettuce, tomato, and house sauce.', 'price' => 155],
            ['name' => 'Crispy Fries', 'category' => 'Sides', 'description' => 'Golden potato fries with seasoning.', 'price' => 85],
            ['name' => 'Iced Tea', 'category' => 'Drinks', 'description' => 'Fresh brewed house iced tea.', 'price' => 55],
            ['name' => 'Chocolate Brownie', 'category' => 'Desserts', 'description' => 'Dense chocolate brownie square.', 'price' => 75],
        ];

        foreach ($menuItems as $menuItem) {
            MenuItem::updateOrCreate(
                ['name' => $menuItem['name']],
                [
                    ...$menuItem,
                    'is_available' => true,
                    'created_by' => $admin->id,
                ]
            );
        }

        $menu = MenuItem::query()->get()->keyBy('name');
        $demoOrders = [
            ['number' => 'FO-DEMO-0001', 'days_ago' => 7, 'customer' => 'Maria Santos', 'items' => [['Chicken Teriyaki Bowl', 2], ['Iced Tea', 2]], 'payment' => 'paid'],
            ['number' => 'FO-DEMO-0002', 'days_ago' => 6, 'customer' => 'Juan Dela Cruz', 'items' => [['Beef Tapa Plate', 1], ['Chocolate Brownie', 1]], 'payment' => 'paid'],
            ['number' => 'FO-DEMO-0003', 'days_ago' => 5, 'customer' => 'Ana Reyes', 'items' => [['Classic Cheeseburger', 2], ['Crispy Fries', 1], ['Iced Tea', 2]], 'payment' => 'paid'],
            ['number' => 'FO-DEMO-0004', 'days_ago' => 4, 'customer' => 'Carlo Mendoza', 'items' => [['Chicken Teriyaki Bowl', 1], ['Crispy Fries', 2]], 'payment' => 'paid'],
            ['number' => 'FO-DEMO-0005', 'days_ago' => 3, 'customer' => 'Liza Garcia', 'items' => [['Beef Tapa Plate', 2], ['Iced Tea', 2]], 'payment' => 'paid'],
            ['number' => 'FO-DEMO-0006', 'days_ago' => 2, 'customer' => 'Ramon Lim', 'items' => [['Classic Cheeseburger', 1], ['Chocolate Brownie', 2]], 'payment' => 'paid'],
            ['number' => 'FO-DEMO-0007', 'days_ago' => 1, 'customer' => 'Nina Cruz', 'items' => [['Chicken Teriyaki Bowl', 3], ['Iced Tea', 3]], 'payment' => 'paid'],
        ];

        foreach ($demoOrders as $demoOrder) {
            $orderedAt = now()->subDays($demoOrder['days_ago'])->setTime(12 + ($demoOrder['days_ago'] % 5), 15);
            $orderLines = [];
            $subtotal = 0;

            foreach ($demoOrder['items'] as [$name, $quantity]) {
                $item = $menu->get($name);
                $lineTotal = (float) $item->price * $quantity;
                $subtotal += $lineTotal;

                $orderLines[] = [
                    'menu_item_id' => $item->id,
                    'menu_item_name' => $item->name,
                    'unit_price' => $item->price,
                    'quantity' => $quantity,
                    'line_total' => $lineTotal,
                ];
            }

            $order = Order::updateOrCreate(
                ['order_number' => $demoOrder['number']],
                [
                    'customer_name' => $demoOrder['customer'],
                    'customer_phone' => '+639' . fake()->numerify('#########'),
                    'order_type' => 'dine_in',
                    'status' => 'completed',
                    'payment_status' => $demoOrder['payment'],
                    'payment_method' => 'cash',
                    'subtotal' => $subtotal,
                    'tax' => 0,
                    'discount' => 0,
                    'total' => $subtotal,
                    'notes' => 'Demo completed sale for analytics.',
                    'ordered_at' => $orderedAt,
                    'completed_at' => $orderedAt->copy()->addMinutes(20),
                    'created_by' => $admin->id,
                    'created_at' => $orderedAt,
                    'updated_at' => $orderedAt,
                ]
            );

            $order->items()->delete();
            $order->items()->createMany($orderLines);
        }
        $activeOrders = [
            ['number' => 'FO-ACTIVE-0001', 'customer' => 'Paolo Rivera', 'status' => 'pending', 'payment' => 'pending', 'items' => [['Classic Cheeseburger', 1], ['Iced Tea', 1]]],
            ['number' => 'FO-ACTIVE-0002', 'customer' => 'Mika Fernandez', 'status' => 'preparing', 'payment' => 'paid', 'items' => [['Beef Tapa Plate', 1], ['Crispy Fries', 1]]],
            ['number' => 'FO-ACTIVE-0003', 'customer' => 'Sofia Tan', 'status' => 'ready', 'payment' => 'pending', 'items' => [['Chicken Teriyaki Bowl', 2], ['Chocolate Brownie', 1]]],
        ];

        foreach ($activeOrders as $activeOrder) {
            $orderedAt = now()->subMinutes(match ($activeOrder['status']) {
                'pending' => 8,
                'preparing' => 18,
                'ready' => 28,
                default => 5,
            });
            $orderLines = [];
            $subtotal = 0;

            foreach ($activeOrder['items'] as [$name, $quantity]) {
                $item = $menu->get($name);
                $lineTotal = (float) $item->price * $quantity;
                $subtotal += $lineTotal;

                $orderLines[] = [
                    'menu_item_id' => $item->id,
                    'menu_item_name' => $item->name,
                    'unit_price' => $item->price,
                    'quantity' => $quantity,
                    'line_total' => $lineTotal,
                ];
            }

            $order = Order::updateOrCreate(
                ['order_number' => $activeOrder['number']],
                [
                    'customer_name' => $activeOrder['customer'],
                    'customer_phone' => '+639' . fake()->numerify('#########'),
                    'order_type' => 'takeout',
                    'status' => $activeOrder['status'],
                    'payment_status' => $activeOrder['payment'],
                    'payment_method' => 'cash',
                    'subtotal' => $subtotal,
                    'tax' => 0,
                    'discount' => 0,
                    'total' => $subtotal,
                    'notes' => 'Demo active order for dashboard.',
                    'ordered_at' => $orderedAt,
                    'completed_at' => null,
                    'created_by' => $admin->id,
                    'created_at' => $orderedAt,
                    'updated_at' => $orderedAt,
                ]
            );

            $order->items()->delete();
            $order->items()->createMany($orderLines);
        }
    }
}




