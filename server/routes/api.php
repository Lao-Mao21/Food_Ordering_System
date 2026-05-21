<?php

use App\Http\Controllers\API\v1\AuthenticationController;
use App\Http\Controllers\API\v1\CategoryController;
use App\Http\Controllers\API\v1\MenuItemController;
use App\Http\Controllers\API\v1\OrderController;
use App\Http\Controllers\API\v1\RecycleBinController;
use App\Http\Controllers\API\v1\SalesAnalyticsController;
use App\Http\Controllers\API\v1\UserController;
use Illuminate\Support\Facades\Route;

Route::post('auth/register', [AuthenticationController::class, 'register']);
Route::post('auth/login', [AuthenticationController::class, 'login']);
Route::post('auth/password/generate', [AuthenticationController::class, 'generatePassword']);
Route::post('auth/password/forgot', [AuthenticationController::class, 'sendResetLink']);
Route::post('auth/password/reset', [AuthenticationController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('user/auth/me', [AuthenticationController::class, 'me']);
    Route::post('auth/logout', [AuthenticationController::class, 'logout']);

    Route::get('menu-items', [MenuItemController::class, 'index']);
    Route::get('menu-items/{menuItem}', [MenuItemController::class, 'show']);
    Route::post('orders', [OrderController::class, 'store']);
    Route::get('orders/my', [OrderController::class, 'myOrders']);
    Route::put('orders/{order}/my', [OrderController::class, 'updateMyOrder']);
    Route::delete('orders/{order}/my', [OrderController::class, 'deleteMyOrder']);

    Route::middleware('role:admin')->group(function () {
        Route::apiResource('orders', OrderController::class)->only(['index', 'show', 'update']);
        Route::post('orders/{order}/status', [OrderController::class, 'updateStatus']);
        Route::apiResource('users', UserController::class);
        Route::post('users/{id}/restore', [UserController::class, 'restore']);
        Route::delete('users/{id}/force', [UserController::class, 'forceDestroy']);
        Route::apiResource('categories', CategoryController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::post('categories/{id}/restore', [CategoryController::class, 'restore']);
        Route::delete('categories/{id}/force', [CategoryController::class, 'forceDestroy']);
        Route::post('menu-items/generate-description', [MenuItemController::class, 'generateDescription']);
        Route::post('menu-items/clean-name', [MenuItemController::class, 'cleanName']);
        Route::post('menu-items/upload-image', [MenuItemController::class, 'uploadImage']);
        Route::post('menu-items/{id}/restore', [MenuItemController::class, 'restore']);
        Route::delete('menu-items/{id}/force', [MenuItemController::class, 'forceDestroy']);
        Route::get('recycle-bin', [RecycleBinController::class, 'index']);
        Route::apiResource('menu-items', MenuItemController::class)
            ->parameters(['menu-items' => 'menuItem'])
            ->except(['index', 'show']);
        Route::get('analytics/sales', [SalesAnalyticsController::class, 'index']);
        Route::post('analytics/summary/generate', [SalesAnalyticsController::class, 'generateSummary']);
    });
});
