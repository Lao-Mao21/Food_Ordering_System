<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class RecycleBinController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        return $this->success('Recycle bin retrieved successfully.', [
            'users' => UserResource::collection(
                User::onlyTrashed()->latest('deleted_at')->get()
            ),
            'categories' => Category::onlyTrashed()
                ->withCount(['menuItems' => fn ($query) => $query->withTrashed()])
                ->latest('deleted_at')
                ->get(),
            'menu_items' => MenuItem::onlyTrashed()
                ->with('menuCategory')
                ->latest('deleted_at')
                ->get(),
        ]);
    }
}
