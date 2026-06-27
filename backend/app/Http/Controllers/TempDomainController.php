<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\HostingAccount;
use App\Jobs\ProvisionDomain;
use App\Services\Hestia\DomainManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TempDomainController extends Controller
{
    /**
     * Create a temporary domain for the client.
     * Generates something like: orange-snake-517453.betelhost.site
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'hosting_account_id' => 'required|exists:hosting_accounts,id',
        ]);

        $account = HostingAccount::with('plan')->findOrFail($request->hosting_account_id);

        // Check ownership
        $user = $request->user();
        if ($user->isClient() && $account->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Check temp domain limit
        $currentTempDomains = Domain::where('hosting_account_id', $account->id)
            ->where('is_temporary', true)
            ->where('status', '!=', 'deleted')
            ->count();

        $maxTemp = $account->plan->max_temp_domains ?? 1;

        if ($currentTempDomains >= $maxTemp) {
            return response()->json([
                'message' => "Temporary domain limit reached ({$maxTemp}). Connect a real domain or upgrade your plan.",
            ], 422);
        }

        // Generate unique temp domain name
        $suffix = $account->plan->temp_domain_suffix ?? 'betelhost.site';
        $prefix = $this->generatePrefix();
        $tempDomain = "{$prefix}.{$suffix}";

        // Ensure uniqueness
        while (Domain::where('domain', $tempDomain)->exists()) {
            $prefix = $this->generatePrefix();
            $tempDomain = "{$prefix}.{$suffix}";
        }

        $domain = Domain::create([
            'hosting_account_id' => $account->id,
            'domain' => $tempDomain,
            'ssl_enabled' => false,
            'is_temporary' => true,
            'status' => 'pending',
            'temp_expires_at' => now()->addDays(30), // 30 days to connect
        ]);

        // Dispatch provisioning
        ProvisionDomain::dispatch($domain);

        return response()->json([
            'domain' => $domain,
            'message' => "Temporary domain created: {$tempDomain}. Connect a real domain anytime.",
            'expires_at' => $domain->temp_expires_at,
        ], 201);
    }

    /**
     * Connect a real domain to replace a temporary one.
     */
    public function connect(Request $request, Domain $domain): JsonResponse
    {
        $request->validate([
            'real_domain' => 'required|string|unique:domains,domain',
        ]);

        if (!$domain->is_temporary) {
            return response()->json(['message' => 'This is not a temporary domain.'], 422);
        }

        $user = $request->user();
        if ($user->isClient() && $domain->hostingAccount->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Create the real domain
        $realDomain = Domain::create([
            'hosting_account_id' => $domain->hosting_account_id,
            'domain' => $request->real_domain,
            'ssl_enabled' => false,
            'is_temporary' => false,
            'status' => 'pending',
        ]);

        // Mark temp domain as connected
        $domain->update([
            'connected_domain' => $request->real_domain,
            'status' => 'active', // keep temp active as alias until DNS propagates
        ]);

        // Provision real domain
        ProvisionDomain::dispatch($realDomain);

        $serverIp = config('hestia.host', '0.0.0.0');

        return response()->json([
            'message' => "Real domain created. Configure DNS to complete.",
            'temp_domain' => $domain->domain,
            'real_domain' => $realDomain,
            'dns_required' => [
                ['type' => 'A', 'name' => '@', 'value' => $serverIp],
                ['type' => 'A', 'name' => 'www', 'value' => $serverIp],
            ],
        ]);
    }

    /**
     * List temporary domains for the user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Domain::where('is_temporary', true)
            ->where('status', '!=', 'deleted')
            ->with('hostingAccount.user');

        if ($user->isClient()) {
            $query->whereHas('hostingAccount', fn($q) => $q->where('user_id', $user->id));
        }

        $domains = $query->get();

        return response()->json($domains);
    }

    /**
     * Admin: configure temp domain settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'max_temp_domains' => 'required|integer|min:0|max:50',
            'temp_domain_suffix' => 'required|string|max:100',
        ]);

        $plan = \App\Models\Plan::findOrFail($request->plan_id);
        $plan->update([
            'max_temp_domains' => $request->max_temp_domains,
            'temp_domain_suffix' => $request->temp_domain_suffix,
        ]);

        return response()->json([
            'message' => 'Temp domain settings updated.',
            'plan' => $plan,
        ]);
    }

    /**
     * Generate a random prefix like "orange-snake-517453"
     */
    private function generatePrefix(): string
    {
        $colors = ['red', 'blue', 'green', 'orange', 'purple', 'gold', 'silver', 'mint', 'coral', 'teal'];
        $animals = ['falcon', 'snake', 'tiger', 'wolf', 'eagle', 'shark', 'lion', 'bear', 'hawk', 'fox'];

        $color = $colors[array_rand($colors)];
        $animal = $animals[array_rand($animals)];
        $number = rand(100000, 999999);

        return "{$color}-{$animal}-{$number}";
    }
}
