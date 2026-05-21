<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Order;
use App\Traits\ApiResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Order::query()->with(['items.menuItem']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->string('payment_status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        $orders = $query
            ->latest('ordered_at')
            ->latest()
            ->get();

        return $this->success('Orders retrieved successfully.', [
            'orders' => $orders,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:40'],
            'order_type' => ['required', Rule::in(['dine_in', 'takeout', 'delivery'])],
            'payment_method' => ['required', Rule::in(['cash', 'card', 'ewallet'])],
            'payment_status' => ['required', Rule::in(['pending', 'paid'])],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $order = DB::transaction(function () use ($validated, $request) {
            $items = collect($validated['items']);
            $menuItems = MenuItem::query()
                ->whereIn('id', $items->pluck('menu_item_id')->unique())
                ->get()
                ->keyBy('id');

            $subtotal = 0;
            $orderLines = [];

            foreach ($items as $item) {
                $menuItem = $menuItems->get($item['menu_item_id']);

                if (! $menuItem || ! $menuItem->is_available) {
                    abort(422, 'One or more selected menu items are unavailable.');
                }

                $lineTotal = (float) $menuItem->price * (int) $item['quantity'];
                $subtotal += $lineTotal;

                $orderLines[] = [
                    'menu_item_id' => $menuItem->id,
                    'menu_item_name' => $menuItem->name,
                    'unit_price' => $menuItem->price,
                    'quantity' => $item['quantity'],
                    'line_total' => $lineTotal,
                ];
            }

            $discount = (float) ($validated['discount'] ?? 0);
            $tax = 0;
            $total = max($subtotal + $tax - $discount, 0);

            $order = Order::create([
                'order_number' => $this->nextOrderNumber(),
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'] ?? null,
                'order_type' => $validated['order_type'],
                'status' => 'pending',
                'payment_status' => $validated['payment_status'],
                'payment_method' => $validated['payment_method'],
                'subtotal' => $subtotal,
                'tax' => $tax,
                'discount' => $discount,
                'total' => $total,
                'notes' => $validated['notes'] ?? null,
                'ordered_at' => now(),
                'created_by' => $request->user()?->id,
            ]);

            $order->items()->createMany($orderLines);

            return $order->load(['items.menuItem']);
        });

        return $this->success('Order created successfully.', [
            'order' => $order,
        ], 201);
    }

    public function show(Order $order): JsonResponse
    {
        return $this->success('Order retrieved successfully.', [
            'order' => $order->load(['items.menuItem']),
        ]);
    }

    public function myOrders(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with(['items.menuItem'])
            ->where('created_by', $request->user()->id)
            ->latest('ordered_at')
            ->latest()
            ->get();

        return $this->success('My orders retrieved successfully.', [
            'orders' => $orders,
        ]);
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => ['sometimes', 'required', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:40'],
            'order_type' => ['sometimes', Rule::in(['dine_in', 'takeout', 'delivery'])],
            'status' => ['sometimes', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'payment_status' => ['sometimes', Rule::in(['pending', 'paid', 'refunded'])],
            'payment_method' => ['sometimes', Rule::in(['cash', 'card', 'ewallet'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $this->preventTerminalStatusChange($order, $validated['status'] ?? null);

        if (($validated['status'] ?? null) === 'completed' && ! $order->completed_at) {
            $validated['completed_at'] = now();
        }

        $order->update($validated);

        return $this->success('Order updated successfully.', [
            'order' => $order->refresh()->load(['items.menuItem']),
        ]);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'preparing', 'ready', 'completed', 'cancelled'])],
            'payment_status' => ['sometimes', Rule::in(['pending', 'paid', 'refunded'])],
        ]);

        $this->preventTerminalStatusChange($order, $validated['status']);

        return $this->update($request->merge($validated), $order);
    }

    public function updateMyOrder(Request $request, Order $order): JsonResponse
    {
        $this->ensureOwnEditableOrder($request, $order);

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $order->update([
            'notes' => $validated['notes'] ?? null,
        ]);

        return $this->success('Order updated successfully.', [
            'order' => $order->refresh()->load(['items.menuItem']),
        ]);
    }

    public function deleteMyOrder(Request $request, Order $order): JsonResponse
    {
        $this->ensureOwnEditableOrder($request, $order);

        $order->update([
            'status' => 'cancelled',
        ]);

        return $this->success('Order cancelled successfully.', [
            'order' => $order->refresh()->load(['items.menuItem']),
        ]);
    }

    public function cleanNote(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'note' => ['required', 'string', 'max:2000'],
        ]);

        $webhookUrl = config('services.n8n.order_note_cleaner_webhook_url');

        if (! $webhookUrl) {
            return $this->error('The order note grammar fixer is not configured.', 400);
        }

        try {
            $client = Http::timeout((int) config('services.n8n.timeout', 30))->acceptJson();
            $headerName = config('services.n8n.order_note_cleaner_header_name');
            $headerValue = config('services.n8n.order_note_cleaner_header_value');

            if ($headerName && $headerValue) {
                $client = $client->withHeaders([$headerName => $headerValue]);
            }

            $response = $client->post($webhookUrl, [
                'note' => trim($validated['note']),
            ]);
        } catch (ConnectionException) {
            return $this->error('The order note grammar fixer could not be reached. Check that n8n is running and listening for the test event.', 424);
        }

        if ($response->failed()) {
            if ($response->status() === 401 || $response->status() === 403) {
                return $this->error('The order note grammar fixer rejected the request. Check the n8n Header Auth credential.', 424);
            }

            $message = $response->json('message');
            $hint = $response->json('hint');
            $details = collect([$message, $hint])
                ->filter(fn ($detail) => is_string($detail) && trim($detail) !== '')
                ->implode(' ');

            return $this->error($details ?: 'The order note grammar fixer returned an error.', 424);
        }

        $note = $this->extractCleanedNote($response->json());

        if (! $note) {
            return $this->error('The order note grammar fixer did not return a note.', 422);
        }

        return $this->success('Order note fixed successfully.', [
            'note' => $note,
        ]);
    }

    private function nextOrderNumber(): string
    {
        $prefix = 'FO-' . now()->format('Ymd') . '-';

        $lastOrder = Order::query()
            ->where('order_number', 'like', $prefix . '%')
            ->latest('id')
            ->first();

        $sequence = $lastOrder
            ? ((int) substr($lastOrder->order_number, -4)) + 1
            : 1;

        return $prefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    private function ensureOwnEditableOrder(Request $request, Order $order): void
    {
        if ($order->created_by !== $request->user()->id) {
            abort(403, 'You can only manage orders you submitted.');
        }

        if ($order->status !== 'pending') {
            abort(422, 'Only pending orders can be changed from mobile.');
        }
    }

    private function preventTerminalStatusChange(Order $order, ?string $nextStatus): void
    {
        if (! $nextStatus || $nextStatus === $order->status) {
            return;
        }

        if (in_array($order->status, ['completed', 'cancelled'], true)) {
            abort(422, 'Completed or cancelled orders can no longer be changed.');
        }
    }

    private function extractCleanedNote(mixed $payload): ?string
    {
        if (is_array($payload) && array_is_list($payload)) {
            $payload = $payload[0] ?? null;
        }

        if (is_string($payload) && trim($payload) !== '') {
            return trim($payload);
        }

        $candidates = [
            data_get($payload, 'note'),
            data_get($payload, 'output.note'),
            data_get($payload, 'output'),
            data_get($payload, 'text'),
            data_get($payload, 'message'),
            data_get($payload, 'data.note'),
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && trim($candidate) !== '') {
                $decoded = json_decode($candidate, true);
                $decodedNote = data_get($decoded, 'note');

                if (is_string($decodedNote) && trim($decodedNote) !== '') {
                    return trim($decodedNote);
                }

                return trim($candidate);
            }
        }

        return null;
    }

}
