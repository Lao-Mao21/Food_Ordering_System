<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
