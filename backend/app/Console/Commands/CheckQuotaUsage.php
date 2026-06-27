<?php

namespace App\Console\Commands;

use App\Models\HostingAccount;
use App\Models\Notification;
use Illuminate\Console\Command;

class CheckQuotaUsage extends Command
{
    protected $signature = 'quota:check';
    protected $description = 'Check hosting accounts approaching quota limits and notify users';

    public function handle(): int
    {
        $accounts = HostingAccount::where('status', 'active')
            ->where('disk_limit_mb', '>', 0)
            ->get();

        $notified = 0;

        foreach ($accounts as $account) {
            $percentage = $account->getDiskUsagePercentage();

            if ($percentage >= 90) {
                Notification::send(
                    $account->user_id,
                    'quota_exceeded',
                    'Disk Quota Warning',
                    "Your hosting account ({$account->hestia_username}) is at {$percentage}% disk usage. Consider upgrading your plan.",
                    'critical'
                );
                $notified++;
            } elseif ($percentage >= 75) {
                Notification::send(
                    $account->user_id,
                    'quota_exceeded',
                    'Disk Usage High',
                    "Your hosting account ({$account->hestia_username}) is at {$percentage}% disk usage.",
                    'warning'
                );
                $notified++;
            }
        }

        $this->info("Sent {$notified} quota notifications.");
        return 0;
    }
}
