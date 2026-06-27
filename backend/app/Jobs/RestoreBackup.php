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

class RestoreBackup implements ShouldQueue
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
            'job_type' => 'restore_backup',
            'payload' => [
                'backup_id' => $this->backup->id,
            ],
            'status' => 'processing',
        ]);

        $username = $this->backup->hostingAccount->hestia_username;
        $backupFile = basename($this->backup->backup_path);

        $result = $backupManager->restoreBackup($username, $backupFile);

        if ($result['success']) {
            $log->update(['status' => 'completed', 'output' => 'Backup restored.']);
        } else {
            $log->update(['status' => 'failed', 'output' => $result['response'] ?? 'Unknown error']);
            $this->fail(new \Exception('Backup restoration failed.'));
        }
    }
}
