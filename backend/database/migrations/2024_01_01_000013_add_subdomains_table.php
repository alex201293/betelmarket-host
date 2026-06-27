<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subdomains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->onDelete('cascade');
            $table->string('subdomain'); // just the prefix, e.g., "blog"
            $table->string('full_domain'); // full, e.g., "blog.example.com"
            $table->string('document_root')->nullable();
            $table->boolean('ssl_enabled')->default(false);
            $table->enum('status', ['active', 'pending', 'suspended', 'deleted'])->default('pending');
            $table->timestamps();

            $table->unique(['domain_id', 'subdomain']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subdomains');
    }
};
