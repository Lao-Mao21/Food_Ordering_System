<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MenuItemDescriptionGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_generate_a_menu_item_description_through_n8n(): void
    {
        config(['services.n8n.menu_description_webhook_url' => 'https://n8n.test/webhook/menu-description']);

        Http::fake([
            'https://n8n.test/webhook/menu-description' => Http::response([
                'output' => [
                    'description' => 'Tender chicken adobo simmered in soy sauce, vinegar, and garlic.',
                ],
            ]),
        ]);

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $response = $this->actingAs($admin)->postJson('/api/menu-items/generate-description', [
            'name' => 'Chicken Adobo',
            'category' => 'Rice meals',
            'price' => 120,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.description', 'Tender chicken adobo simmered in soy sauce, vinegar, and garlic.');

        Http::assertSent(fn ($request) => $request->url() === 'https://n8n.test/webhook/menu-description'
            && $request['name'] === 'Chicken Adobo'
            && $request['category'] === 'Rice meals'
            && $request['price'] === 120);
    }

    public function test_description_generation_requires_a_configured_webhook(): void
    {
        config(['services.n8n.menu_description_webhook_url' => null]);

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $this->actingAs($admin)->postJson('/api/menu-items/generate-description', [
            'name' => 'Halo-Halo',
            'category' => 'Desserts',
        ])->assertStatus(400);
    }

    public function test_description_generation_can_send_header_auth_to_n8n(): void
    {
        config([
            'services.n8n.menu_description_webhook_url' => 'https://n8n.test/webhook/menu-description',
            'services.n8n.menu_description_header_name' => 'x-n8n-key',
            'services.n8n.menu_description_header_value' => 'secret-value',
        ]);

        Http::fake([
            'https://n8n.test/webhook/menu-description' => Http::response([
                'description' => 'A colorful shaved ice dessert with sweet beans, jellies, and creamy milk.',
            ]),
        ]);

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $this->actingAs($admin)->postJson('/api/menu-items/generate-description', [
            'name' => 'Halo-Halo',
            'category' => 'Desserts',
        ])->assertOk();

        Http::assertSent(fn ($request) => $request->hasHeader('x-n8n-key', 'secret-value'));
    }

    public function test_description_generation_accepts_current_ai_agent_output_name_shape(): void
    {
        config(['services.n8n.menu_description_webhook_url' => 'https://n8n.test/webhook/menu-description']);

        Http::fake([
            'https://n8n.test/webhook/menu-description' => Http::response([
                'output' => [
                    'name' => 'Water 150ml - crisp, simple refreshment',
                    'category' => ['Drinks'],
                ],
            ]),
        ]);

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $this->actingAs($admin)->postJson('/api/menu-items/generate-description', [
            'name' => 'Water 150ml',
            'category' => 'Drinks',
            'price' => 15,
        ])
            ->assertOk()
            ->assertJsonPath('data.description', 'Water 150ml - crisp, simple refreshment');
    }

    public function test_admin_can_upload_a_menu_item_image(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $response = $this->actingAs($admin)->postJson('/api/menu-items/upload-image', [
            'image' => UploadedFile::fake()->create('adobo.jpg', 100, 'image/jpeg'),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.image_url', fn ($url) => is_string($url) && str_contains($url, '/storage/menu-items/'));

        $filename = basename($response->json('data.image_url'));

        Storage::disk('public')->assertExists('menu-items/'.$filename);
    }
}
