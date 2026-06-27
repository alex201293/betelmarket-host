<?php

namespace App\Services\Hestia;

use Illuminate\Support\Facades\Log;

class BackupManager
{
    public function __construct(
        private readonly HestiaService $hestia
    ) {}

    /**
     * Create a backup for a user.
     */
    public function createBackup(string $username): array
    {
        $result = $this->hestia->execute('v-backup-user', [$username]);

        if ($result['success']) {
            Log::info("Backup initiated for user: {$username}");
        } else {
            Log::error("Backup failed for user: {$username}", $result);
        }

        return $result;
    }

    /**
     * Restore a user backup.
     */
    public function restoreBackup(string $username, string $backupFile): array
    {
        $result = $this->hestia->execute('v-restore-user', [
            $username,
            $backupFile,
        ]);

        if ($result['success']) {
            Log::info("Backup restored for user: {$username}, file: {$backupFile}");
        }

        return $result;
    }

    /**
     * List available backups for a user.
     */
    public function listBackups(string $username): array
    {
        return $this->hestia->execute('v-list-user-backups', [
            $username,
            'json',
        ]);
    }

    /**
     * Delete a backup.
     */
    public function deleteBackup(string $username, string $backupFile): array
    {
        return $this->hestia->execute('v-delete-user-backup', [
            $username,
            $backupFile,
        ]);
    }

    /**
     * Download backup path.
     */
    public function getBackupPath(string $username, string $backupFile): string
    {
        return "/backup/{$username}/{$backupFile}";
    }
}
