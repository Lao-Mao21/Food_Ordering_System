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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->integer('counter_number');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('queues', function (Blueprint $table) {
            $table->id();
            $table->integer('queue_number')->unique();
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->enum('status', ['pending', 'serving', 'completed', 'skipped'])->default('pending');
            $table->integer('priority')->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('served_at')->nullable();
            $table->foreignId('served_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queues');
        Schema::dropIfExists('services');
    }
};
