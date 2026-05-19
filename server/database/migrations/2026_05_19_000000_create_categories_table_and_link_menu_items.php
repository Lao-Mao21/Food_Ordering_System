<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->foreignId('category_id')
                ->nullable()
                ->after('category')
                ->constrained('categories')
                ->nullOnDelete();
        });

        $categoryNames = DB::table('menu_items')
            ->whereNotNull('category')
            ->pluck('category')
            ->filter(fn ($category) => trim((string) $category) !== '')
            ->unique(fn ($category) => Str::lower(trim((string) $category)))
            ->values();

        foreach ($categoryNames as $index => $categoryName) {
            $name = trim((string) $categoryName);
            $slug = Str::slug($name);
            $originalSlug = $slug;
            $count = 1;

            while (DB::table('categories')->where('slug', $slug)->exists()) {
                $slug = $originalSlug.'-'.$count++;
            }

            $categoryId = DB::table('categories')->insertGetId([
                'name' => $name,
                'slug' => $slug,
                'is_active' => true,
                'sort_order' => $index + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('menu_items')
                ->whereRaw('LOWER(category) = ?', [Str::lower($name)])
                ->update(['category_id' => $categoryId]);
        }
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
        });

        Schema::dropIfExists('categories');
    }
};
