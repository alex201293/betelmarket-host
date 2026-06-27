<?php

namespace App\Services\Hestia;

use App\Models\HostingAccount;
use Illuminate\Support\Facades\Log;

class UserManager
{
    public function __construct(
        private readonly HestiaService $hestia
    ) {}

    /**
     * Create a new user in HestiaCP.
     */
    public function createUser(string $username, string $password, string $email, string $package = 'default'): array
    {
        $result = $this->hestia->execute('v-add-user', [
            $username,
            $password,
            $email,
            $package,
        ]);

        if ($result['success']) {
            Log::info("Hestia user created: {$username}");
        } else {
            Log::error("Failed to create Hestia user: {$username}", $result);
        }

        return $result;
    }

    /**
     * Delete a user from HestiaCP.
     */
    public function deleteUser(string $username): array
    {
        $result = $this->hestia->execute('v-delete-user', [$username]);

        if ($result['success']) {
            Log::info("Hestia user deleted: {$username}");
        }

        return $result;
    }

    /**
     * Suspend a user in HestiaCP.
     */
    public function suspendUser(string $username): array
    {
        $result = $this->hestia->execute('v-suspend-user', [$username]);

        if ($result['success']) {
            Log::info("Hestia user suspended: {$username}");
        }

        return $result;
    }

    /**
     * Unsuspend a user in HestiaCP.
     */
    public function unsuspendUser(string $username): array
    {
        $result = $this->hestia->execute('v-unsuspend-user', [$username]);

        if ($result['success']) {
            Log::info("Hestia user unsuspended: {$username}");
        }

        return $result;
    }

    /**
     * Change user password.
     */
    public function changePassword(string $username, string $newPassword): array
    {
        return $this->hestia->execute('v-change-user-password', [
            $username,
            $newPassword,
        ]);
    }

    /**
     * Get user statistics.
     */
    public function getUserStats(string $username): array
    {
        return $this->hestia->execute('v-list-user', [$username, 'json']);
    }
}
