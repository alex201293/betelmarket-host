<?php

namespace App\Jobs;

use App\Models\Domain;
use App\Models\JobLog;
use App\Services\Hestia\DomainManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProvisionDomain implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        private readonly Domain $domain
    ) {}

    public function handle(DomainManager $domainManager): void
    {
        $log = JobLog::create([
            'job_type' => 'provision_domain',
            'payload' => [
                'domain_id' => $this->domain->id,
                'domain' => $this->domain->domain,
            ],
            'status' => 'processing',
        ]);

        $username = $this->domain->hostingAccount->hestia_username;

        $result = $domainManager->createDomain($username, $this->domain->domain);

        if ($result['success']) {
            $this->domain->update(['status' => 'active']);
            $log->update(['status' => 'completed', 'output' => 'Domain provisioned.']);
        } else {
            $log->update(['status' => 'failed', 'output' => $result['response'] ?? 'Unknown error']);
            $this->fail(new \Exception('Domain provisioning failed.'));
        }
    }
}
