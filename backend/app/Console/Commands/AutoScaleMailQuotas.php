<?php

namespace App\Console\Commands;

use App\Models\MailAccount;
use App\Models\Notification;
use App\Services\Hestia\MailManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AutoScaleMailQuotas extends Command
{
    protected $signature = 'quota:auto-scale-mail';
    protected $description = 'Auto-scale mailbox quotas when usage reaches 80%. Adds 1GB if plan allows.';

    public function handle(MailManager $mailManager): int
    {
        $mailboxes = MailAccount::with('domain.hostingAccount')
            ->where('status', 'active')
            ->where('quota_mb', '>', 0)
            ->get();

        $scaled = 0;
        $atLimit = 0;

        foreach ($mailboxes as $mailbox) {
            if (!$mailbox->needsQuotaScale()) {
                continue;
            }

            $oldQuota = $mailbox->quota_mb;

            if ($mailbox->scaleUpQuota()) {
                $newQuota = $mailbox->quota_mb;

                // Apply new quota in HestiaCP
                $domain = $mailbox->domain;
                if ($domain && $domain->hostingAccount) {
                    $username = $domain->hostingAccount->hestia_username;
                    $account = explode('@', $mailbox->email)[0];

                    $mailManager->changeMailboxQuota(
                        $username,
                        $domain->domain,
                        $account,
                        $newQuota
                    );
                }

                Log::info("Mail quota scaled: {$mailbox->email} {$oldQuota}MB → {$newQuota}MB (usage: {$mailbox->usage_mb}MB = {$mailbox->getUsagePercentage()}%)");

                $scaled++;
            } else {
                // At plan limit, notify admin
                Notification::send(
                    $domain->hostingAccount->user_id ?? 1,
                    'mail_quota_limit',
                    'Cuota de correo al máximo',
                    "El buzón {$mailbox->email} está al {$mailbox->getUsagePercentage()}% pero no puede escalar más. Límite del plan alcanzado ({$mailbox->max_quota_mb}MB).",
                    'warning'
                );

                $atLimit++;
            }
        }

        $this->info("Mail quotas scaled: {$scaled}. At limit: {$atLimit}.");
        return 0;
    }
}
