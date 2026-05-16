<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Traits\ApiResponse;

class UserController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Handle soft deletes - exclude deleted users by default
        $filter = $request->input('filter', 'active'); // active, deleted, all

        match ($filter) {
            'deleted' => $query->onlyTrashed(),
            'all' => $query->withTrashed(),
            'active' => $query->withoutTrashed(),
            default => $query->withoutTrashed(),
        };

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'name');
        $sortOrder = $request->input('sort_order', 'asc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['name', 'role', 'created_at'];
        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'name';
        }

        // Validate sort order
        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'asc';
        }

        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = (int) $request->input('limit', 10);
        $perPage = max(1, min($perPage, 100));

        $paginated = $query->paginate($perPage);

        return $this->success(
            "Users retrieved successfully",
            [
                'users' => UserResource::collection($paginated->items()),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ]
            ],
            200
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('avatar')) {
            $avatarFile = $request->file('avatar');
            $filename = time() . '_' . uniqid() . '.' . $avatarFile->getClientOriginalExtension();
            $path = $avatarFile->storeAs('avatars', $filename, 'public');
            $validated['avatar'] = $path;
        }

        $user = User::create($validated);

        return $this->success(
            "User created successfully",
            ['user' => new UserResource($user)],
            201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(string $slug)
    {
        $user = User::withTrashed()->where('slug', $slug)->firstOrFail();

        return $this->success(
            "User retrieved successfully",
            ['user' => new UserResource($user)],
            200
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, string $id)
    {
        $user = User::withTrashed()->findOrFail($id);

        $validated = $request->validated();

        // Handle avatar upload — replace old file if a new one is provided
        if ($request->hasFile('avatar')) {
            // Delete old avatar from storage if it exists
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            $avatarFile = $request->file('avatar');
            $filename = time() . '_' . uniqid() . '.' . $avatarFile->getClientOriginalExtension();
            $path = $avatarFile->storeAs('avatars', $filename, 'public');
            $validated['avatar'] = $path;
        } else {
            // Keep the existing avatar
            unset($validated['avatar']);
        }

        // Only update password when a new one is explicitly provided
        if (empty($validated['password'])) {
            unset($validated['password']);
            unset($validated['password_confirmation']);
        }

        // Remove confirmation field — not a DB column
        unset($validated['password_confirmation']);

        $user->update($validated);

        return $this->success(
            "User updated successfully",
            ['user' => new UserResource($user)],
            200
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = User::withTrashed()->findOrFail($id);

        // If user is already trashed (soft deleted), do a hard delete (permanent)
        // Otherwise, do a soft delete
        if ($user->trashed()) {
            // Permanently delete the user and their avatar
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            $user->forceDelete();
            
            return $this->success(
                "User permanently deleted successfully",
                null,
                200
            );
        } else {
            // Soft delete the user
            $user->delete();
            
            return $this->success(
                "User deleted successfully",
                null,
                200
            );
        }
    }

    /**
     * Restore a soft-deleted user.
     */
    public function restore(string $id)
    {
        $user = User::withTrashed()->findOrFail($id);

        if (!$user->trashed()) {
            return $this->error("User is not deleted", 400);
        }

        $user->restore();

        return $this->success(
            "User restored successfully",
            ['user' => new UserResource($user)],
            200
        );
    }

}
