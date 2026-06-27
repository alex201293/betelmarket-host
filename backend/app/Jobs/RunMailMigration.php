<?php

namespace App\Jobs;

use App\Models\MailMigration;
use App\Models\JobLog;
use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RunMailMigration implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 3600; // 1 hour max

    public function __construct(
        private readonly MailMigration $migration
    ) {}

    public function handle(): void
    {
        $log = JobLog::create([
            'job_type' => 'mail_migration',
            'payload' => [
                'migration_id' => $this->migration->id,
                'source' => $this->migration->source_email,
                'destination' => $this->migration->destination_email,
            ],
            'status' => 'processing',
        ]);

        $this->migration->update([
            'status' => 'in_progress',
            'started_at' => now(),
        ]);

        try {
            $sourcePassword = $this->migration->source_password;
            $destAccount = $this->migration->destination_email;
            $domain = $this->migration->domain;
            $hestiaUsername = $domain->hostingAccount->hestia_username;

            // Destination password: we need to get it from Hestia or use a temp one
            // For imapsync we use the hestia admin to authenticate
            $destHost = config('hestia.host', '127.0.0.1');

            // Build imapsync command
            $command = sprintf(
                'imapsync --host1 %s --port1 %d --user1 %s --password1 %s ' .
                '--host2 %s --port2 993 --user2 %s --password2 %s ' .
                '--ssl1 --ssl2 --no-modulesversion --allowsizemismatch ' .
                '--nofoldersizes 2>&1',
                escapeshellarg($this->migration->source_host),
                $this->migration->source_port,
                escapeshellarg($this->migration->source_email),
                escapeshellarg($sourcePassword),
                escapeshellarg($destHost),
                escapeshellarg($destAccount),
                escapeshellarg($sourcePassword) // Uses same password set during mailbox creation
            );

            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);

            $outputStr = implode("\n", $output);

            // Parse messages count from imapsync output
            $messagesMigrated = 0;
            if (preg_match('/Messages\s+transferred:\s+(\d+)/i', $outputStr, $matches)) {
                $messagesMigrated = (int) $matches[1];
            }

            if ($returnCode === 0) {
                $this->migration->update([
                    'status' => 'completed',
                    'messages_migrated' => $messagesMigrated,
                    'completed_at' => now(),
                ]);

                $log->update(['status' => 'completed', 'output' => "Migrated {$messagesMigrated} messages."]);

                Notification::send(
                    $this->migration->user_id,
                    'mail_migration_complete',
                    'Mail Migration Complete',
                    "Migration of {$this->migration->source_email} completed. {$messagesMigrated} messages transferred.",
                    'info'
                );
            } else {
                $this->migration->update([
                    'status' => 'failed',
                    'error_log' => substr($outputStr, -2000), // Last 2000 chars
                    'completed_at' => now(),
                ]);

                $log->update(['status' => 'failed', 'output' => substr($outputStr, -500)]);

                Notification::send(
                    $this->migration->user_id,
                    'mail_migration_failed',
                    'Mail Migration Failed',
                    "Migration of {$this->migration->source_email} failed. Check migration details for errors.",
                    'critical'
                );
            }
        } catch (\Exception $e) {
            Log::error("Mail migration failed: " . $e->getMessage());

            $this->migration->update([
                'status' => 'failed',
                'error_log' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            $log->update(['status' => 'failed', 'output' => $e->getMessage()]);
        }
    }
}
