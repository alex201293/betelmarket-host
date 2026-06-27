<?php

namespace App\Http\Controllers;

use App\Models\HostingAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuotaController extends Controller
{
    /**
     * Get account quotas (admin view showing real vs visible).
     */
    public function show(HostingAccount $hostingAccount): JsonResponse
    {
        return response()->json([
            'id' => $hostingAccount->id,
            'hestia_username' => $hostingAccount->hestia_username,
            'user' => $hostingAccount->user->name,
            'plan' => $hostingAccount->plan->name,

            // What the client SEES (plan limits)
            'visible' => [
                'disk_mb' => $hostingAccount->disk_limit_mb,
                'max_mailboxes' => $hostingAccount->plan->max_mailboxes,
                'max_domains' => $hostingAccount->plan->max_domains,
                'bandwidth_mb' => $hostingAccount->plan->bandwidth_quota_mb,
            ],

            // What's ACTUALLY applied in HestiaCP
            'real' => [
                'disk_mb' => $hostingAccount->real_disk_mb,
                'bandwidth_mb' => $hostingAccount->real_bandwidth_mb,
                'max_mailboxes' => $hostingAccount->real_max_mailboxes,
                'max_domains' => $hostingAccount->real_max_domains,
                'mailbox_quota_mb' => $hostingAccount->real_mailbox_quota_mb,
            ],

            // Current usage
            'usage' => [
                'disk_used_mb' => $hostingAccount->disk_used_mb,
                'disk_percent_visible' => $hostingAccount->getDiskUsagePercentage(),
                'disk_percent_real' => $hostingAccount->getRealDiskUsagePercentage(),
            ],

            // Auto-scale config
            'auto_scale' => [
                'enabled' => $hostingAccount->auto_scale_enabled,
                'threshold_percent' => $hostingAccount->scale_threshold_percent,
                'increment_mb' => $hostingAccount->scale_increment_mb,
                'max_mb' => $hostingAccount->scale_max_mb,
                'needs_scaling' => $hostingAccount->needsScaling(),
            ],

            'admin_notes' => $hostingAccount->admin_notes,
        ]);
    }

    /**
     * Update real quotas (admin only).
     */
    public function update(Request $request, HostingAccount $hostingAccount): JsonResponse
    {
        $request->validate([
            'real_disk_mb' => 'sometimes|integer|min:256',
            'real_bandwidth_mb' => 'sometimes|integer|min:1024',
            'real_max_mailboxes' => 'sometimes|integer|min:1',
            'real_max_domains' => 'sometimes|integer|min:1',
            'real_mailbox_quota_mb' => 'sometimes|integer|min:50',
            'auto_scale_enabled' => 'sometimes|boolean',
            'scale_threshold_percent' => 'sometimes|integer|min:50|max:95',
            'scale_increment_mb' => 'sometimes|integer|min:256',
            'scale_max_mb' => 'nullable|integer|min:512',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $hostingAccount->update($request->only([
            'real_disk_mb', 'real_bandwidth_mb', 'real_max_mailboxes',
            'real_max_domains', 'real_mailbox_quota_mb',
            'auto_scale_enabled', 'scale_threshold_percent',
            'scale_increment_mb', 'scale_max_mb', 'admin_notes',
        ]));

        return response()->json([
            'message' => 'Quotas updated.',
            'account' => $hostingAccount->fresh(),
        ]);
    }

    /**
     * Manually scale up an account.
     */
    public function scaleUp(HostingAccount $hostingAccount): JsonResponse
    {
        $old = $hostingAccount->real_disk_mb;

        if ($hostingAccount->scaleUp()) {
            return response()->json([
                'message' => "Scaled from {$old}MB to {$hostingAccount->real_disk_mb}MB.",
            ]);
        }

        return response()->json([
            'message' => 'Cannot scale further. Plan limit reached.',
        ], 422);
    }

    /**
     * List all accounts with their real vs visible quotas.
     */
    public function index(): JsonResponse
    {
        $accounts = HostingAccount::with(['user', 'plan'])
            ->where('status', 'active')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'user' => $a->user->name,
                'hestia_username' => $a->hestia_username,
                'plan' => $a->plan->name,
                'visible_disk_mb' => $a->disk_limit_mb,
                'real_disk_mb' => $a->real_disk_mb,
                'disk_used_mb' => $a->disk_used_mb,
                'real_usage_percent' => $a->getRealDiskUsagePercentage(),
                'auto_scale' => $a->auto_scale_enabled,
                'needs_scaling' => $a->needsScaling(),
            ]);

        return response()->json($accounts);
    }
}
