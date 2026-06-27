<?php

namespace App\Services\Hestia;

use Illuminate\Support\Facades\Log;

class MailManager
{
    public function __construct(
        private readonly HestiaService $hestia
    ) {}

    /**
     * Create a mail account.
     */
    public function createMailbox(string $username, string $domain, string $account, string $password): array
    {
        $result = $this->hestia->execute('v-add-mail-account', [
            $username,
            $domain,
            $account,
            $password,
        ]);

        if ($result['success']) {
            Log::info("Mailbox created: {$account}@{$domain}");
        } else {
            Log::error("Failed to create mailbox: {$account}@{$domain}", $result);
        }

        return $result;
    }

    /**
     * Delete a mail account.
     */
    public function deleteMailbox(string $username, string $domain, string $account): array
    {
        $result = $this->hestia->execute('v-delete-mail-account', [
            $username,
            $domain,
            $account,
        ]);

        if ($result['success']) {
            Log::info("Mailbox deleted: {$account}@{$domain}");
        }

        return $result;
    }

    /**
     * Change mailbox password.
     */
    public function changeMailboxPassword(string $username, string $domain, string $account, string $newPassword): array
    {
        return $this->hestia->execute('v-change-mail-account-password', [
            $username,
            $domain,
            $account,
            $newPassword,
        ]);
    }

    /**
     * Change mailbox quota.
     */
    public function changeMailboxQuota(string $username, string $domain, string $account, int $quotaMb): array
    {
        return $this->hestia->execute('v-change-mail-account-quota', [
            $username,
            $domain,
            $account,
            (string) $quotaMb,
        ]);
    }

    /**
     * Create mail domain (enable mail for a domain).
     */
    public function createMailDomain(string $username, string $domain): array
    {
        return $this->hestia->execute('v-add-mail-domain', [
            $username,
            $domain,
        ]);
    }

    /**
     * List mail accounts for a domain.
     */
    public function listMailboxes(string $username, string $domain): array
    {
        return $this->hestia->execute('v-list-mail-accounts', [
            $username,
            $domain,
            'json',
        ]);
    }
}
