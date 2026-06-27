<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hosting_accounts', function (Blueprint $table) {
            // Real quotas (what HestiaCP actually enforces)
            $table->integer('real_disk_mb')->default(2048)->after('disk_limit_mb'); // 2GB default
            $table->integer('real_bandwidth_mb')->default(10240)->after('real_disk_mb');
            $table->integer('real_max_mailboxes')->default(5)->after('real_bandwidth_mb');
            $table->integer('real_max_domains')->default(1)->after('real_max_mailboxes');
            $table->integer('real_mailbox_quota_mb')->default(200)->after('real_max_domains'); // per mailbox

            // Auto-scale settings
            $table->boolean('auto_scale_enabled')->default(true)->after('real_mailbox_quota_mb');
            $table->integer('scale_threshold_percent')->default(80)->after('auto_scale_enabled'); // scale at 80% usage
            $table->integer('scale_increment_mb')->default(1024)->after('scale_threshold_percent'); // add 1GB each time
            $table->integer('scale_max_mb')->nullable()->after('scale_increment_mb'); // max real quota (null = plan limit)

            // Notes for admin
            $table->text('admin_notes')->nullable()->after('scale_max_mb');
        });
    }

    public function down(): void
    {
        Schema::table('hosting_accounts', function (Blueprint $table) {
            $table->dropColumn([
                'real_disk_mb', 'real_bandwidth_mb', 'real_max_mailboxes',
                'real_max_domains', 'real_mailbox_quota_mb',
                'auto_scale_enabled', 'scale_threshold_percent',
                'scale_increment_mb', 'scale_max_mb', 'admin_notes',
            ]);
        });
    }
};
