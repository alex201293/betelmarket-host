<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\MailAccount;
use App\Jobs\ProvisionMailbox;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MailController extends Controller
{
    /**
     * List mail accounts.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = MailAccount::with('domain.hostingAccount');

        // Everyone only sees their own mail accounts
        // Admin uses "Login as" to manage client emails
        $query->whereHas('domain.hostingAccount', fn($q) => $q->where('user_id', $user->id));

        $mailAccounts = $query->paginate(20);

        return response()->json($mailAccounts);
    }

    /**
     * Create a mail account (async).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'account' => 'required|string|max:64',
            'password' => 'required|string|min:8',
            'quota_mb' => 'sometimes|integer|min:50',
        ]);

        $domain = Domain::with('hostingAccount.plan')->findOrFail($request->domain_id);

        // Cannot create email on temporary domains
        if ($domain->is_temporary) {
            return response()->json(['message' => 'Cannot create email accounts on temporary domains. Connect a real domain first.'], 422);
        }

        // Check plan limits
        $currentMailboxes = MailAccount::where('domain_id', $domain->id)->count();
        if ($currentMailboxes >= $domain->hostingAccount->plan->max_mailboxes) {
            return response()->json(['message' => 'Mailbox limit reached for this plan.'], 422);
        }

        $email = $request->account . '@' . $domain->domain;

        $mailAccount = MailAccount::create([
            'domain_id' => $domain->id,
            'email' => $email,
            'quota_mb' => $request->get('quota_mb', 500),
            'status' => 'active',
            'password_hash' => Hash::make($request->password),
        ]);

        // Dispatch async mailbox provisioning
        ProvisionMailbox::dispatch($mailAccount, $request->password);

        return response()->json($mailAccount, 201);
    }

    /**
     * Update a mail account.
     */
    public function update(Request $request, MailAccount $mailAccount): JsonResponse
    {
        $request->validate([
            'password' => 'sometimes|string|min:8',
            'quota_mb' => 'sometimes|integer|min:50',
            'status' => 'sometimes|in:active,suspended',
        ]);

        if ($request->has('password')) {
            $mailAccount->password_hash = Hash::make($request->password);
        }

        if ($request->has('quota_mb')) {
            $mailAccount->quota_mb = $request->quota_mb;
        }

        if ($request->has('status')) {
            $mailAccount->status = $request->status;
        }

        $mailAccount->save();

        return response()->json($mailAccount);
    }

    /**
     * Delete a mail account.
     */
    public function destroy(MailAccount $mailAccount): JsonResponse
    {
        $mailAccount->update(['status' => 'deleted']);

        return response()->json(['message' => 'Mail account deleted.']);
    }
}
