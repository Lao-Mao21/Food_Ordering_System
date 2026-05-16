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
        // Services table is created in create_queues_table migration
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop is handled in queues migration
    }
};
