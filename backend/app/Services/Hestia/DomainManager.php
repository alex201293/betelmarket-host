<?php

namespace App\Services\Hestia;

use Illuminate\Support\Facades\Log;

class DomainManager
{
    public function __construct(
        private readonly HestiaService $hestia
    ) {}

    /**
     * Create a domain for a user.
     */
    public function createDomain(string $username, string $domain): array
    {
        $result = $this->hestia->execute('v-add-domain', [
            $username,
            $domain,
        ]);

        if ($result['success']) {
            Log::info("Domain created: {$domain} for user: {$username}");
        } else {
            Log::error("Failed to create domain: {$domain}", $result);
        }

        return $result;
    }

    /**
     * Delete a domain.
     */
    public function deleteDomain(string $username, string $domain): array
    {
        $result = $this->hestia->execute('v-delete-domain', [
            $username,
            $domain,
        ]);

        if ($result['success']) {
            Log::info("Domain deleted: {$domain}");
        }

        return $result;
    }

    /**
     * Enable SSL for a domain using Let's Encrypt.
     */
    public function enableSSL(string $username, string $domain): array
    {
        // First add SSL support
        $this->hestia->execute('v-add-web-domain-ssl', [
            $username,
            $domain,
        ]);

        // Then enable Let's Encrypt
        $result = $this->hestia->execute('v-add-letsencrypt-domain', [
            $username,
            $domain,
        ]);

        if ($result['success']) {
            Log::info("SSL enabled for domain: {$domain}");
        }

        return $result;
    }

    /**
     * Create a subdomain.
     */
    public function createSubdomain(string $username, string $domain, string $subdomain): array
    {
        $fullSubdomain = "{$subdomain}.{$domain}";

        $result = $this->hestia->execute('v-add-web-domain', [
            $username,
            $fullSubdomain,
        ]);

        if ($result['success']) {
            Log::info("Subdomain created: {$fullSubdomain}");
        }

        return $result;
    }

    /**
     * List domains for a user.
     */
    public function listDomains(string $username): array
    {
        return $this->hestia->execute('v-list-web-domains', [$username, 'json']);
    }
}
