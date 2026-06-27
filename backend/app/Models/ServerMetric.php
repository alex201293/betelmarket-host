<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServerMetric extends Model
{
    protected $fillable = [
        'cpu_usage',
        'ram_usage',
        'ram_total_mb',
        'ram_used_mb',
        'disk_usage',
        'disk_total_gb',
        'disk_used_gb',
        'active_connections',
        'load_average_1',
        'load_average_5',
        'load_average_15',
        'total_domains',
        'total_mail_accounts',
        'total_users',
        'uptime_hours',
    ];

    protected function casts(): array
    {
        return [
            'cpu_usage' => 'float',
            'ram_usage' => 'float',
            'disk_usage' => 'float',
            'load_average_1' => 'float',
            'load_average_5' => 'float',
            'load_average_15' => 'float',
        ];
    }
}
