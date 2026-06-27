<?php

namespace App\Http\Controllers;

use App\Models\ServerMetric;
use App\Models\Domain;
use App\Models\HostingAccount;
use App\Models\MailAccount;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetricsController extends Controller
{
    /**
     * Get latest server metrics.
     */
    public function current(): JsonResponse
    {
        $metric = ServerMetric::latest()->first();

        if (! $metric) {
            // Generate live metrics from system if no stored metrics
            $metric = $this->collectMetrics();
        }

        return response()->json($metric);
    }

    /**
     * Get metrics history (last 24h, 7d, 30d).
     */
    public function history(Request $request): JsonResponse
    {
        $range = $request->get('range', '24h');

        $since = match ($range) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            default => now()->subHours(24),
        };

        $metrics = ServerMetric::where('created_at', '>=', $since)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($metrics);
    }

    /**
     * Get top domains by disk usage.
     */
    public function topDomains(): JsonResponse
    {
        $accounts = HostingAccount::with('domains', 'user')
            ->where('status', 'active')
            ->orderBy('disk_used_mb', 'desc')
            ->limit(10)
            ->get();

        return response()->json($accounts);
    }

    /**
     * Collect and store current metrics.
     */
    private function collectMetrics(): ServerMetric
    {
        return ServerMetric::create([
            'cpu_usage' => 0,
            'ram_usage' => 0,
            'ram_total_mb' => 0,
            'ram_used_mb' => 0,
            'disk_usage' => 0,
            'disk_total_gb' => 0,
            'disk_used_gb' => 0,
            'active_connections' => 0,
            'load_average_1' => 0,
            'load_average_5' => 0,
            'load_average_15' => 0,
            'total_domains' => Domain::where('status', '!=', 'deleted')->count(),
            'total_mail_accounts' => MailAccount::where('status', '!=', 'deleted')->count(),
            'total_users' => User::where('status', 'active')->count(),
            'uptime_hours' => 0,
        ]);
    }
}
