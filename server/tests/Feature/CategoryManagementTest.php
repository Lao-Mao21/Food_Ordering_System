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

    public function test_category_with_menu_items_can_be_soft_deleted_but_not_permanently_deleted(): void
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
            ->assertOk();

        $this->assertSoftDeleted('categories', ['id' => $category->id]);

        $this->actingAs($admin)->deleteJson("/api/categories/{$category->id}/force")
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

    public function test_category_can_be_soft_deleted_and_restored(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $category = Category::create(['name' => 'Add-ons', 'is_active' => true]);

        $this->actingAs($admin)->deleteJson("/api/categories/{$category->id}")
            ->assertOk();

        $this->assertSoftDeleted('categories', ['id' => $category->id]);

        $this->actingAs($admin)->getJson('/api/recycle-bin')
            ->assertOk()
            ->assertJsonPath('data.categories.0.name', 'Add-ons');

        $this->actingAs($admin)->postJson("/api/categories/{$category->id}/restore")
            ->assertOk()
            ->assertJsonPath('data.category.name', 'Add-ons');

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'deleted_at' => null,
        ]);
    }

    public function test_menu_item_can_be_soft_deleted_and_restored(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $category = Category::create(['name' => 'Drinks', 'is_active' => true]);
        $menuItem = MenuItem::create([
            'name' => 'Iced Tea',
            'category' => $category->name,
            'category_id' => $category->id,
            'price' => 55,
            'is_available' => true,
        ]);

        $this->actingAs($admin)->deleteJson("/api/menu-items/{$menuItem->id}")
            ->assertOk();

        $this->assertSoftDeleted('menu_items', ['id' => $menuItem->id]);

        $this->actingAs($admin)->getJson('/api/recycle-bin')
            ->assertOk()
            ->assertJsonPath('data.menu_items.0.name', 'Iced Tea');

        $this->actingAs($admin)->postJson("/api/menu-items/{$menuItem->id}/restore")
            ->assertOk()
            ->assertJsonPath('data.menu_item.name', 'Iced Tea');

        $this->assertDatabaseHas('menu_items', [
            'id' => $menuItem->id,
            'deleted_at' => null,
        ]);
    }

    public function test_user_delete_is_soft_delete_and_force_route_permanently_deletes(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $user = User::factory()->create(['role' => UserRole::GUEST]);

        $this->actingAs($admin)->deleteJson("/api/users/{$user->id}")
            ->assertOk();

        $this->assertSoftDeleted('users', ['id' => $user->id]);
        $this->assertDatabaseHas('users', ['id' => $user->id]);

        $this->actingAs($admin)->deleteJson("/api/users/{$user->id}/force")
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }
}
