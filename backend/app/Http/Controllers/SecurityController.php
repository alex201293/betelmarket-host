<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Services\Hestia\SecurityManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecurityController extends Controller
{
    public function __construct(
        private readonly SecurityManager $security
    ) {}

    // ─── MAIL SECURITY ────────────────────────────────────────

    /**
     * Get mail security status for a domain.
     */
    public function mailStatus(Domain $domain): JsonResponse
    {
        // In production, this would query Hestia for current status
        return response()->json([
            'domain' => $domain->domain,
            'antispam_enabled' => true,
            'antivirus_enabled' => true,
            'dkim_enabled' => true,
            'spf_configured' => true,
            'dmarc_configured' => false,
        ]);
    }

    /**
     * Enable antispam (SpamAssassin) for a domain.
     */
    public function enableAntispam(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $result = $this->security->enableAntispam($username, $domain->domain);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'Antispam enabled.' : 'Failed to enable antispam.',
        ]);
    }

    /**
     * Disable antispam.
     */
    public function disableAntispam(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $result = $this->security->disableAntispam($username, $domain->domain);

        return response()->json(['success' => $result['success']]);
    }

    /**
     * Enable antivirus (ClamAV).
     */
    public function enableAntivirus(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $result = $this->security->enableAntivirus($username, $domain->domain);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'Antivirus enabled.' : 'Failed.',
        ]);
    }

    /**
     * Disable antivirus.
     */
    public function disableAntivirus(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $result = $this->security->disableAntivirus($username, $domain->domain);

        return response()->json(['success' => $result['success']]);
    }

    /**
     * Enable DKIM.
     */
    public function enableDkim(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $result = $this->security->enableDkim($username, $domain->domain);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'DKIM enabled. Add the DNS record to complete setup.' : 'Failed.',
        ]);
    }

    /**
     * Get DKIM DNS record to configure.
     */
    public function getDkimRecord(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $result = $this->security->getDkimKey($username, $domain->domain);

        return response()->json($result);
    }

    /**
     * Configure SPF record.
     */
    public function configureSpf(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $serverIp = config('hestia.host', '127.0.0.1');
        $result = $this->security->addSpfRecord($username, $domain->domain, $serverIp);

        return response()->json([
            'success' => $result['success'],
            'record' => "v=spf1 a mx ip4:{$serverIp} ~all",
        ]);
    }

    /**
     * Configure DMARC record.
     */
    public function configureDmarc(Request $request, Domain $domain): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $username = $domain->hostingAccount->hestia_username;
        $result = $this->security->addDmarcRecord($username, $domain->domain, $request->email);

        return response()->json([
            'success' => $result['success'],
            'record' => "v=DMARC1; p=quarantine; rua=mailto:{$request->email}",
        ]);
    }

    // ─── WEB SECURITY ─────────────────────────────────────────

    /**
     * Force HTTPS.
     */
    public function forceHttps(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $result = $this->security->forceHttps($username, $domain->domain);

        return response()->json(['success' => $result['success']]);
    }

    /**
     * Enable HSTS.
     */
    public function enableHsts(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $result = $this->security->enableHsts($username, $domain->domain);

        return response()->json(['success' => $result['success']]);
    }

    // ─── FIREWALL ─────────────────────────────────────────────

    /**
     * Ban an IP.
     */
    public function banIp(Request $request): JsonResponse
    {
        $request->validate(['ip' => 'required|ip']);
        $result = $this->security->banIp($request->ip);

        return response()->json(['success' => $result['success'], 'message' => "IP {$request->ip} banned."]);
    }

    /**
     * Unban an IP.
     */
    public function unbanIp(Request $request): JsonResponse
    {
        $request->validate(['ip' => 'required|ip']);
        $result = $this->security->unbanIp($request->ip);

        return response()->json(['success' => $result['success']]);
    }

    /**
     * List banned IPs.
     */
    public function listBanned(): JsonResponse
    {
        $result = $this->security->listBannedIps();
        return response()->json($result);
    }
}
