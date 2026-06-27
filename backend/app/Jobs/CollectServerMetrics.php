<?php

namespace App\Jobs;

use App\Models\Domain;
use App\Models\MailAccount;
use App\Models\ServerMetric;
use App\Models\User;
use App\Services\Hestia\HestiaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CollectServerMetrics implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(HestiaService $hestia): void
    {
        // Get system info from Hestia
        $sysInfo = $hestia->execute('v-list-sys-info', ['json']);

        // Parse load averages from /proc/loadavg if available
        $loadAvg = [0, 0, 0];
        if (file_exists('/proc/loadavg')) {
            $load = explode(' ', file_get_contents('/proc/loadavg'));
            $loadAvg = [
                (float) ($load[0] ?? 0),
                (float) ($load[1] ?? 0),
                (float) ($load[2] ?? 0),
            ];
        }

        // Collect app-level metrics
        $totalDomains = Domain::where('status', '!=', 'deleted')->count();
        $totalMail = MailAccount::where('status', '!=', 'deleted')->count();
        $totalUsers = User::where('status', 'active')->count();

        ServerMetric::create([
            'cpu_usage' => $this->getCpuUsage(),
            'ram_usage' => $this->getRamUsage(),
            'ram_total_mb' => $this->getRamTotal(),
            'ram_used_mb' => $this->getRamUsed(),
            'disk_usage' => $this->getDiskUsage(),
            'disk_total_gb' => $this->getDiskTotal(),
            'disk_used_gb' => $this->getDiskUsed(),
            'active_connections' => 0,
            'load_average_1' => $loadAvg[0],
            'load_average_5' => $loadAvg[1],
            'load_average_15' => $loadAvg[2],
            'total_domains' => $totalDomains,
            'total_mail_accounts' => $totalMail,
            'total_users' => $totalUsers,
            'uptime_hours' => $this->getUptime(),
        ]);

        // Cleanup old metrics (keep 30 days)
        ServerMetric::where('created_at', '<', now()->subDays(30))->delete();
    }

    private function getCpuUsage(): float
    {
        $output = [];
        exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' 2>/dev/null", $output);
        return (float) ($output[0] ?? 0);
    }

    private function getRamUsage(): float
    {
        $total = $this->getRamTotal();
        $used = $this->getRamUsed();
        return $total > 0 ? round(($used / $total) * 100, 1) : 0;
    }

    private function getRamTotal(): float
    {
        $output = [];
        exec("free -m | awk '/^Mem:/ {print $2}' 2>/dev/null", $output);
        return (float) ($output[0] ?? 0);
    }

    private function getRamUsed(): float
    {
        $output = [];
        exec("free -m | awk '/^Mem:/ {print $3}' 2>/dev/null", $output);
        return (float) ($output[0] ?? 0);
    }

    private function getDiskUsage(): float
    {
        $output = [];
        exec("df -h / | awk 'NR==2 {print $5}' 2>/dev/null", $output);
        return (float) str_replace('%', '', $output[0] ?? '0');
    }

    private function getDiskTotal(): float
    {
        $output = [];
        exec("df -BG / | awk 'NR==2 {print $2}' 2>/dev/null", $output);
        return (float) str_replace('G', '', $output[0] ?? '0');
    }

    private function getDiskUsed(): float
    {
        $output = [];
        exec("df -BG / | awk 'NR==2 {print $3}' 2>/dev/null", $output);
        return (float) str_replace('G', '', $output[0] ?? '0');
    }

    private function getUptime(): float
    {
        $output = [];
        exec("cat /proc/uptime 2>/dev/null", $output);
        $seconds = (float) explode(' ', $output[0] ?? '0')[0];
        return round($seconds / 3600, 1);
    }
}
