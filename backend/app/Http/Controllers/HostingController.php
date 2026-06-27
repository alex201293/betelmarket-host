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
}
