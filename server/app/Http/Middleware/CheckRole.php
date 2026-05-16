<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * Usage: middleware('role:admin') or middleware('role:admin,guest')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role->value, $roles)) {
            return response()->json([
                'status'  => 'Error',
                'message' => 'You do not have permission to access this resource.',
                'data'    => null,
            ], 403);
        }

        return $next($request);
    }
}
