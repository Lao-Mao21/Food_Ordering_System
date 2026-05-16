<?php

use App\Http\Controllers\API\v1\AuthenticationController;
use App\Http\Controllers\API\v1\UserController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthenticationController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('user/auth/me', [AuthenticationController::class, 'me']);
    Route::post('auth/logout', [AuthenticationController::class, 'logout']);

    // Admin Only
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::post('users/{id}/restore', [UserController::class, 'restore']);
    });
});