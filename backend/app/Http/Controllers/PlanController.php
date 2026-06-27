<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    /**
     * List all plans.
     */
    public function index(): JsonResponse
    {
        $plans = Plan::where('status', 'active')->get();

        return response()->json($plans);
    }

    /**
     * Create a new plan.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'max_domains' => 'required|integer|min:1',
            'max_subdomains' => 'required|integer|min:0',
            'max_mailboxes' => 'required|integer|min:0',
            'disk_quota_mb' => 'required|integer|min:100',
            'bandwidth_quota_mb' => 'required|integer|min:100',
            'max_databases' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
        ]);

        $plan = Plan::create($request->all());

        return response()->json($plan, 201);
    }

    /**
     * Update a plan.
     */
    public function update(Request $request, Plan $plan): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'max_domains' => 'sometimes|integer|min:1',
            'max_subdomains' => 'sometimes|integer|min:0',
            'max_mailboxes' => 'sometimes|integer|min:0',
            'disk_quota_mb' => 'sometimes|integer|min:100',
            'bandwidth_quota_mb' => 'sometimes|integer|min:100',
            'max_databases' => 'sometimes|integer|min:0',
            'price' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $plan->update($request->all());

        return response()->json($plan);
    }
}
