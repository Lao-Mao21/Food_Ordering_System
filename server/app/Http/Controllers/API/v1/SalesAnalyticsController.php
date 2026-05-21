<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class SalesAnalyticsController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $fromInput = $request->input('from');
        $toInput = $request->input('to');

        $from = filled($fromInput)
            ? Carbon::parse($fromInput)->startOfDay()
            : now()->startOfMonth()->startOfDay();
        $to = filled($toInput)
            ? Carbon::parse($toInput)->endOfDay()
            : now()->endOfDay();

        if ($from->gt($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        $completed = Order::query()
            ->where('status', 'completed')
            ->whereBetween('ordered_at', [$from, $to]);

        $completedOrders = (clone $completed)
            ->orderBy('ordered_at')
            ->get(['ordered_at', 'total']);

        $totalRevenue = (float) $completedOrders->sum(fn (Order $order) => (float) $order->total);
        $totalOrders = $completedOrders->count();
        $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        $statusCounts = Order::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->whereBetween('ordered_at', [$from, $to])
            ->groupBy('status')
            ->pluck('total', 'status');

        $revenueTrend = $this->buildRevenueTrend($from, $to, $completedOrders);

        $revenueByDay = collect($revenueTrend['points'])
            ->filter(fn (array $point) => $revenueTrend['granularity'] === 'daily')
            ->map(fn (array $point) => [
                'date' => $point['period_start'],
                'revenue' => $point['revenue'],
                'orders' => $point['orders'],
            ])
            ->values();

        $topItems = $this->topItemsQuery()
            ->whereBetween('orders.ordered_at', [$from, $to])
            ->get();

        $year = (int) $to->format('Y');
        $yearlyTopItems = $this->topItemsQuery()
            ->whereYear('orders.ordered_at', $year)
            ->get();

        $monthlyRows = Order::query()
            ->select(DB::raw('MONTH(ordered_at) as month'), DB::raw('SUM(total) as revenue'), DB::raw('COUNT(*) as orders'))
            ->where('status', 'completed')
            ->whereYear('ordered_at', $year)
            ->groupBy(DB::raw('MONTH(ordered_at)'))
            ->get()
            ->keyBy('month');

        $monthlyRevenue = collect(range(1, 12))->map(function (int $month) use ($monthlyRows, $year) {
            $row = $monthlyRows->get($month);
            $date = Carbon::create($year, $month, 1);

            return [
                'month' => $date->format('M'),
                'month_number' => $month,
                'revenue' => round((float) ($row->revenue ?? 0), 2),
                'orders' => (int) ($row->orders ?? 0),
            ];
        })->values();

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
            'revenue_trend' => $revenueTrend,
            'revenue_by_day' => $revenueByDay,
            'monthly_revenue' => $monthlyRevenue,
            'top_items' => $topItems,
            'yearly_top_items' => $yearlyTopItems,
            'range' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
        ]);
    }

    public function generateSummary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'range' => ['required', 'array'],
            'range.from' => ['nullable', 'string', 'max:40'],
            'range.to' => ['nullable', 'string', 'max:40'],
            'summary' => ['required', 'array'],
            'revenue_trend' => ['nullable', 'array'],
            'monthly_revenue' => ['nullable', 'array'],
            'top_items' => ['nullable', 'array'],
            'yearly_top_items' => ['nullable', 'array'],
        ]);

        $webhookUrl = config('services.n8n.analytics_summary_webhook_url');

        if (! $webhookUrl) {
            return $this->error('The analytics summary generator is not configured.', 400);
        }

        try {
            $client = Http::timeout((int) config('services.n8n.timeout', 30))->acceptJson();
            $headerName = config('services.n8n.analytics_summary_header_name');
            $headerValue = config('services.n8n.analytics_summary_header_value');

            if ($headerName && $headerValue) {
                $client = $client->withHeaders([$headerName => $headerValue]);
            }

            $response = $client->post($webhookUrl, [
                'range' => $validated['range'],
                'summary' => $validated['summary'],
                'revenue_trend' => $validated['revenue_trend'] ?? [],
                'monthly_revenue' => $validated['monthly_revenue'] ?? [],
                'top_items' => $validated['top_items'] ?? [],
                'yearly_top_items' => $validated['yearly_top_items'] ?? [],
            ]);
        } catch (ConnectionException) {
            return $this->error('The analytics summary generator could not be reached. Check that n8n is running and listening for the test event.', 424);
        }

        if ($response->failed()) {
            if ($response->status() === 401 || $response->status() === 403) {
                return $this->error('The analytics summary generator rejected the request. Check the n8n Header Auth credential.', 424);
            }

            $message = $response->json('message');
            $hint = $response->json('hint');
            $details = collect([$message, $hint])
                ->filter(fn ($detail) => is_string($detail) && trim($detail) !== '')
                ->implode(' ');

            return $this->error($details ?: 'The analytics summary generator returned an error.', 424);
        }

        $generated = $this->extractGeneratedSummary($response->json());

        if (! $generated['summary'] && ! $generated['insight'] && ! $generated['recommendation']) {
            return $this->error('The analytics summary generator did not return a usable summary.', 422);
        }

        return $this->success('Analytics summary generated successfully.', $generated);
    }

    private function topItemsQuery()
    {
        return DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->select(
                'order_items.menu_item_name as name',
                DB::raw('SUM(order_items.quantity) as quantity_sold'),
                DB::raw('SUM(order_items.line_total) as revenue')
            )
            ->where('orders.status', 'completed')
            ->groupBy('order_items.menu_item_name')
            ->orderByDesc('revenue')
            ->limit(20);
    }

    private function buildRevenueTrend(Carbon $from, Carbon $to, Collection $orders): array
    {
        $days = $from->diffInDays($to) + 1;
        $granularity = match (true) {
            $days <= 62 => 'daily',
            $days <= 180 => 'weekly',
            default => 'monthly',
        };

        $buckets = [];

        if ($granularity === 'daily') {
            for ($cursor = $from->copy()->startOfDay(); $cursor->lte($to); $cursor->addDay()) {
                $key = $cursor->toDateString();
                $buckets[$key] = [
                    'label' => $cursor->format('M j'),
                    'period_start' => $cursor->toDateString(),
                    'period_end' => $cursor->toDateString(),
                    'revenue' => 0,
                    'orders' => 0,
                ];
            }
        }

        if ($granularity === 'weekly') {
            for ($cursor = $from->copy()->startOfDay(); $cursor->lte($to); $cursor->addDays(7)) {
                $end = $cursor->copy()->addDays(6)->min($to);
                $key = $cursor->toDateString();
                $buckets[$key] = [
                    'label' => $cursor->format('M j') . '-' . $end->format('M j'),
                    'period_start' => $cursor->toDateString(),
                    'period_end' => $end->toDateString(),
                    'revenue' => 0,
                    'orders' => 0,
                ];
            }
        }

        if ($granularity === 'monthly') {
            for ($cursor = $from->copy()->startOfMonth(); $cursor->lte($to); $cursor->addMonth()) {
                $start = $cursor->copy()->max($from);
                $end = $cursor->copy()->endOfMonth()->min($to);
                $key = $cursor->format('Y-m');
                $buckets[$key] = [
                    'label' => $cursor->format('M Y'),
                    'period_start' => $start->toDateString(),
                    'period_end' => $end->toDateString(),
                    'revenue' => 0,
                    'orders' => 0,
                ];
            }
        }

        foreach ($orders as $order) {
            $orderedAt = Carbon::parse($order->ordered_at);

            $key = match ($granularity) {
                'daily' => $orderedAt->toDateString(),
                'weekly' => $from->copy()->addDays((int) floor($from->diffInDays($orderedAt) / 7) * 7)->toDateString(),
                default => $orderedAt->format('Y-m'),
            };

            if (! isset($buckets[$key])) {
                continue;
            }

            $buckets[$key]['revenue'] = round($buckets[$key]['revenue'] + (float) $order->total, 2);
            $buckets[$key]['orders']++;
        }

        return [
            'granularity' => $granularity,
            'points' => array_values($buckets),
        ];
    }

    private function extractGeneratedSummary(mixed $payload): array
    {
        if (is_array($payload) && array_is_list($payload)) {
            $payload = $payload[0] ?? null;
        }

        $rawOutput = data_get($payload, 'output') ?? data_get($payload, 'data') ?? data_get($payload, 'result') ?? data_get($payload, 'text') ?? data_get($payload, 'message');

        if (is_array($rawOutput) && array_is_list($rawOutput)) {
            $rawOutput = $rawOutput[0] ?? null;
        }

        if (is_string($rawOutput)) {
            $decoded = json_decode($this->stripJsonFence($rawOutput), true);
            $payload = is_array($decoded) ? $decoded : ['summary' => $rawOutput];
        } elseif (is_array($rawOutput)) {
            $payload = $rawOutput;
        }

        $summary = $this->findTextValue($payload, ['summary', 'analytics_summary', 'executive_summary', 'overview']);
        $insight = $this->findTextValue($payload, ['insight', 'key_insight', 'analysis', 'observation']);
        $recommendation = $this->findTextValue($payload, ['recommendation', 'recommendations', 'suggested_action', 'next_action', 'action']);

        if (! $summary && ! $insight && ! $recommendation) {
            $fallback = $this->firstStringValue($payload);
            $summary = $fallback ?: '';
        }

        return [
            'summary' => is_string($summary) ? trim($summary) : '',
            'insight' => is_string($insight) ? trim($insight) : '',
            'recommendation' => is_string($recommendation) ? trim($recommendation) : '',
        ];
    }

    private function findTextValue(mixed $payload, array $keys): ?string
    {
        if (! is_array($payload)) {
            return null;
        }

        foreach ($payload as $key => $value) {
            $normalizedKey = strtolower((string) $key);

            if (in_array($normalizedKey, $keys, true) && is_string($value) && trim($value) !== '') {
                return $value;
            }

            if (is_array($value)) {
                $nested = $this->findTextValue($value, $keys);

                if ($nested) {
                    return $nested;
                }
            }
        }

        return null;
    }

    private function firstStringValue(mixed $payload): ?string
    {
        if (is_string($payload) && trim($payload) !== '') {
            return $payload;
        }

        if (! is_array($payload)) {
            return null;
        }

        foreach ($payload as $value) {
            $found = $this->firstStringValue($value);

            if ($found) {
                return $found;
            }
        }

        return null;
    }

    private function stripJsonFence(string $value): string
    {
        return trim(preg_replace('/^```(?:json)?|```$/m', '', trim($value)) ?? $value);
    }
}
