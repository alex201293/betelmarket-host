<?php

namespace App\Jobs;

use App\Models\Subdomain;
use App\Models\JobLog;
use App\Services\Hestia\DomainManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProvisionSubdomain implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        private readonly Subdomain $subdomain
    ) {}

    public function handle(DomainManager $domainManager): void
    {
        $log = JobLog::create([
            'job_type' => 'provision_subdomain',
            'payload' => [
                'subdomain_id' => $this->subdomain->id,
                'full_domain' => $this->subdomain->full_domain,
            ],
            'status' => 'processing',
        ]);

        $domain = $this->subdomain->domain;
        $username = $domain->hostingAccount->hestia_username;

        $result = $domainManager->createSubdomain(
            $username,
            $domain->domain,
            $this->subdomain->subdomain
        );

        if ($result['success']) {
            $this->subdomain->update(['status' => 'active']);
            $log->update(['status' => 'completed', 'output' => 'Subdomain provisioned.']);
        } else {
            $log->update(['status' => 'failed', 'output' => $result['response'] ?? 'Unknown error']);
            $this->fail(new \Exception('Subdomain provisioning failed.'));
        }
    }
}
