<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\HostingAccount;
use App\Jobs\ProvisionDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DomainWizardController extends Controller
{
    /**
     * Step 1: Create domain.
     */
    public function createDomain(Request $request): JsonResponse
    {
        $request->validate([
            'hosting_account_id' => 'required|exists:hosting_accounts,id',
            'domain' => 'required|string|unique:domains,domain',
        ]);

        $account = HostingAccount::findOrFail($request->hosting_account_id);

        // Check plan limits
        $currentDomains = $account->domains()->where('status', '!=', 'deleted')->count();
        if ($currentDomains >= $account->plan->max_domains) {
            return response()->json(['message' => 'Domain limit reached for this plan.'], 422);
        }

        $domain = Domain::create([
            'hosting_account_id' => $account->id,
            'domain' => $request->domain,
            'status' => 'pending',
        ]);

        ProvisionDomain::dispatch($domain);

        return response()->json([
            'domain' => $domain,
            'dns_records' => $this->getRequiredDnsRecords($domain, $account),
        ], 201);
    }

    /**
     * Step 2: Get DNS records that need to be configured.
     */
    public function getDnsInstructions(Domain $domain): JsonResponse
    {
        $account = $domain->hostingAccount;
        $serverIp = config('hestia.host', '0.0.0.0');

        return response()->json([
            'domain' => $domain->domain,
            'status' => $domain->status,
            'required_records' => $this->getRequiredDnsRecords($domain, $account),
            'instructions' => [
                'Go to your domain registrar (GoDaddy, Namecheap, etc.)',
                'Update the DNS records as shown below',
                'Wait for propagation (usually 1-48 hours)',
                'Come back and verify the domain',
            ],
        ]);
    }

    /**
     * Step 3: Verify domain DNS propagation.
     */
    public function verifyDns(Domain $domain): JsonResponse
    {
        $serverIp = config('hestia.host', '127.0.0.1');
        $domainName = $domain->domain;

        // Check A record
        $dnsRecords = @dns_get_record($domainName, DNS_A);
        $aRecordValid = false;

        if ($dnsRecords) {
            foreach ($dnsRecords as $record) {
                if (isset($record['ip']) && $record['ip'] === $serverIp) {
                    $aRecordValid = true;
                    break;
                }
            }
        }

        // Check MX record
        $mxRecords = @dns_get_record($domainName, DNS_MX);
        $mxValid = false;

        if ($mxRecords) {
            foreach ($mxRecords as $record) {
                if (isset($record['target']) && str_contains($record['target'], $domainName)) {
                    $mxValid = true;
                    break;
                }
            }
        }

        return response()->json([
            'domain' => $domainName,
            'checks' => [
                ['type' => 'A Record', 'expected' => $serverIp, 'valid' => $aRecordValid],
                ['type' => 'MX Record', 'expected' => "mail.{$domainName}", 'valid' => $mxValid],
            ],
            'all_valid' => $aRecordValid, // MX is optional at this stage
            'message' => $aRecordValid
                ? 'Domain is pointing to your server correctly!'
                : 'DNS has not propagated yet. Please wait and try again.',
        ]);
    }

    private function getRequiredDnsRecords(Domain $domain, HostingAccount $account): array
    {
        $serverIp = config('hestia.host', '0.0.0.0');

        return [
            ['type' => 'A', 'name' => '@', 'value' => $serverIp, 'ttl' => 3600],
            ['type' => 'A', 'name' => 'www', 'value' => $serverIp, 'ttl' => 3600],
            ['type' => 'MX', 'name' => '@', 'value' => "mail.{$domain->domain}", 'priority' => 10, 'ttl' => 3600],
            ['type' => 'A', 'name' => 'mail', 'value' => $serverIp, 'ttl' => 3600],
            ['type' => 'TXT', 'name' => '@', 'value' => "v=spf1 a mx ip4:{$serverIp} ~all", 'ttl' => 3600],
        ];
    }
}
