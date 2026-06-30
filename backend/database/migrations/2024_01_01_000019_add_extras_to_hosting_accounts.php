<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hosting_accounts', function (Blueprint $table) {
            $table->integer('extra_mailboxes')->default(0)->after('admin_notes');
            $table->integer('extra_domains')->default(0)->after('extra_mailboxes');
            $table->integer('extra_disk_mb')->default(0)->after('extra_domains');
        });
    }

    public function down(): void
    {
        Schema::table('hosting_accounts', function (Blueprint $table) {
            $table->dropColumn(['extra_mailboxes', 'extra_domains', 'extra_disk_mb']);
        });
    }
};
