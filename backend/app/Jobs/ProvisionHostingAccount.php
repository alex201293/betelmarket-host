<?php

namespace App\Jobs;

use App\Models\HostingAccount;
use App\Models\JobLog;
use App\Services\Hestia\UserManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class ProvisionHostingAccount implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        private readonly HostingAccount $account
    ) {}

    public function handle(UserManager $userManager): void
    {
        $log = JobLog::create([
            'job_type' => 'provision_hosting_account',
            'payload' => [
                'account_id' => $this->account->id,
                'username' => $this->account->hestia_username,
            ],
            'status' => 'processing',
        ]);

        $password = Str::random(16);

        $result = $userManager->createUser(
            $this->account->hestia_username,
            $password,
            $this->account->user->email
        );

        if ($result['success']) {
            $this->account->update(['status' => 'active']);
            $log->update(['status' => 'completed', 'output' => 'User provisioned successfully.']);
        } else {
            $this->account->update(['status' => 'pending']);
            $log->update(['status' => 'failed', 'output' => $result['response'] ?? 'Unknown error']);
            $this->fail(new \Exception('Hestia provisioning failed: ' . ($result['response'] ?? '')));
        }
    }
}
