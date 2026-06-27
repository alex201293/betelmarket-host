<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\HostingAccount;
use App\Jobs\ProvisionDomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DomainController extends Controller
{
    /**
     * List domains.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Domain::with('hostingAccount.user');

        if ($user->isClient()) {
            $query->whereHas('hostingAccount', fn($q) => $q->where('user_id', $user->id));
        }

        $domains = $query->paginate(20);

        return response()->json($domains);
    }

    /**
     * Create a domain (async).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'hosting_account_id' => 'required|exists:hosting_accounts,id',
            'domain' => 'required|string|unique:domains,domain',
        ]);

        $account = HostingAccount::findOrFail($request->hosting_account_id);

        // Check plan limits
        $currentDomains = $account->domains()->count();
        if ($currentDomains >= $account->plan->max_domains) {
            return response()->json(['message' => 'Domain limit reached for this plan.'], 422);
        }

        $domain = Domain::create([
            'hosting_account_id' => $account->id,
            'domain' => $request->domain,
            'status' => 'pending',
        ]);

        // Dispatch async domain provisioning
        ProvisionDomain::dispatch($domain);

        return response()->json($domain, 201);
    }

    /**
     * Delete a domain.
     */
    public function destroy(Domain $domain): JsonResponse
    {
        $domain->update(['status' => 'deleted']);

        // TODO: Dispatch async deletion job

        return response()->json(['message' => 'Domain deletion initiated.']);
    }
}
