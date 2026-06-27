<?php

namespace App\Jobs;

use App\Models\Domain;
use App\Models\JobLog;
use App\Models\Notification;
use App\Services\Hestia\WordPressManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class InstallWordPress implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 300; // 5 minutes

    public function __construct(
        private readonly Domain $domain,
        private readonly string $siteTitle,
        private readonly string $adminUser,
        private readonly string $adminPassword,
        private readonly string $adminEmail,
        private readonly string $locale = 'en_US'
    ) {}

    public function handle(WordPressManager $wpManager): void
    {
        $log = JobLog::create([
            'job_type' => 'install_wordpress',
            'payload' => [
                'domain_id' => $this->domain->id,
                'domain' => $this->domain->domain,
                'site_title' => $this->siteTitle,
            ],
            'status' => 'processing',
        ]);

        $username = $this->domain->hostingAccount->hestia_username;
        $userId = $this->domain->hostingAccount->user_id;

        $result = $wpManager->install(
            $username,
            $this->domain->domain,
            $this->siteTitle,
            $this->adminUser,
            $this->adminPassword,
            $this->adminEmail,
            $this->locale
        );

        if ($result['success']) {
            $log->update(['status' => 'completed', 'output' => "WordPress installed. Admin: {$result['admin_url']}"]);

            Notification::send(
                $userId,
                'wordpress_installed',
                'WordPress Installed',
                "WordPress has been installed on {$this->domain->domain}. Access admin at {$result['admin_url']}",
                'info'
            );
        } else {
            $log->update(['status' => 'failed', 'output' => $result['error'] ?? 'Unknown error']);

            Notification::send(
                $userId,
                'wordpress_install_failed',
                'WordPress Installation Failed',
                "Failed to install WordPress on {$this->domain->domain}: {$result['error']}",
                'critical'
            );
        }
    }
}
