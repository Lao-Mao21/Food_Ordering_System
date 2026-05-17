<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('menu_items', 'stock_quantity')) {
            Schema::table('menu_items', function (Blueprint $table) {
                $table->dropColumn('stock_quantity');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('menu_items', 'stock_quantity')) {
            Schema::table('menu_items', function (Blueprint $table) {
                $table->unsignedInteger('stock_quantity')->default(0)->after('price');
            });
        }
    }
};
