<?php

namespace App\Jobs;

use App\Models\App;
use App\Models\JobLog;
use App\Models\Notification;
use App\Services\Hestia\AppManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DeployApp implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 600; // 10 minutes

    public function __construct(
        private readonly App $app
    ) {}

    public function handle(AppManager $appManager): void
    {
        $log = JobLog::create([
            'job_type' => 'deploy_app',
            'payload' => [
                'app_id' => $this->app->id,
                'name' => $this->app->name,
                'runtime' => $this->app->runtime,
            ],
            'status' => 'processing',
        ]);

        $result = $appManager->deploy($this->app);

        if ($result['success']) {
            $log->update(['status' => 'completed', 'output' => 'App deployed successfully.']);

            Notification::send(
                $this->app->user_id,
                'app_deployed',
                'App Deployed',
                "{$this->app->name} deployed successfully on {$this->app->domain->domain}",
                'info'
            );
        } else {
            $this->app->update(['status' => 'error', 'last_deploy_log' => $result['logs'] ?? $result['error'] ?? 'Unknown error']);
            $log->update(['status' => 'failed', 'output' => $result['logs'] ?? '']);

            Notification::send(
                $this->app->user_id,
                'app_deploy_failed',
                'App Deploy Failed',
                "Deploy of {$this->app->name} failed at step: " . ($result['step'] ?? 'unknown'),
                'critical'
            );
        }
    }
}
