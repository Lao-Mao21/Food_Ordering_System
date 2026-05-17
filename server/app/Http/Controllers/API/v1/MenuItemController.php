<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MenuItemController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::query();

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
            'categories' => $menuItems->pluck('category')->unique()->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateMenuItem($request);
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
        $menuItem->update($this->validateMenuItem($request));

        return $this->success('Menu item updated successfully.', [
            'menu_item' => $menuItem->refresh(),
        ]);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $menuItem->delete();

        return $this->success('Menu item deleted successfully.', null);
    }

    private function validateMenuItem(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'min:0'],
            'is_available' => ['required', 'boolean'],
            'image_url' => ['nullable', 'string', 'max:2048'],
        ]);
    }
}

