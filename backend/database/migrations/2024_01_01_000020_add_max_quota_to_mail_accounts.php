<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mail_accounts', function (Blueprint $table) {
            $table->integer('max_quota_mb')->default(5120)->after('quota_mb');
        });
    }

    public function down(): void
    {
        Schema::table('mail_accounts', function (Blueprint $table) {
            $table->dropColumn('max_quota_mb');
        });
    }
};
