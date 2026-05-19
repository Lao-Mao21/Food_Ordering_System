<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Category::query()->withCount('menuItems');

        $filter = $request->input('filter', 'active');

        match ($filter) {
            'deleted' => $query->onlyTrashed(),
            'all' => $query->withTrashed(),
            default => $query->withoutTrashed(),
        };

        if (! $request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $categories = $query
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return $this->success('Categories retrieved successfully.', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $category = Category::create($this->validateCategory($request));

        return $this->success('Category created successfully.', [
            'category' => $category->loadCount('menuItems'),
        ], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $this->validateCategory($request, $category);

        DB::transaction(function () use ($category, $validated) {
            $category->update($validated);
            $category->menuItems()->update(['category' => $category->name]);
        });

        return $this->success('Category updated successfully.', [
            'category' => $category->refresh()->loadCount('menuItems'),
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return $this->success('Category deleted successfully.', null);
    }

    public function restore(string $id): JsonResponse
    {
        $category = Category::withTrashed()->findOrFail($id);

        if (! $category->trashed()) {
            return $this->error('Category is not deleted.', 400);
        }

        $category->restore();

        return $this->success('Category restored successfully.', [
            'category' => $category->refresh()->loadCount('menuItems'),
        ]);
    }

    public function forceDestroy(string $id): JsonResponse
    {
        $category = Category::withTrashed()->findOrFail($id);

        if ($category->menuItems()->withTrashed()->exists()) {
            return $this->error('This category is linked to menu items and cannot be permanently deleted.', 422);
        }

        $category->forceDelete();

        return $this->success('Category permanently deleted successfully.', null);
    }

    private function validateCategory(Request $request, ?Category $category = null): array
    {
        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('categories', 'name')->ignore($category?->id),
            ],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}
