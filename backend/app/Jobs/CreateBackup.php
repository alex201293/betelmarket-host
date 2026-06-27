<?php

namespace App\Jobs;

use App\Models\Backup;
use App\Models\JobLog;
use App\Services\Hestia\BackupManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CreateBackup implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $backoff = 60;

    public function __construct(
        private readonly Backup $backup
    ) {}

    public function handle(BackupManager $backupManager): void
    {
        $log = JobLog::create([
            'job_type' => 'create_backup',
            'payload' => [
                'backup_id' => $this->backup->id,
                'hosting_account_id' => $this->backup->hosting_account_id,
            ],
            'status' => 'processing',
        ]);

        $this->backup->update(['status' => 'in_progress']);

        $username = $this->backup->hostingAccount->hestia_username;

        $result = $backupManager->createBackup($username);

        if ($result['success']) {
            $this->backup->update([
                'status' => 'completed',
                'backup_path' => "/backup/{$username}/",
            ]);
            $log->update(['status' => 'completed', 'output' => 'Backup created.']);
        } else {
            $this->backup->update(['status' => 'failed']);
            $log->update(['status' => 'failed', 'output' => $result['response'] ?? 'Unknown error']);
            $this->fail(new \Exception('Backup creation failed.'));
        }
    }
}
