<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MenuItem;
use App\Traits\ApiResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class MenuItemController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::query()->with('menuCategory');

        $filter = $request->input('filter', 'active');

        match ($filter) {
            'deleted' => $query->onlyTrashed(),
            'all' => $query->withTrashed(),
            default => $query->withoutTrashed(),
        };

        if (! $request->boolean('include_unavailable')) {
            $query->where('is_available', true);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $menuItems = $query
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return $this->success('Menu items retrieved successfully.', [
            'menu_items' => $menuItems,
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateMenuItem($request);
        $validated = $this->resolveCategory($validated);
        $validated['created_by'] = $request->user()?->id;

        $menuItem = MenuItem::create($validated);

        return $this->success('Menu item created successfully.', [
            'menu_item' => $menuItem,
        ], 201);
    }

    public function show(MenuItem $menuItem): JsonResponse
    {
        return $this->success('Menu item retrieved successfully.', [
            'menu_item' => $menuItem,
        ]);
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $menuItem->update($this->resolveCategory($this->validateMenuItem($request)));

        return $this->success('Menu item updated successfully.', [
            'menu_item' => $menuItem->refresh(),
        ]);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $menuItem->delete();

        return $this->success('Menu item deleted successfully.', null);
    }

    public function restore(string $id): JsonResponse
    {
        $menuItem = MenuItem::withTrashed()->findOrFail($id);

        if (! $menuItem->trashed()) {
            return $this->error('Menu item is not deleted.', 400);
        }

        $menuItem->restore();

        return $this->success('Menu item restored successfully.', [
            'menu_item' => $menuItem->refresh()->load('menuCategory'),
        ]);
    }

    public function forceDestroy(string $id): JsonResponse
    {
        $menuItem = MenuItem::withTrashed()->findOrFail($id);
        $menuItem->forceDelete();

        return $this->success('Menu item permanently deleted successfully.', null);
    }

    public function generateDescription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:120'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'string', 'max:2048'],
        ]);

        $webhookUrl = config('services.n8n.menu_description_webhook_url');

        if (! $webhookUrl) {
            return $this->error('The menu description generator is not configured.', 400);
        }

        try {
            $client = Http::timeout((int) config('services.n8n.timeout', 30))->acceptJson();
            $headerName = config('services.n8n.menu_description_header_name');
            $headerValue = config('services.n8n.menu_description_header_value');

            if ($headerName && $headerValue) {
                $client = $client->withHeaders([$headerName => $headerValue]);
            }

            $response = $client->post($webhookUrl, [
                'name' => trim($validated['name']),
                'category' => trim($validated['category']),
                'price' => $validated['price'] ?? null,
                'image_url' => $validated['image_url'] ?? null,
            ]);
        } catch (ConnectionException) {
            return $this->error('The description generator could not be reached. Check that n8n is running and listening for the test event.', 424);
        }

        if ($response->failed()) {
            if ($response->status() === 401 || $response->status() === 403) {
                return $this->error('The description generator rejected the request. Check the n8n Header Auth credential.', 424);
            }

            $message = $response->json('message');
            $hint = $response->json('hint');
            $details = collect([$message, $hint])
                ->filter(fn ($detail) => is_string($detail) && trim($detail) !== '')
                ->implode(' ');

            return $this->error($details ?: 'The description generator returned an error.', 424);
        }

        $description = $this->extractGeneratedDescription($response->json());

        if (! $description) {
            return $this->error('The description generator did not return a description.', 422);
        }

        return $this->success('Menu item description generated successfully.', [
            'description' => $description,
        ]);
    }

    public function cleanName(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $webhookUrl = config('services.n8n.menu_name_cleaner_webhook_url');

        if (! $webhookUrl) {
            return $this->error('The menu name grammar fixer is not configured.', 400);
        }

        try {
            $client = Http::timeout((int) config('services.n8n.timeout', 30))->acceptJson();
            $headerName = config('services.n8n.menu_name_cleaner_header_name');
            $headerValue = config('services.n8n.menu_name_cleaner_header_value');

            if ($headerName && $headerValue) {
                $client = $client->withHeaders([$headerName => $headerValue]);
            }

            $response = $client->post($webhookUrl, [
                'name' => trim($validated['name']),
            ]);
        } catch (ConnectionException) {
            return $this->error('The menu name grammar fixer could not be reached. Check that n8n is running and listening for the test event.', 424);
        }

        if ($response->failed()) {
            if ($response->status() === 401 || $response->status() === 403) {
                return $this->error('The menu name grammar fixer rejected the request. Check the n8n Header Auth credential.', 424);
            }

            $message = $response->json('message');
            $hint = $response->json('hint');
            $details = collect([$message, $hint])
                ->filter(fn ($detail) => is_string($detail) && trim($detail) !== '')
                ->implode(' ');

            return $this->error($details ?: 'The menu name grammar fixer returned an error.', 424);
        }

        $name = $this->extractCleanedName($response->json());

        if (! $name) {
            return $this->error('The menu name grammar fixer did not return a name.', 422);
        }

        return $this->success('Menu item name fixed successfully.', [
            'name' => $name,
        ]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $validated['image']->store('menu-items', 'public');
        $imageUrl = $request->getSchemeAndHttpHost().Storage::url($path);

        return $this->success('Menu item image uploaded successfully.', [
            'image_url' => $imageUrl,
        ], 201);
    }

    private function validateMenuItem(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'category' => ['required_without:category_id', 'nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_available' => ['required', 'boolean'],
            'image_url' => ['nullable', 'string', 'max:2048'],
        ]);
    }

    private function resolveCategory(array $validated): array
    {
        if (! empty($validated['category_id'])) {
            $category = Category::findOrFail($validated['category_id']);
        } else {
            $category = Category::firstOrCreate(
                ['name' => trim($validated['category'])],
                ['is_active' => true]
            );
        }

        $validated['category_id'] = $category->id;
        $validated['category'] = $category->name;

        return $validated;
    }

    private function extractGeneratedDescription(mixed $payload): ?string
    {
        if (is_array($payload) && array_is_list($payload)) {
            $payload = $payload[0] ?? null;
        }

        $candidates = [
            data_get($payload, 'description'),
            data_get($payload, 'output.description'),
            data_get($payload, 'output.name'),
            data_get($payload, 'output'),
            data_get($payload, 'name'),
            data_get($payload, 'text'),
            data_get($payload, 'message'),
            data_get($payload, 'data.description'),
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && trim($candidate) !== '') {
                $decoded = json_decode($candidate, true);
                $decodedDescription = data_get($decoded, 'description');

                if (is_string($decodedDescription) && trim($decodedDescription) !== '') {
                    return trim($decodedDescription);
                }

                return trim($candidate);
            }
        }

        return null;
    }

    private function extractCleanedName(mixed $payload): ?string
    {
        if (is_array($payload) && array_is_list($payload)) {
            $payload = $payload[0] ?? null;
        }

        if (is_string($payload) && trim($payload) !== '') {
            return trim($payload);
        }

        $candidates = [
            data_get($payload, 'name'),
            data_get($payload, 'output.name'),
            data_get($payload, 'output'),
            data_get($payload, 'text'),
            data_get($payload, 'message'),
            data_get($payload, 'data.name'),
        ];

        foreach ($candidates as $candidate) {
            if (is_string($candidate) && trim($candidate) !== '') {
                $decoded = json_decode($candidate, true);
                $decodedName = data_get($decoded, 'name');

                if (is_string($decodedName) && trim($decodedName) !== '') {
                    return trim($decodedName);
                }

                return trim($candidate);
            }
        }

        return null;
    }
}

