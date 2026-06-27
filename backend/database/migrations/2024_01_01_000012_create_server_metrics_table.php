<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('server_metrics', function (Blueprint $table) {
            $table->id();
            $table->float('cpu_usage')->default(0); // percentage
            $table->float('ram_usage')->default(0); // percentage
            $table->float('ram_total_mb')->default(0);
            $table->float('ram_used_mb')->default(0);
            $table->float('disk_usage')->default(0); // percentage
            $table->float('disk_total_gb')->default(0);
            $table->float('disk_used_gb')->default(0);
            $table->integer('active_connections')->default(0);
            $table->float('load_average_1')->default(0);
            $table->float('load_average_5')->default(0);
            $table->float('load_average_15')->default(0);
            $table->integer('total_domains')->default(0);
            $table->integer('total_mail_accounts')->default(0);
            $table->integer('total_users')->default(0);
            $table->float('uptime_hours')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('server_metrics');
    }
};
