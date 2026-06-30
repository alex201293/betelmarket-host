<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->string('deploy_secret')->nullable()->after('last_deployed_at');
            $table->boolean('auto_deploy')->default(false)->after('deploy_secret');
            $table->json('deploy_history')->nullable()->after('auto_deploy');
        });
    }

    public function down(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->dropColumn(['deploy_secret', 'auto_deploy', 'deploy_history']);
        });
    }
};
