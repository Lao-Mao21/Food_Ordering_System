<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesAnalyticsController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $from = Carbon::parse($request->input('from', now()->subDays(29)->toDateString()))->startOfDay();
        $to = Carbon::parse($request->input('to', now()->toDateString()))->endOfDay();

        $completed = Order::query()
            ->where('status', 'completed')
            ->whereBetween('ordered_at', [$from, $to]);

        $totalRevenue = (float) (clone $completed)->sum('total');
        $totalOrders = (clone $completed)->count();
        $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        $statusCounts = Order::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->whereBetween('ordered_at', [$from, $to])
            ->groupBy('status')
            ->pluck('total', 'status');

        $revenueByDay = Order::query()
            ->select(DB::raw('DATE(ordered_at) as date'), DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as orders'))
            ->where('status', 'completed')
            ->whereBetween('ordered_at', [$from, $to])
            ->groupBy(DB::raw('DATE(ordered_at)'))
            ->orderBy('date')
            ->get();

        $topItems = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->select(
                'order_items.menu_item_name as name',
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('SUM(order_items.line_total) as revenue')
            )
            ->where('orders.status', 'completed')
            ->whereBetween('orders.ordered_at', [$from, $to])
            ->groupBy('order_items.menu_item_name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        return $this->success('Sales analytics retrieved successfully.', [
            'summary' => [
                'total_revenue' => round($totalRevenue, 2),
                'total_orders' => $totalOrders,
                'average_order_value' => round($averageOrderValue, 2),
                'pending_orders' => (int) ($statusCounts['pending'] ?? 0),
                'preparing_orders' => (int) ($statusCounts['preparing'] ?? 0),
                'ready_orders' => (int) ($statusCounts['ready'] ?? 0),
                'completed_orders' => (int) ($statusCounts['completed'] ?? 0),
                'cancelled_orders' => (int) ($statusCounts['cancelled'] ?? 0),
            ],
            'revenue_by_day' => $revenueByDay,
            'top_items' => $topItems,
            'range' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
        ]);
    }
}
