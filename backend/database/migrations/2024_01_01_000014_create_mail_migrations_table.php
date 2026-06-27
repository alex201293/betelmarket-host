<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mail_migrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('domain_id')->constrained()->onDelete('cascade');
            $table->string('source_host'); // mail.proveedor-anterior.com
            $table->integer('source_port')->default(993);
            $table->string('source_email'); // info@tudominio.com
            $table->text('source_password_encrypted');
            $table->string('destination_email'); // info@tudominio.com (en Hestia)
            $table->enum('status', ['pending', 'in_progress', 'completed', 'failed'])->default('pending');
            $table->integer('messages_migrated')->default(0);
            $table->integer('messages_total')->default(0);
            $table->text('error_log')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_migrations');
    }
};
