<?php
namespace App\Http\Controllers\API\v1;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Enums\UserRole;
use App\Traits\ApiResponse;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRules;

class AuthenticationController extends Controller
{
    use ApiResponse;
    
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'       => ['required', 'string', 'email'],
            'password'    => ['required', 'string'],
            'device_name' => ['sometimes', 'string'], // Mobile only
        ]);
        
        if (!Auth::attempt($request->only('email', 'password'))) {
            return $this->error('Invalid email or password.', 401);
        }
        $user = Auth::user();
        
        if ($request->filled('device_name')) {
            // Revoke any existing tokens for this device (prevent duplicates)
            $user->tokens()->where('name', $request->device_name)->delete();
            $token = $user->createToken($request->device_name)->plainTextToken;
            return $this->success(
                'Logged in successfully.',
                [
                    'user'  => new UserResource($user),
                    'token' => $token,
                ],
                200
            );
        }
 
        $request->session()->regenerate();
        return $this->success(
            'Logged in successfully.',
            ['user' => new UserResource($user)],
            200
        );
    }

    /**
     * Register a new user account.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'confirmed', PasswordRules::min(8)->mixedCase()->numbers()->symbols()],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ], [
            'password.min' => 'Password must be at least 8 characters long.',
            'password.confirmed' => 'Passwords do not match.',
            'password.mixed' => 'Password must contain both upper and lower case letters.',
            'password.numbers' => 'Password must include at least one number.',
            'password.symbols' => 'Password must include at least one symbol.',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => UserRole::GUEST,
        ]);

        if ($request->filled('device_name')) {
            $token = $user->createToken($request->device_name)->plainTextToken;

            return $this->success(
                'Registration successful.',
                [
                    'user' => new UserResource($user),
                    'token' => $token,
                ],
                201
            );
        }

        if ($request->hasSession()) {
            Auth::login($user);
            $request->session()->regenerate();
        }

        return $this->success(
            'Registration successful.',
            ['user' => new UserResource($user)],
            201
        );
    }

    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email', 'exists:users,email'],
        ]);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return $this->success(
                'Password reset link sent. Check your email for the next steps.',
                ['status' => __($status)],
                200
            );
        }

        return $this->error('Unable to send password reset link at this time.', 500);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email', 'exists:users,email'],
            'password' => ['required', 'string', 'confirmed', PasswordRules::min(8)->mixedCase()->numbers()->symbols()],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ], [
            'password.min' => 'Password must be at least 8 characters long.',
            'password.confirmed' => 'Passwords do not match.',
            'password.mixed' => 'Password must contain both upper and lower case letters.',
            'password.numbers' => 'Password must include at least one number.',
            'password.symbols' => 'Password must include at least one symbol.',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->success('Password reset successfully. Please log in with your new password.', null, 200);
        }

        return $this->error('The password reset token is invalid or has expired.', 400);
    }

    /**
     * Return the currently authenticated user.
     *
     * Works for both web (session) and mobile (Bearer token)
     * because Sanctum's auth middleware handles both guards.
     */
    public function me(Request $request): JsonResponse
    {
        return $this->success(
            'Authenticated user retrieved.',
            ['user' => new UserResource($request->user())],
            200
        );
    }
    /**
     * Log out the current user.
     *
     * - Mobile: revokes the current access token.
     * - Web: invalidates the session.
     */
    public function logout(Request $request): JsonResponse
    {
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // MOBILE: revoke the Bearer token used for this request
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if ($request->user()->currentAccessToken() &&
            method_exists($request->user()->currentAccessToken(), 'delete')) {
            $request->user()->currentAccessToken()->delete();
            return $this->success('Logged out successfully.', null, 200);
        }
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // WEB SPA: invalidate the session (unchanged)
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return $this->success('Logged out successfully.', null, 200);
    }
}

