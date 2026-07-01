<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\HostingAccount;
use App\Models\MailAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsageController extends Controller
{
    /**
     * Get resource usage summary.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return $this->globalUsage();
        }

        return $this->userUsage($user);
    }

    private function globalUsage(): JsonResponse
    {
        $totalDisk = HostingAccount::sum('disk_used_mb');
        $totalLimit = HostingAccount::sum('disk_limit_mb');
        $totalDomains = Domain::where('status', '!=', 'deleted')->count();
        $totalMailboxes = MailAccount::where('status', '!=', 'deleted')->count();
        $totalAccounts = HostingAccount::where('status', 'active')->count();

        return response()->json([
            'disk_used_mb' => $totalDisk,
            'disk_limit_mb' => $totalLimit,
            'domains' => $totalDomains,
            'mailboxes' => $totalMailboxes,
            'active_accounts' => $totalAccounts,
        ]);
    }

    private function userUsage($user): JsonResponse
    {
        $accounts = $user->hostingAccounts()->with('plan')->get();

        $diskUsed = $accounts->sum('disk_used_mb');
        // Use plan disk quota (what the client purchased), not Hestia's internal limit
        $diskLimit = $accounts->sum(function ($account) {
            return $account->plan->disk_quota_mb ?? $account->disk_limit_mb;
        });
        $domains = Domain::whereIn('hosting_account_id', $accounts->pluck('id'))
            ->where('status', '!=', 'deleted')
            ->count();
        $mailboxes = MailAccount::whereHas('domain', fn($q) =>
            $q->whereIn('hosting_account_id', $accounts->pluck('id'))
        )->where('status', '!=', 'deleted')->count();

        return response()->json([
            'disk_used_mb' => $diskUsed,
            'disk_limit_mb' => $diskLimit,
            'domains' => $domains,
            'mailboxes' => $mailboxes,
        ]);
    }
}
