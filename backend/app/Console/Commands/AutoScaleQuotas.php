<?php

namespace App\Console\Commands;

use App\Models\HostingAccount;
use App\Models\Notification;
use App\Services\Hestia\HestiaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AutoScaleQuotas extends Command
{
    protected $signature = 'quota:auto-scale';
    protected $description = 'Auto-scale real quotas for accounts approaching their limit';

    public function handle(HestiaService $hestia): int
    {
        $accounts = HostingAccount::where('status', 'active')
            ->where('auto_scale_enabled', true)
            ->get();

        $scaled = 0;

        foreach ($accounts as $account) {
            if ($account->needsScaling()) {
                $oldQuota = $account->real_disk_mb;

                if ($account->scaleUp()) {
                    $newQuota = $account->real_disk_mb;

                    // Apply new quota in HestiaCP
                    $hestia->execute('v-change-user-package', [
                        $account->hestia_username,
                        'default', // package name
                    ]);

                    // Update disk limit in Hestia
                    $hestia->execute('v-change-user-disk-quota', [
                        $account->hestia_username,
                        (string) $newQuota,
                    ]);

                    Log::info("Auto-scaled {$account->hestia_username}: {$oldQuota}MB → {$newQuota}MB");

                    // Notify admin
                    Notification::send(
                        1, // Super admin ID
                        'auto_scale',
                        'Auto-Scale Applied',
                        "Account {$account->hestia_username} scaled from {$oldQuota}MB to {$newQuota}MB (usage: {$account->getRealDiskUsagePercentage()}%)",
                        'info'
                    );

                    $scaled++;
                } else {
                    // Reached max — notify admin to review
                    Notification::send(
                        1,
                        'scale_limit_reached',
                        'Scale Limit Reached',
                        "Account {$account->hestia_username} is at {$account->getRealDiskUsagePercentage()}% but cannot scale further. Plan limit reached.",
                        'warning'
                    );
                }
            }
        }

        $this->info("Auto-scaled {$scaled} accounts.");
        return 0;
    }
}
