<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('categories', 'description')) {
            return;
        }

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('description');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('categories', 'description')) {
            return;
        }

        Schema::table('categories', function (Blueprint $table) {
            $table->text('description')->nullable()->after('slug');
        });
    }
};
