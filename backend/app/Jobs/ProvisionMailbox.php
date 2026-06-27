<?php

namespace App\Jobs;

use App\Models\MailAccount;
use App\Models\JobLog;
use App\Services\Hestia\MailManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProvisionMailbox implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        private readonly MailAccount $mailAccount,
        private readonly string $password
    ) {}

    public function handle(MailManager $mailManager): void
    {
        $log = JobLog::create([
            'job_type' => 'provision_mailbox',
            'payload' => [
                'mail_account_id' => $this->mailAccount->id,
                'email' => $this->mailAccount->email,
            ],
            'status' => 'processing',
        ]);

        $domain = $this->mailAccount->domain;
        $username = $domain->hostingAccount->hestia_username;

        // Extract account name from email
        $account = explode('@', $this->mailAccount->email)[0];

        $result = $mailManager->createMailbox(
            $username,
            $domain->domain,
            $account,
            $this->password
        );

        if ($result['success']) {
            $log->update(['status' => 'completed', 'output' => 'Mailbox provisioned.']);
        } else {
            $this->mailAccount->update(['status' => 'suspended']);
            $log->update(['status' => 'failed', 'output' => $result['response'] ?? 'Unknown error']);
            $this->fail(new \Exception('Mailbox provisioning failed.'));
        }
    }
}
