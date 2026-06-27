<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add temp domain limits to plans
        Schema::table('plans', function (Blueprint $table) {
            $table->integer('max_temp_domains')->default(1)->after('max_databases');
            $table->string('temp_domain_suffix')->default('betelhost.site')->after('max_temp_domains');
        });

        // Mark domains as temporary or connected
        Schema::table('domains', function (Blueprint $table) {
            $table->boolean('is_temporary')->default(false)->after('ssl_enabled');
            $table->string('connected_domain')->nullable()->after('is_temporary'); // real domain when connected
            $table->timestamp('temp_expires_at')->nullable()->after('connected_domain');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['max_temp_domains', 'temp_domain_suffix']);
        });
        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn(['is_temporary', 'connected_domain', 'temp_expires_at']);
        });
    }
};
