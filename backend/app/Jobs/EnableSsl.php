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

class EnableSsl implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        private readonly Domain $domain
    ) {}

    public function handle(DomainManager $domainManager): void
    {
        $log = JobLog::create([
            'job_type' => 'enable_ssl',
            'payload' => [
                'domain_id' => $this->domain->id,
                'domain' => $this->domain->domain,
            ],
            'status' => 'processing',
        ]);

        $username = $this->domain->hostingAccount->hestia_username;

        $result = $domainManager->enableSSL($username, $this->domain->domain);

        if ($result['success']) {
            $this->domain->update(['ssl_enabled' => true]);
            $log->update(['status' => 'completed', 'output' => 'SSL enabled via Let\'s Encrypt.']);
        } else {
            $log->update(['status' => 'failed', 'output' => $result['response'] ?? 'SSL provisioning failed']);
            $this->fail(new \Exception('SSL provisioning failed for: ' . $this->domain->domain));
        }
    }
}
