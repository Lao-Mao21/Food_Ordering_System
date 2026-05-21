<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthenticationRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_web_registration_creates_an_admin_account(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'New Admin',
            'email' => 'new-admin@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.user.email', 'new-admin@example.com')
            ->assertJsonPath('data.user.role', 'admin');

        $this->assertDatabaseHas('users', [
            'email' => 'new-admin@example.com',
            'role' => 'admin',
        ]);
    }

    public function test_later_web_registration_creates_a_guest_account(): void
    {
        User::factory()->create(['role' => UserRole::ADMIN]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'New Staff',
            'email' => 'new-staff@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.user.email', 'new-staff@example.com')
            ->assertJsonPath('data.user.role', 'guest');

        $this->assertDatabaseHas('users', [
            'email' => 'new-staff@example.com',
            'role' => 'guest',
        ]);
    }

    public function test_mobile_registration_can_return_a_sanctum_token(): void
    {
        User::factory()->create(['role' => UserRole::ADMIN]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Mobile Customer',
            'email' => 'mobile-customer@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'device_name' => 'flutter-app',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.user.email', 'mobile-customer@example.com')
            ->assertJsonPath('data.user.role', 'guest')
            ->assertJsonStructure(['data' => ['token']]);

        $token = $response->json('data.token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/user/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', 'mobile-customer@example.com');
    }

    public function test_forgot_password_sends_a_frontend_reset_link(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'admin@example.com']);

        $this->postJson('/api/auth/password/forgot', [
            'email' => $user->email,
        ])->assertOk();

        Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) use ($user) {
            $mail = $notification->toMail($user);

            return str_contains($mail->actionUrl, '/reset-password/')
                && str_contains($mail->actionUrl, 'email='.urlencode($user->email));
        });
    }

    public function test_password_can_be_reset_with_a_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'reset-user@example.com',
            'password' => Hash::make('OldPassword123!'),
        ]);
        $token = Password::createToken($user);

        $this->postJson('/api/auth/password/reset', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
    }
}
