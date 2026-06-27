<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\Subdomain;
use App\Jobs\ProvisionSubdomain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubdomainController extends Controller
{
    /**
     * List subdomains.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Subdomain::with('domain.hostingAccount');

        if ($user->isClient()) {
            $query->whereHas('domain.hostingAccount', fn($q) => $q->where('user_id', $user->id));
        }

        if ($request->has('domain_id')) {
            $query->where('domain_id', $request->domain_id);
        }

        $subdomains = $query->paginate(20);

        return response()->json($subdomains);
    }

    /**
     * Create a subdomain.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'subdomain' => 'required|string|max:63|alpha_dash',
        ]);

        $domain = Domain::with('hostingAccount.plan')->findOrFail($request->domain_id);

        // Check plan limits
        $currentSubdomains = Subdomain::where('domain_id', $domain->id)
            ->where('status', '!=', 'deleted')
            ->count();

        $totalSubdomains = Subdomain::whereHas('domain', fn($q) =>
            $q->where('hosting_account_id', $domain->hosting_account_id)
        )->where('status', '!=', 'deleted')->count();

        if ($totalSubdomains >= $domain->hostingAccount->plan->max_subdomains) {
            return response()->json(['message' => 'Subdomain limit reached for this plan.'], 422);
        }

        $fullDomain = "{$request->subdomain}.{$domain->domain}";

        // Check uniqueness
        if (Subdomain::where('full_domain', $fullDomain)->exists()) {
            return response()->json(['message' => 'This subdomain already exists.'], 422);
        }

        $subdomain = Subdomain::create([
            'domain_id' => $domain->id,
            'subdomain' => $request->subdomain,
            'full_domain' => $fullDomain,
            'status' => 'pending',
        ]);

        ProvisionSubdomain::dispatch($subdomain);

        return response()->json($subdomain, 201);
    }

    /**
     * Delete a subdomain.
     */
    public function destroy(Subdomain $subdomain): JsonResponse
    {
        $subdomain->update(['status' => 'deleted']);

        return response()->json(['message' => 'Subdomain deletion initiated.']);
    }
}
