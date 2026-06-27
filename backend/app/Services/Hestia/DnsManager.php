<?php

namespace App\Services\Hestia;

use Illuminate\Support\Facades\Log;

class DnsManager
{
    public function __construct(
        private readonly HestiaService $hestia
    ) {}

    /**
     * Create a DNS record.
     */
    public function createDnsRecord(
        string $username,
        string $domain,
        string $recordId,
        string $type,
        string $value,
        int $priority = 0,
        int $ttl = 3600
    ): array {
        $params = [
            $username,
            $domain,
            $recordId,
            $type,
            $value,
        ];

        if ($priority > 0) {
            $params[] = (string) $priority;
        }

        $result = $this->hestia->execute('v-add-dns-record', $params);

        if ($result['success']) {
            Log::info("DNS record created: {$type} {$recordId} for {$domain}");
        }

        return $result;
    }

    /**
     * Delete a DNS record.
     */
    public function deleteDnsRecord(string $username, string $domain, int $recordId): array
    {
        $result = $this->hestia->execute('v-delete-dns-record', [
            $username,
            $domain,
            (string) $recordId,
        ]);

        if ($result['success']) {
            Log::info("DNS record deleted: #{$recordId} from {$domain}");
        }

        return $result;
    }

    /**
     * Update a DNS record (delete + recreate).
     */
    public function updateDnsRecord(
        string $username,
        string $domain,
        int $recordId,
        string $type,
        string $name,
        string $value,
        int $priority = 0,
        int $ttl = 3600
    ): array {
        // HestiaCP doesn't have a direct update, so we delete and recreate
        $this->deleteDnsRecord($username, $domain, $recordId);

        return $this->createDnsRecord(
            $username,
            $domain,
            $name,
            $type,
            $value,
            $priority,
            $ttl
        );
    }

    /**
     * Create DNS domain zone.
     */
    public function createDnsDomain(string $username, string $domain, string $ip = ''): array
    {
        $params = [$username, $domain];
        if ($ip) {
            $params[] = $ip;
        }

        return $this->hestia->execute('v-add-dns-domain', $params);
    }

    /**
     * List DNS records for a domain.
     */
    public function listDnsRecords(string $username, string $domain): array
    {
        return $this->hestia->execute('v-list-dns-records', [
            $username,
            $domain,
            'json',
        ]);
    }
}
