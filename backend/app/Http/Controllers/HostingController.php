<?php

namespace App\Http\Controllers;

use App\Models\HostingAccount;
use App\Models\Plan;
use App\Jobs\ProvisionHostingAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class HostingController extends Controller
{
    /**
     * List hosting accounts.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = HostingAccount::with(['user', 'plan', 'domains']);

        if ($user->isClient()) {
            $query->where('user_id', $user->id);
        }

        $accounts = $query->paginate(20);

        return response()->json($accounts);
    }

    /**
     * Create a hosting account (async provisioning).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'plan_id' => 'required|exists:plans,id',
        ]);

        $plan = Plan::findOrFail($request->plan_id);

        // Generate unique hestia username
        $hestiaUsername = 'bm_' . Str::lower(Str::random(8));

        $account = HostingAccount::create([
            'user_id' => $request->user_id,
            'plan_id' => $request->plan_id,
            'hestia_username' => $hestiaUsername,
            'status' => 'pending',
            'disk_limit_mb' => $plan->disk_quota_mb,
        ]);

        // Dispatch async provisioning job
        ProvisionHostingAccount::dispatch($account);

        return response()->json($account, 201);
    }

    /**
     * Update a hosting account (change plan, status, custom limits).
     */
    public function update(Request $request, HostingAccount $hostingAccount): JsonResponse
    {
        $request->validate([
            'plan_id' => 'sometimes|exists:plans,id',
            'status' => 'sometimes|in:active,suspended,pending,deleted',
            'extra_mailboxes' => 'sometimes|integer|min:0',
            'extra_domains' => 'sometimes|integer|min:0',
            'extra_disk_mb' => 'sometimes|integer|min:0',
        ]);

        if ($request->has('plan_id')) {
            $newPlan = Plan::findOrFail($request->plan_id);
            $hostingAccount->update([
                'plan_id' => $newPlan->id,
                'disk_limit_mb' => $newPlan->disk_quota_mb,
            ]);
        }

        if ($request->has('status')) {
            $hostingAccount->update(['status' => $request->status]);
            $username = $hostingAccount->hestia_username;
            if ($request->status === 'suspended') {
                exec("/usr/local/hestia/bin/v-suspend-user {$username} 2>&1");
            } elseif ($request->status === 'active') {
                exec("/usr/local/hestia/bin/v-unsuspend-user {$username} 2>&1");
            }
        }

        // Custom extras (override plan limits for this specific account)
        $extras = $request->only(['extra_mailboxes', 'extra_domains', 'extra_disk_mb']);
        if (!empty($extras)) {
            $hostingAccount->update($extras);
        }

        return response()->json($hostingAccount->fresh()->load(['user', 'plan']));
    }

    /**
     * Login as client (impersonate) - generates a token for the client.
     */
    public function loginAs(HostingAccount $hostingAccount): JsonResponse
    {
        $user = $hostingAccount->user;
        $token = $user->createToken('admin-impersonate', [$user->role])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
            'message' => "Logged in as {$user->name}",
        ]);
    }
}
