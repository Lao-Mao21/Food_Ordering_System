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

    public function index(Request $request)
    {
        $query = User::query();

        $filter = $request->input('filter', 'active');

        match ($filter) {
            'deleted' => $query->onlyTrashed(),
            'all' => $query->withTrashed(),
            'active' => $query->withoutTrashed(),
            default => $query->withoutTrashed(),
        };

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->input('sort_by', 'name');
        $sortOrder = $request->input('sort_order', 'asc');

        $allowedSortFields = ['name', 'role', 'created_at'];
        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'name';
        }

        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'asc';
        }

        $query->orderBy($sortBy, $sortOrder);

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

    public function show(string $slug)
    {
        $user = User::withTrashed()->where('slug', $slug)->firstOrFail();

        return $this->success(
            "User retrieved successfully",
            ['user' => new UserResource($user)],
            200
        );
    }

    public function update(UserRequest $request, string $id)
    {
        $user = User::withTrashed()->findOrFail($id);

        $validated = $request->validated();

        if ($request->hasFile('avatar')) {
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            $avatarFile = $request->file('avatar');
            $filename = time() . '_' . uniqid() . '.' . $avatarFile->getClientOriginalExtension();
            $path = $avatarFile->storeAs('avatars', $filename, 'public');
            $validated['avatar'] = $path;
        } else {
            unset($validated['avatar']);
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
            unset($validated['password_confirmation']);
        }

        unset($validated['password_confirmation']);

        $user->update($validated);

        return $this->success(
            "User updated successfully",
            ['user' => new UserResource($user)],
            200
        );
    }

    public function destroy(string $id)
    {
        $user = User::query()->findOrFail($id);
        $user->delete();

        return $this->success(
            "User deleted successfully",
            null,
            200
        );
    }

    public function forceDestroy(string $id)
    {
        $user = User::withTrashed()->findOrFail($id);

        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->forceDelete();

        return $this->success(
            "User permanently deleted successfully",
            null,
            200
        );
    }

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
