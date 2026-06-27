<?php

namespace App\Services\Hestia;

use Illuminate\Support\Facades\Log;

class SecurityManager
{
    public function __construct(
        private readonly HestiaService $hestia
    ) {}

    // ─── ANTISPAM (SpamAssassin + DKIM + SPF + DMARC) ─────────

    /**
     * Enable SpamAssassin for a mail domain.
     */
    public function enableAntispam(string $username, string $domain): array
    {
        $result = $this->hestia->execute('v-add-mail-domain-antispam', [$username, $domain]);
        Log::info("Antispam enabled for {$domain}", $result);
        return $result;
    }

    /**
     * Disable SpamAssassin for a mail domain.
     */
    public function disableAntispam(string $username, string $domain): array
    {
        return $this->hestia->execute('v-delete-mail-domain-antispam', [$username, $domain]);
    }

    /**
     * Enable antivirus (ClamAV) for a mail domain.
     */
    public function enableAntivirus(string $username, string $domain): array
    {
        $result = $this->hestia->execute('v-add-mail-domain-antivirus', [$username, $domain]);
        Log::info("Antivirus enabled for {$domain}", $result);
        return $result;
    }

    /**
     * Disable antivirus for a mail domain.
     */
    public function disableAntivirus(string $username, string $domain): array
    {
        return $this->hestia->execute('v-delete-mail-domain-antivirus', [$username, $domain]);
    }

    /**
     * Enable DKIM signing for outgoing mail.
     */
    public function enableDkim(string $username, string $domain): array
    {
        $result = $this->hestia->execute('v-add-mail-domain-dkim', [$username, $domain]);
        Log::info("DKIM enabled for {$domain}", $result);
        return $result;
    }

    /**
     * Disable DKIM.
     */
    public function disableDkim(string $username, string $domain): array
    {
        return $this->hestia->execute('v-delete-mail-domain-dkim', [$username, $domain]);
    }

    /**
     * Get DKIM public key (for DNS configuration).
     */
    public function getDkimKey(string $username, string $domain): array
    {
        $result = $this->hestia->execute('v-list-mail-domain-dkim', [$username, $domain, 'json']);
        return $result;
    }

    /**
     * Add SPF record to DNS.
     */
    public function addSpfRecord(string $username, string $domain, string $serverIp): array
    {
        $spfValue = "v=spf1 a mx ip4:{$serverIp} ~all";
        return $this->hestia->execute('v-add-dns-record', [
            $username, $domain, '@', 'TXT', $spfValue,
        ]);
    }

    /**
     * Add DMARC record to DNS.
     */
    public function addDmarcRecord(string $username, string $domain, string $email): array
    {
        $dmarcValue = "v=DMARC1; p=quarantine; rua=mailto:{$email}; ruf=mailto:{$email}; fo=1";
        return $this->hestia->execute('v-add-dns-record', [
            $username, $domain, '_dmarc', 'TXT', $dmarcValue,
        ]);
    }

    // ─── FIREWALL (iptables via Hestia) ───────────────────────

    /**
     * Ban an IP address.
     */
    public function banIp(string $ip, string $chain = 'INPUT'): array
    {
        return $this->hestia->execute('v-add-firewall-ban', [$ip, $chain]);
    }

    /**
     * Unban an IP address.
     */
    public function unbanIp(string $ip, string $chain = 'INPUT'): array
    {
        return $this->hestia->execute('v-delete-firewall-ban', [$ip, $chain]);
    }

    /**
     * List banned IPs.
     */
    public function listBannedIps(): array
    {
        return $this->hestia->execute('v-list-firewall-ban', ['json']);
    }

    /**
     * Add a firewall rule.
     */
    public function addFirewallRule(string $action, string $ip, int $port, string $protocol = 'tcp'): array
    {
        return $this->hestia->execute('v-add-firewall-rule', [
            $action, $ip, (string) $port, $protocol,
        ]);
    }

    // ─── FAIL2BAN ─────────────────────────────────────────────

    /**
     * List Fail2Ban jails status.
     */
    public function listFail2banJails(): array
    {
        $output = [];
        exec('sudo fail2ban-client status 2>&1', $output, $code);
        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Get Fail2Ban jail details (banned IPs etc).
     */
    public function getJailStatus(string $jail): array
    {
        $output = [];
        exec("sudo fail2ban-client status {$jail} 2>&1", $output, $code);
        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    // ─── MAIL REJECT LIST (blacklist) ─────────────────────────

    /**
     * Add email/domain to reject list.
     */
    public function addToRejectList(string $username, string $domain, string $entry): array
    {
        // Hestia uses catchall/reject mechanism
        return $this->hestia->execute('v-add-mail-domain-reject', [
            $username, $domain, $entry,
        ]);
    }

    /**
     * Remove from reject list.
     */
    public function removeFromRejectList(string $username, string $domain, string $entry): array
    {
        return $this->hestia->execute('v-delete-mail-domain-reject', [
            $username, $domain, $entry,
        ]);
    }

    // ─── SSL/TLS SECURITY ─────────────────────────────────────

    /**
     * Force HTTPS redirect.
     */
    public function forceHttps(string $username, string $domain): array
    {
        return $this->hestia->execute('v-add-web-domain-ssl-force', [$username, $domain]);
    }

    /**
     * Enable HSTS header.
     */
    public function enableHsts(string $username, string $domain): array
    {
        return $this->hestia->execute('v-add-web-domain-ssl-hsts', [$username, $domain]);
    }
}
