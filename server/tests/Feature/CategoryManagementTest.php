<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_update_and_list_categories(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        $createResponse = $this->actingAs($admin)->postJson('/api/categories', [
            'name' => 'Rice Meals',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.category.name', 'Rice Meals')
            ->assertJsonPath('data.category.slug', 'rice-meals');

        $category = Category::firstOrFail();

        $this->actingAs($admin)->putJson("/api/categories/{$category->id}", [
            'name' => 'Rice Bowls',
            'is_active' => true,
            'sort_order' => 1,
        ])
            ->assertOk()
            ->assertJsonPath('data.category.name', 'Rice Bowls')
            ->assertJsonPath('data.category.slug', 'rice-bowls');

        $this->actingAs($admin)->getJson('/api/categories?include_inactive=1')
            ->assertOk()
            ->assertJsonPath('data.categories.0.name', 'Rice Bowls');
    }

    public function test_category_delete_is_blocked_when_menu_items_use_it(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $category = Category::create(['name' => 'Drinks', 'is_active' => true]);

        MenuItem::create([
            'name' => 'Water 150ml',
            'category' => $category->name,
            'category_id' => $category->id,
            'price' => 15,
            'is_available' => true,
        ]);

        $this->actingAs($admin)->deleteJson("/api/categories/{$category->id}")
            ->assertStatus(422);
    }

    public function test_menu_item_can_be_created_with_a_category_id(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $category = Category::create(['name' => 'Desserts', 'is_active' => true]);

        $this->actingAs($admin)->postJson('/api/menu-items', [
            'name' => 'Halo-Halo',
            'category_id' => $category->id,
            'description' => 'A colorful shaved ice dessert.',
            'price' => 95,
            'is_available' => true,
        ])
            ->assertCreated()
            ->assertJsonPath('data.menu_item.category', 'Desserts')
            ->assertJsonPath('data.menu_item.category_id', $category->id);
    }
}
