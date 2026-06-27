<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->integer('max_db_connections')->default(10)->after('max_databases');
            $table->integer('max_db_size_mb')->default(512)->after('max_db_connections');
        });

        Schema::create('databases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hosting_account_id')->constrained()->onDelete('cascade');
            $table->string('db_name'); // full name: username_dbname
            $table->string('db_user'); // full name: username_dbuser
            $table->string('db_password_encrypted');
            $table->string('db_type')->default('mysql'); // mysql, pgsql
            $table->integer('size_mb')->default(0);
            $table->integer('max_connections')->default(10);
            $table->enum('status', ['active', 'suspended', 'deleted'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['max_db_connections', 'max_db_size_mb']);
        });
        Schema::dropIfExists('databases');
    }
};
